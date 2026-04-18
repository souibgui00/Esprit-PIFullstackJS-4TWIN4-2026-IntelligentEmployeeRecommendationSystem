"use client"

import { useState, useMemo, useRef } from "react"
import { useData } from "/lib/data-store"
import { DashboardHeader } from "/components/dashboard/header"
import { useAuth } from "/lib/auth-context"
import { Progress } from "/components/ui/progress"
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
import { cn } from "/lib/utils"
import { Button } from "/components/ui/button"
import { Badge } from "/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "/components/ui/dialog"
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
    <div className="flex flex-col bg-[#F8FAFC] min-h-screen text-slate-600 pb-16 overflow-x-hidden">
      <DashboardHeader title="Company Analytics" description="Detailed insights into department performance, skill distribution, and training progress." />

      <div className="flex-1 p-4 md:p-6 max-w-330 mx-auto w-full animate-in fade-in duration-1000 space-y-8 md:space-y-10">
        
        {/* Core KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 pt-2">
           {/* Org Score */}
           <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-7 shadow-premium group hover:-translate-y-0.75 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <Target className="w-6 h-6" />
                </div>
                <Badge className="bg-emerald-50 text-emerald-600 border-none px-2.5 py-1 text-[8px] font-black uppercase tracking-widest">+4.2%</Badge>
              </div>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.22em] mb-1.5">Organization Score</p>
              <h3 className="text-3xl md:text-[2.15rem] font-black text-slate-900 tracking-tighter">{analytics.avgScore}%</h3>
           </div>

           {/* Active Training */}
             <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-7 shadow-premium group hover:-translate-y-0.75 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
               <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.22em] mb-1.5">Active Trainings</p>
              <h3 className="text-3xl md:text-[2.15rem] font-black text-slate-900 tracking-tighter">{analytics.activeTrainings}</h3>
           </div>

           {/* Skills Warning */}
             <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-7 shadow-premium group hover:-translate-y-0.75 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
               <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.22em] mb-1.5">Low Skill Count</p>
              <h3 className="text-3xl md:text-[2.15rem] font-black text-rose-500 tracking-tighter">{analytics.skillsAtRisk}</h3>
           </div>

           {/* Total Sectors */}
             <div className="bg-slate-950 border-none rounded-3xl p-6 md:p-7 shadow-mega group hover:-translate-y-0.75 transition-all duration-300 text-white">
              <div className="flex items-center justify-between mb-4">
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary">
                  <PieIcon className="w-6 h-6" />
                </div>
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.22em] mb-1.5">Total Departments</p>
              <h3 className="text-3xl md:text-[2.15rem] font-black text-white tracking-tighter">{analytics.totalSectors}</h3>
           </div>
        </div>

        {/* Main Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            
            {/* Department Comparison Chart */}
            <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-premium space-y-8">
              <div className="flex items-start justify-between gap-4 pr-0 md:pr-2">
                    <div className="space-y-1">
                  <h4 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter">Department Performance</h4>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.22em] leading-tight">Ranking departments by average score</p>
                    </div>
                <Button onClick={() => setShowComparison(true)} variant="ghost" className="rounded-xl h-10 px-4 text-[9px] font-black uppercase tracking-[0.18em] bg-slate-50 transition-all hover:bg-slate-100 active:scale-95 whitespace-nowrap">Compare Data</Button>
                </div>

              <div className="h-75 md:h-85 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sectorPerformance} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 900 }} domain={[0, 100]} />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                axisLine={false} 
                                tickLine={false} 
                                width={110}
                                tick={{ fill: '#0F172A', fontSize: 9, fontWeight: 900, textTransform: 'uppercase' }} 
                            />
                            <Tooltip 
                                cursor={{ fill: '#F8FAFC' }}
                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 12px 28px -10px rgba(0,0,0,0.18)', padding: '0.75rem', background: '#FFF' }}
                                labelStyle={{ fontWeight: 900, fontSize: '9px', textTransform: 'uppercase', marginBottom: '0.4rem', color: '#0F172A' }}
                                itemStyle={{ fontWeight: 800, fontSize: '10px', color: '#F28C1B' }}
                            />
                            <Bar 
                                dataKey="score" 
                                fill="#F28C1B" 
                                radius={[0, 10, 10, 0]} 
                                barSize={32}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Skill Composition Pie */}
                      <div className="lg:col-span-4 bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-premium flex flex-col items-center">
                        <h4 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tighter mb-1">Skill Balance</h4>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.22em] mb-4 md:mb-5">Skill distribution by category</p>
                
                        <div className="h-52 md:h-56 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={analytics.pieData} 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={52} 
                            outerRadius={76} 
                            paddingAngle={4} 
                            dataKey="value"
                            stroke="none"
                          >
                            {analytics.pieData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 15px 30px rgba(0,0,0,0.05)', padding: '0.8rem', background: '#FFF' }}
                            itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                          />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.24em] leading-none">Global</p>
                    <p className="text-lg md:text-xl font-black text-slate-900 leading-none">Skills</p>
                    </div>
                </div>

                  <div className="w-full space-y-2.5 pt-4">
                    {analytics.pieData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50/50 px-3 py-2.5 rounded-2xl border border-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-tight">{item.name}</span>
                            </div>
                      <span className="text-xs font-black text-slate-900">{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Future Talent Growth */}
              <div className="bg-slate-950 border-none rounded-3xl p-6 md:p-8 shadow-mega relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-56 h-56 bg-primary/20 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                 <div className="relative z-10 space-y-6 md:space-y-8 text-white">
                    <div>
                    <h4 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-none mb-2">Growth Tracker</h4>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.22em]">Skill score improvement forecast (6 Months)</p>
                    </div>

                    <div className="h-52.5 md:h-57.5 w-full pt-2">
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 backdrop-blur-xl">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Growth Forecast</p>
                        <p className="text-xl md:text-2xl font-black text-emerald-400">+18%</p>
                        </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 backdrop-blur-xl">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Confidence Layer</p>
                        <p className="text-xl md:text-2xl font-black text-white">95%</p>
                        </div>
                    </div>
                 </div>
            </div>

            {/* Strategic Insights Panel */}
            {(user?.role === 'hr' || user?.role === 'admin') && (
                <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-premium flex flex-col justify-between">
                <div>
                  <h4 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">What to do next</h4>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.22em] italic mb-8 md:mb-10">Quick advice based on your company data</p>
                  
                  <div className="space-y-6">
                    <div className="flex gap-4 group hover:translate-x-1 transition-transform duration-300">
                      <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-rose-100">
                        <ShieldAlert className="w-5 h-5" />
                          </div>
                          <div className="space-y-1 pt-1">
                        <h5 className="text-[10px] font-black uppercase text-rose-500 tracking-[0.12em]">People needing training</h5>
                        <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
                                 {analytics.skillsAtRisk} team members have very few skills. You should suggest some new training sessions for them.
                              </p>
                          </div>
                      </div>

                    <div className="flex gap-4 group hover:translate-x-1 transition-transform duration-300">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-emerald-100">
                        <UserCheck className="w-5 h-5" />
                          </div>
                          <div className="space-y-1 pt-1">
                        <h5 className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.12em]">Best Department</h5>
                        <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
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
              <div className="bg-white rounded-3xl shadow-mega w-full h-full overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
               <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center bg-slate-950 text-white gap-4">
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-primary">
                    <Globe className="w-7 h-7" />
                        </div>
                        <div>
                    <DialogTitle className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Department Checklist</DialogTitle>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">How each group is doing compared to others</div>
                        </div>
                    </div>
                    <Button 
                        variant="ghost" 
                        onClick={() => setShowComparison(false)}
                  className="text-white/50 hover:text-white hover:bg-white/10 rounded-xl h-10 w-10 p-0"
                    >
                  <X className="w-5 h-5" />
                    </Button>
                 </div>

               <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar space-y-6 md:space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                       {sectorPerformance.map((dept, i) => (
                     <div key={i} className="bg-slate-50/50 p-5 md:p-6 rounded-3xl border border-slate-100 flex flex-col justify-between group hover:bg-white hover:shadow-premium transition-all duration-300">
                     <div className="flex justify-between items-start mb-5 gap-4">
                      <div className="space-y-3">
                        <h5 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none group-hover:text-primary transition-colors">{dept.name}</h5>
                        <Badge className="bg-slate-900 text-white border-none px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em]">{dept.count} Members</Badge>
                                </div>
                                <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Score</p>
                        <p className="text-3xl font-black text-slate-950 tracking-tighter">{dept.score}%</p>
                                </div>
                             </div>
                             
                     <div className="space-y-3">
                      <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
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
