import { useState, useEffect } from "react"
import { useData } from "/lib/data-store"
import { toast } from "sonner"
import { Badge } from "/components/ui/badge"
import { cn } from "/lib/utils"
import { Loader2, RefreshCcw } from "lucide-react"
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle
} from "/components/ui/dialog"

export function SelfAssessmentDialog({ open, onOpenChange, employee }) {
    const { updateEmployee, settings } = useData()
    const [assessments, setAssessments] = useState([])
    const [saving, setSaving] = useState(false)

    // Reset state when dialog opens or employee changes
    useEffect(() => {
        if (open && employee) {
            setAssessments(
                employee.skills?.map(s => ({
                    skillId: s.skillId,
                    skillName: s.skillName || s.skill?.name || "Unknown",
                    score: s.proficiencyScore || s.score || 0,
                    originalScore: s.proficiencyScore || s.score || 0
                })) || []
            )
        }
    }, [open, employee])

    const calculateLevel = (score) => {
        const thresholds = settings?.skillLevelThresholds || {
            low: 25,
            medium: 50,
            high: 75,
            expert: 90
        }

        if (score >= thresholds.expert) return "expert"
        if (score >= thresholds.high) return "high"
        if (score >= thresholds.medium) return "medium"
        return "low"
    }

    const getSkillLevelStyle = (level) => {
        switch (level) {
            case "low": return "bg-rose-500/10 text-rose-500 border-none"
            case "medium": return "bg-amber-500/10 text-amber-500 border-none"
            case "high": return "bg-[#F28C1B]/10 text-[#F28C1B] border-none"
            case "expert": return "bg-emerald-500/10 text-emerald-500 border-none"
            default: return "bg-gray-100 text-gray-400 border-none"
        }
    }

    const handleScoreChange = (skillId, value) => {
        setAssessments(prev =>
            prev.map(a => a.skillId === skillId ? { ...a, score: Number(value) } : a)
        )
    }

    const handleSave = async () => {
        setSaving(true)
        // Build updated skills array
        const updatedSkills = employee.skills.map(s => {
            const assessment = assessments.find(a => a.skillId === s.skillId)
            if (assessment) {
                const newScore = assessment.score
                return {
                    ...s,
                    proficiencyScore: newScore,
                    score: newScore,
                    auto_eval: newScore,
                    etat: "submitted",
                    level: calculateLevel(newScore),
                    lastUpdated: new Date().toISOString()
                }
            }
            return s
        })

        updateEmployee(employee.id, { skills: updatedSkills })
        await new Promise(r => setTimeout(r, 1200)) // Artificial sync delay
        setSaving(false)
        toast.success("Proficiency Updated", {
            description: "Your skill levels have been updated successfully."
        })
        onOpenChange(false)
    }

    const getScoreColor = (score) => {
        if (score >= 80) return "text-emerald-500"
        if (score >= 60) return "text-[#F28C1B]"
        if (score >= 40) return "text-amber-500"
        return "text-rose-500"
    }

    const getDeltaInfo = (a) => {
        const delta = a.score - a.originalScore
        if (delta === 0) return null
        return {
            value: delta > 0 ? `+${delta}` : delta,
            className: delta > 0 ? "text-emerald-500" : "text-rose-500"
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl bg-white border-none rounded-[4px] p-0 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header - Fixed */}
                <div className="bg-[#222222] px-10 py-10 relative overflow-hidden group shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#F28C1B]/[0.05] rounded-full -mr-32 -mt-32 blur-[60px] animate-pulse"></div>
                    <DialogHeader className="relative z-10">
                        <p className="text-[9px] font-bold text-[#F28C1B] tracking-[0.4em] mb-3">Skill Assessment</p>
                        <DialogTitle className="text-3xl font-black text-white tracking-tighter ">
                            Update Skill Levels
                        </DialogTitle>
                        <DialogDescription className="text-[10px] text-gray-400 font-bold tracking-widest mt-2 leading-loose opacity-70">
                            Rate your current proficiency in each skill (0–100).
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-10 py-10">
                    <div className="space-y-8">
                        {assessments.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <p className="text-[10px] text-gray-400 tracking-widest font-black ">
                                    No skills found in your profile.
                                </p>
                            </div>
                        )}
                        {assessments.map((a) => {
                            const delta = getDeltaInfo(a)
                            return (
                                <div key={a.skillId} className="space-y-4 p-4 rounded-xl border border-slate-50 hover:border-slate-100 transition-all bg-slate-50/30">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-900 tracking-tight ">{a.skillName}</p>
                                            <Badge variant="outline" className={cn("text-[8px] font-bold tracking-widest", getSkillLevelStyle(calculateLevel(a.score)))}>
                                                {calculateLevel(a.score)}
                                            </Badge>
                                        </div>
                                        <div className="flex items-end gap-3 text-right">
                                            {delta && (
                                                <span className={cn("text-[10px] font-black tracking-widest mb-1", delta.className)}>
                                                    {delta.value}%
                                                </span>
                                            )}
                                            <span className={`text-2xl font-black tracking-tighter ${getScoreColor(a.score)}`}>
                                                {a.score}%
                                            </span>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        step={5}
                                        value={a.score}
                                        onChange={(e) => handleScoreChange(a.skillId, e.target.value)}
                                        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#F28C1B] bg-slate-200"
                                        style={{
                                            background: `linear-gradient(to right, #F28C1B ${a.score}%, #E2E8F0 ${a.score}%)`
                                        }}
                                    />
                                    <div className="flex justify-between text-[8px] font-bold text-slate-400 tracking-[0.2em] ">
                                        <span>Initial/Novice</span>
                                        <span>Operational</span>
                                        <span>Expert/Lead</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Footer - Fixed */}
                <DialogFooter className="px-10 py-8 border-t border-[#EEEEEE] flex gap-4 bg-[#F8FAFC]/50 shrink-0">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="flex-1 bg-transparent border border-[#EEEEEE] hover:bg-white text-gray-400 font-black py-5 px-8 rounded-[4px] tracking-widest text-[10px] transition-all "
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-[#222222] text-white font-black py-5 px-8 rounded-[4px] tracking-widest text-[10px] shadow-xl hover:bg-[#F28C1B] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 "
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin text-[#F28C1B]" />
                                <span>Updating...</span>
                            </>
                        ) : (
                            <>
                                <RefreshCcw className="h-4 w-4 text-[#F28C1B]" />
                                <span>Update Skills</span>
                            </>
                        )}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

