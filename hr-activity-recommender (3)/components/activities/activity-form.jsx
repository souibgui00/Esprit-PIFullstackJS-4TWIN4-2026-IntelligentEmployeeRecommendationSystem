"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { activitySchema } from "@/lib/schemas"
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
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { ArrowLeft, Activity, X, Loader2, Calendar, Clock, Target, Plus, Briefcase, Database, Sparkles, Wand2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

export function ActivityForm({ activity, mode = "create" }) {
  const { addActivity, updateActivity, skills, departments, addSkill: createGlobalSkill } = useData()
  const { user } = useAuth()
  const navigate = useNavigate()
  const rolePrefix = user?.role?.toLowerCase() === "hr" ? "/hr" : "/admin"
  const initialSkills = (() => {
    const fromCovered = activity?.skillsCovered
    if (Array.isArray(fromCovered)) {
      return fromCovered.map((s) => (typeof s === "string" ? s : s._id || s.id)).filter(Boolean)
    }
    const fromRequired = activity?.requiredSkills
    if (Array.isArray(fromRequired)) {
      return fromRequired.map((r) => r.skillId || r.skill?._id || r.skill?.id).filter(Boolean)
    }
    return []
  })()
  const [selectedSkillIds, setSelectedSkillIds] = useState(initialSkills)
  const [selectedDeptIds, setSelectedDeptIds] = useState(
    Array.isArray(activity?.targetDepartments) ? activity.targetDepartments.map(d => d?._id || d?.id || d).filter(Boolean) : []
  )
  const [addSkillValue, setAddSkillValue] = useState("")
  const [customSkillMode, setCustomSkillMode] = useState(false)
  const [customSkillName, setCustomSkillName] = useState("")
  const [isExtracting, setIsExtracting] = useState(false)
  const [suggestions, setSuggestions] = useState([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: activity?.title || "",
      type: activity?.type || "training",
      description: activity?.description || "",
      date: activity?.date ? new Date(activity.date).toISOString().split("T")[0] : "",
      duration: activity?.duration || "",
      capacity: activity?.capacity ?? 20,
      status: activity?.status || "open",
      level: activity?.level || "beginner",
      location: activity?.location || "",
    },
  })

  const formType = watch("type")
  const formStatus = watch("status")
  const formLevel = watch("level")

  const addSkill = (skillId) => {
    if (!skillId || selectedSkillIds.includes(skillId)) return
    setSelectedSkillIds((prev) => [...prev, skillId])
  }

  const removeSkill = (skillId) => {
    setSelectedSkillIds((prev) => prev.filter((id) => id !== skillId))
  }

  const handleExtractSkills = async () => {
    const title = watch("title")
    const description = watch("description")
    
    if (!description || description.length < 10) {
      toast.error("Description too short", { description: "Please provide a more detailed description for better AI matching." })
      return
    }

    setIsExtracting(true)
    try {
      const result = await api.post("/activities/extract-skills", { title, description })
      if (result.extractedSkills?.length > 0) {
        setSuggestions(result.extractedSkills)
        toast.success("Skills extracted", { description: `AI found ${result.extractedSkills.length} relevant skill matches.` })
      } else {
        toast.warning("No matches", { description: "AI couldn't find specific skill matches in your description." })
      }
    } catch (err) {
      toast.error("AI service error", { description: "Commonly caused by NLP service being offline." })
    } finally {
      setIsExtracting(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      const payload = {
        title: data.title,
        description: data.description,
        type: data.type,
        date: data.date,
        duration: data.duration,
        capacity: data.capacity,
        status: data.status,
        skillsCovered: selectedSkillIds,
        requiredSkills: selectedSkillIds.map(id => ({ 
          skillId: id, 
          weight: 0.5, 
          requiredLevel: watch("level") 
        })),
        level: data.level,
        location: data.location,
        targetDepartments: selectedDeptIds,
      }
      console.log('[DEBUG] payload being sent:', JSON.stringify(payload))
      if (mode === "create") {
        await addActivity(payload)
        toast.success("Activity added", { description: `${data.title} has been created.` })
      } else {
        await updateActivity(activity.id || activity._id, payload)
        toast.success("Activity updated", { description: `${data.title} has been updated.` })
      }
      navigate(`${rolePrefix}/activities`)
    } catch (error) {
      toast.error("Operation failed", { description: error.message })
    }
  }

  const availableSkills = skills?.filter((s) => !selectedSkillIds.includes(s.id || s._id)) || []

  return (
    <div className="max-w-4xl mx-auto w-full space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
      
      {/* Navigation & Status */}
      <div className="flex items-center justify-between">
         <button
            onClick={() => navigate(-1)}
            type="button"
            className="group flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
         >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> 
            Back to List
         </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-[48px] shadow-mega overflow-hidden relative">
        {/* Decorative Header */}
        <div className="bg-slate-950 px-12 py-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -mr-48 -mt-48"></div>
            <div className="relative z-10 flex items-center gap-6">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-all">
                    {mode === "create" ? <Plus className="w-8 h-8 text-primary" /> : <Activity className="w-8 h-8 text-primary" />}
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tight leading-none uppercase">
                        {mode === "create" ? "Add Activity" : "Edit Activity"}
                    </h1>
                    <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest opacity-80">
                        {mode === "create" ? "Create a new learning activity or program" : `Updating record: ${activity?.title}`}
                    </p>
                </div>
            </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-12 space-y-12 bg-white relative z-10">
          
          {/* Section: Core Details */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Database className="w-4 h-4 text-primary" />
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">Core Details</h3>
                <div className="h-px flex-1 bg-slate-100"></div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Title</Label>
              <Input
                {...register("title")}
                placeholder="e.g. Advanced Leadership Workshop"
                className={cn("h-14 bg-slate-50/50 border-slate-100 rounded-2xl text-[11px] font-black tracking-widest focus:bg-white focus:ring-primary/10 transition-all", errors.title && "border-rose-300")}
              />
              {errors.title && <p className="text-[9px] font-bold text-rose-500 mt-1">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Type</Label>
                  <Select value={formType} onValueChange={(v) => setValue("type", v)}>
                    <SelectTrigger className={cn("h-14 bg-slate-50/50 border-slate-100 rounded-2xl text-[11px] font-black tracking-widest uppercase", errors.type && "border-rose-300")}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="training" className="text-[10px] font-black uppercase tracking-widest py-3">Training</SelectItem>
                      <SelectItem value="workshop" className="text-[10px] font-black uppercase tracking-widest py-3">Workshop</SelectItem>
                      <SelectItem value="mentoring" className="text-[10px] font-black uppercase tracking-widest py-3">Mentoring</SelectItem>
                      <SelectItem value="webinar" className="text-[10px] font-black uppercase tracking-widest py-3">Webinar</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-[9px] font-bold text-rose-500 mt-1">{errors.type.message}</p>}
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Status</Label>
                  <Select value={formStatus} onValueChange={(v) => setValue("status", v)}>
                    <SelectTrigger className="h-14 bg-slate-50/50 border-slate-100 rounded-2xl text-[11px] font-black tracking-widest uppercase">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="open" className="text-[10px] font-black uppercase tracking-widest py-3 text-emerald-600">Open</SelectItem>
                      <SelectItem value="closed" className="text-[10px] font-black uppercase tracking-widest py-3 text-orange-600">Closed</SelectItem>
                      <SelectItem value="completed" className="text-[10px] font-black uppercase tracking-widest py-3 text-slate-600">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Description</Label>
              <Textarea
                {...register("description")}
                placeholder="Describe objectives, outcomes, and content..."
                rows={4}
                className={cn("bg-slate-50/50 border-slate-100 rounded-3xl text-[11px] font-medium tracking-tight focus:bg-white focus:ring-primary/10 transition-all min-h-[140px] p-6", errors.description && "border-rose-300")}
              />
              {errors.description && <p className="text-[9px] font-bold text-rose-500 mt-1">{errors.description.message}</p>}
              
              <div className="flex justify-end pt-2">
                <Button 
                  type="button" 
                  variant="outline"
                  size="sm"
                  onClick={handleExtractSkills}
                  disabled={isExtracting}
                  className="rounded-xl bg-primary/5 border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all gap-2 h-9 px-4"
                >
                  {isExtracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Extract Skills with AI
                </Button>
              </div>
            </div>
          </div>

          {/* Section: Logistics */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">Logistics</h3>
                <div className="h-px flex-1 bg-slate-100"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-3 lg:col-span-1 md:col-span-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Date</Label>
                  <Input
                    {...register("date")}
                    type="date"
                    className={cn("h-14 bg-slate-50/50 border-slate-100 rounded-2xl text-[11px] font-black tracking-widest focus:bg-white focus:ring-primary/10 transition-all", errors.date && "border-rose-300")}
                  />
                  {errors.date && <p className="text-[9px] font-bold text-rose-500 mt-1">{errors.date.message}</p>}
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Duration</Label>
                  <Input
                    {...register("duration")}
                    placeholder="e.g. 2 hours"
                    className={cn("h-14 bg-slate-50/50 border-slate-100 rounded-2xl text-[11px] font-black tracking-widest focus:bg-white focus:ring-primary/10 transition-all", errors.duration && "border-rose-300")}
                  />
                  {errors.duration && <p className="text-[9px] font-bold text-rose-500 mt-1">{errors.duration.message}</p>}
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Capacity</Label>
                  <Input
                    {...register("capacity")}
                    type="number"
                    min={1}
                    className="h-14 bg-slate-50/50 border-slate-100 rounded-2xl text-[11px] font-black tracking-widest focus:bg-white focus:ring-primary/10 transition-all"
                  />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Location</Label>
                <Input
                  {...register("location")}
                  placeholder="e.g. Room B1 or Online"
                  className={cn("h-14 bg-slate-50/50 border-slate-100 rounded-2xl text-[11px] font-black tracking-widest focus:bg-white focus:ring-primary/10 transition-all", errors.location && "border-rose-300")}
                />
                {errors.location && <p className="text-[9px] font-bold text-rose-500 mt-1">{errors.location.message}</p>}
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Level</Label>
                <Select value={formLevel} onValueChange={(v) => setValue("level", v)}>
                  <SelectTrigger className="h-14 w-full bg-slate-50/50 border-slate-100 rounded-2xl text-[11px] font-black tracking-widest uppercase">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="beginner" className="text-[10px] font-black uppercase tracking-widest py-3">Beginner</SelectItem>
                    <SelectItem value="intermediate" className="text-[10px] font-black uppercase tracking-widest py-3">Intermediate</SelectItem>
                    <SelectItem value="advanced" className="text-[10px] font-black uppercase tracking-widest py-3">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section: Target Departments */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">Target Departments</h3>
                <div className="h-px flex-1 bg-slate-100"></div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Select which departments will receive this activity. Only the managers of these departments will be notified.</p>
            <div className="flex flex-wrap gap-3">
              {(departments || []).map(dept => {
                const dId = dept.id || dept._id
                const isSelected = selectedDeptIds.includes(dId)
                return (
                  <button
                    key={dId}
                    type="button"
                    onClick={() => setSelectedDeptIds(prev => isSelected ? prev.filter(id => id !== dId) : [...prev, dId])}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                      isSelected
                        ? "bg-slate-950 text-white border-slate-950 shadow-md"
                        : "bg-white border-slate-100 text-slate-500 hover:border-primary hover:text-primary"
                    )}
                  >
                    {dept.name}
                  </button>
                )
              })}
            </div>
            {selectedDeptIds.length === 0 && (
              <p className="text-[10px] text-amber-500 font-bold">⚠ No departments selected — activity will not be sent to any manager.</p>
            )}
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Briefcase className="w-4 h-4 text-primary" />
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">Skills Covered</h3>
                <div className="h-px flex-1 bg-slate-100"></div>
            </div>
            
            {suggestions.length > 0 && (
              <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">AI Suggested Skills</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map(sname => {
                    const existingSkill = skills?.find(s => s.name?.toLowerCase() === sname.toLowerCase())
                    const isAdded = existingSkill && selectedSkillIds.includes(existingSkill.id || existingSkill._id)
                    
                    return (
                      <button
                        key={sname}
                        type="button"
                        onClick={() => {
                          if (existingSkill) {
                            addSkill(existingSkill.id || existingSkill._id)
                          } else {
                            // Create temporary skill or ask to create
                            toast.info(`'${sname}' is not in database`, { 
                              description: "Custom skill input opened with suggested name." 
                            })
                            setCustomSkillMode(true)
                            setCustomSkillName(sname)
                          }
                        }}
                        disabled={isAdded}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                          isAdded 
                            ? "bg-slate-100 border-slate-200 text-slate-400 cursor-default"
                            : "bg-white border-primary/20 text-slate-700 hover:border-primary hover:text-primary shadow-sm"
                        )}
                      >
                        {sname} {isAdded && "✓"}
                      </button>
                    )
                  })}
                  <button 
                    type="button"
                    onClick={() => setSuggestions([])}
                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-slate-900"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
                {selectedSkillIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2 p-4 border border-slate-100 rounded-3xl bg-slate-50/30">
                    {selectedSkillIds.map((sid) => {
                      const skill = skills?.find((s) => (s.id || s._id) === sid)
                      return (
                        <span
                          key={sid}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 shadow-sm rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-800"
                        >
                          {skill?.name || sid}
                          <button
                            type="button"
                            onClick={() => removeSkill(sid)}
                            className="text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}
                <div className="flex gap-3">
                  {customSkillMode ? (
                    <div className="flex w-full gap-3">
                        <Input
                            value={customSkillName}
                            onChange={(e) => setCustomSkillName(e.target.value)}
                            placeholder="Enter new skill name..."
                            className="flex-1 h-14 bg-slate-50/50 border-slate-100 rounded-2xl text-[11px] font-black tracking-widest uppercase focus:bg-white focus:ring-primary/10 transition-all"
                        />
                        <Button 
                            type="button"
                            onClick={async () => {
                                if (customSkillName.trim()) {
                                    try {
                                        await createGlobalSkill({ name: customSkillName.trim(), type: 'knowledge', category: 'General' });
                                        toast.success("Skill created", { description: `${customSkillName} has been added to the matrix.` });
                                        // We don't automatically select it locally because we await the remote object to get an ID. 
                                        // But it will instantly appear in the dropdown.
                                        setCustomSkillMode(false);
                                        setCustomSkillName("");
                                    } catch (err) {
                                        toast.error("Failed to create skill", { description: err.message });
                                    }
                                }
                            }}
                            className="h-14 px-6 bg-slate-950 hover:bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all"
                        >
                            Save Skill
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setCustomSkillMode(false)
                                setCustomSkillName("")
                            }}
                            className="h-14 px-6 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900"
                        >
                            Cancel
                        </Button>
                    </div>
                  ) : (
                    <Select
                        value={addSkillValue}
                        onValueChange={(v) => {
                        if (v === "##AUTRE##") {
                            setCustomSkillMode(true)
                        } else {
                            addSkill(v)
                            setAddSkillValue("")
                        }
                        }}
                    >
                        <SelectTrigger className="h-14 flex-1 bg-slate-50/50 border-slate-100 rounded-2xl text-[11px] font-black tracking-widest uppercase md:max-w-md">
                        <SelectValue placeholder="Select skill to add..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                        {availableSkills.filter(s => (s.id || s._id)).map((s) => (
                            <SelectItem key={s.id || s._id} value={s.id || s._id} className="text-[10px] font-black uppercase tracking-widest py-3">
                            {s.name}
                            </SelectItem>
                        ))}
                        <SelectItem value="##AUTRE##" className="text-[10px] font-black uppercase tracking-widest py-3 text-primary bg-primary/5">
                            + AUTRE (CREATE NEW SKILL)
                        </SelectItem>
                        </SelectContent>
                    </Select>
                  )}
                </div>
            </div>
          </div>

          {/* Action Submission */}
          <div className="flex flex-col md:flex-row gap-6 pt-12 border-t border-slate-50">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-16 bg-slate-950 hover:bg-primary text-white font-black text-[12px] tracking-[0.2em] uppercase rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : (mode === "create" ? <Plus className="w-5 h-5 mr-3" /> : <Activity className="w-5 h-5 mr-3" />)}
              {mode === "create" ? "Add Activity" : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`${rolePrefix}/activities`)}
              className="flex-1 h-16 border-slate-100 bg-white hover:bg-slate-50 text-slate-400 font-black text-[12px] tracking-[0.2em] uppercase rounded-2xl transition-all"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
