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
      toast.success("Intelligence Stream Initialized", { description: `You have successfully synchronized with ${title}.` })
    } finally {
      setProcessingId(null)
    }
  }

  const handleUnenroll = async (activityId, title) => {
    setProcessingId(activityId)
    try {
      await unenrollEmployee(activityId, employee.id || employee._id)
      toast.success("Stream Deactivated", { description: `Participation in ${title} has been suspended.` })
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
    <div className="flex flex-col min-h-screen bg-transparent page-transition overflow-x-hidden pb-32">
      {/* Premium AI Navigator Header */}
      <div className="mesh-gradient-premium pt-40 pb-56 px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-primary/10 rounded-full blur-[140px] -mr-96 -mt-96 animate-float"></div>

        <div className="max-w-6xl mx-auto relative z-10 space-y-12">
          <div className="space-y-6 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark border-white/10 text-[#F28C1B] text-[10px] font-black tracking-[0.3em] uppercase mb-4 shimmer-sweep">
              <Compass className="w-3 h-3" />
              MAGHREBIA_PATH_FINDER_v2.0
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] uppercase">
              Strategic <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F28C1B] via-white to-[#F28C1B]">Pathfinder.</span>
            </h1>
            <p className="text-orange-100/40 font-medium text-xl leading-relaxed max-w-xl">
              Our neural engine has calculated the optimal growth trajectories to bridge your
              <span className="text-orange-400 font-bold px-2">competency gaps</span>
              based on real-time market signals.
            </p>
          </div>

          <div className="flex gap-8">
            <div className="glass-dark px-10 py-6 rounded-3xl border-white/5 space-y-1">
              <p className="text-[#F28C1B] text-3xl font-black tracking-tighter">84%</p>
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Alignment</p>
            </div>
            <div className="glass-dark px-10 py-6 rounded-3xl border-white/5 space-y-1">
              <p className="text-white text-3xl font-black tracking-tighter">{recommendedActivities.length}</p>
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Growth Nodes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-8 -mt-24 relative z-20 space-y-24">

        {/* Top Tier Pathway Journey */}
        <section className="space-y-12">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 glass-card rounded-2xl flex items-center justify-center shadow-2xl bg-white/5 backdrop-blur-xl border border-white/10">
                <Map className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Primary Trajectory</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">High-impact skill bridge</p>
              </div>
            </div>
          </div>

          <div className="relative">
            {/* Visual Pathway Line */}
            <div className="absolute left-[50%] top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/10 to-transparent hidden lg:block"></div>

            <div className="space-y-20">
              {recommendedActivities.slice(0, 3).map((rec, idx) => (
                <div key={rec.activity.id || rec.activity._id} className={cn(
                  "relative flex flex-col lg:flex-row items-center gap-12 group",
                  idx % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                )}>
                  {/* Timeline Dot */}
                  <div className="absolute left-[50%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 glass-card rounded-full hidden lg:flex items-center justify-center z-10 border-[#1E5FA8]/20 group-hover:scale-125 transition-transform bg-white/10 backdrop-blur-xl">
                    <div className="w-4 h-4 bg-[#1E5FA8] rounded-full animate-pulse"></div>
                  </div>

                  <div className="w-full lg:w-1/2">
                    <div className="bg-white rounded-[48px] border border-orange-100/50 shadow-premium p-10 lg:p-14 hover:translate-y-[-10px] transition-all duration-700 relative overflow-hidden shimmer-sweep">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-1000"></div>

                      <div className="space-y-8 relative z-10">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-orange-50 text-orange-600 border-none px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase italic">
                            #{idx + 1} STRATEGIC_FIT
                          </Badge>
                          <div className="text-right">
                            <p className="text-2xl font-black text-slate-900 leading-none">{rec.overallScore}%</p>
                            <p className="text-[8px] text-orange-500 font-bold uppercase tracking-widest">Neural Fit</p>
                          </div>
                        </div>

                        <h3 className="text-3xl font-black text-slate-900 leading-tight group-hover:text-primary transition-colors tracking-tighter">{rec.activity.title}</h3>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <span>Skill Bridge Potential</span>
                            <span className="text-primary">+{rec.growthPotential}% Gained</span>
                          </div>
                          <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                            <div className="h-full bg-gradient-to-r from-[#1E5FA8] to-[#F28C1B] rounded-full" style={{ width: `${rec.growthPotential}%` }}></div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {rec.missingSkills.slice(0, 3).map(skill => (
                            <div key={skill} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 text-[9px] font-black uppercase tracking-wider">
                              <Zap className="w-3 h-3 fill-current" />
                              Gap: {skill}
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

                          <button
                            onClick={() => rec.isEnrolled
                              ? handleUnenroll(rec.activity.id || rec.activity._id, rec.activity.title)
                              : handleEnroll(rec.activity.id || rec.activity._id, rec.activity.title)
                            }
                            disabled={processingId === (rec.activity.id || rec.activity._id)}
                            className={cn(
                              "px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 flex items-center gap-3",
                              rec.isEnrolled
                                ? "bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-100"
                                : "bg-slate-900 text-white hover:bg-[#F28C1B] shadow-orange-500/10"
                            )}
                          >
                            {processingId === (rec.activity.id || rec.activity._id) ? <Loader2 className="w-3 h-3 animate-spin" /> : rec.isEnrolled ? "Unsubscribe" : "Synchronize"}
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decoration persona for empty side */}
                  <div className="hidden lg:block w-1/2 px-12 text-center space-y-4">
                    <Brain className="w-16 h-16 text-primary/10 mx-auto" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Trajectory_Point_0{idx + 1}</p>
                    <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto">This node specifically targets your {rec.missingSkills[0] || "primary"} intelligence deficit.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Supplementary Node Grid */}
        {recommendedActivities.length > 3 && (
          <section className="space-y-12">
            <div className="flex items-center gap-4 px-2">
              <div className="w-12 h-12 glass-card rounded-2xl flex items-center justify-center shadow-2xl bg-white/5 backdrop-blur-xl border border-white/10">
                <Rocket className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Competency Opportunities</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secondary growth vectors</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {recommendedActivities.slice(3, 7).map((rec) => (
                <div key={rec.activity.id || rec.activity._id} className="group glass-card rounded-[40px] p-8 border-orange-100 hover:bg-primary transition-all duration-500 flex items-center gap-8">
                  <div className="w-24 h-24 bg-slate-900 rounded-[32px] flex flex-col items-center justify-center relative overflow-hidden shrink-0 group-hover:bg-white/20">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/50 to-orange-500/50"></div>
                    <p className="text-2xl font-black text-white relative z-10 leading-none">{rec.overallScore}%</p>
                    <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mt-1 relative z-10">SYNC</p>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="font-black text-slate-900 group-hover:text-white transition-colors tracking-tight line-clamp-1">{rec.activity.title}</h4>
                      <p className="text-[10px] text-slate-400 group-hover:text-white/60 font-black uppercase tracking-widest mt-1">{rec.activity.type || "Training"} • {rec.activity.duration || "Self-Paced"}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Flame className="w-4 h-4 text-orange-500 group-hover:text-white" />
                        <span className="text-[10px] font-black text-slate-600 group-hover:text-white uppercase tracking-widest">+{rec.growthPotential}% Gain</span>
                      </div>
                      <button
                        onClick={() => rec.isEnrolled
                          ? handleUnenroll(rec.activity.id || rec.activity._id, rec.activity.title)
                          : handleEnroll(rec.activity.id || rec.activity._id, rec.activity.title)
                        }
                        disabled={processingId === (rec.activity.id || rec.activity._id)}
                        className="p-3 rounded-full bg-slate-900/5 group-hover:bg-white text-slate-900 transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty Intelligence State */}
        {recommendedActivities.length === 0 && (
          <div className="bg-white rounded-[60px] border border-orange-100/50 py-40 text-center shadow-premium">
            <div className="w-24 h-24 bg-orange-50 rounded-[32px] flex items-center justify-center mx-auto mb-10 text-orange-200">
              <Brain className="w-12 h-12" />
            </div>
            <h3 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">Calibration Complete.</h3>
            <p className="text-slate-500 max-w-sm mx-auto font-medium text-lg">No immediate strategic gaps detected. Your current trajectory is optimal for your designated role.</p>
          </div>
        )}
      </div>
    </div>
  )
}

