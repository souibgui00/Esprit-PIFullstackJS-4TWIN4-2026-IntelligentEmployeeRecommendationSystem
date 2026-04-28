"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useData } from "@/lib/data-store"
import {
  Brain,
  Sparkles,
  Loader2,
  Settings2,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
  Shield,
  Cpu,
  Sliders,
  Users,
  Calendar,
  Award,
  TrendingUp,
  Filter,
  Search
} from "lucide-react"
import { cn } from "@/lib/utils"

export function RecommendationEngine({
  selectedActivity,
  onActivityChange,
  onGenerateRecommendations,
  isGenerating,
}) {
  const { activities } = useData()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [customDescription, setCustomDescription] = useState("")
  const [seatsToFill, setSeatsToFill] = useState([5])
  const [priorityWeight, setPriorityWeight] = useState([50])
  const [experienceFilter, setExperienceFilter] = useState([3])
  const [skillPriority, setSkillPriority] = useState("balanced")

  // Debug log to see what's coming from the store
  console.log("[RecommendationEngine] All activities from store:", activities)
  if (activities.length > 0) {
    console.log("[RecommendationEngine] Sample Activity:", activities[0])
  }

  // Show all activities. We found out that ALL 51 activities in the database are currently marked as 'completed',
  // which is why any filter excluding 'completed' resulted in an empty dropdown.
  const activeActivities = activities || []

  console.log("[RecommendationEngine] Filtered activeActivities:", activeActivities)

  return (
    <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
      <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">How to find people</CardTitle>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Set your rules</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400"
            title="More Options"
          >
            <Sliders className="w-5 h-5" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-6">
        {/* Activity Selection */}
        <div className="space-y-3">
          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Who needs training?</Label>
          <Select value={selectedActivity?.id || selectedActivity?._id || ""} onValueChange={(value) => {
            const activity = activities.find(a => (a.id || a._id) === value)
            onActivityChange(activity)
          }}>
            <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl px-4 font-medium">
              <SelectValue placeholder="Pick a training session..." />
            </SelectTrigger>
            <SelectContent>
              {activeActivities.map((activity) => (
                <SelectItem key={activity.id || activity._id} value={activity.id || activity._id}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center text-primary">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{activity.title}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activity.type}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Parameters */}
        <div className="space-y-6 pt-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-700">Number of people</Label>
              <span className="text-sm font-black text-primary bg-primary/5 px-3 py-1 rounded-lg">{seatsToFill[0]}</span>
            </div>
            <div className="px-1">
              <Slider
                value={seatsToFill}
                onValueChange={setSeatsToFill}
                max={50}
                min={1}
                step={1}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-700">How important is this?</Label>
              <span className="text-sm font-black text-primary bg-primary/5 px-3 py-1 rounded-lg">{priorityWeight[0]}%</span>
            </div>
            <div className="px-1">
              <Slider
                value={priorityWeight}
                onValueChange={setPriorityWeight}
                max={100}
                min={0}
                step={5}
              />
            </div>
          </div>
        </div>

        {/* Advanced Section */}
        {showAdvanced && (
          <div className="space-y-6 pt-6 mt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-4">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Minimum Years of Work</Label>
              <div className="px-1">
                <Slider
                  value={experienceFilter}
                  onValueChange={setExperienceFilter}
                  max={15}
                  min={0}
                  step={1}
                />
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] font-bold text-slate-400">0 Yrs</span>
                  <span className="text-[10px] font-bold text-primary">{experienceFilter[0]} Years</span>
                  <span className="text-[10px] font-bold text-slate-400">15+ Yrs</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Find based on...</Label>
              <Select value={skillPriority} onValueChange={setSkillPriority}>
                <SelectTrigger className="h-12 bg-white border-slate-200 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="skills">Best Skills First</SelectItem>
                  <SelectItem value="experience">Most Experience First</SelectItem>
                  <SelectItem value="growth">Focus on Growing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Anything extra?</Label>
              <Textarea
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Write any extra rules here..."
                className="min-h-[80px] bg-slate-50 border-slate-200 rounded-xl p-4 text-sm resize-none"
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={() => onGenerateRecommendations({
            seatsToFill: seatsToFill[0],
            priorityWeight: priorityWeight[0],
            experienceFilter: experienceFilter[0],
            skillPriority,
            customDescription
          })}
          disabled={!selectedActivity || isGenerating}
          className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-3"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              Searching for the best people...
            </>
          ) : (
            <>
              <Brain className="w-5 h-5 mr-3" />
              Find Best Matches
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
