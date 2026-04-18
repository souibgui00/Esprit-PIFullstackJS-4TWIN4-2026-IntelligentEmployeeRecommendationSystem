"use client"

import { useState } from "react"
import { useData } from "/lib/data-store"
import { useAuth } from "/lib/auth-context"
import { Badge } from "/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "/components/ui/dialog"
import { Textarea } from "/components/ui/textarea"
import { Button } from "/components/ui/button"
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  Zap,
  Target,
  Trophy,
  Brain,
  X,
  LogOut,
  AlertTriangle,
} from "lucide-react"
import { cn } from "/lib/utils"
import { toast } from "sonner"
import { api } from "/lib/api"

// Statuses that mean the employee is actively enrolled in the activity
const ACTIVE_STATUSES = ['started', 'completed', 'accepted', 'in_progress', 'awaiting_organizer', 'organizer_submitted', 'awaiting_manager', 'validated']
const WITHDRAWABLE_STATUSES = ['accepted', 'in_progress']

export default function EmployeeActivitiesPage() {
  const {
    activities,
    participations,
    enrollEmployee,
    updateParticipationProgress,
    loading,
    assignments,
    acceptRecommendation,
    rejectRecommendation,
    refreshParticipations,
  } = useData()
  const { user } = useAuth()
  const employeeId = user?.id || user?._id
  const userDeptId = user?.department_id?._id || user?.department_id?.id || user?.department_id

  // Withdrawal modal state
  const [withdrawTarget, setWithdrawTarget] = useState(null) // { activityId, title }
  const [withdrawReason, setWithdrawReason] = useState("")
  const [withdrawing, setWithdrawing] = useState(false)

  const enrolledActivities = participations
    ?.filter(p => ACTIVE_STATUSES.includes(p.status))
    .map(p => {
      const activity = typeof p.activityId === 'object' ? p.activityId : activities.find(a => (a.id === p.activityId || a._id === p.activityId))
      return activity ? { ...activity, participation: p } : null
    })
    .filter(Boolean) || []

  const enrolledIds = participations?.map(p => typeof p.activityId === 'object' ? p.activityId._id : p.activityId) || []

  const availableActivities = activities.filter(a => {
    const isEnrolled = enrolledIds.includes(a.id) || enrolledIds.includes(a._id)
    if (isEnrolled) return false
    const isApproved = a.workflowStatus === 'approved'
    const isActive = ["upcoming", "active", "open"].includes(a.status?.toLowerCase())
    const isForMyDept = a.targetDepartments && Array.isArray(a.targetDepartments) &&
      a.targetDepartments.some(dId => String(dId) === String(userDeptId))
    return isApproved && isActive && isForMyDept
  })

  const invitations = assignments?.filter(a => {
    const isForMe = String(a.userId?._id || a.userId) === String(employeeId)
    const isNotified = a.status === 'notified'
    return isForMe && isNotified
  }).map(inv => {
    const activity = activities.find(a => String(a.id || a._id) === String(inv.activityId?._id || inv.activityId))
    return activity ? { ...activity, assignment: inv } : null
  }).filter(Boolean) || []

  // ── Withdrawal handler ──────────────────────────────────────────────────────
  const handleWithdraw = async () => {
    if (!withdrawTarget) return
    if (!withdrawReason.trim()) {
      toast.error("Reason required", { description: "You must explain why you are withdrawing." })
      return
    }
    setWithdrawing(true)
    try {
      await api.post(`/participations/${withdrawTarget.activityId}/withdraw`, {
        reason: withdrawReason.trim(),
      })
      toast.success("Withdrawal submitted", {
        description: "Your manager has been notified. The seat has been freed for another colleague."
      })
      setWithdrawTarget(null)
      setWithdrawReason("")
      // Refresh participations so the card disappears from "My Curriculum"
      if (refreshParticipations) await refreshParticipations()
    } catch (err) {
      toast.error("Withdrawal failed", { description: err?.message || "Please try again." })
    } finally {
      setWithdrawing(false)
    }
  }

  const getStatusBadge = (status) => {
    const map = {
      accepted: { label: "Accepted", cls: "bg-emerald-50 text-emerald-600" },
      in_progress: { label: "In Progress", cls: "bg-blue-50 text-blue-600" },
      awaiting_organizer: { label: "Completion Pending Review", cls: "bg-amber-50 text-amber-600" },
      organizer_submitted: { label: "Under Review", cls: "bg-violet-50 text-violet-600" },
      awaiting_manager: { label: "Awaiting Manager Approval", cls: "bg-sky-50 text-sky-600" },
      validated: { label: "YES Validated", cls: "bg-emerald-100 text-emerald-700" },
      withdrawn: { label: "Withdrawn", cls: "bg-rose-50 text-rose-400" },
    }
    const s = map[status]
    if (!s) return null
    return <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full", s.cls)}>{s.label}</span>
  }

  return (
    <div className="flex flex-col min-h-screen bg-transparent page-transition overflow-x-hidden">
      {/* Immersive Header */}
      <div className="bg-[#2C2C2C] pt-32 pb-48 px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#F28C1B]/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#1E5FA8]/5 rounded-full blur-[80px] -ml-24 -mb-24"></div>

        <div className="max-w-6xl mx-auto relative z-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/20 text-orange-400 text-[10px] font-bold tracking-widest uppercase mb-2">
                <Trophy className="w-3 h-3" />
                Learning Center
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none text-balance uppercase">
                Expand your <span className="text-[#F28C1B]">skills.</span>
              </h1>
              <p className="text-orange-100/60 max-w-lg font-medium">
                Choose from highly curated programs designed to elevate your professional trajectory and strategic impact.
              </p>
            </div>

            <div className="flex gap-4">
              <div className="stats-glass px-6 py-4 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 text-center">
                <p className="text-orange-400 text-2xl font-black leading-none">{enrolledActivities.length}</p>
                <p className="text-orange-100/40 text-[10px] uppercase tracking-widest font-bold mt-2">Active Courses</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-8 -mt-24 pb-24 relative z-20">
        <Tabs defaultValue="enrolled" className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <TabsList className="bg-[#2C2C2C]/10 backdrop-blur-xl p-1.5 rounded-2xl h-14 border border-slate-100 inline-flex shadow-sm">
              <TabsTrigger value="enrolled" className="px-8 rounded-xl font-bold text-xs uppercase tracking-widest data-[state=active]:bg-[#F28C1B] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-slate-500">My Curriculum</TabsTrigger>
              <TabsTrigger value="invitations" className="px-8 rounded-xl font-bold text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-slate-500 relative">
                Invitations
                {invitations.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[8px] flex items-center justify-center rounded-full text-white shadow-lg animate-bounce">
                    {invitations.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── My Curriculum ── */}
          <TabsContent value="enrolled" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-0 m-0 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {enrolledActivities.length === 0 ? (
              <div className="col-span-full bg-white rounded-[40px] border border-orange-100 py-32 text-center shadow-xl shadow-orange-900/5">
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="w-10 h-10 text-orange-200" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">No active courses</h4>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">Explore the catalog or wait for manager invitations.</p>
              </div>
            ) : (
              enrolledActivities.map(activity => (
                <ActivityCard
                  key={activity.id || activity._id}
                  activity={activity}
                  enrolled
                  employeeId={employeeId}
                  enrollEmployee={enrollEmployee}
                  updateParticipationProgress={updateParticipationProgress}
                  getStatusBadge={getStatusBadge}
                  canWithdraw={WITHDRAWABLE_STATUSES.includes(activity.participation?.status)}
                  onWithdraw={() => setWithdrawTarget({
                    activityId: activity.id || activity._id,
                    title: activity.title,
                  })}
                />
              ))
            )}
          </TabsContent>

          {/* ── Invitations ── */}
          <TabsContent value="invitations" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-0 m-0 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {invitations.length === 0 ? (
              <div className="col-span-full bg-white rounded-[40px] border border-orange-100 py-32 text-center shadow-xl shadow-orange-900/5">
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-10 h-10 text-orange-200" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">No active invitations</h4>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">Managers will send you recommendations here when they identify a good fit for your career growth.</p>
              </div>
            ) : (
              invitations.map(activity => (
                <ActivityCard
                  key={activity.id || activity._id}
                  activity={activity}
                  invitation
                  employeeId={employeeId}
                  getStatusBadge={getStatusBadge}
                  acceptInvitation={() => acceptRecommendation(activity.assignment.id)}
                  rejectInvitation={() => rejectRecommendation(activity.assignment.id, "Declined by employee")}

                />
              ))
            )}
          </TabsContent>

          {/* ── Marketplace ── */}

        </Tabs>
      </div>

      {/* ── Withdrawal Modal ──────────────────────────────────────────────────── */}
      <Dialog open={!!withdrawTarget} onOpenChange={(open) => { if (!open && !withdrawing) { setWithdrawTarget(null); setWithdrawReason("") } }}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900">Withdraw from Activity</DialogTitle>
            </div>
            <DialogDescription className="text-slate-500">
              You are about to withdraw from <strong className="text-slate-700">"{withdrawTarget?.title}"</strong>. Your manager will be notified immediately. This action is logged in your history but will <strong>not</strong> affect your skill scores.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-rose-500">
              Reason for withdrawal <span className="text-rose-400">*</span>
            </p>
            <Textarea
              placeholder="e.g., Schedule conflict due to an urgent project deadline, personal emergency, etc."
              value={withdrawReason}
              onChange={e => setWithdrawReason(e.target.value)}
              className="min-h-[110px] bg-slate-50 border-slate-200 rounded-2xl p-4 text-sm resize-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300"
            />
            {withdrawReason.trim().length === 0 && withdrawReason.length > 0 && (
              <p className="text-xs text-rose-500">Reason cannot be empty.</p>
            )}
          </div>

          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              disabled={withdrawing}
              onClick={() => { setWithdrawTarget(null); setWithdrawReason("") }}
              className="flex-1 rounded-xl h-12 font-bold text-[10px] uppercase tracking-widest"
            >
              Cancel
            </Button>
            <Button
              disabled={!withdrawReason.trim() || withdrawing}
              onClick={handleWithdraw}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-xl h-12 font-bold text-[10px] uppercase tracking-widest"
            >
              {withdrawing ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <LogOut className="w-3 h-3 mr-2" />}
              Confirm Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── ActivityCard ─────────────────────────────────────────────────────────────
function ActivityCard({
  activity,
  enrolled,
  invitation,
  employeeId,
  enrollEmployee,
  updateParticipationProgress,
  acceptInvitation,
  rejectInvitation,
  getStatusBadge,
  canWithdraw,
  onWithdraw,
}) {
  const [processing, setProcessing] = useState(null)
  const progress = activity.participation?.progress || 0
  const status = activity.participation?.status

  const handleEnroll = async () => {
    setProcessing('enroll')
    try {
      await enrollEmployee(activity.id || activity._id, employeeId)
      toast.success("Enrolled", { description: "You have successfully enrolled in this course." })
    } finally {
      setProcessing(null)
    }
  }

  const handleAcceptInvitation = async () => {
    setProcessing('accept')
    try {
      await acceptInvitation()
      toast.success("Joined Session", { description: "You are now officially enrolled in this training." })
    } catch {
      toast.error("Failed to join")
    } finally {
      setProcessing(null)
    }
  }

  const handleRejectInvitation = async () => {
    setProcessing('reject')
    try {
      await rejectInvitation()
      toast.success("Invite Declined", { description: "The manager has been notified of your decision." })
    } catch {
      toast.error("Error updating invitation")
    } finally {
      setProcessing(null)
    }
  }

  // Determine card state for enrolled activities
  const isLocked = enrolled && !canWithdraw // past withdrawal window (awaiting report, validated, etc.)

  return (
    <div className="group card-premium bg-white border-none shadow-sm flex flex-col font-sans">
      {/* Card header gradient */}
      <div className="h-40 bg-[#2C2C2C] relative overflow-hidden flex items-center justify-center p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E5FA8]/20 to-[#F28C1B]/20 blur-xl"></div>
        <div className="relative text-white/10 group-hover:scale-125 transition-transform duration-1000">
          <Brain className="w-24 h-24" />
        </div>
        <div className="absolute top-6 right-6">
          <Badge className="bg-white/10 backdrop-blur-md text-white border-white/20 text-[10px] font-black uppercase tracking-widest px-3 py-1">
            {activity.level || "INTERMEDIATE"}
          </Badge>
        </div>
        {/* Status pill on enrolled cards */}
        {enrolled && status && (
          <div className="absolute bottom-4 left-4">
            {getStatusBadge(status)}
          </div>
        )}
      </div>

      <div className="p-8 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 rounded-full bg-[#1E5FA8] animate-pulse"></div>
          <span className="text-[10px] font-bold text-[#1E5FA8] uppercase tracking-[0.2em]">{activity.type || "Training"}</span>
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight group-hover:text-primary transition-colors leading-tight">{activity.title}</h3>
        <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed mb-6">{activity.description}</p>

        <div className="grid grid-cols-2 gap-4 mb-8 pt-6 border-t border-slate-50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary/50" />
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">{activity.duration || "4h"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary/50" />
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">{activity.enrolledCount || 0} enrolled</span>
          </div>
        </div>

        <div className="mt-auto pt-4 space-y-4">
          {/* ── Invitation actions ── */}
          {invitation && (
            <div className="grid grid-cols-1 gap-3">
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 mb-2">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Manager Feedback</p>
                <p className="text-[10px] text-slate-600 font-medium italic">"{activity.assignment?.metadata?.reason || 'Identified as a strong fit for your current skill progression requirements.'}"</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRejectInvitation}
                  disabled={!!processing}
                  className="flex-1 py-4 rounded-2xl border border-rose-100 text-rose-500 text-[10px] font-bold uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {processing === 'reject' ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                  Decline
                </button>
                <button
                  onClick={handleAcceptInvitation}
                  disabled={!!processing}
                  className="flex-[2] py-4 rounded-2xl bg-primary hover:bg-[#D97706] text-white text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-primary/20"
                >
                  {processing === 'accept' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                  Accept & Enroll
                </button>
              </div>
            </div>
          )}

          {/* ── Enrolled actions ── */}
          {enrolled && (
            <div className="space-y-4">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1">
                  <span className="text-primary">{status === 'validated' ? "Validated YES" : status === 'awaiting_manager' ? "Awaiting manager approval" : status === 'awaiting_organizer' ? "Completion under review" : status === 'organizer_submitted' ? "Review in progress" : "In Progress"}</span>
                  <span className="text-slate-400">{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-orange-50 rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(242,140,27,0.5)]"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Mark Complete button - Trigger validation workflow */}
              {['accepted', 'in_progress'].includes(status) && (
                <button
                  onClick={async () => {
                    setProcessing('complete')
                    try {
                      await api.patch(`/participations/${activity.participation?._id}/mark-complete-employee`)
                      toast.success('Validation Requested', { description: 'Your manager has been notified to validate your completion.' })
                      window.location.reload()
                    } catch (err) {
                      toast.error('Failed to mark complete')
                    } finally {
                      setProcessing(null)
                    }
                  }}
                  disabled={!!processing}
                  className="w-full py-4 rounded-2xl bg-[#1E5FA8] hover:bg-[#1E5FA8]/90 text-white text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-blue-900/20 mb-2"
                >
                  {processing === 'complete' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                  I Have Completed This Activity
                </button>
              )}

              {/* Withdraw button — only shown while still withdrawable */}
              {canWithdraw ? (
                <button
                  onClick={onWithdraw}
                  disabled={!!processing}
                  className="w-full py-4 rounded-2xl border border-rose-100 text-rose-500 text-[10px] font-bold uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <LogOut className="w-3 h-3" />
                  Withdraw from Activity
                </button>
              ) : (
                /* Status info pill for post-withdrawal-window states */
                <div className="w-full py-3 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center justify-center gap-2">
                  <ShieldAlert className="w-3 h-3" />
                  {status === 'validated' ? "Completion validated by manager" : "Completed — awaiting manager confirmation"}
                </div>
              )}
            </div>
          )}

          {/* ── Marketplace enroll ── */}
          {!enrolled && !invitation && (
            <button
              onClick={handleEnroll}
              disabled={processing === 'enroll'}
              className="w-full py-5 rounded-2xl bg-[#F28C1B] hover:bg-[#D97706] text-white text-xs font-bold uppercase tracking-widest shadow-xl shadow-orange-900/10 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {processing === 'enroll' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              Enroll in Program
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
