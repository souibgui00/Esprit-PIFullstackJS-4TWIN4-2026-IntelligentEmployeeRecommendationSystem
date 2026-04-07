"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api } from "@/lib/api"
import { useData } from "@/lib/data-store"
import { toast } from "sonner"
import { DashboardHeader } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Loader2, ArrowLeft, Star, FileText, CheckCircle2, AlertCircle, XCircle } from "lucide-react"

export default function ManagerValidationReportPage() {
  const { participationId } = useParams()
  const navigate = useNavigate()
  const { refreshData } = useData()
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form State
  const [globalRating, setGlobalRating] = useState(4)
  const [comment, setComment] = useState("")
  const [skillAssessments, setSkillAssessments] = useState({})
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.get(`/participations/${participationId}/validation-report`)
        setData(res)
        // Default ALL skills to improved — manager toggles OFF where they saw no growth
        const initSkills = {}
        res.activity?.targetedSkills?.forEach(s => {
          initSkills[s.skillId] = true // default to improved since employee completed the activity
        })
        setSkillAssessments(initSkills)
      } catch (err) {
        toast.error("Failed to load validation report")
        navigate("/manager")
      } finally {

        setIsLoading(false)
      }
    }
    loadData()
  }, [participationId, navigate])


  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) return null

  // Calculate prospective updates
  const simulatedIncrease = globalRating === 5 ? 15 : globalRating === 4 ? 10 : globalRating === 3 ? 5 : 0;
  
  const handleValidate = async (isApproved) => {
    if (!comment || comment.trim() === '') {
      toast.error('A comment is mandatory', { description: 'Please provide feedback for this employee.' })
      return
    }

    setIsSubmitting(true)
    try {
      await api.post(`/participations/${participationId}/validate-report`, {
        isApproved,
        rating: globalRating,
        comment,
        skillAssessments
      })
      toast.success(isApproved ? "Completion Validated" : "Completion Rejected", {
        description: isApproved 
          ? "The employee's skills have been updated." 
          : "The employee has been notified of the rejection."
      })
      if (refreshData) await refreshData()
      navigate("/manager")
    } catch (err) {

      toast.error("Validation failed", { description: err?.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 bg-slate-50/50 min-h-screen">
      <DashboardHeader 
        title="Validation Report" 
        subtitle="Review and validate activity completion" 
      />
      
      <div className="p-8 max-w-5xl mx-auto space-y-8 pb-32">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="hover:bg-slate-200"
        >

          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section 1: Employee Information */}
          <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
              <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-black">1</span>
              Employee Context
            </h2>
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="w-16 h-16 border-4 border-slate-50 shadow-sm">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xl">
                  {data.employee.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{data.employee.name}</h3>
                <p className="text-sm font-medium text-slate-500">{data.employee.department}</p>
                <p className="text-xs text-slate-400">{data.employee.email}</p>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Baseline Skill Level (Before Activity)</h4>
              <div className="space-y-3">
                {data.activity.targetedSkills.map(skill => (
                  <div key={skill.skillId} className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">{skill.name}</span>
                    <Badge variant="outline" className="text-slate-500 font-mono">{skill.currentScore}/100</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Activity Information */}
          <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
              <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-black">2</span>
              Activity Context
            </h2>
            <div className="mb-6">
              <Badge className="bg-blue-50 text-blue-600 mb-3 border-blue-100">{data.activity.type || 'Activity'}</Badge>
              <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight">{data.activity.title}</h3>
              <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                <span>{new Date(data.activity.date).toLocaleDateString()}</span>
                <span>•</span>
                <span>{data.activity.duration || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Manager Evaluation */}
        <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-8">
            <span className="bg-[#F28C1B]/20 text-[#F28C1B] rounded-full w-8 h-8 flex items-center justify-center text-sm font-black">3</span>
            Manager's Evaluation
          </h2>

          <div className="space-y-8 max-w-3xl">
            {/* Global Rating */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Global Engagement & Performance</label>
              <p className="text-xs text-slate-500 mb-3">How well did {data.employee.name} perform in this activity?</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setGlobalRating(star)}
                    className={`w-12 h-12 rounded-xl transition-all flex items-center justify-center ${
                      star <= globalRating 
                        ? "bg-[#F28C1B] text-white shadow-lg shadow-orange-500/30 scale-110" 
                        : "bg-slate-100 text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    <Star className={`w-6 h-6 ${star <= globalRating ? "fill-current" : ""}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Mandatory Comment */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Detailed Feedback (Mandatory)</label>
              <p className="text-xs text-slate-500 mb-3">This feedback will be recorded in the employee's learning history.</p>
              <Textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe the employee's key takeaways, strengths shown, or areas for future focus..."
                className="min-h-[120px] rounded-xl border-slate-200 focus-visible:ring-primary focus-visible:border-primary"
              />
            </div>

            {/* Skill Toggles */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Skill-by-Skill Assessment</label>
              <p className="text-xs text-slate-500 mb-4">All skills are marked as improved by default since the employee completed the activity. Toggle <span className="font-bold text-rose-500">OFF</span> any skill where you did not observe tangible growth.</p>
              <div className="space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                {data.activity.targetedSkills.map(skill => (
                  <div key={skill.skillId} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{skill.name}</p>
                      <p className="text-xs text-slate-500">Current Baseline: {skill.currentScore}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold ${skillAssessments[skill.skillId] ? 'text-emerald-500' : 'text-rose-400'}`}>
                         {skillAssessments[skill.skillId] ? '✓ IMPROVED' : '✗ DID NOT IMPROVE'}
                      </span>
                      <Switch 
                        checked={skillAssessments[skill.skillId]}
                        onCheckedChange={(val) => setSkillAssessments(prev => ({ ...prev, [skill.skillId]: val }))}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Summary Preview */}
        <div className="bg-slate-900 rounded-[24px] p-8 shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <FileText className="w-64 h-64" />
          </div>
          <div className="relative">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-white">
              <span className="bg-white/20 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-black">4</span>
              Impact Preview
            </h2>
            
            <p className="text-slate-300 text-sm mb-6 max-w-2xl">
              Based on your evaluation, here is exactly what will happen when you submit this report. Please review to ensure there are no surprises.
            </p>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-8 max-w-3xl">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Projected Skill Updates</h4>
              <div className="grid gap-3">
                {data.activity.targetedSkills.map(skill => {
                  const improved = skillAssessments[skill.skillId];
                  const newScore = improved ? Math.min(100, skill.currentScore + simulatedIncrease) : skill.currentScore;
                  return (
                    <div key={skill.skillId} className="flex items-center justify-between p-3 rounded-lg bg-black/20">
                      <span className="font-semibold text-slate-200">{skill.name}</span>
                      <div className="flex items-center gap-3 font-mono text-sm">
                        <span className="text-slate-400">{skill.currentScore}</span>
                        {improved ? (
                          <>
                            <span className="text-primary font-black">+{simulatedIncrease}</span>
                            <span className="text-green-400 font-bold">→ {newScore}</span>
                          </>
                        ) : (
                          <span className="text-slate-500 italic">No change</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 max-w-3xl">
              <button 
                onClick={() => handleValidate(false)}
                disabled={isSubmitting}
                className="px-6 py-4 rounded-xl border-2 border-rose-500/30 text-rose-400 font-bold hover:bg-rose-500/10 transition-colors flex items-center justify-center gap-2 flex-1"
              >
                <XCircle className="w-5 h-5" />
                Reject & Request Rework
              </button>
              <button 
                onClick={() => handleValidate(true)}
                disabled={isSubmitting}
                className="px-6 py-4 rounded-xl bg-primary hover:bg-[#D97706] text-white font-bold transition-colors flex items-center justify-center gap-2 flex-[2] shadow-xl shadow-primary/20"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Confirm & Apply Updates
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
