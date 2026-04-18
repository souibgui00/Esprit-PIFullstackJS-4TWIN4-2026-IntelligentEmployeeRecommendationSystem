"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { skillSchema } from "@/lib/schemas"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useData } from "@/lib/data-store"
import { toast } from "sonner"
import { Loader2, ArrowLeft, LayoutGrid, BookOpen, Brain, Heart, Database, Layers, ShieldCheck, Sparkles } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

export function SkillForm({ skill, mode = "create" }) {
  const { addSkill, updateSkill, departments } = useData()
  const { user } = useAuth()
  const navigate = useNavigate()
  const rolePrefix = user?.role?.toLowerCase() === "hr" ? "/hr" : "/admin"

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      name: skill?.name || "",
      category: skill?.category || "",
      type: skill?.type || "technique",
      etat: skill?.etat || "draft",
      description: skill?.description || "",
      auto_eval: skill?.auto_eval || 0,
      hierarchie_eval: skill?.hierarchie_eval || 0,
    },
  })

  const selectedType = watch("type")
  const selectedStatus = watch("etat")
  const selectedCategory = watch("category")

  const onSubmit = async (data) => {
    try {
      // Logic for type mapping if needed (already aligned in schema now)
      if (mode === "create") {
        await addSkill(data)
        toast.success("Skill Added", { description: `"${data.name}" has been established.` })
      } else {
        await updateSkill(skill.id || skill._id, data)
        toast.success("Skill Updated", { description: `"${data.name}" parameters modified.` })
      }
      navigate(`${rolePrefix}/skills`)
    } catch (error) {
      toast.error("Process Failed", { description: error.message || "Please check your inputs." })
    }
  }

  return (
    <div className="max-w-5xl mx-auto w-full space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-3 text-[10px] font-black tracking-widest uppercase text-slate-400 p-4 hover:text-slate-900 transition-all bg-white border-2 border-slate-50 rounded-2xl shadow-premium group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </button>
      </div>

      <div className="bg-white border-2 border-slate-50 rounded-[3rem] shadow-mega overflow-hidden relative">
        <div className="bg-slate-950 px-16 py-16 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse"></div>
            <div className="relative z-10 flex items-center gap-8">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-3xl rounded-[2rem] flex items-center justify-center border-2 border-white/10 shadow-2xl">
                    <Database className="w-10 h-10 text-primary" />
                </div>
                <div>
                    <h1 className="text-4xl font-black tracking-tight leading-none uppercase">
                        {mode === "create" ? "Add New Skill" : "Modify Skill"}
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 mt-3 uppercase tracking-[0.3em] opacity-60">
                        {mode === "create" ? "Enter the details for this new skill" : "Updating existing skill information"}
                    </p>
                </div>
            </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-16 space-y-16 bg-white relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-10">
                <div className="space-y-4">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Skill Name</Label>
                    <Input
                        {...register("name")}
                        placeholder="E.G. TECHNICAL ARCHITECTURE"
                        className={cn("h-16 bg-slate-50/50 border-2 border-slate-50 rounded-[1.5rem] text-sm font-bold tracking-tight uppercase focus:bg-white focus:border-primary/20 transition-all", errors.name && "border-rose-200")}
                    />
                    {errors.name && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-1">{errors.name.message}</p>}
                </div>

                <div className="space-y-4">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Department</Label>
                    <Select value={selectedCategory} onValueChange={(val) => setValue("category", val)}>
                        <SelectTrigger className="h-16 bg-slate-50/50 border-2 border-slate-50 rounded-[1.5rem] text-sm font-bold tracking-tight uppercase focus:bg-white focus:border-primary/20 transition-all">
                            <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-mega">
                            {(departments || []).map(dept => (
                                <SelectItem key={dept.id || dept._id} value={dept.name}>
                                    {dept.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-4">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</Label>
                    <Textarea
                        {...register("description")}
                        placeholder="Define the scope of this competency..."
                        className="min-h-[160px] bg-slate-50/50 border-2 border-slate-50 rounded-[2rem] text-sm font-medium p-8 focus:bg-white focus:border-primary/20 transition-all shadow-inner"
                    />
                </div>
            </div>

            <div className="space-y-10">
                <div className="space-y-4">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Skill Classification</Label>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: "technique", icon: Database, label: "Technical" },
                            { id: "comportementale", icon: Heart, label: "Soft Skill" },
                            { id: "transverse", icon: Layers, label: "Governance" },
                            { id: "opérationnelle", icon: Brain, label: "Operational" },
                        ].map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setValue("type", t.id)}
                                className={cn(
                                    "h-16 rounded-[1.2rem] transition-all flex items-center justify-center gap-3 text-[10px] font-black tracking-widest uppercase border-2 shadow-sm",
                                    selectedType === t.id
                                        ? "bg-slate-950 border-slate-950 text-white shadow-xl shadow-slate-900/10"
                                        : "bg-white border-slate-50 text-slate-400 hover:border-slate-100 hover:text-slate-600"
                                )}
                            >
                                <t.icon className="w-4 h-4" />
                                <span>{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Verification Status</Label>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { id: "draft", label: "Draft" },
                            { id: "submitted", label: "Submitted" },
                            { id: "validated", label: "Validated" },
                        ].map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setValue("etat", s.id)}
                                className={cn(
                                    "h-14 rounded-xl transition-all text-[9px] font-black tracking-widest uppercase border-2",
                                    selectedStatus === s.id
                                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                        : "bg-slate-50/50 border-slate-50 text-slate-400 hover:bg-white"
                                )}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-50/50 p-10 rounded-[2.5rem] border-2 border-slate-50 space-y-8">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Starting Assessments (0-5)</p>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <Label className="text-[9px] font-black text-slate-400 uppercase">Self-Eval</Label>
                            <Input
                                type="number"
                                {...register("auto_eval", { valueAsNumber: true })}
                                className="h-14 bg-white border-2 border-slate-100 rounded-xl text-center font-black text-lg"
                            />
                        </div>
                        <div className="space-y-4">
                            <Label className="text-[9px] font-black text-slate-400 uppercase">Manager</Label>
                            <Input
                                type="number"
                                {...register("hierarchie_eval", { valueAsNumber: true })}
                                className="h-14 bg-white border-2 border-slate-100 rounded-xl text-center font-black text-lg"
                            />
                        </div>
                    </div>
                </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 pt-16 border-t border-slate-50">
            <button
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] h-20 bg-slate-950 hover:bg-primary text-white font-black text-[11px] tracking-[0.3em] uppercase rounded-[1.5rem] shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-4"
            >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
                {mode === "create" ? "Establish Asset" : "Push Updates"}
            </button>
            <button
                type="button"
                onClick={() => navigate(`${rolePrefix}/skills`)}
                className="flex-1 h-20 bg-white border-2 border-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-50 font-black text-[11px] tracking-[0.3em] uppercase rounded-[1.5rem] transition-all"
            >
                Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
