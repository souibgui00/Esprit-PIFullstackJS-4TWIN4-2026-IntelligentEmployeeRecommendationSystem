import React, { createContext, useContext, useState, useEffect } from "react"
import { api, API_URL } from "./api"

const AuthContext = createContext(undefined)

export const getRoleLabel = (role) => {
  switch (role?.toLowerCase()) {
    case "admin": return "Administrator"
    case "hr": return "HR Official"
    case "manager": return "Department Manager"
    case "employee":
    case "user": return "Team Member"
    default: return role || "Guest"
  }
}

export const getRoleDescription = (role) => {
  switch (role?.toLowerCase()) {
    case "admin": return "Full access to organization settings, libraries, and global recommendations."
    case "hr": return "Manage organization activities, oversee learning progression, and track all employees."
    case "manager": return "Manage team assignments, view performance, and provide training approvals."
    case "employee":
    case "user": return "View personal growth plan, enroll in activities, and track skill development."
    default: return ""
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Try to load user from localStorage on mount
  useEffect(() => {
    const savedUser = sessionStorage.getItem("skillmatch_user")
    const token = sessionStorage.getItem("skillmatch_token")

    if (savedUser && token) {
      try {
        const parsedUser = JSON.parse(savedUser)
        const normalizedRole = (parsedUser?.role || '').toString().toLowerCase().trim()
        const restoredUser = {
          ...parsedUser,
          role: normalizedRole === 'admin' || normalizedRole === 'manager' || normalizedRole === 'hr'
            ? normalizedRole
            : 'employee',
        }

        setUser(restoredUser)
        setIsAuthenticated(true)
        sessionStorage.setItem("skillmatch_user", JSON.stringify(restoredUser))
        // Refresh profile to get最新 data
        api.get("/users/me")
          .then(freshData => {
            const mappedUser = {
              ...freshData,
              id: freshData._id || freshData.id,
              role: mapBackendRole(freshData.role)
            };
            setUser(mappedUser);
            sessionStorage.setItem("skillmatch_user", JSON.stringify(mappedUser));
          })
          .catch(err => console.error("Failed to refresh profile on load", err));
      } catch (e) {
        console.error("Failed to parse saved user", e)
        sessionStorage.removeItem("skillmatch_user")
        sessionStorage.removeItem("skillmatch_token")
      }
    }
    setIsLoading(false)
  }, [])

  const mapBackendRole = (backendRole) => {
    const role = (backendRole || "").toString().toLowerCase().trim()
    if (role === "admin") return "admin"
    if (role === "manager") return "manager"
    if (role === "hr") return "hr"
    return "employee"
  }

  const login = async (email, password) => {
    try {
      const sanitizedEmail = email.toLowerCase().trim()
      const response = await api.post("/auth/login", { email: sanitizedEmail, password })

      if (response && response.access_token) {
        const backendUser = response.user || {}
        const normalizedRole = mapBackendRole(backendUser.role)

        const userData = {
          ...backendUser,
          id: backendUser.id || backendUser._id,
          role: normalizedRole
        }

        setUser(userData)
        setIsAuthenticated(true)
        sessionStorage.setItem("skillmatch_user", JSON.stringify(userData))
        sessionStorage.setItem("skillmatch_token", response.access_token)
        if (response.refresh_token) {
          sessionStorage.setItem("skillmatch_refresh_token", response.refresh_token)
        }
        return { success: true }
      }
      return { success: false, error: "Authentication failed. No access token received." }
    } catch (error) {
      console.error("Login service error:", error)
      return { success: false, error: error.message || "Invalid credentials. Please check your email and password." }
    }
  }

  const faceLogin = async (email) => {
    try {
      const sanitizedEmail = email.toLowerCase().trim()
      const response = await api.post("/auth/face-login", { email: sanitizedEmail })

      if (response && response.access_token) {
        const backendUser = response.user || {}
        const normalizedRole = mapBackendRole(backendUser.role)

        const userData = {
          ...backendUser,
          id: backendUser.id || backendUser._id,
          role: normalizedRole
        }

        setUser(userData)
        setIsAuthenticated(true)
        sessionStorage.setItem("skillmatch_user", JSON.stringify(userData))
        sessionStorage.setItem("skillmatch_token", response.access_token)
        if (response.refresh_token) {
          sessionStorage.setItem("skillmatch_refresh_token", response.refresh_token)
        }
        return { success: true, user: userData }
      }
      return { success: false, error: "Authentication failed." }
    } catch (error) {
      console.error("Face login error:", error)
      return { success: false, error: error.message || "Face ID login failed." }
    }
  }

  const registerFace = async (blob) => {
    try {
      const formData = new FormData()
      formData.append("picture", blob, "face.jpg")
      const freshData = await api.upload("/face-recognition/register", formData)

      const mappedUser = {
        ...freshData,
        id: freshData._id || freshData.id,
        role: mapBackendRole(freshData.role)
      }
      setUser(mappedUser)
      sessionStorage.setItem("skillmatch_user", JSON.stringify(mappedUser))
      return mappedUser
    } catch (error) {
      console.error("Failed to register face:", error)
      throw error
    }
  }

  const getFaceProfile = async (email) => {
    try {
      return await api.get(`/face-recognition/profile?email=${email}`)
    } catch (error) {
      console.error("Failed to fetch face profile:", error)
      return null
    }
  }

  const logout = () => {
    const refreshToken = sessionStorage.getItem("skillmatch_refresh_token")
    if (refreshToken) {
      api.post("/auth/logout", { refreshToken }).catch(console.error)
    }

    setUser(null)
    setIsAuthenticated(false)
    sessionStorage.removeItem("skillmatch_user")
    sessionStorage.removeItem("skillmatch_token")
    sessionStorage.removeItem("skillmatch_refresh_token")
  }

  const getWrappedRoleLabel = (role) => getRoleLabel(role || user?.role)
  const getWrappedRoleDescription = (role) => getRoleDescription(role || user?.role)

  const getEmployeeProfile = () => {
    if (!user) return null

    const departmentName =
      user.department?.name ||
      user.department_id?.name ||
      user.department ||
      "Unassigned"

    const normalizeSkill = (s, index) => {
      const skillId = s?.skillId?._id || s?.skillId || s?._id || s?.id;
      
      let skillObj = (s?.skillId && typeof s.skillId === 'object') ? s.skillId : s?.skill;

      const resolvedSkillId =
        s?.skillId?._id ||
        s?.skillId ||
        s?._id ||
        s?.id ||
        (typeof skillObj.name === "string"
          ? skillObj.name.toLowerCase().replace(/\s+/g, "-")
          : `skill-${index + 1}`)

      const baseScore = s?.level ? (s.level === '1' || s.level === 'beginner' ? 25 : s.level === '2' || s.level === 'intermediate' ? 50 : s.level === '3' || s.level === 'high' ? 75 : s.level === '4' || s.level === 'expert' ? 100 : 0) : 0;

      return {
        ...s,
        skillId: resolvedSkillId,
        skill: skillObj,
        level: s?.level || "beginner",
        score: s?.score ?? baseScore,
        progression: s?.progression ?? 0,
      }
    }

    const baseSkills = Array.isArray(user.skills) ? user.skills.map(normalizeSkill) : []

    return {
      id: user.id || user._id || user.email,
      name: user.name || user.email || "Employee",
      email: user.email,
      department: departmentName,
      position: user.role,
      avatar: user.avatar,
      skills: baseSkills,
      yearsOfExperience: user.yearsOfExperience || 0,
      matricule: user.matricule,
      jobDescription: user.jobDescription,
      phone: user.telephone || user.phone,
      location: user.location,
      cvUrl: user.cvUrl,
      rank: user.rank || "Junior",
      rankScore: user.rankScore || 0
    }
  }

  const updateProfile = async (data) => {
    try {
      // Map frontend fields to backend fields if necessary
      const backendData = {
        name: data.name,
        email: data.email,
        telephone: data.phone || data.telephone,
        position: data.role || data.position,
        department_id: data.department_id,
        location: data.location,
        avatar: data.avatar
      }

      const freshData = await api.patch("/users/me", backendData)
      const mappedUser = {
        ...freshData,
        id: freshData._id || freshData.id,
        role: mapBackendRole(freshData.role)
      }
      setUser(mappedUser)
      sessionStorage.setItem("skillmatch_user", JSON.stringify(mappedUser))
      return mappedUser
    } catch (error) {
      console.error("Failed to update profile:", error)
      throw error
    }
  }

  const uploadAvatar = async (file) => {
    try {
      const uploadResponse = await api.upload("/upload/image", file)
      const freshData = await api.patch("/users/me", { avatar: uploadResponse.secure_url })

      const mappedUser = {
        ...freshData,
        id: freshData._id || freshData.id,
        role: mapBackendRole(freshData.role)
      }
      setUser(mappedUser)
      sessionStorage.setItem("skillmatch_user", JSON.stringify(mappedUser))
      return mappedUser
    } catch (error) {
      console.error("Failed to upload avatar:", error)
      throw error
    }
  }




  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.patch("/users/me/password", { currentPassword, newPassword })
      return true
    } catch (error) {
      console.error("Failed to change password:", error)
      throw error
    }
  }

  const refreshProfile = async () => {
    if (!isAuthenticated) return null;
    try {
      const freshData = await api.get("/users/me");
      const mappedUser = {
        ...freshData,
        id: freshData._id || freshData.id,
        role: mapBackendRole(freshData.role)
      };
      setUser(mappedUser);
      sessionStorage.setItem("skillmatch_user", JSON.stringify(mappedUser));
      return mappedUser;
    } catch (error) {
      console.error("Failed to refresh profile manually", error);
      return null;
    }
  }

  const forgotPassword = async (email) => {
    try {
      return await api.post("/auth/forgot-password", { email: email.toLowerCase().trim() })
    } catch (error) {
      console.error("Failed to trigger forgot password:", error)
      throw error
    }
  }

  const resetPassword = async (token, newPassword) => {
    try {
      return await api.post("/auth/reset-password", { token, newPassword })
    } catch (error) {
      console.error("Failed to reset password:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
      updateProfile,
      changePassword,
      refreshProfile,
      getRoleLabel: getWrappedRoleLabel,
      getRoleDescription: getWrappedRoleDescription,
      getEmployeeProfile,
      uploadAvatar,
      faceLogin,
      registerFace,
      getFaceProfile,
      forgotPassword,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

