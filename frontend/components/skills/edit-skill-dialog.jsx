"use client"

import { useState, useEffect } from "react"
import { useData } from "/lib/data-store"
import { cn } from "/lib/utils"
import { toast } from "sonner"
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle
} from "/components/ui/dialog"
import { Input } from "/components/ui/input"
import { Label } from "/components/ui/label"
import { Textarea } from "/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "/components/ui/select"
import { Brain, Zap, BookOpen, Heart, Loader2, Save, X } from "lucide-react"

export function EditSkillDialog({ open, onOpenChange, skill }) {
    const { updateSkill } = useData()
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        category: "Programming",
        type: "technique",
        description: ""
    })

    useEffect(() => {
        if (skill) {
            setFormData({
                name: skill.name,
                category: skill.category,
                type: skill.type,
                description: skill.description
            })
        }
    }, [skill, open])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name || !formData.description) {
            toast.error("MISSING DATA", {
                description: "All neural parameters must be defined before synchronization."
            })
            return
        }

        setSaving(true)
        // Artificial delay for premium feel
        await new Promise(r => setTimeout(r, 1000))

        updateSkill(skill.id, formData)

        setSaving(false)
        onOpenChange(false)

        toast.success("NEURAL CONFIG UPDATED", {
            description: `Intelligence node "${formData.name.toUpperCase()}" has been re-calibrated.`
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl bg-white border-none rounded-[4px] p-0 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header - Fixed */}
                <div className="bg-[#222222] px-10 py-10 relative overflow-hidden group shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#F28C1B]/[0.05] rounded-full -mr-32 -mt-32 blur-[60px] animate-pulse"></div>
                    <DialogHeader className="relative z-10">
                        <p className="text-[9px] font-bold text-[#F28C1B] tracking-[0.4em] mb-3">Refinement Protocol</p>
                        <DialogTitle className="text-3xl font-black text-white tracking-tighter ">
                            Edit Neural Config
                        </DialogTitle>
                        <DialogDescription className="text-[10px] text-gray-400 font-bold tracking-widest mt-2 leading-loose opacity-70">
                            Re-calibrate the parameters and taxonomy for this capability entry.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <form id="edit-skill-form" onSubmit={handleSubmit} className="px-10 py-10 space-y-8">
                        <div className="space-y-3">
                            <Label className="text-[9px] font-black text-gray-400 tracking-widest ml-1">Node Identification</Label>
                            <Input
                                placeholder="e.g., QUANTUM LOGIC"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="h-14 bg-[#EEEEEE] border-none rounded-[4px] px-6 text-[11px] font-black text-[#222222] tracking-widest placeholder:text-gray-300 focus-visible:ring-1 focus-visible:ring-[#F28C1B] "
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="text-[9px] font-black text-gray-400 tracking-widest ml-1">Taxonomy Category</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                                >
                                    <SelectTrigger className="h-14 bg-[#EEEEEE] border-none rounded-[4px] px-6 text-[11px] font-black text-[#222222] tracking-widest focus:ring-1 focus:ring-[#F28C1B] ">
                                        <SelectValue placeholder="CATEGORY..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-[#EEEEEE] rounded-[4px] shadow-2xl">
                                        {["Programming", "Design", "Management", "Communication", "Data", "Security", "Soft Skills"].map(cat => (
                                            <SelectItem key={cat} value={cat} className="text-[10px] font-bold tracking-widest py-3">
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[9px] font-black text-gray-400 tracking-widest ml-1">Energy Profile (Type)</Label>
                                <div className="flex gap-2">
                                    {[
                                        { id: 'technique', icon: BookOpen, label: 'Technical' },
                                        { id: 'opérationnelle', icon: Brain, label: 'Operational' },
                                        { id: 'comportementale', icon: Heart, label: 'Soft Skills' },
                                        { id: 'transverse', icon: Zap, label: 'Transversal' }
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: type.id })}
                                            className={cn(
                                                "flex-1 h-14 rounded-[4px] border-2 transition-all flex items-center justify-center gap-2 group/btn",
                                                formData.type === type.id
                                                    ? "bg-[#222222] border-[#222222] text-white shadow-lg shadow-[#222222]/10"
                                                    : "bg-white border-[#EEEEEE] text-gray-300 hover:border-[#F28C1B]/30"
                                            )}
                                        >
                                            <type.icon className={cn("h-4 w-4", formData.type === type.id ? "text-[#F28C1B]" : "group-hover/btn:text-[#F28C1B]")} />
                                            <span className="text-[10px] font-black ">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[9px] font-black text-gray-400 tracking-widest ml-1">Technical Briefing (Description)</Label>
                            <Textarea
                                placeholder="PROVIDE OPERATIONAL CONTEXT..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="min-h-[160px] bg-[#EEEEEE] border-none rounded-[4px] p-6 text-[11px] font-bold text-[#222222] tracking-widest placeholder:text-gray-300 focus-visible:ring-1 focus-visible:ring-[#F28C1B] leading-relaxed"
                            />
                        </div>
                    </form>
                </div>

                {/* Footer - Vertical Stacked */}
                <DialogFooter className="flex flex-col gap-3 px-10 py-10 border-t border-[#EEEEEE] bg-[#F8FAFC]/50 shrink-0">
                    <button
                        form="edit-skill-form"
                        type="submit"
                        disabled={saving}
                        className="w-full bg-[#222222] text-white font-black py-5 px-8 rounded-[12px] tracking-[0.4em] text-[10px] shadow-xl hover:bg-[#F28C1B] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 "
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin text-[#F28C1B]" />
                                <span>Syncing...</span>
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 text-[#F28C1B]" />
                                <span>Save Changes</span>
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="w-full bg-transparent border border-[#EEEEEE] hover:bg-white text-gray-400 font-black py-5 px-8 rounded-[12px] tracking-[0.4em] text-[10px] transition-all flex items-center justify-center gap-4"
                    >
                        <X className="w-4 h-4" />
                        Cancel Mission
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

