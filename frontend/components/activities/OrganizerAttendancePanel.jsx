"use client"

import { useState, useCallback } from "react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, Star, CheckCircle2, XCircle, Send, ClipboardList } from "lucide-react"

/**
 * StarRatingPicker - a simple 1-5 star selector
 */
function StarRatingPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              s <= value
                ? "text-amber-400 fill-amber-400"
                : "text-slate-200 hover:text-amber-300"
            }`}
          />
        </button>
      ))}
    </div>
  )
}

/**
 * OrganizerAttendancePanel
 * A slide-in sheet where the Manager marks each enrolled employee as
 * completed or not, gives a 1-5 star rating, and optionally adds a note.
 * Triggered from the Manager dashboard when participations are in "awaiting_organizer".
 *
 * Props:
 *  - activityId: string
 *  - activityTitle: string
 *  - open: boolean
 *  - onClose: () => void
 *  - onSubmitted: () => void
 */
export function OrganizerAttendancePanel({
  activityId, activityTitle, open, onClose, onSubmitted
}) {
  const [participations, setParticipations] = useState([])
  const [loadingPanel, setLoadingPanel] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [report, setReport] = useState({}) // { [participationId]: { completed, rating, note } }

  const loadPanel = useCallback(async () => {
    if (!activityId) return
    setLoadingPanel(true)
    try {
      const data = await api.get(`/participations/${activityId}/organizer-panel`)
      setParticipations(data)
      // Initialize report state with default values
      const initial = {}
      for (const p of data) {
        initial[p._id] = { completed: true, rating: 3, note: "" }
      }
      setReport(initial)
    } catch (err) {
      toast.error("Failed to load attendance panel", { description: err.message })
    } finally {
      setLoadingPanel(false)
    }
  }, [activityId])

  // Load data when panel opens
  const handleOpenChange = (isOpen) => {
    if (isOpen) loadPanel()
    else onClose()
  }

  const updateReport = (participationId, field, value) => {
    setReport(prev => ({
      ...prev,
      [participationId]: { ...prev[participationId], [field]: value }
    }))
  }

  const handleSubmit = async () => {
    const reportArray = Object.entries(report).map(([participationId, data]) => ({
      participationId,
      completed: data.completed,
      rating: data.rating,
      note: data.note || undefined,
    }))

    setSubmitting(true)
    try {
      const result = await api.post(`/participations/${activityId}/organizer-report`, {
        report: reportArray
      })
      toast.success("Attendance Report Submitted", {
        description: `${result.awaitingValidation} completed, ${result.notCompleted} not completed. HR has been notified.`
      })
      onSubmitted?.()
      onClose()
    } catch (err) {
      toast.error("Submission failed", { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const allDecided = participations.every(p => report[p._id] !== undefined)

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        className="w-full sm:max-w-2xl overflow-y-auto bg-white p-0"
        side="right"
      >
        {/* Header */}
        <div className="bg-slate-950 px-8 py-10 sticky top-0 z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <ClipboardList className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <SheetHeader>
                <SheetTitle className="text-white font-black text-xl tracking-tight text-left">
                  Attendance Report
                </SheetTitle>
                <SheetDescription className="text-slate-400 font-medium text-sm text-left">
                  {activityTitle}
                </SheetDescription>
              </SheetHeader>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Mark each employee and submit the report. Your manager validation request will be triggered after submission.
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-4">
          {loadingPanel && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
          )}

          {!loadingPanel && participations.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-bold text-sm">No employees awaiting your report for this activity.</p>
            </div>
          )}

          {!loadingPanel && participations.map((p) => {
            const employee = p.userId || {}
            const reportEntry = report[p._id] || { completed: true, rating: 3, note: "" }

            return (
              <div
                key={p._id}
                className={`rounded-3xl border-2 p-6 transition-all ${
                  reportEntry.completed
                    ? "border-green-200 bg-green-50/30"
                    : "border-red-200 bg-red-50/20"
                }`}
              >
                {/* Employee info */}
                <div className="flex items-center gap-4 mb-5">
                  <Avatar className="w-11 h-11 rounded-2xl border border-slate-200">
                    <AvatarImage src={employee.avatar} />
                    <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-sm rounded-2xl">
                      {employee.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{employee.name || "Employee"}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">{employee.email}</p>
                  </div>
                  <Badge className={`text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-xl border-none ${
                    reportEntry.completed
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}>
                    {reportEntry.completed ? "Completed" : "Not Completed"}
                  </Badge>
                </div>

                {/* Completed toggle */}
                <div className="flex items-center gap-3 mb-5">
                  <button
                    type="button"
                    onClick={() => updateReport(p._id, "completed", true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                      reportEntry.completed
                        ? "bg-green-600 text-white shadow-green-200 shadow-md"
                        : "bg-slate-100 text-slate-500 hover:bg-green-50 hover:text-green-700"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                  </button>
                  <button
                    type="button"
                    onClick={() => updateReport(p._id, "completed", false)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                      !reportEntry.completed
                        ? "bg-red-600 text-white shadow-red-200 shadow-md"
                        : "bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-700"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" /> Not Completed
                  </button>
                </div>

                {/* Rating */}
                <div className="space-y-2 mb-4">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                    Rating
                  </label>
                  <StarRatingPicker
                    value={reportEntry.rating}
                    onChange={(val) => updateReport(p._id, "rating", val)}
                  />
                </div>

                {/* Note */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                    Note <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <Textarea
                    value={reportEntry.note}
                    onChange={(e) => updateReport(p._id, "note", e.target.value)}
                    placeholder="Add any observations about this employee's participation..."
                    className="min-h-[60px] rounded-2xl border-slate-200 text-sm resize-none text-slate-700"
                    maxLength={300}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        {!loadingPanel && participations.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t border-slate-100 px-8 py-6">
            <Button
              onClick={handleSubmit}
              disabled={!allDecided || submitting}
              className="w-full h-14 bg-slate-950 hover:bg-amber-500 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl gap-3"
            >
              {submitting
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <><Send className="w-4 h-4" /> Submit Attendance Report</>}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
