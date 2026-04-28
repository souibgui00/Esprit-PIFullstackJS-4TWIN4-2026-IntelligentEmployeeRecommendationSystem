"use client"

import { useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ClipboardCheck, Mail, Phone, Calendar as CalendarIcon, Briefcase, ChevronLeft, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { useData } from "@/lib/data-store"
import { cn } from "@/lib/utils"

export default function ManagerTeamMemberPage() {
  const navigate = useNavigate()
  const { employeeId } = useParams()
  const { employees = [] } = useData()

  const employee = useMemo(() => {
    return employees.find((e) => String(e.id || e._id) === String(employeeId)) || null
  }, [employees, employeeId])

  const getSkillTypeLabel = (type) => {
    const labels = {
      technical: "Technical",
      soft: "Soft Skill",
      behavioral: "Behavioral",
      domain: "Domain Expert",
    }
    return labels[type?.toLowerCase()] || "Professional"
  }

  const getProgressionIcon = (progression) => {
    if (progression > 0) return <TrendingUp className="h-3 w-3 text-emerald-500" />
    if (progression < 0) return <TrendingDown className="h-3 w-3 text-rose-500" />
    return <Minus className="h-3 w-3 text-slate-400" />
  }

  if (!employee) {
    return (
      <div className="max-w-5xl mx-auto w-full p-8">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-slate-700 font-semibold">Employee not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/manager/employees")}>
            Back to team roster
          </Button>
        </div>
      </div>
    )
  }

  return (
    <section className="max-w-5xl mx-auto w-full p-8 space-y-6" aria-label="Team member profile details">
      <Button variant="ghost" className="px-2 text-slate-600" onClick={() => navigate("/manager/employees")}>
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to team roster
      </Button>

      <article className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm" aria-label="Employee information">
        <header className="px-8 py-7 border-b border-slate-100 bg-slate-50">
          <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/30 tracking-wider mb-2 bg-primary/5">Employee Profile</Badge>
          <h1 className="text-2xl font-display text-slate-900">{employee.name}</h1>
          <p className="text-slate-500 text-sm mt-1">Detailed profile and performance overview.</p>
        </header>

        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-6 bg-white">
          <Avatar className="h-20 w-20 rounded-2xl border border-slate-200 shadow-sm bg-white">
            <AvatarImage src={employee.avatar} className="object-cover" />
            <AvatarFallback className="text-xl font-bold text-slate-400">{employee.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 border-slate-200 text-slate-600 tracking-wider">{employee.department || "Unassigned"}</Badge>
              <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 border-slate-200 text-slate-600 tracking-wider">ID: {employee.matricule || "N/A"}</Badge>
            </div>
            <h2 className="text-xl font-semibold text-slate-900">{employee.position || "Employee"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-slate-500">
              <div className="flex items-center gap-2 text-xs">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {employee.email || "N/A"}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {employee.telephone || "N/A"}
              </div>
            </div>
          </div>
          <div className="shrink-0 bg-slate-50 p-4 rounded-xl border border-slate-100 text-center min-w-[100px]">
            <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-1">Tenure</p>
            <p className="text-xl font-semibold text-slate-900">{employee.yearsOfExperience || 0} <span className="text-sm font-medium text-slate-400">Yrs</span></p>
          </div>
        </div>

        <Tabs defaultValue="skills" className="w-full">
          <div className="px-6 border-b border-slate-100 bg-white">
            <TabsList className="bg-transparent p-0 gap-6 h-11">
              <TabsTrigger value="skills" className="bg-transparent border-none p-0 text-sm font-semibold text-slate-400 data-[state=active]:text-primary relative h-full rounded-none outline-none group/tab">
                Skill Assessment
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 group-data-[state=active]/tab:scale-x-100 transition-transform duration-300" />
              </TabsTrigger>
              <TabsTrigger value="info" className="bg-transparent border-none p-0 text-sm font-semibold text-slate-400 data-[state=active]:text-primary relative h-full rounded-none outline-none group/tab">
                Work Details
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 group-data-[state=active]/tab:scale-x-100 transition-transform duration-300" />
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="skills" className="mt-0 outline-none">
              <ScrollArea className="max-h-[52vh] pr-3">
                <div className="space-y-3">
                  {(employee.skills || []).map((skill) => (
                    <div key={skill.skillId?._id || skill.skillId} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-primary/20 transition-all shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm",
                          (skill.score > 80) ? "bg-slate-900" : (skill.score > 50) ? "bg-primary" : "bg-slate-300"
                        )}>
                          {(skill.level?.[0] || "B").toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{skill.skillId?.name || "Specialized Skill"}</p>
                          <p className="text-xs text-slate-400">{getSkillTypeLabel(skill.skillId?.type)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right shrink-0">
                          <p className="text-base font-semibold text-slate-900 leading-none">{Math.round((skill.score || 0) * 10) / 10}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            {getProgressionIcon(skill.progression || 0)}
                            <span className={cn(
                              "text-[10px] font-semibold",
                              (skill.progression || 0) > 0 ? "text-emerald-500" : (skill.progression || 0) < 0 ? "text-rose-500" : "text-slate-400"
                            )}>
                              {skill.progression > 0 ? "+" : ""}{skill.progression || 0}%
                            </span>
                          </div>
                        </div>
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary/70 transition-all duration-700" style={{ width: `${Math.min(((skill.score || 0) / 120) * 100, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="info" className="mt-0 outline-none space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    <p className="text-[11px] font-bold text-slate-400 tracking-wider">Join Date</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    {employee.date_embauche ? new Date(employee.date_embauche).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    <p className="text-[11px] font-bold text-slate-400 tracking-wider">Contract Type</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Full-time Permanent</p>
                </div>
              </div>
              <div className="p-6 rounded-xl border border-slate-100 bg-slate-50/50">
                <p className="text-[11px] font-bold text-slate-400 tracking-wider mb-2">Role Description</p>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  {employee.jobDescription || "No job description provided."}
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <Button
            onClick={() => navigate(`/manager/evaluations?employee=${employee.id || employee._id}`)}
            className="bg-primary text-white font-semibold py-2 px-5 rounded-lg text-sm shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <ClipboardCheck className="h-4 w-4" />
            Request Assessment
          </Button>
        </div>
      </article>
    </section>
  )
}
