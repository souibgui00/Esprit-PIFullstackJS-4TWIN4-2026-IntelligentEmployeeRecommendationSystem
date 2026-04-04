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
} from "@/components/ui/dialog"
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
import { X, Loader2 } from "lucide-react"

export function ActivityDialog({ open, onOpenChange, activity, mode }) {
  const { addActivity, updateActivity, skills } = useData()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    type: "training",
    description: "",
    date: "",
    duration: "",
    capacity: 20,
    status: "open",
    level: "beginner",
  })
  const [selectedSkillIds, setSelectedSkillIds] = useState([])
  const [addSkillValue, setAddSkillValue] = useState("")

  useEffect(() => {
    if (activity && mode === "edit") {
      const skills = (() => {
        const fromCovered = activity.skillsCovered
        if (Array.isArray(fromCovered)) {
          return fromCovered.map((s) => (typeof s === "string" ? s : s._id || s.id)).filter(Boolean)
        }
        const fromRequired = activity.requiredSkills
        if (Array.isArray(fromRequired)) {
          return fromRequired.map((r) => r.skillId || r.skill?._id || r.skill?.id).filter(Boolean)
        }
        return []
      })()
      setFormData({
        title: activity.title || "",
        type: activity.type || "training",
        description: activity.description || "",
        date: activity.date ? new Date(activity.date).toISOString().split("T")[0] : "",
        duration: activity.duration || "",
        capacity: activity.capacity ?? 20,
        status: activity.status || "open",
        level: activity.level || "beginner",
      })
      setSelectedSkillIds(skills)
    } else {
      setFormData({
        title: "",
        type: "training",
        description: "",
        date: "",
        duration: "",
        capacity: 20,
        status: "open",
        level: "beginner",
      })
      setSelectedSkillIds([])
    }
  }, [activity, mode, open])

  const addSkill = (skillId) => {
    if (!skillId || selectedSkillIds.includes(skillId)) return
    setSelectedSkillIds((prev) => [...prev, skillId])
  }

  const removeSkill = (skillId) => {
    setSelectedSkillIds((prev) => prev.filter((id) => id !== skillId))
  }

  const availableSkills = skills?.filter((s) => !selectedSkillIds.includes(s.id || s._id)) || []

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title || !formData.description || !formData.date || !formData.duration) {
      toast.error("Missing required fields", { description: "Title, description, date, and duration are required." })
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        date: formData.date,
        duration: formData.duration,
        capacity: formData.capacity,
        status: formData.status,
        skillsCovered: selectedSkillIds,
        level: formData.level,
      }

      if (mode === "create") {
        await addActivity(payload)
        toast.success("Activity added", { description: `${formData.title} has been created.` })
      } else if (activity) {
        await updateActivity(activity.id || activity._id, payload)
        toast.success("Activity updated", { description: `${formData.title} has been updated.` })
      }
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error("Operation failed", { description: error.message || "Please try again." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] bg-white border border-slate-200 rounded-xl p-0 overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-slate-100 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {mode === "create" ? "Add activity" : "Edit activity"}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              {mode === "create" ? "Create a new training activity." : "Update activity details."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form id="activity-dialog-form" onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="form-label">Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Leadership Workshop"
                className="form-input h-12"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="form-label">Type *</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData((p) => ({ ...p, type: v }))}>
                  <SelectTrigger className="form-input h-12">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="mentoring">Mentoring</SelectItem>
                    <SelectItem value="webinar">Webinar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="form-label">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData((p) => ({ ...p, status: v }))}>
                  <SelectTrigger className="form-input h-12">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="form-label">Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Describe objectives and content..."
                rows={4}
                className="form-input min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="form-label">Date *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                  className="form-input h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="form-label">Duration *</Label>
                <Input
                  value={formData.duration}
                  onChange={(e) => setFormData((p) => ({ ...p, duration: e.target.value }))}
                  placeholder="e.g. 2 hours"
                  className="form-input h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="form-label">Capacity</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.capacity}
                  onChange={(e) => setFormData((p) => ({ ...p, capacity: parseInt(e.target.value) || 1 }))}
                  className="form-input h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="form-label">Level</Label>
              <Select value={formData.level} onValueChange={(v) => setFormData((p) => ({ ...p, level: v }))}>
                <SelectTrigger className="form-input h-12">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <Label className="form-label">Skills covered</Label>
              <div className="flex flex-wrap gap-2">
                {selectedSkillIds.map((sid) => {
                  const skill = skills?.find((s) => (s.id || s._id) === sid)
                  return (
                    <span
                      key={sid}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm font-medium text-slate-800"
                    >
                      {skill?.name || sid}
                      <button
                        type="button"
                        onClick={() => removeSkill(sid)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )
                })}
              </div>
              <Select
                value={addSkillValue}
                onValueChange={(v) => {
                  addSkill(v)
                  setAddSkillValue("")
                }}
              >
                <SelectTrigger className="form-input h-12">
                  <SelectValue placeholder="Add skill..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSkills.filter(s => (s.id || s._id)).map((s) => (
                    <SelectItem key={s.id || s._id} value={s.id || s._id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </form>
        </div>

        <DialogFooter className="flex flex-col gap-3 p-6 border-t border-slate-100 shrink-0">
          <button
            form="activity-dialog-form"
            type="submit"
            disabled={saving}
            className="w-full py-3 px-6 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {mode === "create" ? "Add activity" : "Update"}
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full py-3 px-6 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
