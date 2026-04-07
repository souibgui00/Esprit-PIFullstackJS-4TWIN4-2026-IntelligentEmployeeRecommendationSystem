"use client"

import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-store"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Calendar, Clock, ArrowRight, Loader2, Sparkles, Brain,
  Activity, TrendingUp, Zap, Target, Star, Globe, AlertTriangle, UploadCloud, FileText
} from "lucide-react"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts"
import { SkillDistributionChart } from "@/components/dashboard/skill-distribution-chart"
import { ActivityResponsePanel } from "@/components/activities/ActivityResponsePanel"

export default function EmployeeHome() {
  const { user, getEmployeeProfile, refreshProfile } = useAuth()
  const { activities, participations, loading, employees } = useData()
  const employeeProfile = getEmployeeProfile()
  const navigate = useNavigate()

  const employee = employeeProfile

  // Prepare radar data with enhanced aesthetics
  const skillRadarData = useMemo(() => {
    if (!employee || !employee.skills || employee.skills.length === 0) {
      return [
        { subject: 'Strategy', A: 0, fullMark: 100 },
        { subject: 'Innovation', A: 0, fullMark: 100 },
        { subject: 'Technical', A: 0, fullMark: 100 },
        { subject: 'Soft Skills', A: 0, fullMark: 100 },
        { subject: 'Leadership', A: 0, fullMark: 100 },
      ]
    }
    return employee.skills.slice(0, 6).map(s => ({
      subject: s.skill?.name || "Skill",
      A: s.score || 0,
      fullMark: 120
    }))
  }, [employee])

  const enrolledActivities = useMemo(() => {
    if (!participations || !activities) return []
    return participations
      .filter(p => p.status === 'started')
      .map(p => {
        const activity = typeof p.activityId === 'object' ? p.activityId : activities.find(a => (a.id === p.activityId || a._id === p.activityId))
        return activity ? { ...activity, progress: p.progress } : null
      })
      .filter(Boolean)
      .slice(0, 2)
  }, [participations, activities])

  const topRecommendation = useMemo(() => {
    if (!activities) return null
    const enrolledIds = participations?.map(p => typeof p.activityId === 'object' ? p.activityId._id : p.activityId) || []
    return activities.find(a => !enrolledIds.includes(a.id) && !enrolledIds.includes(a._id))
  }, [activities, participations])

  const activeStream = useMemo(() => {
    if (!Array.isArray(participations) || !Array.isArray(activities) || !Array.isArray(employees)) {
      return []
    }

    const formatRelativeTime = (value) => {
      if (!value) return ""
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return ""
      const diffMs = Date.now() - date.getTime()
      const diffMins = Math.max(1, Math.floor(diffMs / 60000))
      if (diffMins < 60) return `${diffMins}m ago`
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours}h ago`
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays}d ago`
    }

    return participations
      .map((p) => {
        const activityRef = typeof p.activityId === "object" ? p.activityId : activities.find(a => a.id === p.activityId || a._id === p.activityId)
        if (!activityRef) return null

        const employeeId = p.userId || p.employeeId || p.user?._id || p.user?.id
        const streamUser = employees.find(e => e.id === employeeId || e._id === employeeId) || null
        const progressValue = Number(p.progress || 0)

        let action = "updated progress in"
        if (progressValue >= 100 || p.status === "completed") action = "completed"
        else if (progressValue > 0) action = `reached ${progressValue}% in`
        else if (p.status === "started") action = "enrolled in"

        return {
          id: p.id || p._id || `${employeeId}-${activityRef.id || activityRef._id}`,
          user: streamUser?.name || user?.name || "",
          userAvatar: streamUser?.avatar || user?.avatar,
          action,
          target: activityRef.title || "",
          time: formatRelativeTime(p.lastUpdated || p.updatedAt || p.createdAt)
        }
      })
      .filter(Boolean)
      .slice(0, 3)
  }, [participations, activities, employees, user])

  if (loading && !employee) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F172A]">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-transparent page-transition overflow-x-hidden pb-24 font-sans text-[#2C2C2C]">
      

      {/* Immersive Hero Section with Mesh Gradient */}
      <div className="relative mesh-gradient-premium pt-20 md:pt-32 pb-40 md:pb-60 px-4 md:px-8 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -mr-96 -mt-96 animate-float"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[100px] -ml-48 -mb-48 animate-float" style={{ animationDelay: '2s' }}></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-16">
            <div className="space-y-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark border-white/10 text-[#F28C1B] text-[10px] font-black tracking-[0.3em] uppercase mb-4 shimmer-sweep">
                <Activity className="w-3 h-3" />
                Skill Development Platform
              </div>

              <div className="space-y-4">
                <h1 className="text-6xl md:text-7xl font-black text-white leading-[0.95] tracking-tighter text-balance uppercase">
                  Elevate your <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F28C1B] via-white to-[#F28C1B] animate-pulse">career path.</span>
                </h1>
                <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-lg">
                  Welcome back, <span className="text-white font-bold">{user?.name?.split(" ")[0] || "Professional"}</span>.
                  Your current rank is <span className="text-orange-400 text-glow-orange font-bold">{employee.rank || "Junior"}</span> with <span className="text-white">{employee.skills?.length || 0}</span> verified competencies.
                </p>
              </div>

              <div className="flex flex-wrap gap-6 pt-4">
                <button
                  onClick={() => navigate("/employee/activities")}
                  className="px-12 py-5 rounded-[2rem] bg-[#F28C1B] hover:bg-[#D97706] text-white font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl shadow-[#F28C1B]/30 hover:shadow-[#F28C1B]/50 active:scale-[0.98] flex items-center gap-4 hover:translate-y-[-4px]"
                >
                  Start Professional Journey
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Premium Radar Chart Container */}
            <div className="relative group w-full lg:w-[450px] mt-12 lg:mt-0">
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-orange-500/30 rounded-[50px] blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-1000"></div>
              <div className="relative glass-dark p-6 md:p-10 rounded-[48px] border-white/10 hover:border-white/20 transition-all duration-700 shimmer-sweep">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                  <div className="space-y-1">
                    <h3 className="text-white font-bold text-xl tracking-tight">Competency Profile</h3>
                    <p className="text-[10px] text-orange-400 font-bold uppercase tracking-[0.2em]">Verified Skills</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#F28C1B]/10 text-[#F28C1B] border border-[#F28C1B]/20">
                    <Target className="w-5 h-5 fill-current" />
                  </div>
                </div>

                <div className="h-[300px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillRadarData}>
                      <PolarGrid stroke="#1e293b" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: '700' }} />
                      <PolarRadiusAxis domain={[0, 120]} axisLine={false} tick={false} />
                      <Radar
                        name="Skill Level"
                        dataKey="A"
                        stroke="#F28C1B"
                        fill="url(#radarGradient)"
                        fillOpacity={0.8}
                      />
                      <defs>
                        <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#F28C1B" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#1E5FA8" stopOpacity={0.6} />
                        </linearGradient>
                      </defs>
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-8 flex justify-center gap-12">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white leading-none">{employee.rank || "Junior"}</p>
                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest mt-2">Rank</p>
                  </div>
                  <div className="text-center border-x border-white/5 px-12">
                    <p className="text-2xl font-bold text-orange-400 text-glow-orange leading-none">{Math.round(employee.rankScore) || 0}</p>
                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest mt-2">Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white leading-none">{employee.skills?.length || 0}</p>
                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest mt-2">Top Skills</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Main Content Sections - Floating Layout */}
      <div className="max-w-6xl mx-auto w-full px-4 md:px-8 -mt-24 md:-mt-32 pb-24 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left Column: Progress & Milestones */}
          <div className="lg:col-span-8 space-y-12">
            
            <section className="space-y-8">
              <div className="flex items-center justify-end mb-4">
                <button onClick={() => navigate("/employee/activities")} className="p-4 rounded-2xl glass-card border-none hover:bg-white text-primary font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all hover:-translate-x-1 shadow-premium">
                  View All <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {(enrolledActivities.length > 0 ? enrolledActivities : []).map((activity, idx) => (
                  <div key={activity.id || activity._id} className="group bg-white rounded-[40px] border border-orange-100/50 shadow-premium p-6 md:p-10 hover:translate-y-[-12px] transition-all duration-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>

                    <div className="flex flex-col h-full relative z-10">
                      <div className="flex items-center justify-between mb-8">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl",
                          idx === 0 ? "bg-gradient-to-br from-[#1E5FA8] to-[#1E5FA8]/80 shadow-blue-500/20" : "bg-gradient-to-br from-[#F28C1B] to-[#F28C1B]/80 shadow-orange-500/20"
                        )}>
                          {idx === 0 ? <Brain className="w-7 h-7" /> : <TrendingUp className="w-7 h-7" />}
                        </div>
                        <Badge className="bg-slate-100 text-slate-500 border-none px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase">
                          {activity.type || "Training"}
                        </Badge>
                      </div>

                      <h4 className="text-2xl font-bold text-slate-900 mb-2 truncate group-hover:text-primary transition-colors tracking-tight">{activity.title}</h4>
                      <p className="text-sm text-slate-500 mb-10 line-clamp-2 font-medium leading-relaxed">{activity.description}</p>

                      <div className="mt-auto space-y-6">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your progress</span>
                          <span className="text-lg font-black text-primary tracking-tighter">{activity.progress || 0}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-1000 relative"
                            style={{ width: `${activity.progress || 0}%` }}
                          >
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-white/20 rounded-full"></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <Clock className="w-4 h-4 text-primary/50" />
                              {activity.duration || "4h"}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <Target className="w-4 h-4 text-primary/50" />
                              Level: {activity.level || "Med"}
                            </div>
                          </div>
                          <button className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-primary transition-colors shadow-xl active:scale-90">
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {enrolledActivities.length === 0 && (
                  <div className="col-span-full glass-card rounded-[40px] border-dashed border-orange-200 p-24 text-center space-y-6">
                    <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-10 h-10 text-orange-200" />
                    </div>
                    <p className="text-slate-400 font-black uppercase text-xs tracking-widest mt-4">No active courses yet.</p>
                    <button onClick={() => navigate("/employee/activities")} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all shadow-xl">Browse Activities</button>
                  </div>
                )}
              </div>
            </section>

            {topRecommendation && (
              <section className="space-y-8 pt-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Recommended for You</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top picks for your growth</p>
                  </div>
                </div>

                <div className="bg-white rounded-[48px] border border-orange-100/50 overflow-hidden shadow-premium p-6 md:p-12 relative shimmer-sweep">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/5 to-orange-500/5 rounded-full blur-3xl"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-16 relative z-10">
                    <div className="space-y-8">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 text-orange-600 text-[10px] font-black tracking-widest uppercase">
                        <Star className="w-3 h-3 fill-current" />
                        Next Milestone
                      </div>
                      <h4 className="text-4xl font-black text-slate-900 tracking-tighter leading-[1.1]">
                        {topRecommendation.title?.length > 20 && /^[0-9a-fA-F]+$/.test(topRecommendation.title) 
                          ? "Advanced Professional Training" 
                          : (topRecommendation.title || "Strategic Development")}
                      </h4>
                      <p className="text-slate-500 text-lg font-medium leading-relaxed line-clamp-3">
                        {(!topRecommendation.description || topRecommendation.description.length < 15 || topRecommendation.description.includes("asdasd"))
                          ? "Expand your capabilities with this curated program designed for your current career path and skill profile."
                          : topRecommendation.description}
                      </p>

                      <div className="flex flex-wrap gap-3 pt-4">
                        {(topRecommendation.skillsCovered || ["Leadership", "Management", "Innovation"]).slice(0, 3).map((skill, index) => {
                          const isId = typeof skill === "string" && skill.length === 24 && /^[0-9a-fA-F]+$/.test(skill);
                          const skillName = typeof skill === "object" ? skill.name || "Skill" : (isId ? `Core Skill ${index + 1}` : skill);
                          return (
                            <Badge key={typeof skill === "object" ? skill.id || skill._id : skill} variant="secondary" className="bg-slate-50 text-slate-500 border border-slate-100 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-100 px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all">
                              {skillName}
                            </Badge>
                          );
                        })}
                      </div>

                      <div className="pt-8">
                        <button
                          onClick={() => navigate("/employee/activities")}
                          className="px-10 py-5 rounded-3xl bg-slate-900 hover:bg-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center gap-4 active:scale-[0.98] group"
                        >
                          Discover Path
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute -inset-6 bg-gradient-to-tr from-primary/10 to-orange-500/10 rounded-[60px] blur-2xl"></div>
                      <div className="relative aspect-[5/4] rounded-[50px] bg-[#0F172A] overflow-hidden shadow-2xl flex items-center justify-center p-12 border border-slate-800">
                        <div className="text-center space-y-4">
                          <div className="w-20 h-20 bg-primary/10 rounded-[32px] flex items-center justify-center mx-auto animate-float">
                            <Sparkles className="w-10 h-10 text-primary" />
                          </div>
                        </div>
                        <div className="absolute bottom-8 right-8 px-6 py-3 glass-dark rounded-2xl text-[#F28C1B] font-black text-[10px] border border-white/10 uppercase tracking-widest">
                          {topRecommendation.duration || "4h Session"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

          </div>

          {/* Right Column: Intelligence & Persona */}
          <div className="lg:col-span-4 space-y-12">

            {/* Live Intelligence Feed */}
            <section className="space-y-8">
              <div className="h-4"></div>

              <div className="bg-slate-900 rounded-[40px] p-6 md:p-10 shadow-premium border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>

                <div className="space-y-10 relative z-10">
                  {activeStream.map((item, idx) => (
                    <div key={item.id} className="flex gap-6 group/item relative">
                      {idx !== activeStream.length - 1 && (
                        <div className="absolute left-[23px] top-12 bottom-[-40px] w-px bg-white/5"></div>
                      )}
                      <div className="relative">
                        <Avatar className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 overflow-hidden shadow-2xl transition-transform group-hover/item:scale-110">
                          <AvatarImage src={item.userAvatar} alt={item.user} />
                          <AvatarFallback className="bg-slate-700 text-white text-xs font-bold">{item.user?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary border-2 border-[#0F172A] rounded-full"></div>
                      </div>
                      <div className="space-y-2 pt-1 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black text-white tracking-tight">{item.user}</p>
                          <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{item.time}</span>
                        </div>
                        <p className="text-[10px] text-white/60 font-medium leading-relaxed">
                          {item.action} <span className="text-primary font-bold">#{item.target}</span>
                        </p>
                      </div>
                    </div>
                  ))}

                  {activeStream.length === 0 && (
                    <div className="py-8 text-center text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                      No recent activity available.
                    </div>
                  )}

                  <button className="w-full py-5 rounded-2xl bg-white/5 border border-white/5 text-slate-400 font-black text-[9px] uppercase tracking-[0.3em] hover:bg-white/10 hover:text-white transition-all">View Full Feed</button>
                </div>
              </div>
            </section>

            {/* Skill Analysis */}
            <section className="space-y-8">
              <div className="h-4"></div>

              <SkillDistributionChart
                employeeId={user?.id || user?._id}
                variant="employee"
              />

              <div className="pt-4">
                <button
                  onClick={() => navigate("/employee/profile")}
                  className="w-full py-5 rounded-3xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.3em] hover:bg-primary transition-all shadow-xl hover:translate-y-[-2px] active:scale-95 shimmer-sweep"
                >
                  View Profile
                </button>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}

