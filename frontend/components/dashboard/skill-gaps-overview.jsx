"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSkillTypeLabel } from "@/lib/utils"
import { AlertTriangle, TrendingUp, Loader2, Sparkles } from "lucide-react"
import { useData } from "@/lib/data-store"
import { useMemo } from "react"
import { cn } from "@/lib/utils"

export function SkillGapsOverview() {
  const { employees, skills, loading } = useData()

  const skillGaps = useMemo(() => {
    if (!employees || !skills) return []

    return skills.map(skill => {
      const associatedEmployees = employees.filter(emp =>
        emp.skills?.some(s => s.skillId === skill.id || s.skillId === skill._id)
      )

      if (associatedEmployees.length === 0) return null

      const totalScore = associatedEmployees.reduce((acc, emp) => {
        const empSkill = emp.skills.find(s => s.skillId === skill.id || s.skillId === skill._id)
        return acc + (empSkill?.score || 0)
      }, 0)

      const currentAvg = Math.round(totalScore / associatedEmployees.length)
      const targetLevel = 85 // Arbitrary target for "expert" baseline in systemic overview

      if (currentAvg >= targetLevel) return null

      return {
        skillId: skill.id || skill._id,
        skill: skill,
        currentAvg,
        targetLevel,
        gap: targetLevel - currentAvg,
        affectedEmployees: associatedEmployees.length
      }
    })
      .filter(Boolean)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 5)
  }, [employees, skills])

  if (loading && skillGaps.length === 0) {
    return (
      <Card className="bg-white border border-slate-100 rounded-2xl shadow-sm h-[500px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    )
  }

  return (
    <Card className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden group">
      <CardHeader className="p-10 pb-4 border-b border-slate-50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Skill Gaps</CardTitle>
            <CardDescription className="text-[10px] font-bold text-slate-400 tracking-widest mt-1 uppercase">Priority skills needing focus</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-10 space-y-10">
        {skillGaps.length > 0 ? (
          skillGaps.map((gap) => (
            <div key={gap.skillId} className="space-y-4 group/item">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-black text-slate-900 tracking-tight group-hover/item:text-primary transition-colors">{gap.skill.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold tracking-[0.2em] mt-1 uppercase">{getSkillTypeLabel(gap.skill.type)}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-3 text-[10px] font-black">
                    <span className="text-slate-300 ">{gap.currentAvg}% CURRENT</span>
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">{gap.targetLevel}% TARGET</span>
                  </div>
                  <p className="text-[9px] font-black text-slate-400 tracking-widest mt-1.5 ">AFFECTED EMPLOYEES: {gap.affectedEmployees}</p>
                </div>
              </div>
              <div className="relative pt-2">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full bg-primary transition-all duration-1000 origin-left",
                      gap.gap > 30 ? "bg-rose-500" : gap.gap > 15 ? "bg-orange-500" : "bg-primary"
                    )}
                    style={{ width: `${gap.currentAvg}%` }}
                  />
                </div>
                <div
                  className="absolute top-0 h-4 w-[3px] bg-slate-900 z-10 rounded-full"
                  style={{ left: `${gap.targetLevel}%`, transform: 'translateX(-50%)' }}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
              <Sparkles className="w-8 h-8" />
            </div>
            <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">No critical skill gaps found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
