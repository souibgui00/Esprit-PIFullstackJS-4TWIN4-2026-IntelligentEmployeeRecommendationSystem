"use client"

import { useParams, useNavigate } from "react-router-dom"
import { useData } from "@/lib/data-store"
import { useAuth } from "@/lib/auth-context"
import { DashboardHeader } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  BookOpen,
  Award,
  Briefcase,
  ArrowLeft,
  Target,
  AlertCircle,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  CheckCircle,
  MessageCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function ManagerActivityDetailsPage() {
  const { activityId } = useParams()
  const navigate = useNavigate()
  const { activities, employees, departments, enrollments } = useData()
  const { user } = useAuth()

  const activity = activities.find(a => a.id === activityId || a._id === activityId)

  const isManager = (user?.role || "").toLowerCase() === "manager"
  const isAdminOrHR = (user?.role || "").toLowerCase() === "admin" || (user?.role || "").toLowerCase() === "hr"

  const getIdString = (v) => {
    if (v == null) return ""
    if (typeof v === "string") return v
    if (typeof v === "object") return String(v._id || v.id || "")
    return String(v)
  }

  const currentUserId = getIdString(user?.id || user?._id)
  const managerDept = isManager
    ? departments.find(d => getIdString(d.manager_id) === currentUserId)
    : null
  const deptName = managerDept?.name || ""
  const deptId = managerDept?._id ?? managerDept?.id ?? ""

  // Global enrollment for HR/Admin, Dept enrollment for Manager
  const enrolledEmployees = (enrollments[activity?.id || activity?._id] || [])
    .map(id => employees.find(e => String(e.id) === String(id) || String(e._id) === String(id)))
    .filter(Boolean)
    .filter(employee => {
      if (isAdminOrHR) return true
      if (!isManager) return false

      // `employee.department` may store a department id string (not the name).
      const employeeDeptId = getIdString(employee.department_id || employee.department)
      return deptId && employeeDeptId
        ? String(employeeDeptId) === String(deptId)
        : employee.department === deptName
    })

  const getTypeIcon = (type) => {
    switch (type) {
      case "training": return <BookOpen className="h-5 w-5" />
      case "certification": return <Award className="h-5 w-5" />
      case "project": return <Briefcase className="h-5 w-5" />
      default: return <Calendar className="h-5 w-5" />
    }
  }

  const getActivityTypeLabel = (type) => {
    switch (type) {
      case "training": return "Professional Development"
      case "certification": return "Certification Program"
      case "project": return "Applied Learning Project"
      default: return "Development Activity"
    }
  }

  if (!activity) {
    return (
      <div className="flex flex-col bg-[#F8FAFC] min-h-screen">
        <DashboardHeader title="Activity Not Found" description="The requested activity could not be located" />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Activity Not Located</h3>
              <p className="text-sm text-slate-500 mb-4">The specified activity identifier is invalid or expired.</p>
              <Button onClick={() => navigate("/manager/activities")}>
                Return to Activities
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // This logic is now handled above for consistency

  return (
    <div className="flex flex-col bg-[#F8FAFC] min-h-screen">
      <DashboardHeader title="Program details" description="Activity overview and participants" />

      <div className="flex-1 p-8 max-w-6xl mx-auto w-full space-y-8">
        {/* Header */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm">
                  {getTypeIcon(activity.type)}
                </div>
                <div>
                  <CardTitle className="text-xl text-slate-900">{activity.title}</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">{getActivityTypeLabel(activity.type)}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                {isManager && (
                  <Button
                    onClick={() => navigate(`/manager/activities/enroll/${activity.id || activity._id}`)}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Configure Enrollment
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-slate-600 leading-relaxed">{activity.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="font-medium">{new Date(activity.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="font-medium">{activity.duration}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span className="font-medium truncate">{activity.location || "On-site"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="font-medium">{enrollments[activity.id || activity._id]?.length || activity.enrolledCount || 0}/{activity.capacity} Enrolled</span>
              </div>
            </div>

            <Badge variant="outline" className="text-xs font-medium bg-white">
              {activity.status?.toUpperCase()}
            </Badge>

            {/* Workflow Status Section */}
            <div className="pt-6 border-t border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-[2rem] bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-700",
                    activity.workflowStatus === "approved" ? "bg-emerald-500 text-white shadow-emerald-500/20" :
                      activity.workflowStatus === "rejected" ? "bg-rose-500 text-white shadow-rose-500/20" :
                        "bg-amber-500 text-white shadow-amber-500/20"
                  )}>
                    {activity.workflowStatus === "approved" ? <ShieldCheck className="w-6 h-6" /> :
                      activity.workflowStatus === "rejected" ? <ShieldAlert className="w-6 h-6" /> :
                        <ShieldQuestion className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Verification Status</h4>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-black text-slate-900 leading-none">
                        {activity.workflowStatus?.replace("_", " ").toUpperCase() || "PENDING REVIEW"}
                      </p>
                      {activity.workflowStatus === "approved" && (
                        <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-500/10" />
                      )}
                    </div>
                  </div>
                </div>

                {activity.workflowStatus === "rejected" && activity.rejectionReason && (
                  <div className="flex-1 md:max-w-md p-4 bg-white rounded-2xl border border-rose-100 flex items-start gap-3">
                    <MessageCircle className="w-4 h-4 text-rose-400 mt-1 shrink-0" />
                    <div>
                      <p className="text-[9px] font-black text-rose-400 uppercase tracking-[0.2em] mb-1">Review Feedback</p>
                      <p className="text-xs text-slate-600 font-medium italic italic leading-relaxed">"{activity.rejectionReason}"</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Required Skills */}
        {activity.requiredSkills && activity.requiredSkills.length > 0 && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">Required Competencies</CardTitle>
              <p className="text-sm text-slate-500">Essential skills and proficiency levels for program participation.</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {activity.requiredSkills.map(rs => (
                  <div key={rs.skillId} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-900">{rs.skill.name}</p>
                        <p className="text-xs text-slate-500">Core competency requirement</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {rs.requiredLevel} Proficiency
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Department Enrollment */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">
              {isAdminOrHR ? "Global Enrollment List" : "Department Participation"}
            </CardTitle>
            <p className="text-sm text-slate-500">
              {isAdminOrHR
                ? "Full list of personnel enrolled across all departments."
                : `Current enrollment status for ${deptName} department personnel.`}
            </p>
          </CardHeader>
          <CardContent>
            {enrolledEmployees.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">
                    Total Enrolled Personnel
                  </span>
                  <span className="text-lg font-bold text-slate-900">
                    {enrolledEmployees.length}
                  </span>
                </div>

                <div className="grid gap-3">
                  {enrolledEmployees.map(employee => (
                    <div key={employee.id} className="flex items-center gap-4 p-4 rounded-lg border border-slate-100 bg-white">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={employee.avatar} />
                        <AvatarFallback>{employee.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{employee.name}</p>
                        <p className="text-sm text-slate-500">{employee.position}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Enrolled
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-slate-900 mb-2">
                  {isAdminOrHR ? "No Personnel Enrolled" : "No Department Personnel Enrolled"}
                </h4>
                <p className="text-sm text-slate-500 mb-4">
                  {isAdminOrHR
                    ? "This program currently has zero enrollments."
                    : `No team members from ${deptName} are currently enrolled in this program.`}
                </p>
                {isManager && (
                  <Button onClick={() => navigate(`/manager/activities/enroll/${activity.id || activity._id}`)}>
                    Configure Enrollment
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Program Metrics */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Program Analytics</CardTitle>
            <p className="text-sm text-slate-500">Performance metrics and enrollment statistics.</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{activity.capacity}</div>
                <p className="text-sm text-slate-500 mt-1">Total Capacity</p>
              </div>
              <div className="text-center p-6 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{enrollments[activity.id || activity._id]?.length || activity.enrolledCount || 0}</div>
                <p className="text-sm text-slate-500 mt-1">Global Enrollment</p>
              </div>
              <div className="text-center p-6 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">
                  {activity.capacity - (enrollments[activity.id || activity._id]?.length || activity.enrolledCount || 0)}
                </div>
                <p className="text-sm text-slate-500 mt-1">Available Slots</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
