"use client"

import { useState } from "react"
import { useData } from "@/lib/data-store"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Zap,
  Target,
  Trophy,
  Brain
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function EmployeeActivitiesPage() {
  const { activities, participations, enrollEmployee, unenrollEmployee, updateParticipationProgress, loading } = useData()
  const { getEmployeeProfile } = useAuth()
  const employee = getEmployeeProfile ? getEmployeeProfile() : null
  const employeeId = employee?.id || employee?._id

  const enrolledActivities = participations
    ?.filter(p => p.status === 'started' || p.status === 'completed')
    .map(p => {
      const activity = typeof p.activityId === 'object' ? p.activityId : activities.find(a => (a.id === p.activityId || a._id === p.activityId))
      // Strictly only show approved activities
      if (activity && activity.workflowStatus === 'approved') {
        return { ...activity, participation: p }
      }
      return null
    })
    .filter(Boolean) || []

  const enrolledIds = participations?.map(p => typeof p.activityId === 'object' ? p.activityId._id : p.activityId) || []

  const availableActivities = activities.filter(a =>
    !enrolledIds.includes(a.id) &&
    !enrolledIds.includes(a._id) &&
    a.workflowStatus === 'approved' &&
    ["upcoming", "active", "open"].includes(a.status?.toLowerCase())
  )

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
              <div className="stats-glass px-6 py-4 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 text-center">
                <p className="text-white text-2xl font-black leading-none">{availableActivities.length}</p>
                <p className="text-orange-100/40 text-[10px] uppercase tracking-widest font-bold mt-2">Available</p>
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
              <TabsTrigger value="available" className="px-8 rounded-xl font-bold text-xs uppercase tracking-widest data-[state=active]:bg-[#1E5FA8] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-slate-500">Marketplace</TabsTrigger>
            </TabsList>

            <div className="relative w-full md:w-80">
              <search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
              <input
                placeholder="Filter courses..."
                className="w-full bg-white rounded-2xl border border-orange-100 px-12 py-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-xl shadow-orange-900/5"
              />
            </div>
          </div>

          <TabsContent value="enrolled" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-0 m-0 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {enrolledActivities.length === 0 ? (
              <div className="col-span-full bg-white rounded-[40px] border border-orange-100 py-32 text-center shadow-xl shadow-orange-900/5">
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="w-10 h-10 text-orange-200" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">No active courses</h4>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">Explore the catalog to find your first course.</p>
              </div>
            ) : (
              enrolledActivities.map(activity => (
                <ActivityCard
                  key={activity.id || activity._id}
                  activity={activity}
                  enrolled
                  employeeId={employeeId}
                  enrollEmployee={enrollEmployee}
                  unenrollEmployee={unenrollEmployee}
                  updateParticipationProgress={updateParticipationProgress}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="available" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-0 m-0 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {availableActivities.length === 0 ? (
              <div className="col-span-full bg-white rounded-[40px] border border-orange-100 py-32 text-center shadow-xl shadow-orange-900/5">
                <h4 className="text-xl font-bold text-slate-900 mb-2">No new courses found</h4>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">You've already started or finished all available courses.</p>
              </div>
            ) : (
              availableActivities.map(activity => (
                <ActivityCard
                  key={activity.id || activity._id}
                  activity={activity}
                  employeeId={employeeId}
                  enrollEmployee={enrollEmployee}
                  unenrollEmployee={unenrollEmployee}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function ActivityCard({ activity, enrolled, employeeId, enrollEmployee, unenrollEmployee, updateParticipationProgress }) {
  const [processing, setProcessing] = useState(null)
  const progress = activity.participation?.progress || 0

  const handleEnroll = async () => {
    setProcessing('enroll')
    try {
      await enrollEmployee(activity.id || activity._id, employeeId)
      toast.success("Enrolled", { description: "You have successfully enrolled in this course." })
    } finally {
      setProcessing(null)
    }
  }

  const handleUnenroll = async () => {
    setProcessing('unenroll')
    try {
      await unenrollEmployee(activity.id || activity._id, employeeId)
      toast.success("Unenrolled", { description: "You have successfully unenrolled." })
    } finally {
      setProcessing(null)
    }
  }

  const handleCompleteModule = async () => {
    setProcessing('progress')
    try {
      const newProgress = Math.min(progress + 25, 100)
      const completionFeedback = newProgress === 100 ? 8 : undefined
      const result = await updateParticipationProgress(
        activity.id || activity._id,
        newProgress,
        completionFeedback,
      )
      toast.success(newProgress === 100 ? "Course Completed" : "Progress Updated", {
        description:
          newProgress === 100
            ? result?.scoreUpdated
              ? "You have finished this course and your score was updated."
              : "You have finished this course."
            : `Course progress at ${newProgress}%.`
      })
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="group card-premium bg-white border-none shadow-sm flex flex-col font-sans">
      {/* Card Top: Gradient & Badge */}
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
      </div>

      <div className="p-8 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 rounded-full bg-[#1E5FA8] animate-pulse"></div>
          <span className="text-[10px] font-bold text-[#1E5FA8] uppercase tracking-[0.2em]">{activity.type || "Training"} CURRICULUM</span>
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
          {enrolled ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1">
                  <span className="text-primary">{progress === 100 ? "Completed" : "Progress"}</span>
                  <span className="text-slate-400">{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-orange-50 rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(242,140,27,0.5)]"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleUnenroll}
                  disabled={processing}
                  className="py-4 rounded-2xl border border-rose-100 text-rose-500 text-[10px] font-bold uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {processing === 'unenroll' ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldAlert className="w-3 h-3" />}
                  Unenroll
                </button>
                <button
                  onClick={handleCompleteModule}
                  disabled={processing || progress === 100}
                  className="py-4 rounded-2xl bg-[#1E5FA8] hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                >
                  {processing === 'progress' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  {progress === 100 ? "Finished" : "Complete Module"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleEnroll}
              disabled={processing === 'enroll' || activity.workflowStatus === 'approved'}
              className={cn(
                "w-full py-5 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]",
                activity.workflowStatus === 'approved' 
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none" 
                  : "bg-[#F28C1B] hover:bg-[#D97706] text-white shadow-orange-900/10"
              )}
            >
              {processing === 'enroll' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : activity.workflowStatus === 'approved' ? (
                <Clock className="w-3 h-3" />
              ) : (
                <Zap className="w-3 h-3" />
              )}
              {activity.workflowStatus === 'approved' ? "Recommendation in Progress" : "Enroll in Program"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

