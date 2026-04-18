"use client"

import { useState, useEffect, useCallback } from "react"
import { useData } from "@/lib/data-store"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Calendar, MapPin, Users, Clock, BookOpen, Award, Briefcase,
  Eye, UserPlus, Sparkles, CheckCircle, XCircle, X,
  ClipboardList, Star, ShieldCheck, AlertCircle, Loader2, ChevronRight
} from "lucide-react"
import { getActivityTypeLabel, cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// ── Star Rating ────────────────────────────────────────────────────────────────
function StarRating({ value, onChange, disabled }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange?.(star)}
          className={cn(
            "w-7 h-7 rounded-md transition-all",
            star <= value ? "text-amber-400" : "text-slate-200",
            !disabled && "hover:text-amber-300 hover:scale-110 active:scale-95"
          )}
        >
          <Star className="w-full h-full fill-current" />
        </button>
      ))}
    </div>
  )
}

export default function ManagerActivitiesPage() {
  const { activities, employees, enrollments, departments, approveActivity, rejectActivity, skills } = useData()
  const { user } = useAuth()
  const navigate = useNavigate()

  // ── Activity Approval ─────────────────────────────────────────────────────
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false)
  const [rejectingActivity, setRejectingActivity] = useState(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false)

  // ── Request Activity Dialog ────────────────────────────────────────────────
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [requestForm, setRequestForm] = useState({ title: "", description: "", requiredSkills: [], seatCount: 1 })
  const [skillSearchValue, setSkillSearchValue] = useState("")
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)

  // ── Attendance Panel ──────────────────────────────────────────────────────
  const [selectedAttendanceActivity, setSelectedAttendanceActivity] = useState(null)
  const [organizerPanel, setOrganizerPanel] = useState([])
  const [attendanceReport, setAttendanceReport] = useState({})
  const [loadingPanel, setLoadingPanel] = useState(false)
  const [submittingReport, setSubmittingReport] = useState(false)

  // ── Pending Validations ───────────────────────────────────────────────────
  const [pendingValidations, setPendingValidations] = useState([])
  const [loadingValidations, setLoadingValidations] = useState(false)
  const [validatingId, setValidatingId] = useState(null)
  const [rejectionValidationTarget, setRejectionValidationTarget] = useState(null)
  const [rejectionValidationReason, setRejectionValidationReason] = useState("")

  // ── Department resolution ─────────────────────────────────────────────────
  const getDeptId = (d) => {
    if (!d) return null
    if (typeof d === "string") return d
    return (d.$oid || d._id || d.id || d)?.toString()
  }
  const getDeptName = (d) => {
    if (!d) return "Unassigned"
    if (typeof d === "string") return d
    return d.name || "Unassigned"
  }
  const managerDept = departments.find(d => {
    const mId = d.manager_id?._id || d.manager_id?.id || d.manager_id
    return mId?.toString() === user?.id?.toString()
  })
  const uDeptId = getDeptId(user?.department_id) || getDeptId(user?.department) || getDeptId(managerDept)
  const uDeptName = getDeptName(user?.department_id) || getDeptName(user?.department) || user?.department || managerDept?.name || "Unassigned"

  const deptEmployees = employees.filter(e => {
    if (e.role?.toLowerCase() === "admin") return false
    if ((e.id || e._id) === (user?.id || user?._id)) return false
    const eDeptId = getDeptId(e.department_id) || getDeptId(e.department)
    const eDeptName = e.department || getDeptName(e.department_id) || "Unassigned"
    if (uDeptId && eDeptId && uDeptId === eDeptId) return true
    if (uDeptName !== "Unassigned" && String(uDeptName).toLowerCase().trim() === String(eDeptName).toLowerCase().trim()) return true
    return false
  })

  const getTypeIcon = (type) => {
    switch (type) {
      case "training": return <BookOpen className="h-5 w-5" />
      case "certification": return <Award className="h-5 w-5" />
      case "project": return <Briefcase className="h-5 w-5" />
      default: return <Calendar className="h-5 w-5" />
    }
  }

  const pendingActivities = activities.filter(a => {
    if (a.workflowStatus !== "pending_approval") return false
    if (!a.targetDepartments || a.targetDepartments.length === 0) return true
    return a.targetDepartments.some(d => String(d?._id || d?.id || d) === String(uDeptId))
  })
  const upcomingActivities = activities.filter(a => a.status === "open" && a.workflowStatus === "approved")
  const ongoingActivities = activities.filter(a => a.status === "closed" && a.workflowStatus === "approved")
  const completedActivities = activities.filter(a => a.status === "completed")
  const attendanceActivities = activities.filter(a => ["approved", "completed"].includes(a.workflowStatus))

  const activityKey = (a) => a.id || a._id
  const formatActivityDay = (activity) => {
    const raw = activity.startDate ?? activity.date
    if (!raw) return "TBD"
    const d = new Date(raw)
    return isNaN(d.getTime()) ? "TBD" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  // ── Load organizer panel for an activity ──────────────────────────────────
  const loadOrganizerPanel = useCallback(async (activityId) => {
    setLoadingPanel(true)
    try {
      const data = await api.get(`/participations/${activityId}/organizer-panel`)
      setOrganizerPanel(data || [])
      const init = {}
      ;(data || []).forEach(p => { init[p._id] = { completed: true, rating: 4, note: "" } })
      setAttendanceReport(init)
    } catch {
      toast.error("Failed to load attendance panel")
    } finally {
      setLoadingPanel(false)
    }
  }, [])

  useEffect(() => {
    if (selectedAttendanceActivity) {
      loadOrganizerPanel(selectedAttendanceActivity._id || selectedAttendanceActivity.id)
    }
  }, [selectedAttendanceActivity, loadOrganizerPanel])

  // ── Load pending validations ───────────────────────────────────────────────
  const loadPendingValidations = useCallback(async () => {
    setLoadingValidations(true)
    try {
      const res = await api.get("/participations")
      const pending = (res || []).filter(p => {
         if (p.status !== "awaiting_manager") return false;
         const pUserStr = String(p.userId?._id || p.userId?.id || p.userId);
         return deptEmployees.some(e => String(e.id || e._id) === pUserStr);
      })
      setPendingValidations(pending)
    } catch (err) {
      toast.error("Failed to load pending validations")
    } finally {
      setLoadingValidations(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptEmployees.length])

  useEffect(() => {
    loadPendingValidations()
  }, [loadPendingValidations])


  // ── Submit attendance report ───────────────────────────────────────────────
  const handleSubmitReport = async () => {
    if (!selectedAttendanceActivity) return
    const activityId = selectedAttendanceActivity._id || selectedAttendanceActivity.id
    const report = organizerPanel.map(p => ({
      participationId: p._id,
      completed: attendanceReport[p._id]?.completed ?? true,
      rating: attendanceReport[p._id]?.rating ?? 3,
      note: attendanceReport[p._id]?.note || "",
    }))
    if (!report.length) return toast.error("No participants to report on")
    setSubmittingReport(true)
    try {
      const result = await api.post(`/participations/${activityId}/organizer-report`, { report })
      toast.success("Attendance Report Submitted", {
        description: `${result.awaitingValidation} completed, ${result.notCompleted} not completed. Managers notified.`
      })
      setSelectedAttendanceActivity(null)
      setOrganizerPanel([])
      setAttendanceReport({})
    } catch (err) {
      toast.error("Failed to submit report", { description: err?.message })
    } finally {
      setSubmittingReport(false)
    }
  }

  // ── Validate or reject a completion ───────────────────────────────────────
  const handleValidate = async (participationId, validate, reason) => {
    setValidatingId(participationId)
    try {
      await api.post(`/participations/${participationId}/validate`, {
        validate,
        rejectionReason: reason || undefined,
      })
      toast.success(validate ? "✅ Completion Validated" : "❌ Completion Rejected", {
        description: validate
          ? "Skill scores have been automatically updated."
          : `Rejected: ${reason}`
      })
      setPendingValidations(prev => prev.filter(p => p._id !== participationId))
      setRejectionValidationTarget(null)
      setRejectionValidationReason("")
    } catch (err) {
      toast.error("Validation failed", { description: err?.message })
    } finally {
      setValidatingId(null)
    }
  }

// ── ActivityCard Component ──────────────────────────────────────────────────
// Extracted out of ManagerActivitiesPage to prevent unmount/remount on every render.
const ActivityCard = ({ activity, deptEmployees, enrollments, getTypeIcon, formatActivityDay, approveActivity, setRejectingActivity, setRejectionModalOpen, navigate }) => {
  const aKey = String(activity._id || activity.id || "")
  const enrollmentList = enrollments[aKey] || []
  const capacity = activity.availableSeats ?? activity.capacity ?? 0
  const enrolled = enrollmentList.filter(id =>
    (deptEmployees || []).some(e => String(e.id || e._id) === String(id))
  )
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all group overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 bg-slate-50/30">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
              {getTypeIcon(activity.type)}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors leading-tight">{activity.title}</h3>
              <p className="text-[10px] font-bold text-slate-400 tracking-wider mt-1">{getActivityTypeLabel(activity.type)}</p>
            </div>
          </div>
          <Badge variant="outline" className={cn("text-[10px] font-bold border-none rounded-md px-2 py-0.5",
            activity.status === "open" ? "bg-emerald-50 text-emerald-600" :
            activity.status === "closed" ? "bg-orange-50 text-orange-600" : "bg-slate-50 text-slate-500")}>
            {activity.status === "open" ? "ENROLLMENT OPEN" : (activity.status || "DRAFT").toUpperCase()}
          </Badge>
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col gap-5">
        <p className="text-sm text-slate-500 leading-relaxed font-medium line-clamp-2">{activity.description}</p>
        <div className="grid grid-cols-2 gap-y-3 gap-x-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600"><Calendar className="h-4 w-4 text-slate-400" />{formatActivityDay(activity)}</div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600"><Clock className="h-4 w-4 text-slate-400" />{activity.duration}</div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600"><MapPin className="h-4 w-4 text-slate-400" /><span className="truncate">{activity.location}</span></div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600"><Users className="h-4 w-4 text-slate-400" />{enrolled.length}/{capacity || "—"} Enrolled</div>
        </div>
        {enrolled.length > 0 && (
          <div className="pt-4 border-t border-slate-100 mt-2">
            <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-3">Team Participation ({enrolled.length} members)</p>
            <div className="flex -space-x-2">
              {enrolled.slice(0, 5).map(empId => {
                const emp = deptEmployees.find(e => (e.id || e._id) === empId)
                return (
                  <Avatar key={empId} className="h-8 w-8 border-2 border-white rounded-lg shadow-sm">
                    <AvatarImage src={emp?.avatar} />
                    <AvatarFallback className="bg-slate-100 text-slate-500 font-bold text-[10px]">{emp?.name?.[0]}</AvatarFallback>
                  </Avatar>
                )
              })}
              {enrolled.length > 5 && <div className="h-8 w-8 rounded-lg bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm">+{enrolled.length - 5}</div>}
            </div>
          </div>
        )}
        <div className="flex gap-3 pt-2 mt-auto">
          {activity.workflowStatus === "pending_approval" ? (
            <>
              <Button size="sm" onClick={async () => {
                try {
                  await approveActivity(activity._id || activity.id); // Fixed missing _id
                  toast.success("Activity Approved")
                } catch {
                  toast.error("Process Failed")
                }
              }} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                <CheckCircle className="h-4 w-4 mr-2" />Approve
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setRejectingActivity(activity); setRejectionModalOpen(true) }} className="flex-1 text-rose-600 border-rose-100 hover:bg-rose-50">
                <XCircle className="h-4 w-4 mr-2" />Reject
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate(`/manager/program-analysis/${activity._id || activity.id}`)} className="flex-1">
                <Eye className="h-4 w-4 mr-2" />Analysis
              </Button>
              {activity.status !== "completed" && (
                <Button size="sm" onClick={() => navigate(`/manager/program-enroll/${activity._id || activity.id}`)} className="flex-1 bg-primary text-white hover:bg-primary/90">
                  <UserPlus className="h-4 w-4 mr-2" />Configure
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col bg-[#F8FAFC] min-h-screen">
      <DashboardHeader title="Programs" description="Training and development activities" />
      <div className="flex-1 p-8 space-y-8 animate-in fade-in duration-500">
        <Tabs defaultValue="upcoming" className="w-full">
          {/* Page header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-200 pb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-200">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Program Portfolio</h1>
                <p className="text-sm text-slate-500">Coordinate team development initiatives and enrollment.</p>
              </div>
            </div>
            <Button className="bg-primary text-white hover:bg-primary/90" size="lg" onClick={() => setRequestDialogOpen(true)}>
              + Request Activity
            </Button>
          </div>

          {/* Tabs */}
          <TabsList className="bg-slate-100 p-1 rounded-xl h-auto mb-8 flex flex-wrap gap-1">
            <TabsTrigger value="requests" className="px-4 h-10 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Requests ({pendingActivities.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="px-4 h-10 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Open ({upcomingActivities.length})
            </TabsTrigger>
            <TabsTrigger value="ongoing" className="px-4 h-10 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
              In Progress ({ongoingActivities.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="px-4 h-10 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Completed ({completedActivities.length})
            </TabsTrigger>
            <TabsTrigger value="attendance" className="px-4 h-10 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5" />Attendance
            </TabsTrigger>
            <TabsTrigger value="validations" onClick={loadPendingValidations} className="px-4 h-10 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />Validate
              {pendingValidations.length > 0 && (
                <span className="bg-rose-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">{pendingValidations.length}</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Requests ── */}
          <TabsContent value="requests" className="mt-0 outline-none">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(pendingActivities || []).map(a => <ActivityCard 
                key={activityKey(a)} 
                activity={a} 
                deptEmployees={deptEmployees}
                enrollments={enrollments}
                getTypeIcon={getTypeIcon}
                formatActivityDay={formatActivityDay}
                approveActivity={approveActivity}
                setRejectingActivity={setRejectingActivity}
                setRejectionModalOpen={setRejectionModalOpen}
                navigate={navigate}
              />)}
              {!pendingActivities.length && (
                <div className="col-span-full text-center py-20 bg-white border border-slate-200 rounded-xl">
                  <Sparkles className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No pending requests</h3>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Open ── */}
          <TabsContent value="upcoming" className="mt-0 outline-none">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingActivities.map(a => <ActivityCard 
                key={activityKey(a)} 
                activity={a} 
                deptEmployees={deptEmployees}
                enrollments={enrollments}
                getTypeIcon={getTypeIcon}
                formatActivityDay={formatActivityDay}
                approveActivity={approveActivity}
                setRejectingActivity={setRejectingActivity}
                setRejectionModalOpen={setRejectionModalOpen}
                navigate={navigate}
              />)}
              {!upcomingActivities.length && (
                <div className="col-span-full text-center py-20 bg-white border border-slate-200 rounded-xl">
                  <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Scheduled Programs</h3>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── In Progress ── */}
          <TabsContent value="ongoing" className="mt-0 outline-none">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {ongoingActivities.map(a => <ActivityCard 
                key={activityKey(a)} 
                activity={a} 
                deptEmployees={deptEmployees}
                enrollments={enrollments}
                getTypeIcon={getTypeIcon}
                formatActivityDay={formatActivityDay}
                approveActivity={approveActivity}
                setRejectingActivity={setRejectingActivity}
                setRejectionModalOpen={setRejectionModalOpen}
                navigate={navigate}
              />)}
              {!ongoingActivities.length && (
                <div className="col-span-full text-center py-20 bg-white border border-slate-200 rounded-xl">
                  <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No In-Progress Programs</h3>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Completed ── */}
          <TabsContent value="completed" className="mt-0 outline-none">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {completedActivities.map(a => <ActivityCard 
                key={activityKey(a)} 
                activity={a} 
                deptEmployees={deptEmployees}
                enrollments={enrollments}
                getTypeIcon={getTypeIcon}
                formatActivityDay={formatActivityDay}
                approveActivity={approveActivity}
                setRejectingActivity={setRejectingActivity}
                setRejectionModalOpen={setRejectionModalOpen}
                navigate={navigate}
              />)}
              {!completedActivities.length && (
                <div className="col-span-full text-center py-20 bg-white border border-slate-200 rounded-xl">
                  <CheckCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Completed Programs</h3>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── ATTENDANCE PANEL ── */}
          <TabsContent value="attendance" className="mt-0 outline-none">
            {!selectedAttendanceActivity ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Attendance Reports</h2>
                    <p className="text-sm text-slate-500">Select an activity to submit employee completion data.</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {attendanceActivities.map(activity => (
                    <button
                      key={activityKey(activity)}
                      onClick={() => setSelectedAttendanceActivity(activity)}
                      className="text-left bg-white border border-slate-200 rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                          {getTypeIcon(activity.type)}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-primary transition-colors">{activity.title}</h3>
                      <p className="text-[11px] text-slate-400 font-medium">{formatActivityDay(activity)} · {activity.duration}</p>
                    </button>
                  ))}
                  {!attendanceActivities.length && (
                    <div className="col-span-full text-center py-20 bg-white border border-slate-200 rounded-xl">
                      <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No activities ready for reporting</h3>
                      <p className="text-sm text-slate-500">Activities appear here once they have ended.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => { setSelectedAttendanceActivity(null); setOrganizerPanel([]) }}
                    className="text-sm text-slate-500 hover:text-primary font-semibold"
                  >
                    ← Back
                  </button>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedAttendanceActivity.title}</h2>
                    <p className="text-sm text-slate-500">Mark completion status and rate each employee's performance.</p>
                  </div>
                </div>

                {loadingPanel ? (
                  <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : !organizerPanel.length ? (
                  <div className="text-center py-20 bg-white border border-slate-200 rounded-xl">
                    <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No employees pending attendance</h3>
                    <p className="text-sm text-slate-500">No employees from your team are awaiting an attendance report for this activity.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {organizerPanel.map(participation => {
                        const emp = participation.userId
                        const report = attendanceReport[participation._id] || { completed: true, rating: 4, note: "" }
                        return (
                          <div
                            key={participation._id}
                            className={cn(
                              "bg-white border rounded-xl p-5 transition-all",
                              report.completed ? "border-emerald-200 bg-emerald-50/30" : "border-rose-200 bg-rose-50/20"
                            )}
                          >
                            <div className="flex items-center justify-between flex-wrap gap-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 rounded-xl border border-white shadow-sm">
                                  <AvatarImage src={emp?.avatar} />
                                  <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-sm">{emp?.name?.[0] || "?"}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-bold text-slate-900 text-sm">{emp?.name || "Unknown"}</p>
                                  <p className="text-[11px] text-slate-400">{emp?.email}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => setAttendanceReport(prev => ({
                                  ...prev,
                                  [participation._id]: { ...report, completed: !report.completed }
                                }))}
                                className={cn(
                                  "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border",
                                  report.completed
                                    ? "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600"
                                    : "bg-white text-rose-500 border-rose-200 hover:bg-rose-50"
                                )}
                              >
                                {report.completed ? "✓ Completed" : "✗ Not Completed"}
                              </button>
                            </div>
                            {report.completed && (
                              <div className="mt-4 grid md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Performance Rating</p>
                                  <StarRating
                                    value={report.rating}
                                    onChange={r => setAttendanceReport(prev => ({
                                      ...prev,
                                      [participation._id]: { ...report, rating: r }
                                    }))}
                                  />
                                </div>
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Note (optional)</p>
                                  <Input
                                    value={report.note}
                                    onChange={e => setAttendanceReport(prev => ({
                                      ...prev,
                                      [participation._id]: { ...report, note: e.target.value }
                                    }))}
                                    placeholder="Add a note..."
                                    className="text-xs h-8"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleSubmitReport}
                        disabled={submittingReport}
                        className="bg-primary hover:bg-primary/90 text-white px-8 h-12 text-sm font-bold rounded-xl"
                      >
                        {submittingReport ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ClipboardList className="w-4 h-4 mr-2" />}
                        Submit Attendance Report
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── PENDING VALIDATIONS ── */}
          <TabsContent value="validations" className="mt-0 outline-none">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Pending Validations</h2>
                  <p className="text-sm text-slate-500">Validate or reject completions submitted by organizers. Validated completions update skill scores automatically.</p>
                </div>
              </div>

              {loadingValidations ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : !pendingValidations.length ? (
                <div className="text-center py-20 bg-white border border-slate-200 rounded-xl">
                  <ShieldCheck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">All caught up!</h3>
                  <p className="text-sm text-slate-500">No pending validations. Check back after organizers submit their reports.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingValidations.map(participation => {
                    const emp = participation.userId
                    const activity = participation.activityId
                    const isValidating = validatingId === participation._id
                    const isRejecting = rejectionValidationTarget === participation._id
                    return (
                      <div key={participation._id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start gap-4 flex-wrap">
                          <Avatar className="h-11 w-11 rounded-xl border border-slate-100 shadow-sm flex-shrink-0">
                            <AvatarImage src={emp?.avatar} />
                            <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">{emp?.name?.[0] || "?"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <p className="font-bold text-slate-900">{emp?.name}</p>
                              <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[10px] font-black">Awaiting Validation</Badge>
                            </div>
                            <p className="text-sm text-slate-500 truncate font-medium">{activity?.title}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Organizer Rating:</p>
                              <StarRating value={participation.organizerRating || 0} disabled />
                              <span className="text-xs font-bold text-slate-600">{participation.organizerRating}/5</span>
                            </div>
                            {participation.organizerNote && (
                              <p className="text-xs text-slate-500 mt-2 italic bg-slate-50 px-3 py-2 rounded-lg">"{participation.organizerNote}"</p>
                            )}
                          </div>
                          <div className="flex gap-2 flex-shrink-0 items-center justify-end">
                            <Button
                              onClick={() => {
                                navigate(`/manager/validation/${participation._id}`)
                              }}
                              className="bg-primary hover:bg-[#D97706] text-white h-9 px-4 text-xs font-bold rounded-lg shadow-md shadow-primary/20"
                            >

                              <CheckCircle className="w-3 h-3 mr-2" />
                              Review Validation Report
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* ── Request Activity Dialog ── */}
        <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
          <DialogContent className="bg-white rounded-2xl">
            <DialogHeader>
              <DialogTitle>Request New Activity</DialogTitle>
              <DialogDescription>Fill in the details to request a new training or development activity for your team.</DialogDescription>
            </DialogHeader>
            <form onSubmit={async (e) => {
              e.preventDefault()
              setIsSubmittingRequest(true)
              try {
                await api.post("/activity-requests", {
                  title: requestForm.title, description: requestForm.description,
                  requiredSkills: requestForm.requiredSkills, seatCount: Number(requestForm.seatCount),
                })
                toast.success("Request submitted!", { description: "Your activity request has been sent to HR for approval." })
                setRequestDialogOpen(false)
                setRequestForm({ title: "", description: "", requiredSkills: [], seatCount: 1 })
              } catch (err) {
                toast.error("Failed to submit request", { description: err.message })
              } finally {
                setIsSubmittingRequest(false)
              }
            }} className="space-y-4">
              <div>
                <Label htmlFor="req-title">Activity Title</Label>
                <Input id="req-title" placeholder="e.g., Advanced TypeScript Training" value={requestForm.title} onChange={e => setRequestForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div>
                <Label htmlFor="req-desc">Description</Label>
                <Textarea id="req-desc" placeholder="Describe the activity..." value={requestForm.description} onChange={e => setRequestForm(f => ({ ...f, description: e.target.value }))} required className="min-h-24" />
              </div>
              <div>
                <Label>Required Skills</Label>
                <div className="space-y-3">
                  <Select value={skillSearchValue} onValueChange={skillId => {
                    const skill = skills.find(s => (s.id || s._id) === skillId)
                    if (skill && !requestForm.requiredSkills.includes(skill.name)) {
                      setRequestForm(f => ({ ...f, requiredSkills: [...f.requiredSkills, skill.name] }))
                      setSkillSearchValue("")
                    }
                  }}>
                    <SelectTrigger className="bg-white border border-slate-200 rounded-lg"><SelectValue placeholder="Search and select skills..." /></SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 rounded-lg shadow-lg">
                      {skills.filter(s => !requestForm.requiredSkills.includes(s.name)).map(skill => (
                        <SelectItem key={skill.id || skill._id} value={skill.id || skill._id} className="py-2">{skill.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {requestForm.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                      {requestForm.requiredSkills.map(skill => (
                        <Badge key={skill} variant="secondary" className="flex items-center gap-2 bg-blue-100 text-blue-700 border-blue-200">
                          {skill}
                          <button type="button" onClick={() => setRequestForm(f => ({ ...f, requiredSkills: f.requiredSkills.filter(s => s !== skill) }))} className="ml-1 hover:bg-blue-200 rounded p-0.5">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="req-seats">Available Seats</Label>
                <Input id="req-seats" type="number" min="1" value={requestForm.seatCount} onChange={e => setRequestForm(f => ({ ...f, seatCount: e.target.value }))} required />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRequestDialogOpen(false)} disabled={isSubmittingRequest}>Cancel</Button>
                <Button type="submit" className="bg-primary text-white hover:bg-primary/90" disabled={isSubmittingRequest}>{isSubmittingRequest ? "Submitting..." : "Submit Request"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Rejection Modal ── */}
        <Dialog open={rejectionModalOpen} onOpenChange={setRejectionModalOpen}>
          <DialogContent className="sm:max-w-md bg-white rounded-3xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">Provide Rejection Reason</DialogTitle>
              <DialogDescription className="text-slate-500 font-medium">Explain why this program is being rejected. This feedback will be sent to the activity coordinator.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea
                placeholder="e.g., Budget constraints or needs more focus on technical skills..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="min-h-[120px] bg-slate-50 border-slate-100 h-32 rounded-2xl p-4 text-sm resize-none"
              />
            </div>
            <DialogFooter className="flex gap-3 sm:justify-start">
              <Button variant="outline" onClick={() => { setRejectionModalOpen(false); setRejectionReason("") }} className="flex-1 rounded-xl h-12 font-bold uppercase tracking-widest text-[10px]">Cancel</Button>
              <Button
                disabled={!rejectionReason.trim() || isSubmittingRejection}
                onClick={async () => {
                  setIsSubmittingRejection(true)
                  try {
                    await rejectActivity(rejectingActivity.id || rejectingActivity._id, rejectionReason)
                    toast.success("Program Rejected", { description: "The coordinator has been notified." })
                    setRejectionModalOpen(false)
                    setRejectionReason("")
                  } catch { toast.error("Failed to process rejection") } finally { setIsSubmittingRejection(false) }
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-12 font-bold uppercase tracking-widest text-[10px]"
              >
                Confirm Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
