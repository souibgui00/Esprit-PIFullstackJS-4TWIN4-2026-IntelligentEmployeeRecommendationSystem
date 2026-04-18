"use client"

import React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "/components/ui/dialog"
import { Label } from "/components/ui/label"
import { Slider } from "/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "/components/ui/select"
import { useData } from "/lib/data-store"
import { toast } from "sonner"
import { Sparkles, Brain, Loader2, X } from "lucide-react"
import { cn } from "/lib/utils"

export function EmployeeSkillDialog({
  open,
  onOpenChange,
  employee,
  employeeSkill,
  mode
}) {
  const { skills, updateEmployeeSkill, addEmployeeSkill } = useData()
  const [selectedSkillId, setSelectedSkillId] = useState("")
  const [level, setLevel] = useState("medium")
  const [score, setScore] = useState(50)
  const [saving, setSaving] = useState(false)

  const availableSkills = skills.filter(
    s => !employee.skills.some(es => es.skillId === s.id)
  )

  useEffect(() => {
    if (employeeSkill && mode === "edit") {
      setSelectedSkillId(employeeSkill.skillId)
      setLevel(employeeSkill.level)
      setScore(employeeSkill.score)
    } else {
      setSelectedSkillId("")
      setLevel("medium")
      setScore(50)
    }
  }, [employeeSkill, mode, open])

  // Auto-determine level based on score
  useEffect(() => {
    if (score < 30) setLevel("low")
    else if (score < 60) setLevel("medium")
    else if (score < 85) setLevel("high")
    else setLevel("expert")
  }, [score])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (mode === "add" && !selectedSkillId) {
      toast.error("MISSING DATA", { description: "Please select a target capability." })
      return
    }

    setSaving(true)
    await new Promise(r => setTimeout(r, 800))

    if (mode === "edit" && employeeSkill) {
      updateEmployeeSkill(employee.id, employeeSkill.skillId, {
        level,
        score,
      })
      toast.success("MATRIX SYNCHRONIZED", {
        description: `Proficiency update for ${employeeSkill.skill.name} completed.`
      })
    } else if (mode === "add") {
      const skill = skills.find(s => s.id === selectedSkillId)
      if (skill) {
        addEmployeeSkill(employee.id, skill, level, score)
        toast.success("CAPABILITY INJECTED", {
          description: `New neural node ${skill.name} added to the asset profile.`
        })
      }
    }

    setSaving(false)
    onOpenChange(false)
  }

  const getLevelDisplay = (s) => {
    if (s < 30) return "Initial Phase"
    if (s < 60) return "Operational"
    if (s < 85) return "Professional"
    return "Mastery/Expert"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[450px] bg-white border-none rounded-[4px] p-0 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header - Fixed */}
        <div className="bg-[#222222] px-10 py-10 relative overflow-hidden group shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F28C1B]/[0.05] rounded-full -mr-32 -mt-32 blur-[60px] animate-pulse"></div>
          <DialogHeader className="relative z-10 text-left">
            <p className="text-[9px] font-bold text-[#F28C1B] tracking-[0.4em] mb-3">Calibration Protocol</p>
            <DialogTitle className="text-3xl font-black text-white tracking-tighter ">
              {mode === "add" ? "Inject Skill" : "Update Matrix"}
            </DialogTitle>
            <DialogDescription className="text-[10px] text-gray-400 font-bold tracking-widest mt-2 leading-loose opacity-70">
              {mode === "add"
                ? `Inject new neural capability for ${employee.name.split(' ')[0]}.`
                : `Sync ${employeeSkill?.skillName || 'skill'} proficiency parameters.`}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form id="skill-calibration-form" onSubmit={handleSubmit} className="p-10 space-y-8">
            <div className="grid gap-8">
              {mode === "add" && (
                <div className="grid gap-3">
                  <Label htmlFor="skill" className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Target Capability *</Label>
                  <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
                    <SelectTrigger className="bg-[#EEEEEE] border-none rounded-[4px] h-12 font-bold text-[#222222] focus:ring-1 focus:ring-[#F28C1B] ">
                      <SelectValue placeholder="Protocol..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 rounded-[4px] shadow-2xl">
                      {availableSkills.filter(s => s.id).map((skill) => (
                        <SelectItem key={skill.id} value={skill.id} className="font-bold text-[10px] ">
                          {skill.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableSkills.length === 0 && (
                    <p className="text-[9px] text-rose-500 font-black tracking-widest mt-1">
                      Matrix saturation reached. No available nodes.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <Label className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Proficiency Score</Label>
                  <span className="text-3xl font-black text-[#F28C1B] tracking-tighter">{score}%</span>
                </div>
                <Slider
                  value={[score]}
                  onValueChange={(value) => setScore(value[0])}
                  max={100}
                  min={0}
                  step={1}
                  className="py-4"
                />
                <div className="p-6 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 tracking-widest ">Status:</span>
                  <span className="text-[11px] font-black text-[#222222] tracking-widest ">{getLevelDisplay(score)}</span>
                </div>
              </div>

              <div className="p-6 rounded-xl border-2 border-dashed border-slate-100 space-y-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-[#F28C1B]" />
                  <p className="text-[10px] font-black text-[#222222] tracking-widest ">Capability Thresholds</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { l: 'LOW', range: '0-29%', c: 'bg-rose-500' },
                    { l: 'MED', range: '30-59%', c: 'bg-amber-500' },
                    { l: 'HIGH', range: '60-84%', c: 'bg-[#F28C1B]' },
                    { l: 'EXP', range: '85-100%', c: 'bg-emerald-500' }
                  ].map(t => (
                    <div key={t.l} className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full", t.c)}></div>
                      <span className="text-[9px] font-bold text-slate-500 tracking-tighter">{t.l}: {t.range}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer - Vertical Stacked */}
        <DialogFooter className="flex flex-col gap-3 bg-[#F8FAFC]/50 p-10 border-t border-[#EEEEEE] shrink-0">
          <button
            form="skill-calibration-form"
            type="submit"
            disabled={saving || (mode === "add" && !selectedSkillId)}
            className="w-full bg-[#222222] text-white font-black py-5 px-8 rounded-[12px] tracking-[0.4em] text-[10px] shadow-xl hover:bg-[#F28C1B] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 "
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#F28C1B]" />
                <span>Calibrating...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-[#F28C1B]" />
                <span>{mode === "add" ? "Inject Node" : "Sync Profile"}</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full bg-transparent border border-[#EEEEEE] hover:bg-white text-gray-400 font-black py-5 px-8 rounded-[12px] tracking-[0.4em] text-[10px] transition-all flex items-center justify-center gap-4"
          >
            <X className="w-4 h-4" />
            Abort Mission
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

