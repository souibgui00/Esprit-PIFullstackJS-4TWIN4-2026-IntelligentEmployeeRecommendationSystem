"use client"

import React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useData } from "@/lib/data-store"
import { cn } from "@/lib/utils"

import { toast } from "sonner"



function getSkillLevelFromScore(score) {
  if (score <= 25) return "low"
  if (score <= 50) return "medium"
  if (score <= 75) return "high"
  return "expert"
}

function getLevelColor(level) {
  switch (level) {
    case "low": return "bg-rose-500/10 text-rose-500 border-none"
    case "medium": return "bg-amber-500/10 text-amber-500 border-none"
    case "high": return "bg-[#F28C1B]/10 text-[#F28C1B] border-none"
    case "expert": return "bg-emerald-500/10 text-emerald-500 border-none"
    default: return "bg-gray-100 text-gray-400 border-none"
  }
}

export function SelfAssessmentDialog({ open, onOpenChange, employee }) {
  const { addEvaluation, skills: allSkills } = useData()

  const [skillScores, setSkillScores] = useState(
    employee.skills.reduce((acc, skill) => ({ ...acc, [skill.skillId]: skill.proficiencyScore || skill.score || 0 }), {})
  )
  const [skillComments, setSkillComments] = useState({})
  const [overallFeedback, setOverallFeedback] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()

    const skillEvaluations = employee.skills.map((skill) => ({
      skillId: skill.skillId,
      previousScore: skill.proficiencyScore || skill.score || 0,
      newScore: skillScores[skill.skillId] || skill.proficiencyScore || skill.score || 0,
      previousLevel: skill.level,
      newLevel: getSkillLevelFromScore(skillScores[skill.skillId] || skill.proficiencyScore || skill.score || 0),
      comments: skillComments[skill.skillId] || "",
    }))

    const avgScore = skillEvaluations.reduce((sum, e) => sum + e.newScore, 0) / skillEvaluations.length

    addEvaluation({
      employeeId: employee.id,
      activityId: "",
      evaluatorId: employee.userId || employee.id,
      evaluationType: "self",
      date: new Date(),
      skillEvaluations,
      overallScore: Math.round(avgScore),
      feedback: overallFeedback,
      status: "completed",
    })

    toast.success("Self-assessment submitted successfully")
    onOpenChange(false)
  }

  const handleScoreChange = (skillId, value) => {
    setSkillScores({ ...skillScores, [skillId]: value[0] })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white border-none rounded-[4px] p-0 shadow-2xl">
        <DialogHeader className="p-8 border-b border-[#EEEEEE]">
          <DialogTitle className="text-2xl font-bold text-[#222222] tracking-tighter">Self-Calibration Matrix</DialogTitle>
          <DialogDescription className="text-xs font-bold text-gray-400 tracking-widest mt-2 leading-relaxed">
            Assess your current neural capability nodes. <span className="text-[#F28C1B]">Calibrate honestly</span> for optimal growth indexing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="space-y-4">
            {employee.skills.map((skill) => {
              const skillInfo = allSkills.find((s) => s.id === skill.skillId)
              const currentScore = skillScores[skill.skillId] || skill.proficiencyScore || skill.score || 0
              const newLevel = getSkillLevelFromScore(currentScore)
              const skillName = skillInfo?.name || skill.skillName || "UNNAMED_NODE"

              return (
                <Card key={skill.skillId} className="border border-[#EEEEEE] shadow-none rounded-[4px] bg-white group hover:border-[#F28C1B]/30 transition-all overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-[#F28C1B]/20 rounded-full"></div>
                        <div>
                          <span className="text-sm font-bold text-[#222222] tracking-tighter">{skillName}</span>
                          {skillInfo && (
                            <span className="ml-2 text-[10px] font-bold text-gray-400 tracking-widest">
                              [{skillInfo.type}]
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5 rounded-[2px]", getLevelColor(skill.level))}>
                          {skill.level}
                        </Badge>
                        <span className="text-gray-300 font-bold">→</span>
                        <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5 rounded-[2px]", getLevelColor(newLevel))}>
                          {newLevel}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-6">
                        <Slider
                          value={[currentScore]}
                          onValueChange={(value) => handleScoreChange(skill.skillId, value)}
                          min={0}
                          max={100}
                          step={5}
                          className="flex-1"
                        />
                        <span className="min-w-[40px] text-right font-bold text-[#F28C1B] text-lg tracking-tighter">{currentScore}%</span>
                      </div>

                      <Textarea
                        placeholder="PROVIDE OPERATIONAL COMMENTARY..."
                        value={skillComments[skill.skillId] || ""}
                        onChange={(e) => setSkillComments({ ...skillComments, [skill.skillId]: e.target.value })}
                        rows={1}
                        className="bg-[#EEEEEE] border-none rounded-[4px] py-3 text-[10px] font-bold text-[#222222] tracking-widest placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-[#F28C1B] min-h-[40px] resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="space-y-3 pt-4 border-t border-[#EEEEEE]">
            <Label htmlFor="overallFeedback" className="text-[10px] font-bold text-gray-400 tracking-widest">Final Synthesis</Label>
            <Textarea
              id="overallFeedback"
              value={overallFeedback}
              onChange={(e) => setOverallFeedback(e.target.value)}
              placeholder="DOCUMENT ADDITIONAL FEEDBACK, GROWTH OBJECTIVES, OR RESOURCE REQUIREMENTS..."
              rows={4}
              className="bg-[#EEEEEE] border-none rounded-[4px] py-4 text-sm font-bold text-[#222222] placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-[#F28C1B]"
            />
          </div>

          <DialogFooter className="gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="px-8 font-bold text-gray-400 hover:text-[#222222] tracking-widest text-[10px]"
            >
              Abort Evaluation
            </Button>
            <Button
              type="submit"
              className="bg-[#F28C1B] hover:bg-[#D97812] text-white font-bold py-6 px-10 rounded-[4px] tracking-widest text-[10px] shadow-md transition-all active:scale-95"
            >
              Commit Calibration
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

