"use client"

import { useState } from "react"
import { useData } from "@/lib/data-store"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Clock,
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useNavigate } from "react-router-dom"

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
  const navigate = useNavigate()

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

  const handleAcceptRecommendation = async (assignment) => {
    await acceptRecommendation?.(assignment.id || assignment._id)
    await refreshParticipations?.()
  }

  const handleRejectRecommendation = async (assignment) => {
    await rejectRecommendation?.(assignment.id || assignment._id)
    await refreshParticipations?.()
  }

  const getStatusBadge = (status) => {
    const map = {
      accepted: { label: "Accepted", cls: "bg-emerald-50 text-emerald-600" },
      in_progress: { label: "In Progress", cls: "bg-blue-50 text-blue-600" },
      awaiting_organizer: { label: "Completion Pending Review", cls: "bg-amber-50 text-amber-600" },
      organizer_submitted: { label: "Under Review", cls: "bg-violet-50 text-violet-600" },
      awaiting_manager: { label: "Awaiting Manager Approval", cls: "bg-sky-50 text-sky-600" },
      validated: { label: "Validated", cls: "bg-emerald-100 text-emerald-700" },
      withdrawn: { label: "Withdrawn", cls: "bg-rose-50 text-rose-400" },
    }
    const s = map[status]
    if (!s) return null
    return <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full", s.cls)}>{s.label}</span>
  }

  return (
    <div className="flex flex-col min-h-screen bg-transparent page-transition overflow-x-hidden">
      {/* Immersive Header */}
      <div className="bg-[#2C2C2C] pt-24 pb-36 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-150 h-150 bg-primary/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-100 h-100 bg-accent-blue/5 rounded-full blur-[80px] -ml-24 -mb-24"></div>

        <div className="max-w-5xl mx-auto relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/20 text-orange-400 text-[10px] font-bold tracking-widest uppercase mb-2">
                <Trophy className="w-3 h-3" />
                Learning Center
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none text-balance uppercase">
                Expand your <span className="text-primary">skills.</span>
              </h1>
              <p className="text-orange-100/60 max-w-lg font-medium text-sm">
                Choose from highly curated programs designed to elevate your professional trajectory and strategic impact.
              </p>
            </div>

            <div className="flex gap-4">
              <div className="stats-glass px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-center">
                <p className="text-orange-400 text-xl font-black leading-none">{enrolledActivities.length}</p>
                <p className="text-orange-100/40 text-[10px] uppercase tracking-widest font-bold mt-2">Active Courses</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full px-6 -mt-18 pb-16 relative z-20">
        <Tabs defaultValue="enrolled" className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <TabsList className="bg-[#2C2C2C]/10 backdrop-blur-xl p-1 rounded-xl h-11 border border-slate-100 inline-flex shadow-sm">
              <TabsTrigger value="enrolled" className="px-6 rounded-lg font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-slate-500">My Curriculum</TabsTrigger>
              <TabsTrigger value="invitations" className="px-6 rounded-lg font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-slate-500 relative">
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
          <TabsContent value="enrolled" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-0 m-0 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {enrolledActivities.length === 0 ? (
              <div className="col-span-full bg-white rounded-3xl border border-orange-100 py-20 text-center shadow-xl shadow-orange-900/5">
                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-orange-200" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-1">No active courses</h4>
                <p className="text-slate-500 text-xs max-w-xs mx-auto">Explore the catalog or wait for manager invitations.</p>
              </div>
            ) : (
              enrolledActivities.map((activity) => (
                <ActivityCard
                  key={activity.id || activity._id}
                  activity={activity}
                  enrolled
                  employeeId={employeeId}
                  enrollEmployee={enrollEmployee}
                  updateParticipationProgress={updateParticipationProgress}
                  getStatusBadge={getStatusBadge}
                  canWithdraw={WITHDRAWABLE_STATUSES.includes(activity.participation?.status)}
                  onWithdraw={() => {
                    const participationId = activity.participation?._id || activity.participation?.id
                    if (participationId) {
                      navigate(`/employee/activities/withdraw/${participationId}`)
                    }
                  }}
                />
              ))
            )}
          </TabsContent>

          {/* ── Invitations ── */}
          <TabsContent value="invitations" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-0 m-0 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {invitations.length === 0 ? (
              <div className="col-span-full bg-white rounded-3xl border border-orange-100 py-20 text-center shadow-xl shadow-orange-900/5">
                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-orange-200" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-1">No active invitations</h4>
                <p className="text-slate-500 text-xs max-w-xs mx-auto">Managers will send you recommendations here when they identify a good fit for your career growth.</p>
              </div>
            ) : (
              invitations.map((activity) => (
                <ActivityCard
                  key={`inv-${activity.id || activity._id}`}
                  activity={activity}
                  invitation
                  employeeId={employeeId}
                  enrollEmployee={enrollEmployee}
                  updateParticipationProgress={updateParticipationProgress}
                  acceptInvitation={() => handleAcceptRecommendation(activity.assignment)}
                  rejectInvitation={() => handleRejectRecommendation(activity.assignment)}
                  getStatusBadge={getStatusBadge}
                />
              ))
            )}
          </TabsContent>

          {/* ── Marketplace ── */}

        </Tabs>
      </div>
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
      <div className="h-30 bg-[#2C2C2C] relative overflow-hidden flex items-center justify-center p-5">
        <div className="absolute inset-0 bg-linear-to-br from-accent-blue/20 to-primary/20 blur-xl"></div>
        <div className="relative text-white/10 group-hover:scale-125 transition-transform duration-1000">
          <Brain className="w-16 h-16" />
        </div>
        <div className="absolute top-4 right-4">
          <Badge className="bg-white/10 backdrop-blur-md text-white border-white/20 text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
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

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-accent-blue animate-pulse"></div>
          <span className="text-[10px] font-bold text-accent-blue uppercase tracking-[0.2em]">{activity.type || "Training"}</span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-2 tracking-tight group-hover:text-primary transition-colors leading-tight">{activity.title}</h3>
        <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed mb-4">{activity.description}</p>

        <div className="grid grid-cols-2 gap-3 mb-5 pt-4 border-t border-slate-50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary/50" />
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">{activity.duration || "4h"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary/50" />
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">{activity.enrolledCount || 0} enrolled</span>
          </div>
        </div>

        <div className="mt-auto pt-3 space-y-3">
          {/* ── Invitation actions ── */}
          {invitation && (
            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 mb-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Manager Feedback</p>
                <p className="text-[10px] text-slate-600 font-medium italic">"{activity.assignment?.metadata?.reason || 'Identified as a strong fit for your current skill progression requirements.'}"</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRejectInvitation}
                  disabled={!!processing}
                  className="flex-1 py-3 rounded-xl border border-rose-100 text-rose-500 text-[10px] font-bold uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {processing === 'reject' ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                  Decline
                </button>
                <button
                  onClick={handleAcceptInvitation}
                  disabled={!!processing}
                  className="flex-2 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-primary/20"
                >
                  {processing === 'accept' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                  Accept & Enroll
                </button>
              </div>
            </div>
          )}

          {/* ── Enrolled actions ── */}
          {enrolled && (
            <div className="space-y-3">
              {/* Progress bar */}
              <div className="space-y-2">
<div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1">
                  <span className="text-primary">{status === 'validated' ? "Validated" : status === 'awaiting_manager' ? "Awaiting manager approval" : status === 'awaiting_organizer' ? "Completion under review" : status === 'organizer_submitted' ? "Review in progress" : "In Progress"}</span>
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
                  className="w-full py-3 rounded-xl bg-accent-blue hover:bg-accent-blue/90 text-white text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-blue-900/20 mb-1"
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
                  className="w-full py-3 rounded-xl border border-rose-100 text-rose-500 text-[10px] font-bold uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <LogOut className="w-3 h-3" />
                  Withdraw from Activity
                </button>
              ) : (
                /* Status info pill for post-withdrawal-window states */
                <div className="w-full py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center justify-center gap-2">
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
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-orange-900/10 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
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
