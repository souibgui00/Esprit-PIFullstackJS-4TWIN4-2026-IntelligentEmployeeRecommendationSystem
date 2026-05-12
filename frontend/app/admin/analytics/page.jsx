"use client"

import { useState, useMemo, useRef } from "react"
import { useData } from "@/lib/data-store"
import { DashboardHeader } from "@/components/dashboard/header"
import { useAuth } from "@/lib/auth-context"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts"
import {
  Target,
  Brain,
  Zap,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  BookOpen,
  PieChart as PieIcon,
  AlertTriangle,
  UserCheck,
  Download,
  Flame,
  Globe,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

const COLORS = ['#F28C1B', '#0F172A', '#3B82F6', '#10B981', '#F43F5E']

export default function AdminAnalyticsPage() {
  const { user } = useAuth()
  const { employees, activities, skills, departments } = useData()
  const [showComparison, setShowComparison] = useState(false)

  // Real-time calculation of key organization metrics
  const analytics = useMemo(() => {
    const totalEmps = employees?.length || 1
    const totalSectors = departments?.length || 1
    const avgScore = Math.round(employees?.reduce((acc, e) => acc + (e.rankScore || 0), 0) / totalEmps)
    const skillsAtRisk = employees?.filter(e => (e.skills?.length || 0) < 3).length
    const activeTrainings = activities?.filter(a => a.status === 'active').length || 0
    
    const skillTypes = skills?.reduce((acc, s) => {
        const type = (s.type || 'technique').toLowerCase()
        acc[type] = (acc[type] || 0) + 1
        return acc
    }, { technique: 0, comportementale: 0, opérationnelle: 0, transverse: 0 })

    const pieData = [
        { name: 'Theory', value: skillTypes.technique || 0 },
        { name: 'Soft Skills', value: skillTypes.comportementale || 0 },
        { name: 'Practical', value: skillTypes.opérationnelle || 0 },
        { name: 'Transversal', value: skillTypes.transverse || 0 }
    ]

    return { avgScore, skillsAtRisk, activeTrainings, pieData, totalEmps, totalSectors }
  }, [employees, activities, skills, departments])

  // Sector Performance Data
  const sectorPerformance = useMemo(() => {
    if (!departments) return []
    return departments.map(dept => {
      const deptEmps = employees?.filter(e => e.department === dept.name) || []
      const avgDeptScore = deptEmps.length ? Math.round(deptEmps.reduce((acc, e) => acc + (e.rankScore || 0), 0) / deptEmps.length) : 0
      const totalSkillsCount = deptEmps.reduce((acc, e) => acc + (e.skills?.length || 0), 0)
      return {
        name: dept.name,
        score: avgDeptScore,
        count: deptEmps.length,
        totalSkills: totalSkillsCount
      }
    }).sort((a, b) => b.score - a.score)
  }, [departments, employees])

  return (
    <div className="flex flex-col bg-[#F8FAFC] min-h-screen text-slate-600 pb-20 overflow-x-hidden">
      <DashboardHeader title="Company Analytics" description="Detailed insights into department performance, skill distribution, and training progress." />

      <div className="flex-1 p-5 md:p-8 max-w-[1180px] mx-auto w-full animate-in fade-in duration-1000 space-y-12">
        
        {/* Core KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-4">
           {/* Org Score */}
           <div className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-7 shadow-premium group hover:translate-y-[-3px] transition-all duration-500">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <Target className="w-7 h-7" />
                </div>
                <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1 text-[9px] font-medium uppercase tracking-widest">+4.2%</Badge>
              </div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-2">Organization Score</p>
              <h3 className="text-3xl font-semibold text-slate-900 tracking-tight">{analytics.avgScore}%</h3>
           </div>

           {/* Active Training */}
           <div className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-7 shadow-premium group hover:translate-y-[-3px] transition-all duration-500">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                    <BookOpen className="w-7 h-7" />
                </div>
              </div>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-2">Active Trainings</p>
                <h3 className="text-3xl font-semibold text-slate-900 tracking-tight">{analytics.activeTrainings}</h3>
           </div>

           {/* Skills Warning */}
           <div className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-7 shadow-premium group hover:translate-y-[-3px] transition-all duration-500">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                    <AlertTriangle className="w-7 h-7" />
                </div>
              </div>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-2">Low Skill Count</p>
                <h3 className="text-3xl font-semibold text-rose-500 tracking-tight">{analytics.skillsAtRisk}</h3>
           </div>

           {/* Total Sectors */}
           <div className="bg-slate-950 border-none rounded-[2.5rem] p-7 shadow-mega group hover:translate-y-[-3px] transition-all duration-500 text-white">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-primary">
                    <PieIcon className="w-7 h-7" />
                </div>
              </div>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-2">Total Departments</p>
                <h3 className="text-3xl font-semibold text-white tracking-tight">{analytics.totalSectors}</h3>
           </div>
        </div>

        {/* Main Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Department Comparison Chart */}
            <div className="lg:col-span-8 bg-white border-2 border-slate-50 rounded-[3rem] p-8 shadow-premium space-y-8">
                <div className="flex items-center justify-between pr-4">
                    <div className="space-y-1">
                        <h4 className="text-xl font-semibold text-slate-900 uppercase tracking-tight">Department Performance</h4>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-none">Ranking departments by average score</p>
                    </div>
                      <Button onClick={() => setShowComparison(true)} variant="ghost" className="rounded-2xl h-12 px-5 text-[10px] font-medium uppercase tracking-widest bg-slate-50 transition-all hover:bg-slate-100 active:scale-95">Compare Data</Button>
                </div>

                <div className="h-[400px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sectorPerformance} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }} domain={[0, 100]} />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                axisLine={false} 
                                tickLine={false} 
                                width={120}
                                tick={{ fill: '#0F172A', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }} 
                            />
                            <Tooltip 
                                cursor={{ fill: '#F8FAFC' }}
                                contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 40px -8px rgba(0,0,0,0.1)', padding: '1rem', background: '#FFF' }}
                                labelStyle={{ fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', marginBottom: '0.5rem', color: '#0F172A' }}
                                itemStyle={{ fontWeight: 600, fontSize: '11px', color: '#F28C1B' }}
                            />
                            <Bar 
                                dataKey="score" 
                                fill="#F28C1B" 
                                radius={[0, 10, 10, 0]} 
                                barSize={45}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Skill Composition Pie */}
            <div className="lg:col-span-4 bg-white border-2 border-slate-50 rounded-[3rem] p-8 shadow-premium flex flex-col items-center">
              <h4 className="text-lg font-semibold text-slate-900 uppercase tracking-tight mb-2">Skill Balance</h4>
              <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mb-8">Skill distribution by category</p>
                
                <div className="h-[280px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={analytics.pieData} 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={70} 
                            outerRadius={100} 
                            paddingAngle={8} 
                            dataKey="value"
                            stroke="none"
                          >
                            {analytics.pieData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 15px 30px rgba(0,0,0,0.05)', padding: '0.8rem', background: '#FFF' }}
                            itemStyle={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}
                          />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <p className="text-[9px] font-medium text-slate-300 uppercase tracking-widest leading-none">Global</p>
                          <p className="text-xl font-semibold text-slate-900 leading-none">Skills</p>
                    </div>
                </div>

                <div className="w-full space-y-4 pt-10">
                    {analytics.pieData.map((item, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-50/50 p-2.5 rounded-lg border border-slate-50/50">
                            <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                <span className="text-[8px] font-medium text-slate-600 uppercase tracking-tight">{item.name}</span>
                            </div>
                              <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Future Talent Growth */}
            <div className="bg-slate-950 border-none rounded-[3rem] p-8 shadow-mega relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                 <div className="relative z-10 space-y-10 text-white">
                    <div>
                        <h4 className="text-2xl font-semibold uppercase tracking-tight leading-none mb-2">Growth Tracker</h4>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Skill score improvement forecast (6 Months)</p>
                    </div>

                    <div className="h-[250px] w-full pt-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[
                                { name: 'Jan', val: 56 }, { name: 'Feb', val: 62 }, { name: 'Mar', val: 60 },
                                { name: 'Apr', val: 68 }, { name: 'May', val: 74 }, { name: 'Jun', val: 82 }
                            ]}>
                              <defs>
                                <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#F28C1B" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#F28C1B" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="val" stroke="#F28C1B" strokeWidth={5} fillOpacity={1} fill="url(#growthGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                            <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest mb-1">Growth Forecast</p>
                            <p className="text-xl font-semibold text-emerald-400">+18%</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                            <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest mb-1">Confidence Layer</p>
                            <p className="text-xl font-semibold text-white">95%</p>
                        </div>
                    </div>
                 </div>
            </div>

            {/* Strategic Insights Panel */}
            {(user?.role === 'hr' || user?.role === 'admin') && (
              <div className="bg-white border-2 border-slate-50 rounded-[3rem] p-8 shadow-premium flex flex-col justify-between">
                <div>
                  <h4 className="text-2xl font-semibold text-slate-900 uppercase tracking-tight mb-2">What to do next</h4>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest italic mb-10">Quick advice based on your company data</p>
                  
                  <div className="space-y-8">
                      <div className="flex gap-6 group hover:translate-x-2 transition-transform duration-500">
                          <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center shrink-0 shadow-sm border border-rose-100">
                              <ShieldAlert className="w-6 h-6" />
                          </div>
                          <div className="space-y-1 pt-1">
                              <h5 className="text-[11px] font-semibold uppercase text-rose-500 tracking-[0.1em]">People needing training</h5>
                              <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                                 {analytics.skillsAtRisk} team members have very few skills. You should suggest some new training sessions for them.
                              </p>
                          </div>
                      </div>

                      <div className="flex gap-6 group hover:translate-x-2 transition-transform duration-500">
                          <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center shrink-0 shadow-sm border border-emerald-100">
                              <UserCheck className="w-6 h-6" />
                          </div>
                          <div className="space-y-1 pt-1">
                              <h5 className="text-[11px] font-semibold uppercase text-emerald-500 tracking-[0.1em]">Best Department</h5>
                              <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                                 {sectorPerformance[0]?.name} is doing great! Maybe their top people can help teach other departments.
                              </p>
                          </div>
                      </div>
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Detailed Comparison Modal */}
        <Dialog open={showComparison} onOpenChange={setShowComparison}>
           <DialogContent className="sm:max-w-4xl max-h-[85vh] p-0 bg-transparent border-none shadow-none focus:outline-none">
                <div className="bg-white rounded-[3rem] shadow-mega w-full h-full overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-500">
                 <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-950 text-white">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-primary">
                            <Globe className="w-8 h-8" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-semibold uppercase tracking-tight">Department Checklist</DialogTitle>
                            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">How each group is doing compared to others</div>
                        </div>
                    </div>
                    <Button 
                        variant="ghost" 
                        onClick={() => setShowComparison(false)}
                        className="text-white/50 hover:text-white hover:bg-white/10 rounded-xl"
                    >
                        <X className="w-6 h-6" />
                    </Button>
                 </div>

                 <div className="flex-1 overflow-y-auto p-8 no-scrollbar space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {sectorPerformance.map((dept, i) => (
                             <div key={i} className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between group hover:bg-white hover:shadow-premium transition-all duration-500">
                             <div className="flex justify-between items-start mb-8">
                                <div className="space-y-4">
                                <h5 className="text-xl font-semibold text-slate-900 uppercase tracking-tight leading-none group-hover:text-primary transition-colors">{dept.name}</h5>
                                <Badge className="bg-slate-900 text-white border-none px-4 py-2 rounded-xl text-[9px] font-medium uppercase tracking-widest">{dept.count} Members</Badge>
                                </div>
                                <div className="text-right">
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Total Score</p>
                                <p className="text-3xl font-semibold text-slate-950 tracking-tight">{dept.score}%</p>
                                </div>
                             </div>
                             
                             <div className="space-y-4">
                              <div className="flex justify-between text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                    <span>Number of Skills</span>
                                    <span className="text-slate-950">{dept.totalSkills} Skills</span>
                                </div>
                                <div className="h-2.5 bg-white border border-slate-100 rounded-full overflow-hidden p-0.5">
                                    <div 
                                        className="h-full bg-primary rounded-full" 
                                        style={{ width: `${dept.score}%` }}
                                    ></div>
                                </div>
                             </div>
                           </div>
                       ))}
                    </div>
                 </div>
              </div>
           </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
