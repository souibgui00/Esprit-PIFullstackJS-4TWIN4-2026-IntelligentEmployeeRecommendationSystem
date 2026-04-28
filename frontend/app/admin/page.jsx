"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { Link } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"
import { lazy, Suspense, useState } from "react"
import {
  Users,
  Calendar,
  TrendingUp,
  ArrowRight,
  DatabaseZap,
  Loader2,
  Activity,
  History,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"

const StatsCards = lazy(() => import("@/components/dashboard/stats-cards").then((m) => ({ default: m.StatsCards })))
const DepartmentOverview = lazy(() => import("@/components/dashboard/department-overview").then((m) => ({ default: m.DepartmentOverview })))
const UpcomingActivities = lazy(() => import("@/components/dashboard/upcoming-activities").then((m) => ({ default: m.UpcomingActivities })))

function PanelLoader() {
  return (
    <div className="h-56 rounded-2xl border border-slate-100 bg-white flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  )
}

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
        <Suspense fallback={<PanelLoader />}>
          <StatsCards />
        </Suspense>

        <div className="space-y-8">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                    <h3 className="text-xl font-display font-black text-slate-900 uppercase tracking-tighter italic">System Ops</h3>
                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                </div>
                <button 
                  onClick={handleTriggerDecay}
                  disabled={decaying}
                  className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 group"
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
                    <h4 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-white">{label}</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed m-0 group-hover:text-slate-400">{desc}</p>
                    <div className="flex items-center gap-2 mt-6 text-slate-400 transition-colors group-hover:text-white/40">
                      <span className="text-[10px] font-bold tracking-widest uppercase">Inspect Module</span>
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
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Sector Stability Metrics</h3>
               </div>
               <Suspense fallback={<PanelLoader />}>
                 <DepartmentOverview hideHeader={true} />
               </Suspense>
            </div>
          </div>
          <div className="space-y-10">
            <div className="bg-white rounded-3xl p-8 shadow-premium border border-slate-50">
               <div className="flex items-center gap-3 mb-6">
                  <History className="w-6 h-6 text-slate-400" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Operational Snapshots</h3>
               </div>
               <Suspense fallback={<PanelLoader />}>
                 <UpcomingActivities hideHeader={true} />
               </Suspense>
               <button className="w-full mt-6 py-3 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors">View All Program Logs</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
