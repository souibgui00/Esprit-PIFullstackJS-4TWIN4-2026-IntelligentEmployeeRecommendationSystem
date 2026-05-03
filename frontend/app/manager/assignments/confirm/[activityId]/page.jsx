"use client"

import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useData } from "@/lib/data-store"
import { useAuth } from "@/lib/auth-context"
import { DashboardHeader } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"
import {
  Users,
  Calendar,
  Target,
  TrendingUp,
  Briefcase,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  RefreshCcw,
  Sparkles,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function ManagerAssignmentConfirmationPage() {
  const { activityId } = useParams()
  const navigate = useNavigate()
  const { assignments, activities, employees, fetchAssignments } = useData()
  const { user } = useAuth()

  const [isSubmitting, setIsSubmitting] = useState(false)
  // Track which assignments are selected (accepted) — default all pending selected
  const [declineReasons, setDeclineReasons] = useState({}) // { assignmentId: string }

  // Normalize IDs
  const currentUserId = String(user?.id || user?._id || "")

  // Find activity (by id or _id)
  const activity = activities.find((a) => String(a.id || a._id) === String(activityId))

  // Get pending assignments for this manager and this activity
  const deptAssignments = assignments.filter((a) => {
    const mid = String(a.managerId?._id || a.managerId || "")
    const aid = String(a.activityId?._id || a.activityId?.id || a.activityId || "")
    return mid === currentUserId && aid === String(activityId)
  })

  const pendingAssignments = deptAssignments.filter((a) => a.status === "pending_manager")

  // Local decision state: each assignment starts as 'accepted'
  const [decisions, setDecisions] = useState(() =>
    Object.fromEntries(pendingAssignments.map((a) => [a.id || a._id, "accepted"]))
  )

  const toggleDecision = (id, val) =>
    setDecisions((prev) => ({ ...prev, [id]: val }))

  const findEmployee = (empId) =>
    employees.find((e) => String(e.id || e._id) === String(empId))

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!activity || !user) return
    setIsSubmitting(true)

    const results = { accepted: 0, declined: 0, errors: 0 }

    const missingReason = pendingAssignments.find((assignment) => {
      const aid = String(assignment.id || assignment._id)
      const decision = decisions[aid] || "accepted"
      const reason = String(declineReasons[aid] || "").trim()
      return decision === "rejected" && !reason
    })

    if (missingReason) {
      setIsSubmitting(false)
      toast.error("Reason required", {
        description: "Each rejected recommendation must include a reason.",
      })
      return
    }

    for (const assignment of pendingAssignments) {
      const aid = String(assignment.id || assignment._id)
      const decision = decisions[aid] || "accepted"
      const reason = declineReasons[aid] || undefined

      try {
        await api.patch(`/assignments/${aid}/status`, { status: decision, reason })
        if (decision === "accepted") results.accepted++
        else results.declined++
      } catch (err) {
        console.error(`[Confirm] Failed for assignment ${aid}:`, err)
        results.errors++
      }
    }

    // Refresh global assignments list
    await fetchAssignments()

    const parts = []
    if (results.accepted) parts.push(`${results.accepted} accepted`)
    if (results.declined) parts.push(`${results.declined} declined`)
    if (results.errors) parts.push(`${results.errors} failed`)

    if (results.errors === pendingAssignments.length) {
      toast.error("All submissions failed", { description: "Check your network and try again." })
    } else {
      toast.success("Review submitted", {
        description: `${parts.join(", ")} — Candidates have been notified automatically.`
      })
      navigate("/manager/assignments")
    }

    setIsSubmitting(false)
  }

  // ─── Guard states ─────────────────────────────────────────────────────────
  if (!activity) {
    return (
      <div className="flex flex-col bg-[#F8FAFC] min-h-screen">
        <DashboardHeader title="Activity Not Found" description="The requested activity could not be located" />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Activity Not Found</h3>
              <p className="text-sm text-slate-500 mb-4">The specified activity identifier is invalid or expired.</p>
              <Button onClick={() => navigate("/manager/assignments")}>Return to Assignments</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (pendingAssignments.length === 0) {
    return (
      <div className="flex flex-col bg-[#F8FAFC] min-h-screen">
        <DashboardHeader title="No Pending Assignments" description="All assignments for this activity have been processed" />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Assignments Complete</h3>
              <p className="text-sm text-slate-500 mb-4">All pending assignments for this activity have been processed.</p>
              <Button onClick={() => navigate("/manager/assignments")}>Return to Assignments</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const acceptedCount = Object.values(decisions).filter((v) => v === "accepted").length
  const declinedCount = Object.values(decisions).filter((v) => v === "rejected").length

  return (
    <div className="flex flex-col bg-[#F8FAFC] min-h-screen">
      <DashboardHeader title="Review Recommendations" description="Accept or decline candidate recommendations for this program" />

      <div className="flex-1 p-8 max-w-6xl mx-auto w-full space-y-8">

        {/* Activity Overview */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl text-slate-900">{activity.title}</CardTitle>
                <p className="text-sm text-slate-500 mt-1">{activity.description}</p>
              </div>
              <Button variant="outline" onClick={() => navigate("/manager/assignments")} className="flex items-center gap-2 shrink-0">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="font-medium">
                  {activity.startDate ? new Date(activity.startDate).toLocaleDateString() : "TBD"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="font-medium">
                  {activity.availableSeats != null
                    ? `${activity.availableSeats - (activity.enrolledCount || 0)} seats left`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-slate-400" />
                <span className="font-medium">{pendingAssignments.length} candidates</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="font-medium">{acceptedCount} to accept · {declinedCount} to decline</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Candidate Cards */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Candidate Review</h2>

          {pendingAssignments
            .sort((a, b) => (b.metadata?.aiScore || 0) - (a.metadata?.aiScore || 0))
            .map((assignment) => {
              const aid = String(assignment.id || assignment._id)
              const empId = String(assignment.employeeId || assignment.userId?._id || assignment.userId || "")
              const emp = findEmployee(empId)
              const score = assignment.metadata?.aiScore ?? null
              const decision = decisions[aid] || "accepted"
              const isAccepted = decision === "accepted"

              return (
                <div
                  key={aid}
                  className={cn(
                    "rounded-2xl border p-6 transition-all duration-300",
                    isAccepted
                      ? "border-emerald-200 bg-emerald-50/30 shadow-sm"
                      : "border-rose-200 bg-rose-50/20 opacity-80"
                  )}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 rounded-xl border border-slate-100 shadow-sm">
                        <AvatarImage src={emp?.avatar} className="object-cover" />
                        <AvatarFallback className="bg-slate-100 text-orange-500 font-bold">
                          {emp?.name ? emp.name.split(" ").map((n) => n[0]).join("") : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-lg font-bold text-slate-900 leading-none">
                          {emp?.name || <span className="italic text-slate-400">Unknown Employee</span>}
                        </p>
                        <p className="text-xs font-bold text-orange-500 tracking-widest mt-1.5 opacity-80">
                          {emp?.position || emp?.role || "—"}
                        </p>
                        {score !== null && (
                          <p className="text-xs text-slate-500 mt-1">
                            AI Score: <span className="font-bold text-slate-800">{score}%</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Accept / Decline toggle */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleDecision(aid, "accepted")}
                        className={cn(
                          "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                          isAccepted
                            ? "bg-emerald-500 text-white border-emerald-500 shadow"
                            : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-600"
                        )}
                      >
                        <CheckCircle2 className="h-4 w-4" /> Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleDecision(aid, "rejected")}
                        className={cn(
                          "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                          !isAccepted
                            ? "bg-rose-500 text-white border-rose-500 shadow"
                            : "bg-white text-slate-500 border-slate-200 hover:border-rose-300 hover:text-rose-600"
                        )}
                      >
                        <XCircle className="h-4 w-4" /> Decline
                      </button>
                    </div>
                  </div>

                  {/* Skill gaps */}
                  {Array.isArray(assignment.metadata?.skillGaps) && assignment.metadata.skillGaps.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1">
                      <span className="text-[9px] font-bold text-slate-400 tracking-widest mr-1 self-center">SKILL GAPS:</span>
                      {assignment.metadata.skillGaps.map((gap, i) => (
                        <span key={i} className="text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100 rounded px-2 py-0.5">
                          {gap}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Reason shown on AI recommendation */}
                  {assignment.metadata?.reason && (
                    <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <Info className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {assignment.metadata.reason}
                      </p>
                    </div>
                  )}

                  {/* Decline reason input */}
                  {!isAccepted && (
                    <div className="mt-4">
                      <label className="text-xs font-bold text-slate-600 tracking-wider block mb-1.5">
                        REASON FOR REJECTION <span className="text-slate-400 font-normal">(required — sent to candidate)</span>
                      </label>
                      <Textarea
                        rows={2}
                        placeholder="Explain why this recommendation is declined..."
                        className="resize-none text-sm border-rose-200 focus:border-rose-400"
                        value={declineReasons[aid] || ""}
                        onChange={(e) => setDeclineReasons((prev) => ({ ...prev, [aid]: e.target.value }))}
                      />
                    </div>
                  )}
                </div>
              )
            })}
        </div>

        {/* Summary + Actions */}
        <Card className="border-slate-200 shadow-sm bg-slate-50">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Decision Summary</h3>
                <p className="text-sm text-slate-500 mt-1">
                  <span className="text-emerald-600 font-bold">{acceptedCount} to accept</span>
                  {" · "}
                  <span className="text-rose-500 font-bold">{declinedCount} to decline</span>
                  {" · "}
                  Candidates will be notified immediately.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/manager/assignments")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || pendingAssignments.length === 0}
                  className="btn-premium px-6"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Confirm All Decisions ({pendingAssignments.length})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
