"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { Link } from "react-router-dom"
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
import { StatsCards } from "@/components/dashboard/stats-cards"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useState } from "react"
import { DepartmentOverview } from "@/components/dashboard/department-overview"
import { UpcomingActivities } from "@/components/dashboard/upcoming-activities"

/**
 * HR STRATEGIC CENTER
 * A dashboard dedicated to human capital, retention, and skill growth.
 */
export default function AdminDashboard() {
  const [decaying, setDecaying] = useState(false)

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
    <main id="main-content" className="flex flex-col bg-transparent min-h-screen page-transition" aria-label="Admin dashboard">
      <DashboardHeader title="Admin Command Center" description="System Control, Mutation Monitoring & Data Stability." />

      <section className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-12 animate-in fade-in duration-700" aria-label="Dashboard content">
        <StatsCards />

        <section aria-labelledby="system-ops-heading" className="space-y-8">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <h2 id="system-ops-heading" className="text-xl font-display font-black text-slate-900 uppercase tracking-tighter italic">System Ops</h2>
              <div className="h-px flex-1 bg-slate-100" aria-hidden="true" />
            </div>
            <button
              type="button"
              onClick={handleTriggerDecay}
              disabled={decaying}
              className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 group focus:ring-2 focus:ring-offset-2 focus:ring-slate-950"
              aria-label="Trigger system decay logic"
              aria-busy={decaying}
            >
              {decaying ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <DatabaseZap className="w-4 h-4 text-orange-500 group-hover:rotate-12 transition-transform" aria-hidden="true" />}
              Trigger System Logic
            </button>
          </header>

          <nav className="grid gap-6 md:grid-cols-4" aria-label="Admin quick links">
            {quickLinks.map(({ to, icon: Icon, label, desc }) => (
              <Link key={to} to={to} aria-label={`Navigate to ${label}: ${desc}`}>
                <article className="card-premium p-8 hover:bg-slate-950 hover:text-white h-full group border-slate-100 transition-all duration-500 hover:-translate-y-1 shadow-sm hover:shadow-2xl focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-slate-950 rounded-2xl">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl mb-6 bg-slate-100 text-slate-600 group-hover:bg-white/10 group-hover:text-white transition-all" aria-hidden="true">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-white">{label}</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed m-0 group-hover:text-slate-400">{desc}</p>
                  <div className="flex items-center gap-2 mt-6 text-slate-400 transition-colors group-hover:text-white/40">
                    <span className="text-[10px] font-bold tracking-widest uppercase">Inspect Module</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </div>
                </article>
              </Link>
            ))}
          </nav>
        </section>

        <section className="grid gap-10 lg:grid-cols-3" aria-label="System health metrics">
          <section className="lg:col-span-2 space-y-10" aria-labelledby="stability-metrics-heading">
            <article className="bg-white rounded-3xl p-8 shadow-premium border border-slate-50">
              <header className="flex items-center gap-3 mb-8">
                <Activity className="w-6 h-6 text-slate-900" aria-hidden="true" />
                <h3 id="stability-metrics-heading" className="text-lg font-black text-slate-900 uppercase tracking-widest">Sector Stability Metrics</h3>
              </header>
              <DepartmentOverview hideHeader={true} />
            </article>
          </section>

          <aside className="space-y-10" aria-labelledby="operational-snapshots-heading">
            <article className="bg-white rounded-3xl p-8 shadow-premium border border-slate-50">
              <header className="flex items-center gap-3 mb-6">
                <History className="w-6 h-6 text-slate-400" aria-hidden="true" />
                <h3 id="operational-snapshots-heading" className="text-sm font-black text-slate-900 uppercase tracking-widest">Operational Snapshots</h3>
              </header>
              <UpcomingActivities hideHeader={true} />
              <button
                type="button"
                className="w-full mt-6 py-3 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-slate-950"
                aria-label="View all operational program logs"
              >
                View All Program Logs
              </button>
            </article>
          </aside>
        </section>
      </section>
    </main>
  )
}
