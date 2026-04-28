"use client"

import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useData } from "@/lib/data-store"
import { DashboardHeader } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Brain, Target, Users, TrendingUp, Sparkles, PieChart as PieChartIcon, BarChart3 } from "lucide-react"
import { Card } from "@/components/ui/card"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts"
import { cn } from "@/lib/utils"

export default function AdminGlobalSkillsDashboard() {
  const navigate = useNavigate()
  const { fetchGlobalSkillsDashboard } = useData()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const loadDashboard = async () => {
      try {
        setLoading(true)
        const result = await fetchGlobalSkillsDashboard()
        if (mounted && result) {
          setData(result)
        }
      } catch (err) {
        console.error("Failed to load skills dashboard:", err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadDashboard()
    return () => { mounted = false }
  }, [fetchGlobalSkillsDashboard])

  const COLORS = ['#F28C1B', '#3b82f6', '#10b981', '#8b5cf6', '#f43f5e', '#f59e0b']

  if (loading) {
    return (
      <main id="main-content" className="flex flex-col items-center justify-center min-h-screen text-slate-400 space-y-4" aria-label="Skills analytics loading" role="status" aria-live="polite">
        <Sparkles className="w-16 h-16 animate-pulse opacity-20 text-primary" aria-hidden="true" />
        <p className="text-xs font-black tracking-widest uppercase">Analyzing Organizational Competencies...</p>
      </main>
    )
  }

  if (!data) {
    return (
      <main id="main-content" className="flex flex-col items-center justify-center min-h-screen" aria-label="Skills analytics unavailable" role="status" aria-live="polite">
        <p className="text-lg font-bold text-slate-500">Could not retrieve dashboard data.</p>
        <Button onClick={() => navigate("/admin/skills")} variant="outline" className="mt-4">Go Back</Button>
      </main>
    )
  }

  // Format data for charts
  const topSkillsData = (data.topSkills || []).slice(0, 10).map(s => ({
    name: s.skillName || "Unknown",
    score: Math.round(s.averageScore || 0),
    count: s.employeeCount || 0
  }))

  const levelData = data.levelDistribution ? [
    { name: "Expert", value: data.levelDistribution.expert || 0, color: "#4f46e5" },
    { name: "Advanced", value: data.levelDistribution.advanced || 0, color: "#3b82f6" },
    { name: "Intermediate", value: data.levelDistribution.intermediate || 0, color: "#10b981" },
    { name: "Beginner", value: data.levelDistribution.beginner || 0, color: "#94a3b8" }
  ].filter(l => l.value > 0) : []

  const categoryData = (data.categoryDistribution || []).map((c, i) => ({
    name: c.category || "General",
    value: c.count || 0,
    color: COLORS[i % COLORS.length]
  }))

  const totalEvaluations = data.totalEvaluations || 0
  const avgOrgScore = data.averageOrganizationScore ? Math.round(data.averageOrganizationScore) : 0

  return (
    <main id="main-content" className="flex flex-col bg-[#F8FAFC] min-h-screen pb-20" aria-label="Global skills dashboard page">
      <DashboardHeader
        title="Global Skills Analytics"
        description="Organization-wide competency mapping and distribution insights."
      />

      <section className="flex-1 p-8 max-w-350 mx-auto w-full space-y-8 animate-in fade-in duration-700" aria-label="Global skills dashboard content">

        {/* Header Setup */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Competency Dashboard<span className="text-primary">.</span></h2>
            <p className="text-sm font-medium text-slate-500">Real-time organizational capability insights</p>
          </div>
          <Button
            onClick={() => navigate("/admin/skills")}
            variant="outline"
            className="flex items-center gap-2 rounded-xl bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Skills Library
          </Button>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Configured Skills"
            value={data.totalSkillsConfigured || 0}
            icon={Brain}
            trend="+12% from last quarter"
            color="text-[#F28C1B]"
            bg="bg-[#F28C1B]/10"
          />
          <KPICard
            title="Avg Org Score"
            value={`${avgOrgScore}%`}
            icon={Target}
            trend="Target: 85%"
            color="text-emerald-500"
            bg="bg-emerald-500/10"
          />
          <KPICard
            title="Active Evaluated Profiles"
            value={totalEvaluations}
            icon={Users}
            trend="Across all departments"
            color="text-blue-500"
            bg="bg-blue-500/10"
          />
          <KPICard
            title="Highest Rated Category"
            value={categoryData.length > 0 ? categoryData.reduce((prev, current) => (prev.value > current.value) ? prev : current).name : "N/A"}
            icon={Sparkles}
            trend="Leading capability domain"
            color="text-purple-500"
            bg="bg-purple-500/10"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Skills Bar Chart */}
          <Card className="lg:col-span-2 p-8 border-none shadow-sm rounded-3xl bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-primary" aria-hidden="true" />
                    Top Rated Competencies
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Average scores across the organization</p>
                </div>
              </div>
              <div className="h-75 w-full" role="img" aria-label="Top rated competencies bar chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topSkillsData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 100]} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="score" radius={[8, 8, 8, 8]} barSize={40}>
                      {topSkillsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          {/* Proficiency Level Split */}
          <Card className="p-8 border-none shadow-sm rounded-3xl bg-slate-900 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-3">
                    <PieChartIcon className="w-5 h-5 text-emerald-400" />
                    Proficiency Distribution
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Organization level breakdown</p>
                </div>
              </div>
              <div className="h-65 w-full" role="img" aria-label="Proficiency distribution pie chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={levelData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {levelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#1e293b', color: '#fff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }} itemStyle={{ color: '#fff' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Distribution Area Chart */}
          <Card className="p-8 border-none shadow-sm rounded-3xl bg-white">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Category Allocation
                </h3>
                <p className="text-xs text-slate-500 mt-1">Volume of skills per functional category</p>
              </div>
            </div>
            <div className="h-75 w-full" role="img" aria-label="Category allocation area chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={categoryData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Radar Skill Coverage */}
          <Card className="p-8 border-none shadow-sm rounded-3xl bg-white">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <Target className="w-5 h-5 text-purple-500" />
                  Capability Assessment Map
                </h3>
                <p className="text-xs text-slate-500 mt-1">Holistic view of top 6 competencies</p>
              </div>
            </div>
            <div className="h-75 w-full flex items-center justify-center" role="img" aria-label="Capability assessment radar chart">
              {topSkillsData.length > 2 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={topSkillsData.slice(0, 6)}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 8 }} />
                    <Radar name="Org Score" dataKey="score" stroke="#F28C1B" strokeWidth={3} fill="#F28C1B" fillOpacity={0.2} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center">
                  <p className="text-slate-400 text-sm font-medium">Insufficient data for capability map.</p>
                  <p className="text-xs text-slate-300 mt-1">Requires at least 3 active competencies.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

      </section>
    </main>
  )
}

function KPICard({ title, value, icon: Icon, trend, color, bg }) {
  return (
    <Card className="p-6 border-none shadow-sm rounded-[24px] bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", bg)}>
          <Icon className={cn("w-6 h-6", color)} />
        </div>
        <div className="h-8 w-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:border-slate-200 group-hover:text-slate-500 transition-colors">
          <TrendingUp className="w-3.5 h-3.5" />
        </div>
      </div>
      <div>
        <h4 className="text-3xl font-black font-display text-slate-900 tracking-tighter mb-1">{value}</h4>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-xs font-medium text-slate-400 mt-2 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{trend}</p>
      </div>
    </Card>
  )
}
