"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { useData } from "/lib/data-store"
import { useMemo } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "/lib/utils"

export function SkillDistributionChart({ employeeId = null, variant = "admin" }) {
  const { employees, skills, loading } = useData()

  const data = useMemo(() => {
    if (!employees || !skills) return []

    if (employeeId) {
      // Show stats for a specific employee
      const targetEmp = employees.find(e => e.id === employeeId || e._id === employeeId)
      if (!targetEmp) return []

      return (targetEmp.skills || [])
        .map(s => {
          const isPopulated = s.skillId && typeof s.skillId === 'object' && s.skillId.name;
          const skillDef = isPopulated ? s.skillId : skills.find(sk => sk.id === s.skillId || sk._id === s.skillId);
          const rawScore = s.score || 0;
          return {
            name: skillDef?.name || s.skill?.name || "Unknown",
            score: Math.round((rawScore / 120) * 100),
            rawScore,
            type: skillDef?.type || s.skill?.type || "knowledge"
          }
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 7)
    }

    // Calculate average score for each skill across all employees
    const skillStats = skills.map(skill => {
      let totalScore = 0
      let count = 0

      employees.forEach(emp => {
        const empSkill = emp.skills?.find(s => s.skillId === skill.id || s.skillId === skill._id)
        if (empSkill) {
          totalScore += empSkill.score || 0
          count++
        }
      })

      return {
        name: skill.name,
        score: count > 0 ? Math.round((totalScore / count / 120) * 100) : 0,
        type: skill.type || "knowledge"
      }
    })

    return skillStats.sort((a, b) => b.score - a.score).slice(0, 7)
  }, [employees, skills, employeeId])

  const getBarColor = (type) => {
    switch (type) {
      case "knowledge": return "#F28C1B"
      case "know-how": 
      case "knowHow": return "#0F172A"
      case "soft-skill": 
      case "softSkill": return "#64748B"
      default: return "#F28C1B"
    }
  }

  if (loading && data.length === 0) {
    return (
      <Card className="col-span-2 bg-white border border-slate-100 rounded-[32px] shadow-premium overflow-hidden h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    )
  }

  return (
    <Card className="col-span-2 bg-white border border-slate-100 rounded-[32px] shadow-premium overflow-hidden group">
      <CardHeader className="p-8 pb-4 border-b border-slate-50">
        <CardTitle className="text-xl font-black text-slate-900 tracking-tight">
          {employeeId ? "Skill Proficiency" : "Top Skills Breakdown"}
        </CardTitle>
        <CardDescription className="text-[10px] font-bold text-slate-400 tracking-widest mt-1 uppercase">
          {employeeId ? "Skill levels for specific employee" : "Average proficiency levels across the organization"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <div className="mb-8 flex flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-[#F28C1B]" />
            <span className="text-[10px] font-black text-slate-600 tracking-widest uppercase">Knowledge</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-[#0F172A]" />
            <span className="text-[10px] font-black text-slate-600 tracking-widest uppercase">Know-how</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-[#64748B]" />
            <span className="text-[10px] font-black text-slate-600 tracking-widest uppercase">Soft Skills</span>
          </div>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#F8FAFC" horizontal={true} vertical={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: "#94A3B8", fontSize: 9, fontWeight: '900' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: "#1E293B", fontSize: 10, fontWeight: '900' }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "none",
                  borderRadius: "16px",
                  fontSize: "10px",
                  fontWeight: "900",
                  padding: "16px",
                  boxShadow: "0 20px 32px -8px rgba(0, 0, 0, 0.1)"
                }}
                cursor={{ fill: "#F28C1B", fillOpacity: 0.05 }}
                formatter={(value) => [`${value}%`, 'Proficiency']}
              />
              <Bar
                dataKey="score"
                radius={[0, 8, 8, 0]}
                barSize={12}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.type)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

