"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/header"
import { RecommendationEngine } from "@/components/recommendations/recommendation-engine"
import RecommendationResults from "@/components/recommendations/recommendation-results"
import { useData } from "@/lib/data-store"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Brain, Cpu, Sparkles, Zap, Shield } from "lucide-react"

function RecommendationsContent() {
  const [searchParams] = useSearchParams()
  const activityId = searchParams.get("activityId")
  const { activities, employees } = useData()

  const [selectedActivity, setSelectedActivity] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState(null)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [isForwarding, setIsForwarding] = useState(false)
  const [isForwarded, setIsForwarded] = useState(false)

  // Set activity from URL param
  useEffect(() => {
    if (activityId && activities?.length > 0) {
      const activity = activities.find((a) => (a.id || a._id) === activityId) || null
      setSelectedActivity(activity)
    }
  }, [activityId, activities])

  const handleGenerateRecommendations = async (options = {}) => {
    if (!selectedActivity) return

    setIsGenerating(true)
    setHasGenerated(false)
    setIsForwarded(false)
    setGenerationError(null)

    try {
      const actId = selectedActivity._id || selectedActivity.id
      console.log('Calling API with actId:', actId)
<<<<<<< HEAD
      const response = await api.post(`/api/activities/${actId}/recommendations`, options)
=======
      const response = await api.post(`/activities/${actId}/recommendations`, options)
>>>>>>> dd895aa (reverting old work)
      const candidates = Array.isArray(response?.candidates) ? response.candidates : []

      const mappedResults = candidates.map((c) => ({
        id: c.userId,
        name: c.name,
        role: c.role,
        overallScore: Math.round(Math.max(0, Math.min(1, Number(c.score || 0))) * 100),
        skillGaps: Array.isArray(c.gap) ? c.gap : [],
        gap: Array.isArray(c.gap) ? c.gap : [],
        recommendation_reason: c.recommendation_reason || "",
      }))

      setRecommendations(mappedResults)
      setHasGenerated(true)
      toast.success("Recommendations Generated", {
        description: `${mappedResults.length} candidates found for ${selectedActivity.title}.`
      })
    } catch (error) {
      const msg = error?.message || "Unable to generate recommendations."
      setGenerationError(msg)
      toast.error("Failed to generate recommendations", { description: msg })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleForwardToManager = async (employeeIds, selectedRecs) => {
    if (!selectedActivity) return
    setIsForwarding(true)
    try {
      const actId = selectedActivity._id || selectedActivity.id
      const avgScore = selectedRecs.length > 0
        ? Math.round(selectedRecs.reduce((acc, r) => acc + (r.overallScore || 0), 0) / selectedRecs.length)
        : 0
<<<<<<< HEAD
      await api.post('/api/assignments/forward-to-department-manager', {
=======
      await api.post('/assignments/forward-to-department-manager', {
>>>>>>> dd895aa (reverting old work)
        candidateIds: employeeIds,
        activityId: actId,
        aiScore: avgScore,
        reason: 'Suggested training based on skill match analysis.'
      })
      setIsForwarded(true)
      toast.success("Forwarded!", { description: "Recommendations sent to managers." })
    } catch (error) {
      toast.error("Failed to forward", { description: error?.message })
    } finally {
      setIsForwarding(false)
    }
  }


  return (
    <div className="flex flex-col bg-[#F8FAFC] min-h-screen page-transition">
      <DashboardHeader title="Matching Analytics" description="AI-driven matching between employees and activities." />

      <div className="flex-1 p-10 max-w-[1600px] mx-auto w-full space-y-12 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row items-end justify-between border-b border-slate-100 pb-12 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-orange-500 tracking-[0.3em] font-sans">AI Analysis</span>
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></span>
            </div>
            <h1 className="text-4xl font-display font-bold text-slate-900 tracking-tight leading-tight ">Smart Matching</h1>
            <p className="text-slate-400 font-medium text-sm">Advanced AI matchmaking between employees and training activities.</p>
          </div>
          <div className="flex items-center gap-8 px-8 py-5 bg-white rounded-2xl border border-slate-100 shadow-sm shadow-orange-500/5">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-300 tracking-widest leading-none mb-2">System Status</span>
              <span className="text-xs font-black text-emerald-500 tracking-widest flex items-center gap-2">
                Online <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
              </span>
            </div>
            <div className="w-px h-8 bg-slate-100"></div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <Shield className="h-4 w-4 text-orange-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-300 tracking-widest leading-none mb-1">Secure</span>
                <span className="text-[10px] font-black text-slate-900 ">Data Protection</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-12">
          {/* Controls Column */}
          <div className="lg:col-span-4 space-y-10">
            <RecommendationEngine
              selectedActivity={selectedActivity}
              onActivityChange={(activity) => {
                setSelectedActivity(activity)
                setHasGenerated(false)
                setRecommendations([])
                setIsForwarded(false)
              }}
              onGenerateRecommendations={handleGenerateRecommendations}
              isGenerating={isGenerating}
            />

            <div className="card-premium p-10 bg-slate-900 border-none shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500 opacity-5 blur-[80px]"></div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20">
                    <Zap className="h-5 w-5 text-orange-500" />
                  </div>
                  <span className="text-[11px] font-black text-white tracking-[0.2em] ">Engine Optimization</span>
                </div>
                <p className="text-xs text-slate-400 font-medium leading-relaxed m-0">
                  Matching parameters are automatically optimized based on departmental history and individual employee growth.
                </p>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-orange-500 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-8">
            <RecommendationResults
              activity={selectedActivity}
              recommendations={recommendations}
              isLoading={isGenerating}
              error={generationError}
              hasGenerated={hasGenerated}
              onForwardToManager={handleForwardToManager}
              isForwarding={isForwarding}
              isForwarded={isForwarded}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RecommendationsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-6">
          <Cpu className="h-12 w-12 text-orange-500 animate-pulse" />
          <p className="text-[10px] font-black text-slate-400 tracking-widest animate-pulse">Loading AI Analysis...</p>
        </div>
      </div>
    }>
      <RecommendationsContent />
    </Suspense>
  )
}

