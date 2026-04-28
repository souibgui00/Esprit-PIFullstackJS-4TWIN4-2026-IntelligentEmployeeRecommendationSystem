import { useState, useMemo } from "react"
import {
  Clock, Star, Target, Sparkles, ShieldCheck, ShieldAlert,
  Loader2, Trophy, Zap, Calendar, Users, TrendingUp,
  Award, Flame, Brain, Rocket, CheckCircle2, XCircle, ArrowRight,
  ChevronRight, Map, Compass
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-store"
import { Badge } from "@/components/ui/badge"

export default function EmployeeRecommendationsPage() {
  const { getEmployeeProfile } = useAuth()
  const { activities, participations, enrollEmployee, unenrollEmployee } = useData()
  const [processingId, setProcessingId] = useState(null)

  const employeeProfile = getEmployeeProfile ? getEmployeeProfile() : null
  const employee = employeeProfile || {}

  const handleEnroll = async (activityId, title) => {
    setProcessingId(activityId)
    try {
      await enrollEmployee(activityId, employee.id || employee._id)
      toast.success("Enrolled Successfully", { description: `You have been enrolled in ${title}.` })
    } finally {
      setProcessingId(null)
    }
  }

  const handleUnenroll = async (activityId, title) => {
    setProcessingId(activityId)
    try {
      await unenrollEmployee(activityId, employee.id || employee._id)
      toast.success("Unenrolled", { description: `You have been removed from ${title}.` })
    } finally {
      setProcessingId(null)
    }
  }

  const recommendedActivities = useMemo(() => {
    if (!activities) return []

    return activities
      .filter(a => ["upcoming", "active", "open"].includes(a.status?.toLowerCase()))
      .map(activity => {
        let matchScore = 0
        let growthPotential = 0

        const reqSkills = activity.requiredSkills || []
        const matchedSkills = []
        const missingSkills = []

        reqSkills.forEach(rs => {
          const employeeSkill = employee.skills?.find(s => (s.skillId?.toString() || s._id?.toString()) === (rs.skillId?.toString() || rs._id?.toString()))
          if (employeeSkill) {
            matchScore += (employeeSkill.score || 0) / 120 * (rs.weight || 1)
            matchedSkills.push(employeeSkill.skill?.name || "Skill")
          } else {
            growthPotential += (rs.weight || 1)
            missingSkills.push(rs.name || rs.skill?.name || "Skill")
          }
        })

        const totalWeight = reqSkills.reduce((acc, rs) => acc + (rs.weight || 1), 0)
        const normalizedMatch = totalWeight > 0 ? (matchScore / totalWeight) * 100 : 0
        const normalizedGrowth = totalWeight > 0 ? (growthPotential / totalWeight) * 100 : 0

        const isEnrolled = participations?.some(p => (p.activityId === activity.id || p.activityId === activity._id || p.activityId?._id === activity._id))

        return {
          activity,
          matchScore: Math.round(normalizedMatch),
          growthPotential: Math.round(normalizedGrowth),
          overallScore: Math.round((normalizedMatch * 0.4) + (normalizedGrowth * 0.6)),
          isEnrolled,
          matchedSkills,
          missingSkills
        }
      })
      .sort((a, b) => b.overallScore - a.overallScore)
  }, [activities, employee.skills, participations])

  return (
    <section className="flex flex-col min-h-screen bg-transparent page-transition overflow-x-hidden pb-20" aria-label="Employee recommendations page">
      {/* Premium AI Navigator Header */}
      <header className="mesh-gradient-premium pt-26 pb-36 px-5 md:px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-250 h-250 bg-primary/10 rounded-full blur-[140px] -mr-96 -mt-96 animate-float"></div>

        <div className="max-w-6xl mx-auto relative z-10 space-y-8">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark border-white/10 text-primary text-[10px] font-black tracking-[0.3em] uppercase mb-4 shimmer-sweep">
              <Compass className="w-3 h-3" />
              AI Career Guide
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.92] uppercase">
              Strategic <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-white to-primary">Pathfinder.</span>
            </h1>
            <p className="text-orange-100/50 font-medium text-sm md:text-base leading-relaxed max-w-xl">
              Based on your current skills profile, we have identified the best activities
              to help you <span className="text-orange-400 font-bold px-2">grow and develop</span> your professional capabilities.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="glass-dark px-6 py-4 rounded-2xl border-white/5 space-y-1">
              <p className="text-primary text-2xl font-black tracking-tighter">84%</p>
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Profile Match</p>
            </div>
            <div className="glass-dark px-6 py-4 rounded-2xl border-white/5 space-y-1">
              <p className="text-white text-2xl font-black tracking-tighter">{recommendedActivities.length}</p>
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Activities Found</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto w-full px-5 md:px-6 -mt-16 relative z-20 space-y-14">

        {/* Top Tier Pathway Journey */}
        <section className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center shadow-2xl bg-white/5 backdrop-blur-xl border border-white/10">
                <Map className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Best Matches</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top recommended activities for your growth</p>
              </div>
            </div>
          </div>

          <div className="relative">
            {/* Visual Pathway Line */}
            <div className="absolute left-[50%] top-0 bottom-0 w-px bg-linear-to-b from-primary/50 via-primary/10 to-transparent hidden lg:block"></div>

            <div className="space-y-12">
              {recommendedActivities.slice(0, 3).map((rec, idx) => (
                <div key={rec.activity.id || rec.activity._id} className={cn(
                  "relative flex flex-col lg:flex-row items-center gap-8 group",
                  idx % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                )}>
                  {/* Timeline Dot */}
                  <div className="absolute left-[50%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 glass-card rounded-full hidden lg:flex items-center justify-center z-10 border-accent-blue/20 group-hover:scale-125 transition-transform bg-white/10 backdrop-blur-xl">
                    <div className="w-4 h-4 bg-accent-blue rounded-full animate-pulse"></div>
                  </div>

                  <div className="w-full lg:w-1/2">
                    <div className="bg-white rounded-[36px] border border-orange-100/50 shadow-premium p-6 lg:p-8 hover:-translate-y-1.5 transition-all duration-700 relative overflow-hidden shimmer-sweep">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-1000"></div>

                      <div className="space-y-5 relative z-10">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-orange-50 text-orange-600 border-none px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase">
                            #{idx + 1} Recommended
                          </Badge>
                          <div className="text-right">
                            <p className="text-xl font-black text-slate-900 leading-none">{rec.overallScore}%</p>
                            <p className="text-[8px] text-orange-500 font-bold uppercase tracking-widest">Match Score</p>
                          </div>
                        </div>

                        <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-primary transition-colors tracking-tighter">{rec.activity.title}</h3>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <span>Skills You Will Develop</span>
                            <span className="text-primary">+{rec.growthPotential}% Growth Potential</span>
                          </div>
                          <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                            <div className="h-full bg-linear-to-r from-accent-blue to-primary rounded-full" style={{ width: `${rec.growthPotential}%` }}></div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {rec.missingSkills.slice(0, 3).map((skill, sIdx) => (
                            <div key={`${rec.activity.id || rec.activity._id}_skill_${sIdx}`} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 text-[9px] font-black uppercase tracking-wider">
                              <Zap className="w-3 h-3 fill-current" />
                              {skill}
                            </div>
                          ))}
                        </div>

                        <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <Clock className="w-4 h-4 text-primary/30" />
                              {rec.activity.duration || "Self-Paced"}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <Users className="w-4 h-4 text-primary/30" />
                              {rec.activity.type || "Program"}
                            </div>
                          </div>

                          <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <Clock className="w-4 h-4 text-primary/30" />
                                {rec.activity.duration || "Self-Paced"}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <Users className="w-4 h-4 text-primary/30" />
                                {rec.activity.type || "Program"}
                              </div>
                            </div>

                            <div className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-100 flex items-center gap-2">
                              <Brain className="w-3.5 h-3.5" />
                              Recommended
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decoration persona for empty side */}
                  <div className="hidden lg:block w-1/2 px-10 text-center space-y-3">
                    <Brain className="w-12 h-12 text-primary/10 mx-auto" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Recommendation #{idx + 1}</p>
                    <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto">This activity is designed to help you develop your {rec.missingSkills[0] || "key"} skills.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Supplementary Node Grid */}
        {recommendedActivities.length > 3 && (
          <section className="space-y-8">
            <div className="flex items-center gap-4 px-2">
              <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center shadow-2xl bg-white/5 backdrop-blur-xl border border-white/10">
                <Rocket className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">More Activities</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Additional activities matching your profile</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {recommendedActivities.slice(3, 7).map((rec) => (
                <div key={rec.activity.id || rec.activity._id} className="group glass-card rounded-[30px] p-5 border-orange-100 hover:bg-primary transition-all duration-500 flex items-center gap-5">
                  <div className="w-18 h-18 bg-slate-900 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden shrink-0 group-hover:bg-white/20">
                    <div className="absolute inset-0 bg-linear-to-br from-primary/50 to-orange-500/50"></div>
                    <p className="text-xl font-black text-white relative z-10 leading-none">{rec.overallScore}%</p>
                    <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mt-1 relative z-10">MATCH</p>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="font-black text-slate-900 group-hover:text-white transition-colors tracking-tight line-clamp-1">{rec.activity.title}</h4>
                      <p className="text-[10px] text-slate-400 group-hover:text-white/60 font-black uppercase tracking-widest mt-1">{rec.activity.type || "Training"} • {rec.activity.duration || "Self-Paced"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty Intelligence State */}
        {recommendedActivities.length === 0 && (
          <div className="bg-white rounded-[48px] border border-orange-100/50 py-24 text-center shadow-premium">
            <div className="w-18 h-18 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-orange-200">
              <Brain className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter">All Caught Up!</h3>
            <p className="text-slate-500 max-w-sm mx-auto font-medium text-base">No new activities match your skill profile right now. Check back soon or contact your manager to get assigned to a program.</p>
          </div>
        )}
      </div>
    </section>
  )
}

