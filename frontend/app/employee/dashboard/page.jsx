import { useNavigate } from "react-router-dom"
import { useMemo } from "react"
import { useData } from "../../../lib/data-store"
import { useAuth } from "../../../lib/auth-context"
import {
  BookOpen,
  Target,
  Calendar,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Settings,
  LogOut,
  Home,
  Activity,
  Sparkles,
  ChevronRight,
  Zap,
  Star as StarIcon
} from "lucide-react"
import { cn } from "../../../lib/utils"
import { toast } from "sonner"

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const { activities, employees } = useData()
  const navigate = useNavigate()

  const handlePlaceholderAction = (action) => {
    toast.info(`${action} Pipeline Initialized`, {
      description: "Neural network is synchronizing this data stream."
    })
  }

  const employeeData = employees.find(e => e.userId === user?.id || e.id === user?.id || e._id === user?.id)

  return (
    <div className="p-8 space-y-12 max-w-[1600px] mx-auto animate-in fade-in duration-700 bg-transparent text-[#2C2C2C]">
      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden rounded-[40px] bg-[#2C2C2C] border border-white/5 p-8 lg:p-12 shadow-2xl">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#F28C1B]/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-[#1E5FA8]/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-400 font-bold text-xs tracking-[0.2em]">
              <Sparkles className="w-4 h-4" />
              <span>Personalized For You</span>
            </div>
              <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight uppercase">
                Ready to elevate your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F28C1B] via-white to-[#F28C1B]">career, {user?.name?.split(" ")[0]}?</span>
              </h1>
            <p className="text-gray-400 text-lg max-w-xl font-light">
              You've completed 85% of your quarterly goals. Explore new AI-suggested activities to reach the next level.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button
                onClick={() => navigate("/employee/recommendations")}
                className="bg-[#F28C1B] hover:bg-[#D97706] text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#F28C1B]/20 transition-all active:scale-95"
              >
                View Insights
              </button>
              <button
                onClick={() => handlePlaceholderAction("Progress Calibration")}
                className="bg-white/5 hover:bg-white/10 text-white px-8 py-3.5 rounded-2xl font-bold border border-white/10 transition-all active:scale-95"
              >
                My Progress
              </button>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-md rounded-3xl border border-white/10 p-8 flex flex-col items-center text-center lg:min-w-[280px]">
            <div className="relative mb-4">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364} strokeDashoffset={364 * 0.15} className="text-primary transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">Lvl 4</span>
                <span className="text-[10px] text-gray-400 font-bold tracking-widest">Expert</span>
              </div>
            </div>
            <p className="text-sm font-medium text-orange-100">850 / 1000 XP</p>
            <p className="text-[10px] text-gray-500 mt-1 tracking-wider">To next level</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {useMemo(() => {
          const activeCount = participations?.filter(p => p.status === 'in_progress' || p.status === 'started')?.length || 0
          const skillCount = employeeData?.skills?.length || 0
          return [
            { label: "Active Activities", value: activeCount.toString(), icon: Activity, color: "text-orange-500", bg: "bg-orange-500/10" },
            { label: "Skills Assessed", value: skillCount.toString(), icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Overall Score", value: employeeData?.rankScore ? Math.round(employeeData.rankScore) : "—", icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Proficiency Rank", value: employeeData?.rank || "—", icon: Award, color: "text-primary", bg: "bg-primary/10" },
          ]
        }, [participations, employeeData]).map((stat, i) => (
          <div key={i} className="card-premium bg-white p-6 shadow-sm border-none group">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-2xl group-hover:scale-110 transition-transform", 
                i === 0 ? "bg-[#F28C1B]/10 text-[#F28C1B]" : 
                i === 2 ? "bg-[#1E5FA8]/10 text-[#1E5FA8]" : 
                stat.bg, stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-[#F28C1B] text-[10px] font-black uppercase tracking-widest">+2 this week</span>
            </div>
            <p className="text-slate-400 text-[10px] font-black tracking-widest mb-1 uppercase">{stat.label}</p>
            <p className="text-3xl font-black text-[#2C2C2C] tracking-tighter italic">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Ongoing Training */}
          <div className="card-premium bg-white border-none shadow-sm overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Ongoing Training</h3>
              <button onClick={() => navigate("/employee/activities")} className="text-sm text-orange-400 hover:text-orange-300 font-bold transition-colors">Browse Marketplace</button>
            </div>
            <div className="p-6 space-y-4">
              {participations?.filter(p => p.status === 'started' || p.status === 'in_progress').slice(0, 3).map((participation) => {
                const activity = typeof participation.activityId === 'object' ? participation.activityId : activities?.find(a => a.id === participation.activityId || a._id === participation.activityId)
                return (
                <div key={participation.id || participation._id} className="group flex items-center justify-between p-5 bg-white/5 hover:bg-white/[0.08] rounded-2xl border border-white/5 transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-primary flex items-center justify-center shadow-lg">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-black text-[#2C2C2C] mb-1 group-hover:text-[#F28C1B] transition-colors uppercase text-sm">{activity?.title || activity?.name || 'Activity'}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-3">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {activity?.duration || "—"}</span>
                        <span className="flex items-center gap-1"><StarIcon className="w-3 h-3 text-amber-500 fill-amber-500" /> {activity?.type || "Program"}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="hidden sm:block w-32">
                      <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1 tracking-tighter">
                        <span>Progress</span>
                        <span className="text-orange-400">{participation.progress || 0}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1E5FA8] rounded-full shadow-[0_0_10px_rgba(30,95,168,0.3)]" style={{ width: `${participation.progress || 0}%` }}></div>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePlaceholderAction(`Resuming ${activity.title || activity.name}`)}
                      className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all active:scale-95"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-premium bg-white border-none p-6 shadow-sm">
              <h3 className="text-lg font-bold text-white mb-6">Skill Analysis</h3>
              <div className="space-y-6">
                {employeeData?.skills?.slice(0, 3).map((skill, i) => (
                  <div key={skill.skillId?._id || skill.skillId}>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-bold text-white">{skill.skillId?.name || 'Skill'}</span>
                      <span className="text-[10px] font-bold text-gray-500 tracking-widest">{Math.round(skill.score || 0)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", i === 1 ? "bg-[#F28C1B]" : "bg-[#1E5FA8]")} style={{ width: `${Math.min(skill.score || 0, 120) / 120 * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => handlePlaceholderAction("Skill Audit")}
                className="w-full mt-8 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all text-sm active:scale-95"
              >
                Full Skills Audit
              </button>
            </div>

            <div className="bg-gradient-to-br from-[#2C2C2C] to-[#2C2C2C]/90 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group border border-white/5">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                <Sparkles className="w-32 h-32 text-white" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">AI Mentorship</h3>
                  <p className="text-indigo-100/70 text-sm leading-relaxed">
                    "Based on your recent React success, I recommend focusing on <span className="text-white font-bold">Node.js Performance Tuning</span> to become a Full Stack expert."
                  </p>
                </div>
                <button
                  onClick={() => handlePlaceholderAction("Neural Mentorship")}
                  className="bg-white text-[#121214] font-bold py-3 px-6 rounded-2xl mt-8 shadow-xl hover:bg-orange-50 transition-all w-fit active:scale-95"
                >
                  Talk to Mentor
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          <div className="card-premium bg-white border-none overflow-hidden shadow-sm">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-sm font-bold text-white tracking-wider">Upcoming Schedule</h3>
            </div>
            <div className="p-6 space-y-6">
              {upcomingDirect.map((activity) => {
                const startDate = activity.startDate ? new Date(activity.startDate) : new Date()
                const monthStr = startDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
                const dateNum = startDate.getDate()
                return (
                <div key={activity._id || activity.id} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="text-[10px] font-bold text-[#F28C1B] mb-1 tracking-tighter">{monthStr}</div>
                    <div className="text-xl font-bold text-white leading-none">{dateNum}</div>
                  </div>
                  <div className="flex-1 border-l border-white/5 pl-4 pb-1">
                    <h4 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors mb-0.5">{activity.title || activity.name}</h4>
                    <p className="text-[10px] text-gray-500 font-medium">10:00 AM • {activity.type || 'Remote Workshop'}</p>
                  </div>
                </div>
                )
              })}
            </div>
            <button
              onClick={() => handlePlaceholderAction("Calendar Synchronization")}
              className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 transition-all border-t border-white/5 text-xs font-bold tracking-widest active:scale-95"
            >
              Open Calendar
            </button>
          </div>

          <div className="bg-[#121214] rounded-3xl border border-white/5 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-white tracking-wider">Global Leaderboard</h3>
              <TrendingUp className="w-4 h-4 text-orange-500" />
            </div>
            <div className="space-y-4">
              {leaderboard.map((player, i) => {
                const isCurrentUser = (player.id || player._id) === (user?.id || user?._id)
                return (
                <div key={i} className={cn(
                  "flex items-center justify-between p-3 rounded-2xl transition-all",
                  isCurrentUser ? "bg-[#F28C1B]/10 border border-[#F28C1B]/20" : "hover:bg-slate-50"
                )}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-600 w-4">{i + 1}</span>
                    <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-slate-700 text-white text-xs font-bold flex items-center justify-center">
                      {player.avatar ? (
                        <img src={player.avatar} className="w-8 h-8 rounded-full" alt={player.name} />
                      ) : (
                        <span>{player.name?.charAt(0)}</span>
                      )}
                    </div>
                    <span className={cn("text-sm font-bold", isCurrentUser ? "text-white" : "text-gray-400")}>{isCurrentUser ? "You" : player.name}</span>
                  </div>
                  <span className="text-xs font-bold text-orange-400">{Math.round(player.rankScore || 0)} XP</span>
                </div>
              )})}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#F28C1B]/10 to-[#1E5FA8]/10 rounded-3xl border border-[#F28C1B]/20 p-6 shadow-sm">
            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Special Offer
            </h4>
            <p className="text-gray-400 text-xs leading-relaxed mb-4">
              Unlock the <span className="text-white">Senior Leadership</span> certification for free by completing two more soft-skill activities this month.
            </p>
            <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-primary" style={{ width: '40%' }}></div>
            </div>
            <button className="text-[10px] font-bold text-orange-400 tracking-[0.2em] hover:text-orange-300 transition-colors">Track Progress</button>
          </div>
        </div>
      </div>
    </div>
  )
}




