"use client"

import { DashboardHeader } from "/components/dashboard/header"
import { Link } from "react-router-dom"
import { useAuth } from "/lib/auth-context"
import { cn } from "/lib/utils"
import { StatsCards } from "/components/dashboard/stats-cards"
import { SkillDistributionChart } from "/components/dashboard/skill-distribution-chart"
import { UpcomingActivities } from "/components/dashboard/upcoming-activities"
import { HrParticipationStats } from "/components/dashboard/HrParticipationStats"
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Sparkles, 
  ArrowRight, 
  Brain, 
  AlertTriangle,
  Target,
  Zap,
  ShieldCheck,
  ChevronRight,
  LayoutDashboard
} from "lucide-react"

export default function HRDashboard() {
  const quickLinks = [
    { to: "/hr/employees", icon: Users, label: "All Users", desc: "See how everyone's doing" },
    { to: "/hr/activities", icon: Calendar, label: "Activities", desc: "Training & learning sessions" },
    { to: "/hr/recommendations", icon: Sparkles, label: "Recommendations", desc: "Find the best person for every job" },
    { to: "/hr/analytics", icon: TrendingUp, label: "Results", desc: "Growth and success data" },
  ]

  return (
    <div className="flex flex-col bg-[#F8FAFC] min-h-screen">
      <DashboardHeader 
        title="People and Skills Hub" 
        description="A clear view of everyone's growth, skills, and how ready we are for the future." 
      />

      <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-12 animate-in fade-in duration-700">
        
        {/* Main Stats Row */}
        <StatsCards />

        {/* Tactical Navigation */}
        <div className="space-y-8">
            <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-display font-black text-slate-900 uppercase tracking-tighter italic">Quick Links</h3>
                <div className="h-[1px] flex-1 bg-slate-200/60"></div>
            </div>
            <div className="grid gap-6 md:grid-cols-4">
              {quickLinks.map(({ to, icon: Icon, label, desc }) => (
                <Link key={to} to={to}>
                  <div className="card-premium p-8 bg-white/50 backdrop-blur-xl border-slate-100 h-full group hover:bg-white transition-all duration-500 hover:border-orange-500/30 overflow-hidden relative">
                    <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-slate-50 rounded-full group-hover:scale-[3] transition-transform duration-700 pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl mb-6 shadow-sm group-hover:scale-110 group-hover:shadow-lg transition-all duration-500 bg-[#F28C1B]/10 text-[#F28C1B] shadow-orange-500/10">
                        <Icon className="h-6 w-6" />
                        </div>
                        <h4 className="text-lg font-black text-slate-900 mb-2 group-hover:text-[#F28C1B] tracking-tight">{label}</h4>
                        <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest">{desc}</p>
                        <div className="flex items-center gap-2 mt-6 text-slate-400 group-hover:text-[#F28C1B] transition-all">
                        <span className="text-[9px] font-black tracking-[0.2em] uppercase">Go to section</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
        </div>

        {/* AI STRATEGIC SPOTLIGHT */}
        <div className="bg-slate-900 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-orange-500/10 via-transparent to-blue-500/5 pointer-events-none"></div>
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-orange-500/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                <div className="flex-1 space-y-6">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                        <Sparkles className="w-4 h-4 text-orange-400" />
                        <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">AI MATCHES FOR YOU</span>
                    </div>
                    <h3 className="text-5xl font-black text-white tracking-tighter italic uppercase leading-none">Best People for the Job<span className="text-orange-500">.</span></h3>
                    <p className="text-slate-400 text-base leading-relaxed font-medium max-w-2xl">We've looked at everyone's latest work and training. Here are the <span className="text-white font-bold italic">Top Performers</span> who are ready for a step up. You can match the right skills to the right projects today.</p>
                    <div className="flex gap-4">
                        <Link to="/hr/recommendations" className="bg-orange-500 hover:bg-orange-600 text-white px-8 h-14 rounded-2xl flex items-center gap-3 font-black text-[11px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-orange-500/20">
                            See Your Matches <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
                <div className="items-center gap-6 p-8 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl hidden md:flex">
                    <div className="space-y-2 text-center border-r border-white/10 pr-8">
                        <p className="text-3xl font-black text-orange-500 tracking-tighter">84%</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">How well they fit</p>
                    </div>
                    <div className="space-y-2 text-center pl-4">
                        <p className="text-3xl font-black text-emerald-500 tracking-tighter">12</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ready Now</p>
                    </div>
                </div>
            </div>
        </div>

        {/* HR TALENT MATRICES */}
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-10">
            <HrParticipationStats />
            <div className="bg-white rounded-[3rem] p-8 shadow-premium border border-slate-50 overflow-hidden">
                <div className="flex items-center gap-3 mb-8">
                    <Brain className="w-6 h-6 text-orange-500" />
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest leading-none">Skill Mix Across Company</h3>
                </div>
                <SkillDistributionChart hideHeader={true} />
            </div>
            {/* Unique HR Retention Card */}
            <div className="bg-[#0F111A] rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-orange-500/10 rounded-full blur-[100px] group-hover:bg-orange-500/20 transition-all duration-1000"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-1 space-y-4">
                        <div className="h-10 w-10 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                            <AlertTriangle className="h-5 w-5 text-orange-400" />
                        </div>
                        <h4 className="text-white font-black text-2xl uppercase tracking-tighter italic text-orange-500">Skills We are Missing</h4>
                        <p className="text-slate-400 text-sm leading-relaxed font-medium">92% of the skills we currently need are in the 'Tech Operations' area. We recommend finding matches for these people first.</p>
                        <Link to="/hr/recommendations" className="inline-flex items-center gap-3 text-orange-500 text-[10px] font-black uppercase tracking-widest border-b border-orange-500/20 pb-1 hover:border-orange-500 transition-all group-hover:gap-4">
                            Check for gaps <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="hidden lg:block w-32 h-32 rounded-full border-8 border-orange-500/20 border-t-orange-500 animate-spin-slow"></div>
                </div>
            </div>
          </div>

          {/* Growth Timeline & Pipeline */}
          <div className="space-y-10">
            <div className="bg-white rounded-[3rem] p-8 shadow-premium border border-slate-50 overflow-hidden group">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-6 h-6 text-[#1E5FA8]" />
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">Learning Queue</h3>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-200 group-hover:text-[#F28C1B] transition-all" />
                </div>
                <UpcomingActivities hideHeader={true} />
            </div>

            {/* Department Maturity Heatmap-style Overview */}
            <div className="bg-white rounded-[3rem] p-8 shadow-premium border border-slate-50">
                <div className="flex items-center gap-3 mb-8">
                    <ShieldCheck className="w-6 h-6 text-emerald-500" />
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">Best Departments</h3>
                </div>
                <div className="space-y-6">
                    {[
                        { name: "Engineering", score: 88, color: "bg-emerald-500" },
                        { name: "Product Design", score: 74, color: "bg-[#F28C1B]" },
                        { name: "Strategy & Ops", score: 62, color: "bg-[#1E5FA8]" },
                        { name: "Technical Support", score: 45, color: "bg-rose-500" },
                    ].map(dept => (
                        <div key={dept.name} className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span className="truncate">{dept.name}</span>
                                <span className={cn("font-black", dept.score > 80 ? "text-emerald-500" : dept.score > 60 ? "text-[#F28C1B]" : "text-rose-500")}>{dept.score}% Growth</span>
                            </div>
                            <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                                <div className={cn("h-full transition-all duration-1000", dept.color)} style={{ width: `${dept.score}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
