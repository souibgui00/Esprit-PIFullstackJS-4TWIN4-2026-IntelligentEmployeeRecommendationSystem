"use client"

import { DashboardHeader } from "/components/dashboard/header"
import { Link } from "react-router-dom"
import { useAuth } from "/lib/auth-context"
import { cn } from "/lib/utils"
import {
  Brain,
  Users,
  Calendar,
  TrendingUp,
  Sparkles,
  ArrowRight,
  DatabaseZap,
  Loader2,
  Shield,
  Activity,
  History,
  AlertTriangle
} from "lucide-react"
import { StatsCards } from "/components/dashboard/stats-cards"
import { toast } from "sonner"
import { api } from "/lib/api"
import { useState } from "react"
import { SkillDistributionChart } from "/components/dashboard/skill-distribution-chart"
import { DepartmentOverview } from "/components/dashboard/department-overview"
import { UpcomingActivities } from "/components/dashboard/upcoming-activities"
import { SkillGapsOverview } from "/components/dashboard/skill-gaps-overview"

/**
 * HR STRATEGIC CENTER
 * A dashboard dedicated to human capital, retention, and skill growth.
 */
export default function AdminDashboard() {
  const { user } = useAuth()
  const [decaying, setDecaying] = useState(false)

  // Absolute role branching

  const handleTriggerDecay = async () => {
    setDecaying(true)
    try {
      const result = await api.post("/api/skill-decay/trigger")
      toast.success("Skill Decay Executed", {
        description: `Affected ${result.usersAffected} users and decayed ${result.skillsDecayed} skills.`,
      })
    } catch (error) {
      toast.error("Decay Trigger Failed", { description: error.message })
    } finally {
      setDecaying(false)
    }
  }

  const quickLinks = [
    { to: "/admin/employees", icon: Users, label: "Identities", desc: "Manage system-wide user credentials" },
    { to: "/admin/activities", icon: Calendar, label: "Program Ops", desc: "Global session status & orchestration" },
    { to: "/admin/audit", icon: History, label: "Audit Registry", desc: "Full traceability of system mutations" },
    { to: "/admin/analytics", icon: TrendingUp, label: "System Health", desc: "Diagnostic data & operational growth" },
  ]

  return (
    <div className="flex flex-col bg-transparent min-h-screen page-transition">
      <DashboardHeader title="Admin Command Center" description="System Control, Mutation Monitoring & Data Stability." />

      <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-12 animate-in fade-in duration-700">
        <StatsCards />

        <div className="space-y-8">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                    <h3 className="text-xl font-display font-bold text-slate-900 uppercase tracking-tighter italic">System Ops</h3>
                    <div className="h-px flex-1 bg-slate-100"></div>
                </div>
                <button 
                  onClick={handleTriggerDecay}
                  disabled={decaying}
                  className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-white px-5 py-2.5 rounded-2xl text-[10px] font-medium font-sans uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 group"
                >
                  {decaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <DatabaseZap className="w-4 h-4 text-orange-500 group-hover:rotate-12 transition-transform" />}
                  Trigger System Logic
                </button>
            </div>
            <div className="grid gap-6 md:grid-cols-4">
              {quickLinks.map(({ to, icon: Icon, label, desc }) => (
                <Link key={to} to={to}>
                  <div className="card-premium p-8 hover:bg-slate-950 hover:text-white h-full group border-slate-100 transition-all duration-500 hover:-translate-y-1 shadow-sm hover:shadow-2xl">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl mb-6 bg-slate-100 text-slate-600 group-hover:bg-white/10 group-hover:text-white transition-all">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h4 className="text-lg font-display font-bold text-slate-900 mb-2 group-hover:text-white">{label}</h4>
                    <p className="text-xs text-slate-500 font-sans font-medium leading-relaxed m-0 group-hover:text-slate-400">{desc}</p>
                    <div className="flex items-center gap-2 mt-6 text-slate-400 transition-colors group-hover:text-white/40">
                      <span className="text-[10px] font-sans font-medium tracking-widest uppercase">Inspect Module</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
        </div>

        {/* ADMIN SYSTEM HEALTH GRID */}
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-10">
            <div className="bg-white rounded-3xl p-8 shadow-premium border border-slate-50">
               <div className="flex items-center gap-3 mb-8">
                  <Activity className="w-6 h-6 text-slate-900" />
                  <h3 className="text-lg font-display font-bold text-slate-900 uppercase tracking-widest">Sector Stability Metrics</h3>
               </div>
               <DepartmentOverview hideHeader={true} />
            </div>
          </div>
          <div className="space-y-10">
            <div className="bg-white rounded-3xl p-8 shadow-premium border border-slate-50">
               <div className="flex items-center gap-3 mb-6">
                  <History className="w-6 h-6 text-slate-400" />
                  <h3 className="text-sm font-display font-bold text-slate-900 uppercase tracking-widest">Operational Snapshots</h3>
               </div>
               <UpcomingActivities hideHeader={true} />
                <button className="w-full mt-6 py-3 bg-slate-50 text-[10px] font-sans font-medium uppercase tracking-widest text-slate-400 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors">View All Program Logs</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
