"use client"

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import { useAuth } from "./auth-context"
import { api, API_URL } from "./api"
import { io } from "socket.io-client"
const defaultSettings = {
  companyName: "HR Activity Recommender",
  skillLevelThresholds: {
    low: 25,
    medium: 50,
    high: 75,
    expert: 90
  },
  evaluationFrequency: "monthly",
  autoRecommendations: true,
  notificationsEnabled: true
}

function normalizeId(raw) {
  if (raw == null) return ""
  if (typeof raw === "object" && typeof raw.toString === "function") return String(raw.toString())
  return String(raw)
}

const DataContext = createContext(undefined)

export function DataProvider({ children }) {
  const { isAuthenticated, user, isLoading: authLoading, refreshProfile } = useAuth()
  const [users, setUsers] = useState([])
  const [employees, setEmployees] = useState([])
  const [activities, setActivities] = useState([])
  const [skills, setSkills] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [departments, setDepartments] = useState([])
  const [settings, setSettings] = useState(defaultSettings)
  const [enrollments, setEnrollments] = useState({})
  const [assignments, setAssignments] = useState([])
  const [notifications, setNotifications] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [participations, setParticipations] = useState([])
  const [notificationEventVersion, setNotificationEventVersion] = useState(0)
  const [lastNotificationEvent, setLastNotificationEvent] = useState(null)
  const [notificationSocketConnected, setNotificationSocketConnected] = useState(false)

  const socketRef = useRef(null)
  const notificationListenersRef = useRef(new Set())

  const fetchParticipations = useCallback(async () => {
    if (!user) return
    try {
      const role = (user?.role || "").toLowerCase()
      const isAdminOrMananger = ["admin", "hr", "manager"].includes(role)

      const endpoint = isAdminOrMananger ? "/participations" : "/participations/me"
      const data = await api.get(endpoint)
      setParticipations(data)

      if (isAdminOrMananger) {
        const newEnrollments = {}
        data.forEach(p => {
          if (!p.activityId || !p.userId) return // Skip orphans

          // Only consider active/enrolled statuses for the manager's view
          const activeStatuses = ['accepted', 'in_progress', 'awaiting_organizer', 'organizer_submitted', 'awaiting_manager', 'validated'];
          if (!activeStatuses.includes(p.status)) return;

          // `activityId` is populated in backend (`populate('activityId')`), but `userId` often comes back as a raw ObjectId.
          // Handle both cases safely.
          const aId = (p.activityId?._id ?? p.activityId?.id ?? p.activityId)
          const uId = (p.userId?._id ?? p.userId?.id ?? p.userId)

          if (!aId || !uId) return

          const aKey = aId?.toString ? String(aId.toString()) : String(aId)
          const uKey = uId?.toString ? String(uId.toString()) : String(uId)

          if (!newEnrollments[aKey]) newEnrollments[aKey] = []
          if (!newEnrollments[aKey].includes(uKey)) newEnrollments[aKey].push(uKey)
        })
        setEnrollments(newEnrollments)
      }
    } catch (error) {
      console.error("Failed to fetch participations:", error)
    }
  }, [user])

  const selfEvaluateSkill = useCallback(async (skillId, auto_eval) => {
    try {
      await api.patch(`/users/me/skills/${skillId}/eval`, { auto_eval })
      await refreshProfile()
    } catch (error) {
      console.error("Failed to self-evaluate:", error)
      throw error
    }
  }, [refreshProfile])

  const fetchUsers = useCallback(async (preloadedSkills) => {
    try {
      const data = await api.get("/users")
      if (Array.isArray(data)) {
        // Use passed-in skills list first (avoids stale-closure race with fetchSkills),
        // then fall back to the current skills state.
        const skillsRef = (preloadedSkills && preloadedSkills.length > 0) ? preloadedSkills : skills

        const mappedEmployees = data.map(u => {
          const id = u._id || u.id

          // Decorate each skill entry with a resolved name/category/type so the
          // profile card never falls back to generic placeholders.
          const decoratedSkills = (u.skills || []).map(us => {
            // skillId can be:
            //  a) A fully-populated Mongoose sub-document { _id, name, type, category, … }
            //  b) A raw ObjectId string (happens for skills added via manager validation)
            const isPopulated = us.skillId && typeof us.skillId === 'object' && us.skillId.name
            const rawId = isPopulated
              ? String(us.skillId._id || us.skillId.id || '')
              : String(us.skillId || '')

            // Always try to resolve from the skills catalogue so we get the
            // canonical name even for newly-inserted skill entries.
            let skillObj = isPopulated ? us.skillId : (us.skill || null)

            if ((!skillObj || !skillObj.name) && rawId && skillsRef.length > 0) {
              const found = skillsRef.find(s => String(s._id || s.id) === rawId)
              if (found) skillObj = found
            }

            return {
              ...us,
              // Normalise skillId so UnifiedProfile's `s.skillId?.name` always works
              skillId: skillObj || us.skillId,
              skill: skillObj,
            }
          })

          return {
            ...u,
            id,
            _id: id,
            userId: id,
            department: (u.department_id && typeof u.department_id === 'object' ? u.department_id.name : null) || u.department || u.department_id,
            position: u.role,
            avatar: u.avatar || u.facePicture || u.profilePicture || null,
            skills: decoratedSkills,
            yearsOfExperience: u.yearsOfExperience,
            rank: u.rank,
            rankScore: u.rankScore,
          }
        })
        setEmployees(mappedEmployees)
        setUsers(data)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }, [])

  const updateParticipationProgress = useCallback(async (activityId, progress, feedback) => {
    try {
      const payload =
        typeof feedback === "number"
          ? { progress, feedback }
          : { progress }
      const response = await api.patch(`/participations/${activityId}/progress`, payload)
      await fetchParticipations()
      // Keep employee-facing score/rank cards in sync right after completion.
      await Promise.all([refreshProfile(), fetchUsers()])
      return response
    } catch (error) {
      console.error("Failed to update progress:", error)
      throw error
    }
  }, [fetchParticipations, refreshProfile, fetchUsers])

  const fetchActivities = useCallback(async () => {
    try {
      const data = await api.get("/activities")
      if (Array.isArray(data)) {
        setActivities(data.map(a => {
          const id = normalizeId(a._id ?? a.id)
          return {
            ...a,
            id,
            _id: id,
            // Backend uses date + capacity; many UI screens expect startDate + availableSeats
            startDate: a.startDate ?? a.date,
            availableSeats: a.availableSeats ?? a.capacity ?? 0,
          }
        }))
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error)
    }
  }, [])

  const fetchSkills = useCallback(async () => {
    try {
      const data = await api.get("/skills")
      if (Array.isArray(data)) {
        const mapped = data.map(s => ({ ...s, id: s._id || s.id }))
        setSkills(mapped)
        return mapped // return so callers don't need to wait for state to settle
      }
      return []
    } catch (error) {
      console.error("Failed to fetch skills:", error)
      return []
    }
  }, [])

  const fetchDepartments = useCallback(async () => {
    try {
      const data = await api.get("/departments")
      if (Array.isArray(data)) {
        setDepartments(data.map(d => ({ ...d, id: d._id || d.id })))
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error)
    }
  }, [])

  const fetchPosts = useCallback(async () => {
    try {
      const data = await api.get("/posts")
      if (Array.isArray(data)) {
        setPosts(data.map(p => ({ ...p, id: p._id || p.id })))
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error)
    }
  }, [])

  // Notification operations
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return
    try {
      const data = await api.get("/notifications")
      if (Array.isArray(data)) {
        setNotifications(data.map(n => ({ ...n, id: n._id || n.id })))
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    }
  }, [isAuthenticated, user])

  const addNotification = useCallback(async (notification) => {
    try {
      // If notification has no recipientId, use current user as receiver (self-notification)
      const data = {
        recipientId: notification.userId || notification.recipientId || user?.id,
        title: notification.title,
        message: notification.message,
        type: notification.type || "info",
        metadata: { link: notification.link }
      }
      const newNotif = await api.post("/notifications", data)
      setNotifications(prev => [{ ...newNotif, id: newNotif._id || newNotif.id }, ...prev])
      return newNotif
    } catch (error) {
      console.error("Frontend addNotification failed:", error)
      throw error
    }
  }, [user])

  const markNotificationRead = useCallback(async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n =>
        (n.id === id || n._id === id) ? { ...n, read: true } : n
      ))
    } catch (error) {
      console.error("Failed to mark notification read:", error)
    }
  }, [skills])

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await api.patch("/notifications/read-all")
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error("Failed to mark all notifications read:", error)
    }
  }, [skills])

  const getNotificationsForUser = useCallback((userId) => {
    return notifications.filter(n => (n.recipientId || n.userId) === userId)
  }, [notifications])

  const deleteNotification = useCallback(async (id) => {
    try {
      await api.delete(`/notifications/${id}`)
      setNotifications(prev => prev.filter(n => (n.id !== id && n._id !== id)))
    } catch (error) {
      console.error("Failed to delete notification:", error)
    }
  }, [skills])

  const getUnreadCount = useCallback((userId) => {
    return notifications.filter(n => (n.recipientId || n.userId) === userId && !n.read).length
  }, [notifications])

  const subscribeToNotifications = useCallback((listener) => {
    if (typeof listener !== "function") {
      return () => { }
    }

    notificationListenersRef.current.add(listener)
    return () => {
      notificationListenersRef.current.delete(listener)
    }
  }, [notificationListenersRef])

  // Activity operations
  const addActivity = useCallback(async (activityData) => {
    try {
      const newActivity = await api.post("/activities", activityData)
      await fetchActivities()

      // Only notify managers of the selected target departments
      const targetDeptIds = activityData.targetDepartments || []

      if (targetDeptIds.length > 0) {
        const targetManagers = users.filter(u => {
          if (u.role?.toLowerCase() !== "manager") return false
          const userDeptId = u.department_id?._id || u.department_id?.id || u.department_id
          return targetDeptIds.some(dId => String(dId) === String(userDeptId))
        })

        // Also find managers via the departments list
        const deptManagerIds = (departments || [])
          .filter(d => targetDeptIds.some(dId => String(dId) === String(d.id || d._id)))
          .map(d => d.manager_id?._id || d.manager_id?.id || d.manager_id)
          .filter(Boolean)

        const allManagerIds = new Set([
          ...targetManagers.map(m => String(m._id || m.id)),
          ...deptManagerIds.map(id => String(id))
        ])

        allManagerIds.forEach(managerId => {
          addNotification({
            userId: managerId,
            title: "New Activity Assigned to Your Department",
            message: `HR has assigned "${activityData.title}" to your department. Please review and accept or reject this activity.`,
            link: `/manager/activities`,
            type: "activity",
            read: false
          })
        })
      }

      return newActivity
    } catch (error) {
      console.error("Failed to add activity:", error)
      throw error
    }
  }, [fetchActivities, users, departments, addNotification])

  const updateActivity = useCallback(async (id, data) => {
    try {
      const existing = activities.find(a => (a.id === id || a._id === id))
      await api.put(`/activities/${id}`, data)
      await fetchActivities()

      // STRATEGIC RESUBMISSION NOTIFICATION
      // If the activity was previously rejected, notify managers that a revision has been submitted
      if (existing?.workflowStatus === 'rejected') {
        const targetDeptIds = data.targetDepartments || existing.targetDepartments || []
        
        if (targetDeptIds.length > 0) {
          const targetManagers = users.filter(u => {
            if (u.role?.toLowerCase() !== "manager") return false
            const userDeptId = u.department_id?._id || u.department_id?.id || u.department_id
            return targetDeptIds.some(dId => String(dId) === String(userDeptId))
          })

          targetManagers.forEach(m => {
            addNotification({
              userId: m._id || m.id,
              title: "🔄 Activity Revised & Resubmitted",
              message: `HR has integrated your feedback and resubmitted "${data.title || existing.title}". Please review and approve the updated program.`,
              link: `/manager/activities`,
              type: "activity",
              read: false
            })
          })
        }
      }
    } catch (error) {
      console.error("Failed to update activity:", error)
      throw error
    }
  }, [fetchActivities, activities, users, addNotification])

  const approveActivity = useCallback(async (id) => {
    try {
      const activity = activities.find(a => (a.id === id || a._id === id))
      await api.patch(`/activities/${id}/approve`)
      await fetchActivities()

      // Notify the HR user who created it (+ any HR users as fallback)
      const hrRecipients = users.filter(u => u.role?.toLowerCase() === "hr" || u.role?.toLowerCase() === "admin")
      const recipientIds = activity?.createdBy
        ? [String(activity.createdBy)]
        : hrRecipients.map(u => String(u._id || u.id))

      recipientIds.forEach(uid => {
        addNotification({
          userId: uid,
          title: "✅ Activity Accepted by Manager",
          message: `The manager has accepted "${activity?.title || 'the activity'}". The activity is now pending the recommendation phase before enrollment opens.`,
          link: `/hr/activities`,
          type: "success",
          read: false
        })
      })
    } catch (error) {
      console.error("Failed to approve activity:", error)
      throw error
    }
  }, [fetchActivities, activities, users, addNotification])

  const rejectActivity = useCallback(async (id, reason) => {
    try {
      const activity = activities.find(a => (a.id === id || a._id === id))
      await api.patch(`/activities/${id}/reject`, { reason })
      await fetchActivities()

      // Notify HR about the rejection with the manager's reason
      const hrRecipients = users.filter(u => u.role?.toLowerCase() === "hr" || u.role?.toLowerCase() === "admin")
      const recipientIds = activity?.createdBy
        ? [String(activity.createdBy)]
        : hrRecipients.map(u => String(u._id || u.id))

      recipientIds.forEach(uid => {
        addNotification({
          userId: uid,
          title: "❌ Activity Rejected by Manager",
          message: `The manager rejected "${activity?.title || 'the activity'}". Reason: ${reason}`,
          link: `/hr/activities`,
          type: "error",
          read: false
        })
      })
    } catch (error) {
      console.error("Failed to reject activity:", error)
      throw error
    }
  }, [fetchActivities, activities, users, addNotification])

  const deleteActivity = useCallback(async (id) => {
    try {
      await api.delete(`/activities/${id}`)
      await fetchActivities()
    } catch (error) {
      console.error("Failed to delete activity:", error)
      throw error
    }
  }, [fetchActivities])

  const enrollEmployee = useCallback(async (activityId, employeeId) => {
    try {
      await api.post(`/participations/${activityId}`, { userId: employeeId })
      await fetchParticipations()
      // Also update activities since enrolledCount might change
      await fetchActivities()
    } catch (error) {
      console.error("Failed to enroll:", error)
      throw error
    }
  }, [fetchParticipations, fetchActivities])

  const unenrollEmployee = useCallback(async (activityId, employeeId) => {
    try {
      await api.delete(`/participations/${activityId}`, { userId: employeeId })
      await fetchParticipations()
      await fetchActivities()
    } catch (error) {
      console.error("Failed to unenroll:", error)
      throw error
    }
  }, [fetchParticipations, fetchActivities])

  // Skill operations
  const addSkill = useCallback(async (skill) => {
    try {
      await api.post("/skills", skill)
      await fetchSkills()
    } catch (error) {
      console.error("Failed to add skill:", error)
      throw error
    }
  }, [fetchSkills])

  const updateSkill = useCallback(async (id, data) => {
    try {
      await api.put(`/skills/${id}`, data)
      await fetchSkills()
    } catch (error) {
      console.error("Failed to update skill:", error)
      throw error
    }
  }, [fetchSkills])

  const deleteSkill = useCallback(async (id) => {
    try {
      await api.delete(`/skills/${id}`)
      await fetchSkills()
    } catch (error) {
      console.error("Failed to delete skill:", error)
      throw error
    }
  }, [fetchSkills])

  // Employee Skill operations
  const updateEmployeeSkill = useCallback(async (employeeId, skillId, data) => {
    try {
      await api.patch(`/users/${employeeId}/skills/${skillId}`, data)
      await fetchUsers()
    } catch (error) {
      console.error("Failed to update employee skill:", error)
      throw error
    }
  }, [fetchUsers])

  const addEmployeeSkill = useCallback(async (employeeId, skill, level, score) => {
    try {
      await api.post(`/users/${employeeId}/skills`, {
        skillId: skill.id,
        level,
        score,
        auto_eval: 0,
        hierarchie_eval: 0
      })
      await fetchUsers()
    } catch (error) {
      console.error("Failed to add employee skill:", error)
      throw error
    }
  }, [fetchUsers])

  const removeEmployeeSkill = useCallback(async (employeeId, skillId) => {
    try {
      await api.delete(`/users/${employeeId}/skills/${skillId}`)
      await fetchUsers()
    } catch (error) {
      console.error("Failed to remove employee skill:", error)
      throw error
    }
  }, [fetchUsers])

  const fetchEvaluations = useCallback(async () => {
    if (!isAuthenticated || !user) return
    try {
      const data = await api.get("/evaluations")
      if (Array.isArray(data)) {
        setEvaluations(data.map(e => ({ ...e, id: e._id || e.id })))
      }
    } catch (error) {
      console.error("Failed to fetch evaluations:", error)
    }
  }, [isAuthenticated, user])

  // Evaluation operations
  const addEvaluation = useCallback(async (evaluation) => {
    try {
      const newEvaluation = await api.post("/evaluations", evaluation)
      const mapped = { ...newEvaluation, id: newEvaluation._id || newEvaluation.id }
      setEvaluations(prev => [...prev, mapped])
      return mapped
    } catch (error) {
      console.error("Failed to add evaluation:", error)
      throw error
    }
  }, [skills])

  const updateEvaluation = useCallback(async (id, data) => {
    try {
      const updated = await api.patch(`/evaluations/${id}`, data)
      setEvaluations(prev => prev.map(e =>
        (e.id === id || e._id === id) ? { ...updated, id: updated._id || updated.id } : e
      ))
    } catch (error) {
      console.error("Failed to update evaluation:", error)
    }
  }, [skills])

  const deleteEvaluation = useCallback(async (id) => {
    try {
      await api.delete(`/evaluations/${id}`)
      setEvaluations(prev => prev.filter(e => e.id !== id && e._id !== id))
    } catch (error) {
      console.error("Failed to delete evaluation:", error)
    }
  }, [skills])

  // Department operations (backend)
  const addDepartment = useCallback(async (data) => {
    try {
      await api.post("/departments", data)
      await fetchDepartments()
    } catch (error) {
      console.error("Failed to add department:", error)
      throw error
    }
  }, [fetchDepartments])

  const updateDepartment = useCallback(async (id, data) => {
    try {
      await api.put(`/departments/${id}`, data)
      await fetchDepartments()
      await fetchUsers()
    } catch (error) {
      console.error("Failed to update department:", error)
      throw error
    }
  }, [fetchDepartments, fetchUsers])

  const deleteDepartment = useCallback(async (id) => {
    try {
      await api.delete(`/departments/${id}`)
      await fetchDepartments()
    } catch (error) {
      console.error("Failed to delete department:", error)
      throw error
    }
  }, [fetchDepartments])

  const fetchAssignments = useCallback(async () => {
    if (!isAuthenticated || !user) return
    try {
      const data = await api.get("/assignments")
      if (Array.isArray(data)) {
        setAssignments(data.map(a => {
          const id = a._id || a.id
          // Map backend userId to frontend employeeId for component compatibility
          return {
            ...a,
            id,
            _id: id,
            employeeId: a.userId?._id || a.userId?.id || a.userId,
            managerId: a.managerId?._id || a.managerId?.id || a.managerId
          }
        }))
      }
    } catch (error) {
      console.error("Failed to fetch assignments:", error)
    }
  }, [isAuthenticated, user])

  // Assignment operations
  const addAssignment = useCallback(async (assignment) => {
    try {
      const newAssignment = await api.post("/assignments", {
        userId: assignment.employeeId || assignment.userId,
        activityId: assignment.activityId
      })
      const mapped = { ...newAssignment, id: newAssignment._id || newAssignment.id }
      setAssignments(prev => [...prev, mapped])
      return mapped
    } catch (error) {
      console.error("Failed to add assignment:", error)
      throw error
    }
  }, [skills])

  const updateAssignmentStatus = useCallback(async (id, status) => {
    try {
      const updated = await api.patch(`/assignments/${id}/status`, { status })
      setAssignments(prev => prev.map(a =>
        (a.id === id || a._id === id) ? { ...updated, id: updated._id || updated.id } : a
      ))
      return updated
    } catch (error) {
      console.error("Failed to update assignment status:", error)
      throw error
    }
  }, [skills])

  const acceptRecommendation = useCallback(async (id) => {
    try {
      const response = await api.post(`/assignments/${id}/accept`)
      await fetchAssignments()
      await fetchParticipations()
      await fetchActivities()
      return response
    } catch (error) {
      console.error("Failed to accept recommendation:", error)
      throw error
    }
  }, [fetchAssignments, fetchParticipations, fetchActivities])

  const rejectRecommendation = useCallback(async (id, reason) => {
    try {
      const response = await api.post(`/assignments/${id}/reject`, { reason })
      await fetchAssignments()
      return response
    } catch (error) {
      console.error("Failed to reject recommendation:", error)
      throw error
    }
  }, [fetchAssignments])

  const getAssignmentsForActivity = useCallback((activityId) => {
    return assignments.filter(a => String(a.activityId?._id || a.activityId) === String(activityId))
  }, [assignments])

  const getAssignmentsForEmployee = useCallback((employeeId) => {
    return assignments.filter(a => String(a.userId?._id || a.userId) === String(employeeId))
  }, [assignments])

  const getAssignmentsForManager = useCallback((departmentName) => {
    return assignments.filter(a => {
      const emp = employees.find(e => String(e.id) === String(a.userId?._id || a.userId))
      return emp?.department === departmentName
    })
  }, [assignments, employees])

  // User operations
  const addUser = useCallback(async (userData) => {
    try {
      console.log("[DataStore] Attempting to add user with data:", userData)
      const newUser = await api.post("/users", userData)
      console.log("[DataStore] User created successfully:", newUser)
      await fetchUsers()
      console.log("[DataStore] Users list refreshed")
      return newUser
    } catch (error) {
      console.error("[DataStore] Failed to add user:", error)
      console.error("[DataStore] Error details:", {
        message: error.message,
        response: error.response,
        status: error.status
      })
      throw error
    }
  }, [fetchUsers])

  const updateUser = useCallback(async (id, data) => {
    try {
      await api.put(`/users/${id}`, data)
      await fetchUsers()
    } catch (error) {
      console.error("Failed to update user:", error)
      throw error
    }
  }, [fetchUsers])

  const deleteUser = useCallback(async (id) => {
    try {
      await api.delete(`/users/${id}`)
      await fetchUsers()
    } catch (error) {
      console.error("Failed to delete user:", error)
      throw error
    }
  }, [fetchUsers])

  // Settings operations
  const fetchSettings = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const data = await api.get("/settings")
      if (data && typeof data === 'object') {
        setSettings(prev => ({ ...prev, ...data }))
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    }
  }, [isAuthenticated])

  const updateSettings = useCallback(async (data) => {
    try {
      // For each key-value pair in data, update the backend
      const promises = Object.entries(data).map(([key, value]) =>
        api.post("/settings", { key, value })
      )
      await Promise.all(promises)
      setSettings(prev => ({ ...prev, ...data }))
    } catch (error) {
      console.error("Failed to update settings:", error)
      throw error
    }
  }, [skills])

  // Social Feed Operations
  const addPost = useCallback(async (postData) => {
    try {
      const newPost = await api.post("/posts", postData)
      const mappedPost = { ...newPost, id: newPost._id || newPost.id }
      setPosts(prev => [mappedPost, ...prev])
      return mappedPost
    } catch (error) {
      console.error("Failed to add post:", error)
      throw error
    }
  }, [skills])

  const likePost = useCallback(async (postId, userId) => {
    try {
      const updatedPost = await api.post(`/posts/${postId}/like`, {})
      setPosts(prev => prev.map(post =>
        (post.id === postId || post._id === postId)
          ? { ...updatedPost, id: updatedPost._id || updatedPost.id }
          : post
      ))
    } catch (error) {
      console.error("Failed to like post:", error)
    }
  }, [skills])

  const addComment = useCallback(async (postId, commentData) => {
    try {
      const updatedPost = await api.post(`/posts/${postId}/comment`, commentData)
      setPosts(prev => prev.map(post =>
        (post.id === postId || post._id === postId)
          ? { ...updatedPost, id: updatedPost._id || updatedPost.id }
          : post
      ))
    } catch (error) {
      console.error("Failed to add comment:", error)
      throw error
    }
  }, [skills])

  // Core lists: run once auth has finished hydrating from storage (do not require `user` here).
  // Child effects run before parent Auth's effect on the first paint; gating only on `user` skipped the load entirely.
  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    // Load skills FIRST so fetchUsers can resolve skill names without a race
    fetchSkills().then(loadedSkills => {
      return Promise.all([
        fetchUsers(loadedSkills),
        fetchDepartments(),
        fetchActivities(),
        fetchPosts(),
        fetchNotifications(),
        fetchAssignments(),
        fetchEvaluations(),
        fetchSettings(),
      ])
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [
    authLoading,
    isAuthenticated,
    fetchUsers,
    fetchDepartments,
    fetchActivities,
    fetchSkills,
    fetchPosts,
    fetchNotifications,
    fetchAssignments,
    fetchEvaluations,
    fetchSettings,
  ])

  // Participations + enrollments map need role from `user` (admin/hr/manager vs employee).
  useEffect(() => {
    if (!isAuthenticated || authLoading || !user) return
    fetchParticipations()
  }, [isAuthenticated, authLoading, user, fetchParticipations])

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user) {
      setNotificationSocketConnected(false)
      return
    }

    const currentUserId = String(user.id || user._id || "")
    if (!currentUserId) return

    const socket = io(`${API_URL}/notifications`, {
      transports: ["websocket"],
      query: { userId: currentUserId },
    })

    socketRef.current = socket

    socket.on("connect", () => {
      setNotificationSocketConnected(true)
      fetchNotifications()
    })

    socket.on("disconnect", (reason) => {
      setNotificationSocketConnected(false)
    })

    socket.on("connect_error", (error) => {
      setNotificationSocketConnected(false)
      console.warn("[NotificationSocket] Connection error:", error?.message || error)
    })

    socket.on("reconnect", () => {
      setNotificationSocketConnected(true)
      fetchNotifications()
    })

    socket.on("newNotification", (incoming) => {
      const normalized = {
        ...incoming,
        id: incoming?._id || incoming?.id || `${Date.now()}-${Math.random()}`,
        _id: incoming?._id || incoming?.id,
        recipientId: incoming?.recipientId || currentUserId,
        read: incoming?.read ?? false,
        metadata: incoming?.metadata || {
          activityId: incoming?.activityId,
          candidateIds: incoming?.candidateIds,
          aiScore: incoming?.aiScore,
        },
      }

      setNotifications((prev) => {
        const incomingId = String(normalized.id || normalized._id || "")
        const hasSameId = incomingId && prev.some((n) => String(n.id || n._id || "") === incomingId)

        if (hasSameId) {
          return prev
        }

        return [normalized, ...prev]
      })

      setLastNotificationEvent(normalized)
      setNotificationEventVersion((v) => v + 1)

      for (const listener of notificationListenersRef.current) {
        try {
          listener(normalized)
        } catch (error) {
          console.warn("[NotificationSocket] Listener failed:", error)
        }
      }
    })

    return () => {
      socket.removeAllListeners("connect")
      socket.removeAllListeners("disconnect")
      socket.removeAllListeners("connect_error")
      socket.removeAllListeners("reconnect")
      socket.removeAllListeners("newNotification")
      socket.disconnect()
      setNotificationSocketConnected(false)
    }
  }, [authLoading, isAuthenticated, user, fetchNotifications, socketRef, notificationListenersRef])

  const refreshGlobalData = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      // Skills must resolve first so fetchUsers can decorate skill names correctly
      const loadedSkills = await fetchSkills()
      await Promise.all([
        fetchUsers(loadedSkills),
        fetchDepartments(),
        fetchActivities(),
        fetchPosts(),
        fetchNotifications(),
        fetchAssignments(),
        fetchEvaluations(),
        fetchSettings(),
        ...(user ? [fetchParticipations()] : []),
      ])
    } finally {
      setLoading(false)
    }
  }, [
    isAuthenticated,
    user,
    fetchUsers,
    fetchDepartments,
    fetchActivities,
    fetchSkills,
    fetchPosts,
    fetchParticipations,
    fetchNotifications,
    fetchAssignments,
    fetchEvaluations,
    fetchSettings,
  ])

  const fetchCombinedScore = useCallback(async (userId) => {
    try {
      const data = await api.get(`/users/${userId}/combined-score`)
      return data
    } catch (error) {
      console.error("Failed to fetch combined score:", error)
      return null
    }
  }, [])

  const fetchGlobalSkillsDashboard = useCallback(async () => {
    try {
      const data = await api.get('/skills/dashboard/global')
      return data
    } catch (error) {
      console.error("Failed to fetch global dashboard:", error)
      return null
    }
  }, [])

  return (
    <DataContext.Provider value={{
      users,
      addUser,
      updateUser,
      deleteUser,
      employees,
      addEmployee: addUser, // Alias for consistency
      updateEmployee: updateUser,
      deleteEmployee: deleteUser,
      activities,
      addActivity,
      updateActivity,
      deleteActivity,
      enrollEmployee,
      unenrollEmployee,
      skills,
      addSkill,
      updateSkill,
      deleteSkill,
      posts,
      participations,
      loading,
      fetchUsers,
      fetchSkills,
      fetchActivities,
      approveActivity,
      rejectActivity,
      fetchParticipations,
      refreshGlobalData,
      addPost,
      updateEmployeeSkill,
      addEmployeeSkill,
      removeEmployeeSkill,
      updateParticipationProgress,
      selfEvaluateSkill,
      evaluations,
      addEvaluation,
      updateEvaluation,
      deleteEvaluation,
      departments,
      addDepartment,
      updateDepartment,
      deleteDepartment,
      settings,
      updateSettings,
      enrollments,
      assignments,
      addAssignment,
      updateAssignmentStatus,
      acceptRecommendation,
      rejectRecommendation,
      getAssignmentsForActivity,
      getAssignmentsForEmployee,
      getAssignmentsForManager,
      notifications,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      getNotificationsForUser,
      getUnreadCount,
      likePost,
      addComment,
      fetchEvaluations,
      fetchAssignments,
      fetchSettings,
      fetchNotifications,
      deleteNotification,
      subscribeToNotifications,
      lastNotificationEvent,
      notificationEventVersion,
      notificationSocketConnected,
      fetchCombinedScore,
      fetchGlobalSkillsDashboard,
      refreshData: refreshGlobalData,
      refreshParticipations: fetchParticipations
    }}>

      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}

export const NotificationProvider = DataProvider

