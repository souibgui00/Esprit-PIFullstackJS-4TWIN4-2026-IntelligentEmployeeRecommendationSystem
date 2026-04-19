"use client"

import { useState, useMemo } from "react"
import { useData } from "@/lib/data-store"
import { Badge } from "@/components/ui/badge"
import { 
  Search, Brain, Plus, BookOpen, Heart, ArrowRight, X, 
  Edit3, Award, Sparkles, Filter, Database, Users, 
  ShieldCheck, BarChart3, TrendingUp, Layers, SlidersHorizontal
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { DashboardHeader } from "@/components/dashboard/header"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AdminSkillsPage() {
  const { skills, employees, activities } = useData()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [activeViewTab, setActiveViewTab] = useState("Overview")
  
  // Categorization States
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  const categories = ["All", "Technique", "Comportementale", "Transverse", "Opérationnelle"]

  const filteredSkills = (skills || []).filter(s => {
    const matchesSearch = (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (s.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    
    // Logic for Type and Status based on Schema
    const matchesType = filterType === "all" || (s.type || "").toLowerCase() === filterType.toLowerCase()
    const matchesStatus = filterStatus === "all" || (s.etat || "").toLowerCase() === filterStatus.toLowerCase()
    
    return matchesSearch && matchesType && matchesStatus
  })

  const typeConfig = {
    technique: { icon: Database, label: "Technical", color: "bg-blue-50 text-[#1E5FA8]", border: "hover:border-[#1E5FA8]/20" },
    comportementale: { icon: Heart, label: "Soft Skill", color: "bg-rose-50 text-rose-600", border: "hover:border-rose-200" },
    transverse: { icon: Layers, label: "Governance", color: "bg-amber-50 text-amber-600", border: "hover:border-amber-200" },
    opérationnelle: { icon: Brain, label: "Operational", color: "bg-emerald-50 text-emerald-600", border: "hover:border-emerald-200" },
  }

  const renderSkillCard = (skill) => {
    const cfg = typeConfig[skill.type?.toLowerCase()] || typeConfig.technique
    const Icon = cfg.icon
    const skillKey = skill.id || skill._id
    
    const skillEmployees = (employees || []).filter(e =>
      e.skills?.some(s => String(s?.skillId?._id ?? s?.skillId?.id ?? s?.skillId) === String(skillKey))
    )
    
    const isSelected = selectedSkill?._id === skill._id || selectedSkill?.id === skill.id

    return (
      <div
        key={skill.id || skill._id}
        onClick={() => {
          setSelectedSkill(skill)
          setActiveViewTab("Overview")
        }}
        className={cn(
          "bg-white border-2 rounded-4xl p-8 transition-all group cursor-pointer hover:shadow-2xl relative",
          isSelected ? "border-primary bg-slate-50/30" : "border-slate-50 shadow-premium"
        )}
      >
        <div className="flex justify-between items-start mb-6">
          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500", cfg.color)}>
            <Icon className="h-7 w-7" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="secondary" className="text-[10px] font-black tracking-widest uppercase bg-slate-50 text-slate-400 border-none px-3 py-1.5 rounded-lg">
              {skill.category || "General"}
            </Badge>
            {skill.etat && (
              <Badge className={cn("text-[9px] font-black uppercase border-none px-2.5 py-1 rounded-lg", 
                skill.etat === 'validated' ? 'bg-emerald-100 text-emerald-600' : 
                skill.etat === 'submitted' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
              )}>
                {skill.etat}
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors leading-tight mb-2 uppercase">
              {skill.name}
            </h3>
            <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed">
              {skill.description}
            </p>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-50">
            <div className="flex items-center gap-2">
               <Users className="w-4 h-4 text-slate-300" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{skillEmployees.length} EMPLOYEES</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all">
              <ArrowRight className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-[#F8FAFC] min-h-screen text-slate-600">
      <DashboardHeader title="Skills" description="Manage your skills and training requirements" />

      <div className="flex-1 p-6 md:p-10 max-w-350 mx-auto w-full animate-in fade-in duration-700 space-y-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-4">
          <div className="flex flex-wrap items-center gap-4 w-full justify-between">
            <div className="relative group min-w-[320px]">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search skills, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-8 h-16 bg-white border-2 border-slate-50 focus:border-primary/20 rounded-4xl text-sm font-bold text-slate-900 shadow-premium outline-none transition-all placeholder:text-slate-300 placeholder:font-black placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-16 px-8 rounded-4xl bg-white border-2 border-slate-50 shadow-premium hover:bg-slate-50 transition-all gap-4">
                    <SlidersHorizontal className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Filters</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-95 p-8 bg-white border-none rounded-[3rem] shadow-2xl space-y-10 mt-4 animate-in fade-in slide-in-from-top-4">
                  <div className="space-y-8">
                     <div className="space-y-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Skill Category</label>
                        <Select value={filterType} onValueChange={setFilterType}>
                          <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold text-sm">
                            <SelectValue placeholder="All Categories" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-none shadow-xl">
                            <SelectItem value="all">All Skills</SelectItem>
                            <SelectItem value="technique">Technical</SelectItem>
                            <SelectItem value="comportementale">Soft Skills</SelectItem>
                            <SelectItem value="transverse">Cross-functional</SelectItem>
                            <SelectItem value="opérationnelle">Operational</SelectItem>
                          </SelectContent>
                        </Select>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Evaluation Status</label>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold text-sm">
                            <SelectValue placeholder="All Status" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-none shadow-xl">
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="validated">Validated</SelectItem>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                          </SelectContent>
                        </Select>
                     </div>
                     <Button 
                        variant="ghost" 
                        onClick={() => {setFilterType("all"); setFilterStatus("all")}}
                        className="w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50"
                      >Reset All</Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Button onClick={() => navigate("new")} className="h-16 px-10 rounded-4xl bg-slate-950 text-white font-black text-[11px] tracking-widest uppercase hover:bg-primary transition-all shadow-xl active:scale-95 flex items-center gap-4">
                <Plus className="h-5 w-5" />
                Add Skill
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-3">
            {filteredSkills.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredSkills.map(skill => renderSkillCard(skill))}
              </div>
            ) : (
              <div className="py-40 text-center bg-white border-2 border-slate-50 border-dashed rounded-[3rem] shadow-premium">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Filter className="h-10 w-10 text-slate-200" />
                </div>
                <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest font-display">No skills matching search</h3>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            {selectedSkill ? (
              <div className="bg-white border-2 border-slate-50 rounded-[3rem] p-10 sticky top-8 shadow-2xl shadow-slate-200/50 flex flex-col min-h-[650px] animate-in slide-in-from-right-10 duration-700">
                <div className="flex justify-between items-start mb-8">
                  <div className="space-y-1">
                    <Badge className="bg-primary/10 text-primary border-none px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">Skill Details</Badge>
                    <h2 className="text-2xl font-black text-slate-900 uppercase leading-tight pt-2">{selectedSkill.name}</h2>
                  </div>
                  <button onClick={() => setSelectedSkill(null)} className="w-10 h-10 bg-slate-50 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-xl flex items-center justify-center transition-all">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex bg-slate-100/50 p-1.5 rounded-2xl mb-8">
                  {["Overview", "Employees"].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveViewTab(tab)}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        activeViewTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="flex-1 space-y-8 overflow-y-auto pr-2 no-scrollbar">
                  {activeViewTab === "Overview" ? (
                    <div className="space-y-8">
                      <div className="bg-slate-50 rounded-4xl p-8 border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Description</p>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                          "{selectedSkill.description}"
                        </p>
                      </div>

                      <div className="space-y-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evaluation Scores</p>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-6 bg-white border border-slate-100 rounded-[1.5rem] space-y-2">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Self Evaluation</p>
                              <p className="text-3xl font-black text-primary">{selectedSkill.auto_eval || 0}<span className="text-xs text-slate-300">/5</span></p>
                           </div>
                           <div className="p-6 bg-white border border-slate-100 rounded-[1.5rem] space-y-2">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Manager Evaluation</p>
                              <p className="text-3xl font-black text-slate-900">{selectedSkill.hierarchie_eval || 0}<span className="text-xs text-slate-300">/5</span></p>
                           </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(() => {
                        const talent = (employees || []).filter(e => 
                          e.skills?.some(s => {
                            const employeeSkillId = s.skillId?._id || s.skillId?.id || s.skillId;
                            const currentSkillId = selectedSkill._id || selectedSkill.id;
                            return String(employeeSkillId) === String(currentSkillId);
                          })
                        );

                        if (talent.length === 0) {
                          return (
                            <div className="py-20 text-center space-y-4">
                              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                <Users className="h-6 w-6 text-slate-200" />
                              </div>
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-loose">No team members<br/>possess this skill yet</p>
                            </div>
                          );
                        }

                        return talent.map(emp => (
                          <div key={emp._id || emp.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4 group hover:bg-white hover:border-primary/20 transition-all cursor-pointer">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-400 text-xs group-hover:text-primary transition-colors">{emp.name?.charAt(0)}</div>
                            <div className="flex-1">
                              <p className="text-xs font-black text-slate-900 leading-none mb-1">{emp.name}</p>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{emp.department || "Independent"}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-black text-primary mb-0.5">LVL {emp.skills?.find(s => String(s.skillId?._id || s.skillId?.id || s.skillId) === String(selectedSkill._id || selectedSkill.id))?.level || 1}</p>
                               <div className="flex gap-0.5">
                                 {[1,2,3,4,5].map(i => (
                                   <div key={i} className={cn("w-1 h-1 rounded-full", i <= (emp.skills?.find(s => String(s.skillId?._id || s.skillId?.id || s.skillId) === String(selectedSkill._id || selectedSkill.id))?.level || 1) ? "bg-primary" : "bg-slate-200")} />
                                 ))}
                               </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => navigate(`${selectedSkill._id || selectedSkill.id}/edit`)}
                  className="w-full bg-slate-950 hover:bg-primary text-white rounded-2xl py-8 font-black text-[10px] uppercase tracking-widest transition-all mt-8 shadow-xl"
                >
                  Manage Skill
                </Button>
              </div>
            ) : (
              <div className="bg-white border-2 border-slate-50 rounded-[3rem] p-16 text-center flex flex-col items-center justify-center min-h-150 shadow-premium">
                <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mb-6">
                  <BookOpen className="h-8 w-8 text-slate-200" />
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase">No Skill Selected</h3>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest max-w-30 mt-2">Select a skill to see more details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
