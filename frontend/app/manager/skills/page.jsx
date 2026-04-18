"use client"

import { Brain, AlertCircle, TrendingUp, Target, Zap, ArrowUpRight, Sparkles, BookOpen, Layers } from "lucide-react"
import { DashboardHeader } from "/components/dashboard/header"
import { useData } from "/lib/data-store"
import { Card, CardContent, CardHeader, CardTitle } from "/components/ui/card"
import { Badge } from "/components/ui/badge"
import { Button } from "/components/ui/button"
import { Progress } from "/components/ui/progress"
import { cn } from "/lib/utils"
import { toast } from "sonner"

export default function ManagerSkillsPage() {
    const { skills, employees } = useData()

    const skillGaps = []

    const topSkills = []

    const handleGeneratePlan = () => {
        toast.promise(new Promise(r => setTimeout(r, 2000)), {
            loading: "Generating development strategy...",
            success: "Training plan synthesized successfully",
            error: "Analysis failed",
        })
    }

    return (
        <div className="flex flex-col bg-[#F8FAFC] min-h-screen">
      <DashboardHeader title="Skills" description="Team skills and competencies" />

      <div className="flex-1 p-8 space-y-10 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-200">
                            <Layers className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Competency Maturity</h1>
                            <p className="text-sm text-slate-500">Analytics and gap detection for team proficiency.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleGeneratePlan}
                        className="px-6 h-11 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                    >
                        <Zap className="h-4 w-4 text-primary" />
                        Generate Development Plan
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Skill Deficits */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                            <h3 className="text-sm font-bold text-slate-800">Critical Skill Gaps</h3>
                            <p className="text-xs text-slate-500 mt-1">Skills requiring immediate development attention.</p>
                        </div>
                        <div className="p-6 space-y-8 flex-1">
                            {skillGaps.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <AlertCircle className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-slate-800 mb-2">No Skill Gaps Detected</h4>
                                    <p className="text-sm text-slate-500 mb-4">Start adding skills and employee assessments to identify development areas.</p>
                                    <Button 
                                        onClick={handleGeneratePlan}
                                        className="bg-slate-900 hover:bg-slate-800"
                                    >
                                        Generate Initial Assessment
                                    </Button>
                                </div>
                            ) : (
                                skillGaps.map((gap, i) => (
                                    <div key={i} className="group">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-lg flex items-center justify-center transition-all shadow-sm",
                                                    gap.critical ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-500"
                                                )}>
                                                    <AlertCircle className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">{gap.name}</p>
                                                    <p className="text-[11px] text-slate-400 font-medium">Team: {gap.teamAvg}% · Benchmark: {gap.target}%</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={cn(
                                                    "text-lg font-bold",
                                                    gap.critical ? "text-rose-500" : "text-amber-500"
                                                )}>{gap.gap}%</span>
                                                <p className="text-[10px] font-bold text-slate-300 tracking-wider leading-none">Gap</p>
                                            </div>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-1000",
                                                    gap.critical ? "bg-rose-400" : "bg-amber-400"
                                                )}
                                                style={{ width: `${gap.teamAvg}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-8">
                        {/* Summary Action */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                                <Brain className="w-24 h-24 text-white" />
                            </div>
                            <div className="relative z-10 text-center md:text-left">
                                <h3 className="text-xl font-bold text-white tracking-tight mb-2">Neural Optimization Map</h3>
                                <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
                                    We've identified {skillGaps.length} areas where focused training can significantly boost overall team performance.
                                </p>
                                <button
                                    onClick={handleGeneratePlan}
                                    className="px-8 h-12 bg-primary text-white text-sm font-bold rounded-lg hover:bg-white hover:text-slate-900 transition-all active:scale-95 shadow-lg shadow-primary/20"
                                >
                                    <Sparkles className="inline-block mr-2 h-4 w-4" />
                                    Optimize Training Paths
                                </button>
                            </div>
                        </div>

                        {/* Top Strengths */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex-1">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                                <h3 className="text-sm font-bold text-slate-800">Top Team Strengths</h3>
                                <p className="text-xs text-slate-500 mt-1">Highest ranking proficiencies in your department.</p>
                            </div>
                            <div className="p-6 space-y-6">
                                {topSkills.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <TrendingUp className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <h4 className="text-lg font-semibold text-slate-800 mb-2">No Skills Data Available</h4>
                                        <p className="text-sm text-slate-500 mb-4">Add skills and conduct assessments to identify team strengths.</p>
                                        <Button 
                                            onClick={handleGeneratePlan}
                                            className="bg-slate-900 hover:bg-slate-800"
                                        >
                                            Start Skills Assessment
                                        </Button>
                                    </div>
                                ) : (
                                    topSkills.map((skill, i) => (
                                        <div key={i} className="group">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-primary font-bold text-sm border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                                                        {skill.name[0]}
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">{skill.name}</span>
                                                        <p className="text-[11px] text-slate-400 font-medium">Applied by {skill.employees} members</p>
                                                    </div>
                                                </div>
                                                <span className="text-lg font-bold text-slate-900">{skill.avg}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-400 rounded-full transition-all duration-1000"
                                                    style={{ width: `${skill.avg}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}







