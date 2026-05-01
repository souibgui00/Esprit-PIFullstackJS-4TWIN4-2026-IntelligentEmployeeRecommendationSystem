"use client"

import { useState, useEffect } from "react"
import { useData } from "@/lib/data-store"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Trophy,
  TrendingUp,
  Target,
  Briefcase,
  Sparkles,
  CheckCircle2,
  Forward,
  Loader2,
  Check,
  Zap,
  Cpu,
  ShieldCheck,
  ChevronRight,
  Info,
  Activity,
  Brain,
  Star,
  Award,
  Flame,
  Rocket,
  User,
  Building,
  Calendar,
  BarChart3,
  Lightbulb,
  Users,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"

function ScoreCircle({ score, size = 60, strokeWidth = 5 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (score / 100) * circumference

  const getColor = (score) => {
    if (score >= 90) return "#22c55e"
    if (score >= 75) return "#3b82f6"
    if (score >= 60) return "#f97316"
    return "#ef4444"
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#f1f5f9" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={getColor(score)} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" className="transition-all duration-1000"
        />
      </svg>
      <span className="absolute text-xs font-black text-slate-900">{score}%</span>
    </div>
  )
}

export default function RecommendationResults({
  activity,
  recommendations: initialRecommendations,
  isLoading,
  error,
  hasGenerated,
  onForwardToManager,
  isForwarding,
  isForwarded
}) {
  const { skills } = useData()
  const [recommendations, setRecommendations] = useState(initialRecommendations || [])
  const [selectedEmployees, setSelectedEmployees] = useState([])

  useEffect(() => {
    setRecommendations(initialRecommendations || [])
  }, [initialRecommendations])

  useEffect(() => {
    setSelectedEmployees([])
  }, [activity?.id, activity?._id])

  useEffect(() => {
    if (isForwarded) setSelectedEmployees([])
  }, [isForwarded])

  const handleEmployeeToggle = (employeeId) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border p-20 flex flex-col items-center justify-center gap-6 shadow-sm">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Looking at the team...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border p-20 flex flex-col items-center justify-center gap-6 shadow-sm">
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-400">
          <X className="w-8 h-8" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-900">Something went wrong</h3>
          <p className="text-sm text-slate-500 mt-2">{error}</p>
        </div>
      </div>
    )
  }

  if (!activity) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-20 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
          <Target className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Find the right people</h3>
          <p className="text-sm text-slate-500">Pick a session from the list on the left.</p>
        </div>
      </div>
    )
  }

  if (hasGenerated && recommendations.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-20 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
          <Users className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">No matches found</h3>
          <p className="text-sm text-slate-500">We couldn't find anyone for this session yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Best Match</p>
            <h4 className="text-xl font-bold text-slate-900">{recommendations[0]?.overallScore || 0}% Score</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Found</p>
            <h4 className="text-xl font-bold text-slate-900">{recommendations.length} People</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
            <Rocket className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">High Potential</p>
            <h4 className="text-xl font-bold text-slate-900">{recommendations.filter(r => (r.overallScore || 0) > 75).length} People</h4>
          </div>
        </div>
      </div>

      {/* Main List */}
      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 p-8 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Suggested Team Members</CardTitle>
            <p className="text-xs text-slate-500 mt-1 font-medium">The best people for this session.</p>
          </div>
          {selectedEmployees.length > 0 && (
            <Badge className="bg-primary text-white font-bold h-7 px-4 rounded-lg">
              {selectedEmployees.length} SELECTED
            </Badge>
          )}
        </CardHeader>

        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
          {recommendations.map((rec) => (
            <div key={rec.id} className={cn(
              "p-8 transition-colors hover:bg-slate-50/50 group",
              selectedEmployees.includes(rec.id) && "bg-primary/5"
            )}>
              <div className="flex items-start gap-6">
                <Checkbox
                  checked={selectedEmployees.includes(rec.id)}
                  onCheckedChange={() => handleEmployeeToggle(rec.id)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border shadow-sm">
                        <AvatarImage src={rec.avatar} />
                        <AvatarFallback>{rec.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold text-slate-900 leading-none">{rec.name}</h4>
                        <p className="text-xs text-slate-500 mt-1.5 font-medium">{rec.role || "EMPLOYEE"}</p>
                      </div>
                    </div>
                    <ScoreCircle score={rec.overallScore || 0} />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Match</p>
                      <p className="text-sm font-bold text-slate-700">{rec.overallScore || 0}%</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Job</p>
                      <p className="text-sm font-bold text-slate-700">{rec.role || "EMPLOYEE"}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Missing</p>
                      <p className="text-sm font-bold text-slate-700">{Array.isArray(rec.skillGaps || rec.gap) ? (rec.skillGaps || rec.gap).length : 0} Skills</p>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-3 min-h-[24px]">
                      {rec.recommendation_reason && (
                        <div className="flex items-start gap-2 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                          <Brain className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                          <p className="text-sm font-medium text-slate-700 leading-snug">{rec.recommendation_reason}</p>
                        </div>
                      )}
                      <div className="flex items-start gap-2 text-slate-400">
                        <Info className="h-4 w-4 mt-0.5" />
                      {Array.isArray(rec.skillGaps || rec.gap) && (rec.skillGaps || rec.gap).length > 0 ? (
                        <div className="text-sm font-medium text-slate-500 space-y-2">
                          <p className="font-bold text-slate-600">Needs to learn:</p>
                          <ul className="list-disc pl-4 marker:text-slate-300 space-y-1">
                            {(rec.skillGaps || rec.gap).map((g, idx) => {
                               const actualSkill = skills?.find(s => s.id === g.skillId || s._id === g.skillId);
                               const sName = actualSkill?.name || g.skillName || g.skillId || "Unknown";
                               return (
                                 <li key={idx} className="flex flex-col">
                                   <span className="font-medium text-slate-800">{sName}</span>
                                   {g.gap === 'level_mismatch' && (
                                     <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">Target Level: {g.requiredLevel}</span>
                                   )}
                                 </li>
                               );
                            })}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-emerald-600">This person has everything needed!</p>
                      )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold tracking-widest uppercase border-slate-200">
                      {(rec.overallScore || 0) > 85 ? "Excellent Match" : (rec.overallScore || 0) > 70 ? "Good Fit" : "Recommended"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!isForwarded && (
          <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-xs uppercase tracking-widest h-12 shadow-lg shadow-primary/10"
              onClick={() => onForwardToManager(selectedEmployees, recommendations)}
              disabled={selectedEmployees.length === 0 || isForwarding}
            >
              {isForwarding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Forward className="h-4 w-4 mr-2" />}
              Send chosen people to managers ({selectedEmployees.length})
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-xl font-bold text-xs uppercase tracking-widest h-12"
              onClick={() => onForwardToManager(recommendations.map(r => r.id), recommendations)}
              disabled={isForwarding}
            >
              Send all suggestions
            </Button>
          </div>
        )}

        {isForwarded && (
          <div className="p-8 bg-emerald-50 border-t border-emerald-100 flex items-center justify-center gap-3 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-bold text-xs uppercase tracking-widest">Sent to managers successfully!</span>
          </div>
        )}
      </Card>
    </div>
  )
}
