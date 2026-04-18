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
import { Button } from "/components/ui/button"
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
import { useData } from "/lib/data-store"

import { toast } from "sonner"



const categories = [
  "Technical",
  "Management",
  "Finance",
  "Legal",
  "Communication",
  "Interpersonal",
  "Cognitive",
]

export function SkillDialog({ open, onOpenChange, skill, mode }) {
  const { addSkill, updateSkill } = useData()
  const [formData, setFormData] = useState({
    name: "",
    type: "knowledge",
    description: "",
    category: "",
  })

  useEffect(() => {
    if (skill && mode === "edit") {
      setFormData({
        name: skill.name || "",
        type: skill.type || "knowledge",
        description: skill.description || "",
        category: skill.category || "",
      })
    } else {
      setFormData({
        name: "",
        type: "knowledge",
        description: "",
        category: "",
      })
    }
  }, [skill, mode])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.type) {
      toast.error("Name and type are required")
      return
    }

    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        description: formData.description || undefined,
        category: formData.category || undefined,
      }
      if (mode === "create") {
        await addSkill(payload)
        toast.success("Skill added", { description: `"${formData.name}" has been added.` })
      } else if (skill) {
        await updateSkill(skill.id || skill._id, payload)
        toast.success("Skill updated", { description: `"${formData.name}" has been updated.` })
      }
      onOpenChange(false)
    } catch (error) {
      toast.error("Operation failed", { description: error.message })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New Skill" : "Edit Skill"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Define a new skill in the skills library." 
              : "Update skill information."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Skill Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Python Programming"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Skill Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="knowledge">Knowledge (Savoir)</SelectItem>
                    <SelectItem value="knowHow">Know-how (Savoir-faire)</SelectItem>
                    <SelectItem value="softSkill">Soft Skill (Savoir-etre)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this skill and what it encompasses..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button type="submit">
              {mode === "create" ? "Add Skill" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
