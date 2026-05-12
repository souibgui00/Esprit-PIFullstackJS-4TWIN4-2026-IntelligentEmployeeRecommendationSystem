"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { useData } from "@/lib/data-store"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  ClipboardCheck, 
  MoreHorizontal, 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  CheckCircle, 
  Send, 
  TrendingUp, 
  BarChart3, 
  ChevronLeft,
  Search,
  Activity,
  User,
  Brain,
  Sparkles,
  Target,
  ClipboardList
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"

export default function EvaluationsPage() {
  const { evaluations, addEvaluation, updateEvaluation, deleteEvaluation, activities, employees, skills, updateEmployeeSkill } = useData()
  const { user } = useAuth()

  const getEntityId = (value) => {
    if (!value) return ""
    if (typeof value === "string") return value
    if (typeof value === "object") return value.id || value._id || ""
    return ""
  }

  const [viewState, setViewState] = useState({ mode: "list", currentEval: null })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, evaluation: null })

  // Form state
  const [employeeId, setEmployeeId] = useState("")
  const [activityId, setActivityId] = useState("")
  const [evaluationType, setEvaluationType] = useState("post-activity")
  const [feedback, setFeedback] = useState("")
  const [recommendations, setRecommendations] = useState("")
  const [skillEvaluations, setSkillEvaluations] = useState([])

  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const eid = searchParams.get("employeeId")
    if (eid && employees.length > 0) {
      const employee = employees.find(e => (e.id === eid || e._id === eid))
      if (employee) {
        handleEnterAddMode(eid)
        // Clear search param
        searchParams.delete("employeeId")
        setSearchParams(searchParams)
      }
    }
  }, [searchParams, employees, setSearchParams])

  const handleEnterAddMode = (eid = "") => {
    setEmployeeId(eid)
    setActivityId("")
    setEvaluationType("post-activity")
    setFeedback("")
    setRecommendations("")
    setSkillEvaluations([])
    
    if (eid) {
      const employee = employees.find(e => e.id === eid || e._id === eid)
      if (employee) {
        setSkillEvaluations(employee.skills.map(s => ({
          skillId: s.skillId,
          previousScore: s.score || 0,
          newScore: s.score || 0,
          previousLevel: s.level || "beginner",
          newLevel: s.level || "beginner",
        })))
      }
    }
    setViewState({ mode: "form", currentEval: null, formMode: "add" })
  }

  const handleEnterEditMode = (evaluation) => {
    setEmployeeId(getEntityId(evaluation.employeeId))
    setActivityId(getEntityId(evaluation.activityId))
    setEvaluationType(evaluation.evaluationType)
    setFeedback(evaluation.feedback)
    setRecommendations(evaluation.recommendations || "")
    setSkillEvaluations(evaluation.skillEvaluations)
    setViewState({ mode: "form", currentEval: evaluation, formMode: "edit" })
  }

  const handleEnterViewMode = (evaluation) => {
    setEmployeeId(getEntityId(evaluation.employeeId))
    setActivityId(getEntityId(evaluation.activityId))
    setEvaluationType(evaluation.evaluationType)
    setFeedback(evaluation.feedback)
    setRecommendations(evaluation.recommendations || "")
    setSkillEvaluations(evaluation.skillEvaluations)
    setViewState({ mode: "form", currentEval: evaluation, formMode: "view" })
  }

  const handleEmployeeChange = (empId) => {
    setEmployeeId(empId)
    const employee = employees.find(e => e.id === empId || e._id === empId)
    if (employee) {
      setSkillEvaluations(employee.skills.map(s => ({
        skillId: s.skillId,
        previousScore: s.score || 0,
        newScore: s.score || 0,
        previousLevel: s.level || "beginner",
        newLevel: s.level || "beginner",
      })))
    }
  }

  const handleSkillScoreChange = (skillId, newScore) => {
    const getLevel = (score) => {
      if (score >= 90) return "expert"
      if (score >= 75) return "high"
      if (score >= 50) return "medium"
      return "low"
    }
    setSkillEvaluations(prev => prev.map(se =>
      se.skillId === skillId
        ? { ...se, newScore, newLevel: getLevel(newScore) }
        : se
    ))
  }

  const calculateOverallScore = () => {
    if (skillEvaluations.length === 0) return 0
    const totalNewScore = skillEvaluations.reduce((sum, se) => sum + se.newScore, 0)
    return Math.round(totalNewScore / skillEvaluations.length)
  }

  const handleSaveEvaluation = (status) => {
    if (!employeeId || !activityId) {
      toast.error("Please select an employee and activity")
      return
    }

    const evaluationData = {
      employeeId,
      activityId,
      evaluatorId: user?.id || "u1",
      evaluationType,
      date: new Date(),
      skillEvaluations,
      overallScore: calculateOverallScore(),
      feedback,
      recommendations: recommendations || undefined,
      status
    }

    if (viewState.formMode === "add") {
      addEvaluation(evaluationData)
      toast.success(status === "submitted" ? "Evaluation submitted successfully" : "Draft saved successfully")
    } else if (viewState.currentEval) {
      updateEvaluation(viewState.currentEval.id || viewState.currentEval._id, { ...evaluationData, status })
      toast.success("Evaluation record updated")
    }

    // If submitted or approved, update employee skills
    if (status === "submitted" || status === "approved") {
      skillEvaluations.forEach(se => {
        updateEmployeeSkill(employeeId, se.skillId, {
          score: se.newScore,
          level: se.newLevel,
          progression: se.newScore - se.previousScore
        })
      })
    }

    setViewState({ mode: "list", currentEval: null })
  }

  const handleRemoveSkillFromEval = (skillId) => {
    setSkillEvaluations(prev => prev.filter(se => se.skillId !== skillId))
  }

  const handleAddSkillToEval = (skillId) => {
    const skill = skills.find(s => s.id === skillId || s._id === skillId)
    if (!skill) return

    const employee = employees.find(e => e.id === employeeId || e._id === employeeId)
    const existingSkill = employee?.skills?.find(s => s.skillId === skillId || s.skillId?._id === skillId)

    setSkillEvaluations(prev => [
      ...prev,
      {
        skillId: skill.id || skill._id,
        previousScore: existingSkill?.score || 0,
        previousLevel: existingSkill?.level || "beginner",
        newScore: 0,
        newLevel: "beginner"
      }
    ])
  }

  const getScoreStatus = (score) => {
    if (score >= 90) return { label: "EXCELLENT", color: "bg-emerald-500", icon: CheckCircle }
    if (score >= 75) return { label: "HIGH PERFORMANCE", color: "bg-blue-500", icon: TrendingUp }
    if (score >= 50) return { label: "SATISFACTORY", color: "bg-amber-500", icon: ClipboardCheck }
    return { label: "NEEDS IMPROVEMENT", color: "bg-rose-500", icon: Plus }
  }

  const getTypeBadge = (type) => {
    switch (type) {
      case "pre-activity": return <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200 text-[10px] font-black tracking-widest px-4 py-1 rounded-xl uppercase ">Pre-training</Badge>
      case "post-activity": return <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200 text-[10px] font-black tracking-widest px-4 py-1 rounded-xl uppercase ">Post-training</Badge>
      case "3-months": return <Badge variant="outline" className="bg-cyan-50 text-cyan-500 border-cyan-100 text-[10px] font-black tracking-widest px-4 py-1 rounded-xl uppercase ">3-Month Review</Badge>
      case "6-months": return <Badge variant="outline" className="bg-indigo-50 text-indigo-500 border-indigo-100 text-[10px] font-black tracking-widest px-4 py-1 rounded-xl uppercase ">6-Month Review</Badge>
      case "monthly": return <Badge variant="outline" className="bg-blue-50 text-blue-500 border-blue-100 text-[10px] font-black tracking-widest px-4 py-1 rounded-xl uppercase ">Monthly Review</Badge>
      case "annual": return <Badge variant="outline" className="bg-purple-50 text-purple-500 border-purple-100 text-[10px] font-black tracking-widest px-4 py-1 rounded-xl uppercase ">Annual Review</Badge>
      default: return <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200 text-[10px] font-black tracking-widest px-4 py-1 rounded-xl uppercase ">Periodic</Badge>
    }
  }

  if (viewState.mode === "form") {
    const isView = viewState.formMode === "view"
    return (
      <div className="flex flex-col bg-transparent min-h-screen page-transition">
        <DashboardHeader 
          title={viewState.formMode === "add" ? "New Evaluation" : isView ? "Evaluation Record" : "Edit Evaluation"} 
          description={isView ? "Detailed performance breakdown and recommendations." : "Complete the assessment form to update employee proficiency levels."}
        />
        
        <div className="flex-1 p-6 md:p-10 max-w-350 mx-auto w-full animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-10">
          <button 
            onClick={() => setViewState({ mode: "list", currentEval: null })}
            className="group flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-colors"
          >
            <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-50 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-black tracking-widest uppercase">Back to Overview</span>
          </button>

          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-10">
              {/* Core Information Card */}
              <div className="bg-white border border-slate-100 rounded-[48px] shadow-premium overflow-hidden">
                <div className="bg-slate-950 p-10 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                  <div className="relative z-10 flex items-center gap-5">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight leading-none uppercase">Assessment Space</h2>
                      <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-[0.2em] opacity-80">Cycle: {evaluationType.toUpperCase()}</p>
                    </div>
                  </div>
                </div>

                <div className="p-12 space-y-12">
                  <div className="grid md:grid-cols-3 gap-10">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 mb-2">
                        <User className="w-4 h-4 text-primary" />
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Employee</h4>
                      </div>
                      {isView ? (
                        <div className="h-16 flex items-center px-6 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black text-slate-900 uppercase tracking-widest">
                          {employees.find(e => e.id === employeeId || e._id === employeeId)?.name}
                        </div>
                      ) : (
                        <Select value={employeeId} onValueChange={handleEmployeeChange}>
                          <SelectTrigger className="h-16 bg-slate-50 border-slate-100 rounded-2xl text-[11px] font-black tracking-widest focus:ring-primary/20 hover:bg-white transition-all">
                            <SelectValue placeholder="SELECT EMPLOYEE" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 rounded-2xl shadow-mega overflow-hidden p-2">
                            {employees.map(emp => (
                              <SelectItem key={emp.id || emp._id} value={emp.id || emp._id} className="rounded-xl py-3 font-bold text-[10px] tracking-widest">
                                {emp.name.toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-4 mb-2">
                        <Target className="w-4 h-4 text-primary" />
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Activity</h4>
                      </div>
                      {isView ? (
                        <div className="h-16 flex items-center px-6 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black text-slate-900 uppercase tracking-widest">
                          {activities.find((a) => (a.id === activityId || a._id === activityId))?.title || "-"}
                        </div>
                      ) : (
                        <Select value={activityId} onValueChange={setActivityId}>
                          <SelectTrigger className="h-16 bg-slate-50 border-slate-100 rounded-2xl text-[11px] font-black tracking-widest focus:ring-primary/20 hover:bg-white transition-all">
                            <SelectValue placeholder="SELECT ACTIVITY" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 rounded-2xl shadow-mega overflow-hidden p-2">
                            {activities.map((act) => (
                              <SelectItem key={act.id || act._id} value={act.id || act._id} className="rounded-xl py-3 font-bold text-[10px] tracking-widest">
                                {(act.title || "UNTITLED ACTIVITY").toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-4 mb-2">
                        <Activity className="w-4 h-4 text-primary" />
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Process / Cycle</h4>
                      </div>
                      {isView ? (
                        <div className="flex items-center h-16 px-2">{getTypeBadge(evaluationType)}</div>
                      ) : (
                        <Select value={evaluationType} onValueChange={setEvaluationType}>
                          <SelectTrigger className="h-16 bg-slate-50 border-slate-100 rounded-2xl text-[11px] font-black tracking-widest focus:ring-primary/20 hover:bg-white transition-all">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 rounded-2xl shadow-mega overflow-hidden p-2">
                            <SelectItem value="pre-activity" className="rounded-xl py-3 font-bold text-[10px] tracking-widest">PRE-TRAINING</SelectItem>
                            <SelectItem value="post-activity" className="rounded-xl py-3 font-bold text-[10px] tracking-widest">POST-TRAINING</SelectItem>
                            <SelectItem value="monthly" className="rounded-xl py-3 font-bold text-[10px] tracking-widest">MONTHLY REVIEW</SelectItem>
                            <SelectItem value="3-months" className="rounded-xl py-3 font-bold text-[10px] tracking-widest">3-MONTH REVIEW</SelectItem>
                            <SelectItem value="6-months" className="rounded-xl py-3 font-bold text-[10px] tracking-widest">6-MONTH REVIEW</SelectItem>
                            <SelectItem value="annual" className="rounded-xl py-3 font-bold text-[10px] tracking-widest">ANNUAL REVIEW</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                      <Brain className="w-4 h-4 text-primary" />
                      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Skill Proficiency Matrix</h4>
                      <div className="h-px flex-1 bg-slate-100"></div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Overall Score</p>
                        <p className="text-2xl font-black text-slate-950 mt-1">{calculateOverallScore()}%</p>
                      </div>
                    </div>

                    <div className="grid gap-6">
                      {skillEvaluations.map((se) => {
                        const skill = skills.find(s => s.id === se.skillId || s._id === se.skillId)
                        return (
                          <div key={se.skillId} className="p-8 bg-slate-50/50 border border-slate-100 rounded-4xl group hover:bg-white hover:shadow-premium transition-all duration-500">
                            <div className="flex items-center justify-between mb-8">
                              <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-primary font-black shadow-sm group-hover:scale-110 transition-transform">
                                  {skill?.name[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">{skill?.name}</p>
                                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mt-2">
                                    Current Rank: {se.previousLevel.toUpperCase()} ({se.previousScore}%)
                                  </p>
                                </div>
                              </div>
                              <div className="text-right flex items-center gap-6">
                                <div className="text-2xl font-black text-slate-950 tracking-tighter">{se.newScore}%</div>
                                {!isView && (
                                  <button 
                                    onClick={() => handleRemoveSkillFromEval(se.skillId)}
                                    className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-200 hover:text-rose-500 hover:border-rose-100 transition-all active:scale-95"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {!isView ? (
                              <div className="px-1">
                                <Slider
                                  value={[se.newScore]}
                                  onValueChange={([val]) => handleSkillScoreChange(se.skillId, val)}
                                  className="w-full"
                                />
                              </div>
                            ) : (
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden p-0.5">
                                 <div 
                                    className="h-full bg-primary rounded-full transition-all duration-1000"
                                    style={{ width: `${se.newScore}%` }}
                                 ></div>
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {!isView && (
                         <div className="pt-4">
                            <Select onValueChange={handleAddSkillToEval}>
                              <SelectTrigger className="h-16 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black tracking-widest text-slate-400 uppercase hover:border-primary hover:text-primary transition-all">
                                <div className="flex items-center gap-3">
                                  <Plus className="w-4 h-4" />
                                  <span>Add additional competence</span>
                                </div>
                              </SelectTrigger>
                              <SelectContent className="bg-white border-slate-200 rounded-2xl shadow-mega p-2">
                                {skills.filter(s => !skillEvaluations.some(se => se.skillId === (s.id || s._id))).map(sk => (
                                  <SelectItem key={sk.id || sk._id} value={sk.id || sk._id} className="rounded-xl py-3 font-bold text-[10px] tracking-widest uppercase">
                                    {sk.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                         </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-10 sticky top-24">
              {/* Feedback and Notes Card */}
              <div className="bg-white border border-slate-100 rounded-[48px] shadow-premium p-10 space-y-10">
                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <Target className="w-4 h-4 text-primary" />
                      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Observations</h4>
                      <div className="h-px flex-1 bg-slate-100"></div>
                   </div>
                   {isView ? (
                     <p className="text-xs font-medium text-slate-500 leading-relaxed bg-slate-50 p-6 rounded-3xl border border-slate-100 italic">
                        "{feedback || "No performance feedback recorded for this session."}"
                     </p>
                   ) : (
                     <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Type observation notes..."
                        rows={4}
                        className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-medium placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none"
                     />
                   )}
                </div>

                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Recommendations</h4>
                      <div className="h-px flex-1 bg-slate-100"></div>
                   </div>
                   {isView ? (
                     <p className="text-xs font-medium text-slate-500 leading-relaxed bg-slate-50 p-6 rounded-3xl border border-slate-100 italic">
                        "{recommendations || "No development recommendations provided."}"
                     </p>
                   ) : (
                     <textarea
                        value={recommendations}
                        onChange={(e) => setRecommendations(e.target.value)}
                        placeholder="Growth strategy notes..."
                        rows={4}
                        className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-medium placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none"
                     />
                   )}
                </div>

                {!isView && (
                  <div className="pt-6 grid grid-cols-1 gap-4">
                     <Button
                        onClick={() => handleSaveEvaluation("approved")}
                        className="h-16 bg-primary hover:bg-primary-dark text-white font-black text-[11px] tracking-widest uppercase rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                     >
                        <Send className="w-4 h-4" />
                        Finalize Assessment
                     </Button>
                     <Button
                        variant="outline"
                        onClick={() => handleSaveEvaluation("draft")}
                        className="h-16 border-slate-100 bg-white hover:bg-slate-50 text-slate-900 font-black text-[11px] tracking-widest uppercase rounded-2xl transition-all"
                     >
                        Keep as Draft
                     </Button>
                  </div>
                )}
                
                {isView && (
                   <Button
                      onClick={() => setViewState({ mode: "list", currentEval: null })}
                      className="h-16 w-full bg-slate-950 text-white font-black text-[11px] tracking-widest uppercase rounded-2xl shadow-xl transition-all active:scale-95"
                   >
                      Close Evaluation
                   </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-transparent min-h-screen page-transition">
      <DashboardHeader title="Performance Dashboard" description="Enterprise-scale professional monitoring system" />
      
      <div className="flex-1 p-6 md:p-10 max-w-350 mx-auto w-full space-y-12 animate-in fade-in duration-700">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Growth <span className="text-primary">.</span></h1>
                <p className="text-sm font-medium text-slate-400">Analysis and performance history for your enterprise.</p>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
                <Button
                    onClick={() => handleEnterAddMode()}
                    className="bg-primary hover:bg-primary-dark text-white h-14 px-8 rounded-2xl font-black text-[11px] tracking-widest uppercase transition-all shadow-xl shadow-orange-500/20 active:scale-95 flex items-center gap-3"
                >
                    <Plus className="h-5 w-5" />
                    New Assessment
                </Button>
            </div>
        </div>

        {/* Real-time Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white border-slate-100 shadow-premium rounded-[40px] p-8 group hover:border-primary/20 transition-all duration-500 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                <div className="relative z-10">
                    <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                        <BarChart3 className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Global Avg Score</p>
                    <p className="text-4xl font-black text-slate-950 tracking-tighter">
                      {evaluations.length > 0 ? (evaluations.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / evaluations.length).toFixed(1) : 0}%
                    </p>
                </div>
            </Card>

            <Card className="bg-slate-950 border-none shadow-mega rounded-[40px] p-8 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full -mr-24 -mt-24 blur-[80px]"></div>
                <div className="relative z-10">
                    <div className="h-12 w-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center text-primary mb-6 border border-white/10 group-hover:scale-110 transition-transform">
                        <Target className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-80">Cycle Completions</p>
                    <p className="text-4xl font-black text-white tracking-tighter">{evaluations.length || 0}</p>
                </div>
            </Card>

            <Card className="bg-white border-slate-100 shadow-premium rounded-[40px] p-8 group hover:border-primary/20 transition-all duration-500 overflow-hidden relative">
                <div className="absolute top-1/2 right-1/2 w-48 h-48 bg-emerald-500/5 rounded-full -mr-24 -mt-24 blur-[100px] pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-6">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">High Performers</p>
                    <p className="text-4xl font-black text-slate-950 tracking-tighter">
                      {evaluations.filter(e => e.overallScore >= 75).length}
                    </p>
                </div>
            </Card>
        </div>

        {/* Records Dashboard Card */}
        <Card className="bg-white border border-slate-100 shadow-mega rounded-[48px] overflow-hidden border-none p-1">
           <div className="bg-slate-50/50 p-10 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-5">
                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm">
                    <ClipboardList className="w-6 h-6 text-slate-400" />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-slate-950 tracking-tighter uppercase leading-none">Evaluation Logs</h3>
                    <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest opacity-80">Full administrative tracking</p>
                 </div>
              </div>
           </div>
           
           <div className="p-0">
              <div className="overflow-x-auto">
                 <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-50 hover:bg-transparent">
                        <TableHead className="px-10 py-8 text-[10px] font-black text-slate-900 uppercase tracking-widest">Employee</TableHead>
                        <TableHead className="py-8 text-[10px] font-black text-slate-900 uppercase tracking-widest">Assessment Type</TableHead>
                        <TableHead className="py-8 text-[10px] font-black text-slate-900 uppercase tracking-widest">Global Score</TableHead>
                        <TableHead className="py-8 text-[10px] font-black text-slate-900 uppercase tracking-widest">Status Badge</TableHead>
                        <TableHead className="py-8 text-right px-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                       {evaluations.length === 0 ? (
                         <TableRow>
                            <TableCell colSpan={5} className="py-32 text-center">
                               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                  <Sparkles className="w-8 h-8 text-slate-200" />
                               </div>
                               <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No evaluation records available</p>
                            </TableCell>
                         </TableRow>
                       ) : evaluations.map((evaluation) => {
                         const employee = employees.find(e => e.id === evaluation.employeeId || e._id === evaluation.employeeId)
                         const status = getScoreStatus(evaluation.overallScore)
                         return (
                           <TableRow key={evaluation.id || evaluation._id} className="group border-b border-slate-50 hover:bg-slate-50/50 transition-all duration-500">
                             <TableCell className="px-10 py-8">
                                <div className="flex items-center gap-5">
                                   <Avatar className="h-12 w-12 rounded-2xl border-2 border-white shadow-premium group-hover:scale-110 transition-all duration-500">
                                      <AvatarImage src={employee?.avatar} className="object-cover" />
                                      <AvatarFallback className="bg-slate-950 text-white font-black text-xs">
                                         {employee?.name ? employee.name.substring(0,2).toUpperCase() : "??"}
                                      </AvatarFallback>
                                   </Avatar>
                                   <div>
                                      <p className="text-sm font-black text-slate-950 uppercase tracking-tighter leading-none">{employee?.name}</p>
                                      <p className="text-[9px] font-black text-slate-300 uppercase mt-2 tracking-widest">{employee?.position || "Member"}</p>
                                   </div>
                                </div>
                             </TableCell>
                             <TableCell className="py-8">{getTypeBadge(evaluation.evaluationType)}</TableCell>
                             <TableCell className="py-8">
                                <span className={cn("text-xl font-black tracking-tighter", evaluation.overallScore >= 75 ? "text-emerald-500" : "text-slate-950")}>
                                   {evaluation.overallScore}%
                                </span>
                             </TableCell>
                             <TableCell className="py-8">
                                <Badge className={cn("text-[9px] font-black tracking-widest px-4 py-1.5 rounded-xl uppercase border-none", status.color, status.color.includes("bg") ? "text-white" : "")}>
                                   {status.label}
                                </Badge>
                             </TableCell>
                             <TableCell className="px-10 py-8 text-right">
                                <DropdownMenu>
                                   <DropdownMenuTrigger asChild>
                                      <button className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 hover:text-slate-950 hover:border-slate-300 transition-all shadow-sm active:scale-95">
                                         <MoreHorizontal className="w-5 h-5" />
                                      </button>
                                   </DropdownMenuTrigger>
                                   <DropdownMenuContent align="end" className="bg-white border-slate-200 rounded-2xl shadow-mega p-2 min-w-50 animate-in fade-in zoom-in-95 duration-200">
                                      <DropdownMenuItem onClick={() => handleEnterViewMode(evaluation)} className="flex items-center gap-3 rounded-xl px-4 py-3 font-black text-[10px] tracking-widest uppercase text-slate-600 hover:bg-slate-50 hover:text-primary transition-all cursor-pointer">
                                         <Eye className="w-4 h-4" /> View Details
                                      </DropdownMenuItem>
                                      {evaluation.status !== "approved" && (
                                        <DropdownMenuItem onClick={() => handleEnterEditMode(evaluation)} className="flex items-center gap-3 rounded-xl px-4 py-3 font-black text-[10px] tracking-widest uppercase text-slate-600 hover:bg-slate-50 hover:text-primary transition-all cursor-pointer">
                                           <Pencil className="w-4 h-4" /> Edit Record
                                        </DropdownMenuItem>
                                      )}
                                      <div className="h-px bg-slate-100 my-2 mx-2"></div>
                                      <DropdownMenuItem 
                                        onClick={() => setDeleteDialog({ open: true, evaluation })}
                                        className="flex items-center gap-3 rounded-xl px-4 py-3 font-black text-[10px] tracking-widest uppercase text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
                                      >
                                         <Trash2 className="w-4 h-4" /> Delete Log
                                      </DropdownMenuItem>
                                   </DropdownMenuContent>
                                </DropdownMenu>
                             </TableCell>
                           </TableRow>
                         )
                       })}
                    </TableBody>
                 </Table>
              </div>
           </div>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        onConfirm={() => {
          if (deleteDialog.evaluation) {
            deleteEvaluation(deleteDialog.evaluation.id || deleteDialog.evaluation._id)
            toast.success("Log record deleted permanentely")
          }
          setDeleteDialog({ open: false, evaluation: null })
        }}
        title="Destroy Record?"
        description="This action will permanently delete this evaluation log. This cannot be undone."
        confirmText="Confirm Destruction"
      />
    </div>
  )
}
