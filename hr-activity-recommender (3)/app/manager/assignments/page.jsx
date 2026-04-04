"use client"

import { useState } from "react"
import { useData } from "@/lib/data-store"
import { useAuth } from "@/lib/auth-context"
import { DashboardHeader } from "@/components/dashboard/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Bell,
  Forward,
  Send,
  Sparkles,
} from "lucide-react"

export default function ManagerAssignmentsPage() {
  const { assignments, activities, employees, updateAssignmentStatus, fetchAssignments } = useData()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)

  const currentUserId = String(user?.id || user?._id || "")

  // Filter assignments that are forwarded to this manager
  const deptAssignments = assignments.filter((a) => {
    const mid = String(a.managerId?._id || a.managerId || "")
    return mid === currentUserId
  })

  // Normalize activityId to a plain string key
  const normalizeActId = (a) =>
    String(a.activityId?._id || a.activityId?.id || a.activityId || "")

  // Group by normalized activityId string
  const assignmentsByActivity = deptAssignments.reduce((acc, assignment) => {
    const key = normalizeActId(assignment)
    if (!key) return acc
    if (!acc[key]) acc[key] = []
    acc[key].push(assignment)
    return acc
  }, {})

  // Helper: find an activity by normalized id
  const findActivity = (actId) =>
    activities.find((a) => String(a.id || a._id) === String(actId))

  // Helper: find an employee by normalized id
  const findEmployee = (empId) =>
    employees.find((e) => String(e.id || e._id) === String(empId))

  const isPendingDecision = (assignment) => {
    const status = String(assignment?.status || "").toLowerCase()
    return status === "pending_manager" || status === "pending"
  }

  const pendingActivities = Object.entries(assignmentsByActivity).filter(
    ([, assgns]) => assgns.some((a) => isPendingDecision(a)),
  )

  const processedActivities = Object.entries(assignmentsByActivity).filter(
    ([, assgns]) => assgns.every((a) => !isPendingDecision(a)),
  )

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending_manager":
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 rounded-[4px] font-bold text-[9px]">
            <Clock className="mr-1 h-3 w-3" />
            Pending Review
          </Badge>
        )
      case "confirmed":
      case "notified":
        return (
          <Badge variant="outline" className="text-[#F28C1B] border-[#F28C1B]/30 bg-[#F28C1B]/5 rounded-[4px] font-bold text-[9px]">
            <Bell className="mr-1 h-3 w-3" />
            Notified
          </Badge>
        )
      case "accepted":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 rounded-[4px] font-bold text-[9px] border">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Accepted
          </Badge>
        )
      case "declined":
      case "rejected":
        return (
          <Badge variant="outline" className="text-rose-500 border-rose-500/30 bg-rose-50 rounded-[4px] font-bold text-[9px]">
            <XCircle className="mr-1 h-3 w-3" />
            Declined
          </Badge>
        )
      default:
        return <Badge variant="secondary" className="rounded-[4px] font-bold text-[9px]">{status}</Badge>
    }
  }

  const handleAccept = async (assignmentId) => {
    try {
      setIsSubmittingAction(true)
      await updateAssignmentStatus(assignmentId, "accepted")
      await fetchAssignments()
      toast.success("Assignment accepted", {
        description: "The candidate has been notified in real time.",
      })
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || "Failed to accept assignment"
      toast.error("Action failed", { description: message })
    } finally {
      setIsSubmittingAction(false)
    }
  }

  const handleReject = async (assignmentId) => {
    try {
      setIsSubmittingAction(true)
      await updateAssignmentStatus(assignmentId, "rejected")
      await fetchAssignments()
      toast.success("Assignment rejected", {
        description: "Recommendation was rejected. No employee notification was sent.",
      })
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || "Failed to reject assignment"
      toast.error("Action failed", { description: message })
    } finally {
      setIsSubmittingAction(false)
    }
  }

  return (
    <div className="flex flex-col bg-[#F8FAFC] min-h-screen page-transition">
      <DashboardHeader title="Assignments" description="Manage team assignments to training programs" />

      <div className="flex-1 p-10 max-w-7xl mx-auto w-full space-y-12">

        {/* Empty state */}
        {pendingActivities.length === 0 && processedActivities.length === 0 && (
          <div className="glass-panel p-24 text-center group">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:bg-orange-50 transition-colors duration-500">
              <Forward className="h-10 w-10 text-slate-300 group-hover:text-orange-500 transition-all duration-500" />
            </div>
            <h3 className="text-2xl font-display font-bold text-slate-900 mb-4">No Assignment Protocols Active</h3>
            <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
              The assignment queue is currently clear. HR has not forwarded personnel recommendations for your department.
            </p>
          </div>
        )}

        {/* Pending Review Section */}
        {pendingActivities.length > 0 && (
          <div className="space-y-8">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-orange-500 tracking-[0.2em]">Deployment Control</span>
              <h1 className="text-3xl font-display font-bold text-slate-900">Pending Assignment Evaluations</h1>
            </div>

            <div className="grid gap-10">
              {pendingActivities.map(([activityId, activityAssignments]) => {
                const activity = findActivity(activityId)
                if (!activity) return null

                const pendingOnes = activityAssignments.filter((a) => isPendingDecision(a))

                return (
                  <div key={activityId} className="card-premium p-0 border-none bg-white">
                    {/* Activity header */}
                    <div className="p-8 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                      <div>
                        <h3 className="text-xl font-display font-bold text-slate-900 leading-tight">{activity.title}</h3>
                        <p className="text-sm text-slate-500 font-medium mt-2 max-w-2xl leading-relaxed">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-6 mt-6">
                          <span className="flex items-center gap-2 text-[11px] font-bold text-slate-600 tracking-wide">
                            <Calendar className="h-4 w-4 text-orange-500" />
                            {activity.startDate
                              ? new Date(activity.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                              : "TBD"}
                          </span>
                          <span className="flex items-center gap-2 text-[11px] font-bold text-slate-600 tracking-wide">
                            <Users className="h-4 w-4 text-orange-500" />
                            {activity.availableSeats != null ? `${activity.availableSeats - (activity.enrolledCount || 0)} seats remaining` : "—"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <div className="badge-premium px-4 py-2">
                          {pendingOnes.length} Pending Candidate{pendingOnes.length !== 1 ? "s" : ""}
                        </div>
                        <Button
                          onClick={() => navigate(`/manager/assignments/confirm/${activityId}`)}
                          className="btn-premium px-6 h-10 rounded-lg"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Review Assignments
                        </Button>
                      </div>
                    </div>

                    {/* Candidate preview — top 3 */}
                    <div className="p-8 space-y-6">
                      {activityAssignments
                        .filter((a) => isPendingDecision(a))
                        .sort((a, b) => (b.metadata?.aiScore || 0) - (a.metadata?.aiScore || 0))
                        .map((assignment) => {
                          const empId = String(assignment.employeeId || assignment.userId?._id || assignment.userId || "")
                          const emp = findEmployee(empId)
                          const score = assignment.metadata?.aiScore ?? null
                          const assignmentId = String(assignment.id || assignment._id)

                          return (
                            <div
                              key={assignment.id || assignment._id}
                              className="flex items-center gap-6 p-6 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-white transition-all duration-500"
                            >
                              <Avatar className="h-14 w-14 rounded-xl border border-slate-100 shadow-sm">
                                <AvatarImage src={emp?.avatar} className="object-cover" />
                                <AvatarFallback className="bg-slate-100 text-orange-500 font-bold">
                                  {emp?.name ? emp.name.split(" ").map((n) => n[0]).join("") : "?"}
                                </AvatarFallback>
                              </Avatar>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-lg font-bold text-slate-900 leading-none">
                                      {emp?.name || <span className="text-slate-400 italic">Employee not found</span>}
                                    </p>
                                    <p className="text-xs font-bold text-orange-500 tracking-widest mt-2 opacity-80">
                                      {emp?.position || emp?.role || "—"}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    {score !== null ? (
                                      <>
                                        <div className="text-3xl font-display font-black text-slate-900 tracking-tight leading-none">
                                          {score}<span className="text-base ml-0.5">%</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-orange-500 tracking-widest mt-1 opacity-60">
                                          AI SCORE
                                        </p>
                                      </>
                                    ) : (
                                      <span className="text-xs text-slate-400 italic">No score</span>
                                    )}
                                  </div>
                                </div>

                                {/* Skill gaps preview */}
                                {Array.isArray(assignment.metadata?.skillGaps) && assignment.metadata.skillGaps.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-1">
                                    {assignment.metadata.skillGaps.slice(0, 3).map((gap, i) => (
                                      <span key={i} className="text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100 rounded px-2 py-0.5">
                                        {gap}
                                      </span>
                                    ))}
                                    {assignment.metadata.skillGaps.length > 3 && (
                                      <span className="text-[9px] font-bold text-slate-400">
                                        +{assignment.metadata.skillGaps.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                )}

                                <div className="mt-4 flex items-center gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="h-8 px-3"
                                    disabled={isSubmittingAction}
                                    onClick={() => handleAccept(assignmentId)}
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                    Accept
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-3 border-rose-200 text-rose-600 hover:bg-rose-50"
                                    disabled={isSubmittingAction}
                                    onClick={() => handleReject(assignmentId)}
                                  >
                                    <XCircle className="h-3.5 w-3.5 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Processed / Archive Section */}
        {processedActivities.length > 0 && (
          <div className="space-y-8 pt-8 border-t border-slate-100">
            <div className="flex flex-col gap-2 opacity-60">
              <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em]">Deployment Archive</span>
              <h1 className="text-3xl font-display font-bold text-slate-900">Processed Assignment Protocols</h1>
            </div>

            <div className="grid gap-6">
              {processedActivities.map(([activityId, activityAssignments]) => {
                const activity = findActivity(activityId)
                if (!activity) return null

                return (
                  <div key={activityId} className="card-premium p-6 flex flex-col md:flex-row items-center justify-between gap-8 opacity-80 group hover:opacity-100">
                    <div className="flex items-center gap-8">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-orange-500/20 transition-all duration-500">
                        <CheckCircle2 className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight m-0">{activity.title}</h3>
                        <div className="flex items-center gap-3 mt-1.5 px-0.5">
                          <span className="text-[10px] font-bold text-slate-500 tracking-widest">{activityAssignments.length} Units Assigned</span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                          <span className="text-[10px] font-bold text-orange-500 tracking-widest">
                            {activity.startDate
                              ? new Date(activity.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                              : "TBD"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex -space-x-3">
                      {activityAssignments.slice(0, 5).map((a, i) => {
                        const empId = String(a.employeeId || a.userId?._id || a.userId || "")
                        const emp = findEmployee(empId)
                        return (
                          <Avatar key={i} className="w-11 h-11 border-[3px] border-white rounded-xl shadow-sm grayscale group-hover:grayscale-0 transition-all duration-500">
                            <AvatarImage src={emp?.avatar} className="object-cover" />
                            <AvatarFallback>{emp?.name?.[0] || "?"}</AvatarFallback>
                          </Avatar>
                        )
                      })}
                      {activityAssignments.length > 5 && (
                        <div className="w-11 h-11 rounded-xl bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center border-[3px] border-white shadow-sm">
                          +{activityAssignments.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



