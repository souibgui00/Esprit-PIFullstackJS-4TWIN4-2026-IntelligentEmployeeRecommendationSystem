"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "react-router-dom"
import { DashboardHeader } from "/components/dashboard/header"
import { RecommendationEngine } from "/components/recommendations/recommendation-engine"
import RecommendationResults from "/components/recommendations/recommendation-results"
import { useData } from "/lib/data-store"
import { api } from "/lib/api"
import { toast } from "sonner"
import { Zap, Shield, Cpu, UserCheck } from "lucide-react"

function RecommendationsContent() {
  const [searchParams] = useSearchParams()
  const activityId = searchParams.get("activity")
  const { activities: storeActivities, employees } = useData()

  const [selectedActivity, setSelectedActivity] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState(null)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [isForwarding, setIsForwarding] = useState(false)
  const [isForwarded, setIsForwarded] = useState(false)

  // Set activity from URL param or store
  useEffect(() => {
    if (activityId) {
      const activity = storeActivities.find((a) => (a.id || a._id) === activityId) || null
      setSelectedActivity(activity)
    }
  }, [activityId, storeActivities])

  const handleGenerateRecommendations = async (options = {}) => {
    if (!selectedActivity) return

    setIsGenerating(true)
    setGenerationError(null)
    setHasGenerated(false)
    setIsForwarded(false)

    try {
      const selectedActivityId = selectedActivity.id || selectedActivity._id
      const response = await api.get(`/activities/${selectedActivityId}/recommendations`)
      const candidates = Array.isArray(response?.candidates) ? response.candidates : []

      // 1. Initial Mapping
      let mappedResults = candidates.map((candidate) => {
        const normalizedScore = Math.max(0, Math.min(1, Number(candidate.score || 0)))
        return {
          id: candidate.userId,
          name: candidate.name,
          role: candidate.role,
          overallScore: Math.round(normalizedScore * 100),
          gap: Array.isArray(candidate.gap) ? candidate.gap : [],
          recommendation_reason: candidate.recommendation_reason || "",
        }
      })

      // 2. Post-Filtering & Re-Ranking based on Engine Options
      if (options) {
        // Apply Minimum Experience Filter
        if (options.experienceFilter > 0) {
          mappedResults = mappedResults.filter((rec) => {
             const emp = employees?.find((e) => (e.id || e._id) === rec.id)
             const years = emp?.yearsOfExperience || 0
             return years >= options.experienceFilter
          })
        }

        // Apply Logic Priorities
        mappedResults = mappedResults.map((rec) => {
            const emp = employees?.find((e) => (e.id || e._id) === rec.id)
            let adjustedScore = rec.overallScore
            const gapCount = rec.gap.length

            if (options.skillPriority === 'skills') {
                if (gapCount === 0) adjustedScore += 15
                else adjustedScore -= (gapCount * 5)
            } else if (options.skillPriority === 'experience') {
                const years = emp?.yearsOfExperience || 0
                if (years > 5) adjustedScore += 10
                if (years > 10) adjustedScore += 10
            } else if (options.skillPriority === 'growth') {
                if (gapCount > 0) adjustedScore += (gapCount * 8)
            }

            // Apply priority weights globally if we want to scale expectations
            if (options.priorityWeight > 0) {
               // A high priority weight gives a small baseline bump to ensure high numbers get pulled up faster
               adjustedScore += (options.priorityWeight * 0.1)
            }

            adjustedScore = Math.max(0, Math.min(100, Math.round(adjustedScore)))
            return { ...rec, overallScore: adjustedScore }
        })

        // Sort Highest to Lowest
        mappedResults.sort((a, b) => b.overallScore - a.overallScore)

        // Trim to "Seats To Fill" limit
        if (options.seatsToFill > 0) {
            mappedResults = mappedResults.slice(0, options.seatsToFill)
        }
      }

      setRecommendations(mappedResults)
      setHasGenerated(true)

      toast.success("Analysis Complete", {
        description: `${mappedResults.length} candidates optimally ranked for ${selectedActivity.title}.`
      })
    } catch (error) {
      const message = error?.message || "Unable to generate recommendations."
      setGenerationError(message)
      setRecommendations([])
      toast.error("Recommendation Failed", {
        description: message,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleForwardToManager = async (employeeIds, selectedRecs) => {
    if (!selectedActivity) {
      toast.error("Error", { description: "Please select a training session first" })
      return
    }

    const selectedActivityId = selectedActivity.id || selectedActivity._id
    if (!selectedActivityId) {
      toast.error("Error", { description: "Invalid session ID. Please reselect the activity." })
      return
    }

    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      toast.error("Selection Required", { description: "Please select at least one person." })
      return
    }

    setIsForwarding(true)

    try {
      const avgScore = recommendations.length > 0
        ? Math.round(recommendations.filter(r => employeeIds.includes(r.id)).reduce((acc, r) => acc + (r.overallScore || 0), 0) / employeeIds.length)
        : 0;

      const payload = {
        candidateIds: employeeIds,
        activityId: selectedActivityId,
        aiScore: avgScore,
        reason: 'Suggested training based on skill match analysis.'
      }

      const response = await api.post('/assignments/forward-to-department-manager', payload)

      if (response && typeof response.totalForwarded === 'number') {
        setIsForwarded(true)
        const totalForwarded = response.totalForwarded || 0
        const skipped = response.skipped || 0
        const skippedDetails = response.skippedDetails || []

        if (totalForwarded > 0) {
            toast.success("Suggestions Sent!", {
                description: `Successfully sent ${totalForwarded} people to their managers.${skipped > 0 ? ` Note: ${skipped} candidates were skipped.` : ''}`
            })
        }

        if (skipped > 0) {
            skippedDetails.forEach(skip => {
                const empName = selectedRecs.find(r => r.id === skip.candidateId)?.name || 'Unknown Candidate';
                toast.warning(`Candidate Skipped: ${empName}`, {
                   description: skip.reason
                });
            });
        }
      } else {
        throw new Error('Could not connect to the server.')
      }
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Failed to send suggestions'
      toast.error("Sending Failed", {
        description: message
      })
      console.error('Forward error:', error)
    } finally {
      setIsForwarding(false)
    }
  }

  return (
    <div className="flex flex-col bg-[#F8FAFC] min-h-screen">
      <DashboardHeader title="People Matchmaker" description="AI Help: Finding the right people for every training session." />

      <div className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">

        {/* Global Strategy Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Best Matches</h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Helping your team grow by matching them with the right training</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Config Column */}
          <div className="lg:col-span-4 space-y-8">
            <RecommendationEngine
              selectedActivity={selectedActivity}
              onActivityChange={(activity) => {
                setSelectedActivity(activity)
                setHasGenerated(false)
                setRecommendations([])
                setGenerationError(null)
                setIsForwarded(false)
              }}
              onGenerateRecommendations={handleGenerateRecommendations}
              isGenerating={isGenerating}
            />

            <div className="bg-slate-950 rounded-3xl p-8 relative overflow-hidden group shadow-2xl border border-white/5">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary/10 rounded-full blur-[80px]"></div>
              <div className="relative z-10 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">How it works</span>
                </div>
                <div className="space-y-3">
                    <p className="text-[11px] text-slate-400 font-bold leading-relaxed uppercase tracking-wider">
                        The AI looks at these factors:
                    </p>
                    <ul className="space-y-2">
                       <li className="flex items-baseline gap-2 text-[10px] text-slate-200 font-bold uppercase tracking-widest">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div> Skill Matching
                       </li>
                       <li className="flex items-baseline gap-2 text-[10px] text-slate-200 font-bold uppercase tracking-widest">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div> How fast they learn
                       </li>
                       <li className="flex items-baseline gap-2 text-[10px] text-slate-200 font-bold uppercase tracking-widest">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div> Long-term potential
                       </li>
                    </ul>
                </div>
                <div className="pt-2">
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full w-4/5 bg-gradient-to-r from-primary/40 to-primary animate-pulse shadow-[0_0_20px_rgba(242,140,27,0.4)]"></div>
                    </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-8 space-y-6">
            {hasGenerated && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top duration-500">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-none">Destination Managers</h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Auto-routed by each employee department</p>
                  </div>
                </div>
              </div>
            )}

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

export default function AdminRecommendationsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div>
            <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">Running Talent Engine...</p>
        </div>
      </div>
    }>
      <RecommendationsContent />
    </Suspense>
  )
}
