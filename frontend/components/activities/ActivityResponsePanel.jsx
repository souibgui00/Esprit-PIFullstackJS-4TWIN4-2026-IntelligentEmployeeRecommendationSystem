"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2, XCircle, Clock, Calendar, Loader2, Bell, AlertTriangle
} from "lucide-react"

/**
 * ActivityResponsePanel
 * Shows a dismissible banner/card for each participation in "pending_response" status.
 * Employees can Accept or Decline (declination requires a reason).
 */
export function ActivityResponsePanel() {
  const { user } = useAuth()
  const [pendingParticipations, setPendingParticipations] = useState([])
  const [loading, setLoading] = useState(true)
  const [declineModal, setDeclineModal] = useState(null) // { participationId, activityId, activityTitle }
  const [declineReason, setDeclineReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fetchPending = useCallback(async () => {
    if (!user || user.role?.toLowerCase() !== "employee") return
    try {
      const participations = await api.get("/participations/me")
      const pending = participations.filter(p => p.status === "pending_response")
      setPendingParticipations(pending)
    } catch (err) {
      console.error("[ActivityResponsePanel] Failed to fetch participations:", err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchPending()
  }, [fetchPending])

  const handleAccept = async (activityId, activityTitle) => {
    setSubmitting(true)
    try {
      await api.post(`/participations/${activityId}/respond`, { accept: true })
      toast.success("✅ Participation Confirmed!", {
        description: `You are now enrolled in "${activityTitle}".`
      })
      await fetchPending()
    } catch (err) {
      toast.error("Failed to accept", { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeclineSubmit = async () => {
    if (!declineReason.trim()) {
      toast.error("A reason is required to decline.")
      return
    }
    if (!declineModal) return
    setSubmitting(true)
    try {
      await api.post(`/participations/${declineModal.activityId}/respond`, {
        accept: false,
        reason: declineReason.trim()
      })
      toast.success("Declination submitted", {
        description: `Your manager has been notified of your decision for "${declineModal.activityTitle}".`
      })
      setDeclineModal(null)
      setDeclineReason("")
      await fetchPending()
    } catch (err) {
      toast.error("Failed to decline", { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (!user || user.role?.toLowerCase() !== "employee") return null
  if (loading) return null
  if (pendingParticipations.length === 0) return null

  return (
    <>
      <div className="w-full space-y-4 mb-8">
        {/* Header */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">
              Action Required
            </h3>
            <p className="text-xs text-slate-500">
              You have {pendingParticipations.length} pending activity assignment{pendingParticipations.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Pending Cards */}
        {pendingParticipations.map((participation) => {
          const activity = typeof participation.activityId === "object"
            ? participation.activityId
            : { title: "Activity", _id: participation.activityId }

          return (
            <div
              key={participation._id || participation.id}
              className="bg-white border-2 border-orange-200 rounded-3xl p-6 shadow-lg relative overflow-hidden"
            >
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-10 -mt-10 opacity-60" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-orange-100 text-orange-700 border-none text-[9px] font-black uppercase tracking-wider px-2 py-0.5">
                      <Clock className="w-2.5 h-2.5 mr-1 inline" />
                      Awaiting Response
                    </Badge>
                    {activity.type && (
                      <Badge className="bg-slate-100 text-slate-500 border-none text-[9px] font-black uppercase tracking-wider px-2 py-0.5">
                        {activity.type}
                      </Badge>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-slate-900 truncate">
                    {activity.title || "Activity Assignment"}
                  </h4>
                  {activity.date && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(activity.date).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                      {activity.duration && <span className="ml-2">· {activity.duration}</span>}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 shrink-0">
                  <Button
                    disabled={submitting}
                    onClick={() => handleAccept(
                      activity._id || participation.activityId,
                      activity.title
                    )}
                    className="bg-slate-900 hover:bg-green-600 text-white font-black text-[10px] uppercase tracking-wider px-6 py-2 rounded-2xl h-auto transition-all gap-2"
                  >
                    {submitting
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Accept
                  </Button>
                  <Button
                    disabled={submitting}
                    variant="outline"
                    onClick={() => setDeclineModal({
                      activityId: activity._id || participation.activityId,
                      activityTitle: activity.title
                    })}
                    className="border-red-200 text-red-600 hover:bg-red-50 font-black text-[10px] uppercase tracking-wider px-6 py-2 rounded-2xl h-auto transition-all gap-2"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Decline
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Decline Reason Modal */}
      <Dialog
        open={!!declineModal}
        onOpenChange={(open) => {
          if (!open) { setDeclineModal(null); setDeclineReason("") }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-3xl border-none p-0 overflow-hidden">
          <div className="bg-slate-950 p-8 text-center">
            <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-black tracking-tight">
                Decline Activity
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-medium mt-2">
                You are declining: <span className="text-white font-bold">{declineModal?.activityTitle}</span>
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6 bg-white">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-widest">
                Reason for Declining <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Please provide a reason (e.g. schedule conflict, already attending a similar course, health reasons...)"
                className="min-h-[100px] rounded-2xl border-slate-200 text-sm resize-none focus:ring-orange-500 focus:border-orange-500"
                maxLength={500}
              />
              <p className="text-[10px] text-slate-400 text-right font-mono">
                {declineReason.length}/500
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => { setDeclineModal(null); setDeclineReason("") }}
                className="flex-1 rounded-2xl font-black text-[10px] uppercase tracking-wider h-12"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeclineSubmit}
                disabled={!declineReason.trim() || submitting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-wider h-12"
              >
                {submitting
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : "Confirm Decline"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
