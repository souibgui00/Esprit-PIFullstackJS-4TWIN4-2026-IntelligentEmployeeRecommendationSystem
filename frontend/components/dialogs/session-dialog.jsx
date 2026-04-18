"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useData } from "@/lib/data-store"
import { toast } from "sonner"
import { Zap, Clock, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function SessionDialog({ open, onOpenChange, session, activityId }) {
  const { activities, addSession, updateSession } = useData()
  const [saving, setSaving] = useState(false)
  const isEditing = !!session

  const [formData, setFormData] = useState({
    activityId: activityId || "",
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    instructor: "",
    maxParticipants: 20,
    notes: "",
  })

  useEffect(() => {
    if (session) {
      setFormData({
        activityId: session.activityId,
        title: session.title,
        date: session.date instanceof Date ? session.date.toISOString().split("T")[0] : new Date(session.date).toISOString().split("T")[0],
        startTime: session.startTime || "",
        endTime: session.endTime || "",
        location: session.location,
        instructor: session.instructor || "",
        maxParticipants: session.maxParticipants,
        notes: session.notes || "",
      })
    } else {
      setFormData({
        activityId: activityId || "",
        title: "",
        date: new Date().toISOString().split("T")[0],
        startTime: "09:00",
        endTime: "17:00",
        location: "",
        instructor: "",
        maxParticipants: 20,
        notes: "",
      })
    }
  }, [session, activityId, open])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.activityId || !formData.title || !formData.date || !formData.location) {
      toast.error("Missing Information", {
        description: "All required session details must be filled out."
      })
      return
    }

    setSaving(true)
    await new Promise(r => setTimeout(r, 1000))

    const sessionData = {
      ...formData,
      date: new Date(formData.date),
      status: "scheduled",
      enrolledParticipants: session?.enrolledParticipants || [],
    }

    if (isEditing && session) {
      updateSession(session.id, sessionData)
      toast.success("Session Updated", {
        description: `${formData.title} session has been updated.`
      })
    } else {
      addSession(sessionData)
      toast.success("SESSION DEPLOYED", {
        description: `${formData.title.toUpperCase()} has been scheduled in the temporal stack.`
      })
    }

    setSaving(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[550px] bg-white border-none rounded-[4px] p-0 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header - Fixed */}
        <div className="bg-[#222222] px-10 py-10 relative overflow-hidden group shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F28C1B]/[0.05] rounded-full -mr-32 -mt-32 blur-[60px] animate-pulse"></div>
          <DialogHeader className="relative z-10 text-left">
            <p className="text-[9px] font-black text-[#F28C1B] tracking-[0.4em] mb-3">Session Details</p>
            <DialogTitle className="text-3xl font-black text-white tracking-tighter ">
              {isEditing ? "Edit Session" : "Schedule Session"}
            </DialogTitle>
            <DialogDescription className="text-[10px] text-gray-400 font-bold tracking-widest mt-2 leading-loose opacity-70">
              {isEditing ? "Update the details for this training session." : "Schedule a new training session for this activity."}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form id="session-form" onSubmit={handleSubmit} className="p-10 space-y-8">
            <div className="grid gap-2">
              <Label htmlFor="activityId" className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Activity *</Label>
              <Select
                value={formData.activityId}
                onValueChange={(value) => setFormData({ ...formData, activityId: value })}
              >
                <SelectTrigger className="bg-[#EEEEEE] border-none rounded-[4px] h-12 font-bold text-[#222222] focus:ring-1 focus:ring-[#F28C1B] ">
                  <SelectValue placeholder="Select activity" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 rounded-[4px] shadow-2xl">
                  {activities.filter(a => a.id).map((activity) => (
                    <SelectItem key={activity.id} value={activity.id} className="font-bold text-[10px] ">
                      {activity.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title" className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Session Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Example: Morning Workshop"
                className="bg-[#EEEEEE] border-none rounded-[4px] h-12 text-sm font-bold text-[#222222] placeholder:text-gray-300 focus-visible:ring-1 focus-visible:ring-[#F28C1B] "
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="date" className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="bg-[#EEEEEE] border-none rounded-[4px] h-12 text-sm font-bold text-[#222222] focus-visible:ring-1 focus-visible:ring-[#F28C1B] "
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location" className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="ROOM 101 / REMOTE"
                  className="bg-[#EEEEEE] border-none rounded-[4px] h-12 text-sm font-bold text-[#222222] placeholder:text-gray-300 focus-visible:ring-1 focus-visible:ring-[#F28C1B] "
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="startTime" className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="bg-[#EEEEEE] border-none rounded-[4px] h-12 text-sm font-bold text-[#222222] focus-visible:ring-1 focus-visible:ring-[#F28C1B] "
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime" className="text-[10px] font-black text-gray-400 tracking-widest ml-1">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="bg-[#EEEEEE] border-none rounded-[4px] h-12 text-sm font-bold text-[#222222] focus-visible:ring-1 focus-visible:ring-[#F28C1B] "
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="instructor" className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Instructor</Label>
                <Input
                  id="instructor"
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  placeholder="EX: DR. VANCE"
                  className="bg-[#EEEEEE] border-none rounded-[4px] h-12 text-sm font-bold text-[#222222] placeholder:text-gray-300 focus-visible:ring-1 focus-visible:ring-[#F28C1B] "
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxParticipants" className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Max Participants</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  min={1}
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 1 })}
                  className="bg-[#EEEEEE] border-none rounded-[4px] h-12 text-sm font-bold text-[#222222] focus-visible:ring-1 focus-visible:ring-[#F28C1B] "
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes" className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Enter any additional session details here..."
                rows={3}
                className="bg-[#EEEEEE] border-none rounded-[4px] py-4 text-sm font-bold text-[#222222] placeholder:text-gray-300 focus-visible:ring-1 focus-visible:ring-[#F28C1B] min-h-[100px] "
              />
            </div>
          </form>
        </div>

        {/* Footer - Vertical Stacked */}
        <DialogFooter className="flex flex-col gap-3 bg-[#F8FAFC]/50 p-10 border-t border-[#EEEEEE] shrink-0">
          <button
            form="session-form"
            type="submit"
            disabled={saving}
            className="w-full bg-[#222222] text-white font-black py-5 px-8 rounded-[12px] tracking-[0.4em] text-[10px] shadow-xl hover:bg-[#F28C1B] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 "
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#F28C1B]" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 text-[#F28C1B]" />
                <span>{isEditing ? "Save Changes" : "Schedule Session"}</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full bg-transparent border border-[#EEEEEE] hover:bg-white text-gray-400 font-black py-5 px-8 rounded-[12px] tracking-[0.4em] text-[10px] transition-all flex items-center justify-center gap-4"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

