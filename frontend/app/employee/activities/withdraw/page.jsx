"use client"

import { useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { AlertTriangle, ChevronLeft, Loader2, LogOut } from "lucide-react"

import { useData } from "@/lib/data-store"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { api } from "@/lib/api"

const WITHDRAWABLE_STATUSES = ["accepted", "in_progress"]

export default function EmployeeWithdrawPage() {
  const navigate = useNavigate()
  const { activityId } = useParams()
  const { activities = [], participations = [], refreshParticipations } = useData()

  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const enrollment = useMemo(() => {
    return participations.find((p) => {
      const rawId = typeof p.activityId === "object" ? p.activityId?._id || p.activityId?.id : p.activityId
      return String(rawId) === String(activityId)
    })
  }, [participations, activityId])

  const activity = useMemo(() => {
    if (!activityId) return null
    return activities.find((a) => String(a.id || a._id) === String(activityId)) || (typeof enrollment?.activityId === "object" ? enrollment.activityId : null)
  }, [activities, enrollment, activityId])

  const canWithdraw = WITHDRAWABLE_STATUSES.includes(enrollment?.status)

  const submitWithdrawal = async () => {
    if (!reason.trim()) {
      toast.error("Reason required", { description: "You must explain why you are withdrawing." })
      return
    }

    setSubmitting(true)
    try {
      await api.post(`/participations/${activityId}/withdraw`, { reason: reason.trim() })
      toast.success("Withdrawal submitted", {
        description: "Your manager has been notified. The seat has been freed for another colleague.",
      })
      if (refreshParticipations) await refreshParticipations()
      navigate("/employee/activities", { replace: true })
    } catch (err) {
      toast.error("Withdrawal failed", { description: err?.message || "Please try again." })
    } finally {
      setSubmitting(false)
    }
  }

  if (!activity || !enrollment) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center">
          <p className="text-slate-700 font-bold">Activity enrollment was not found.</p>
          <Link to="/employee/activities" className="inline-flex mt-4 text-primary text-sm font-bold">
            Back to activities
          </Link>
        </div>
      </div>
    )
  }

  if (!canWithdraw) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center">
          <p className="text-slate-700 font-bold">This activity is no longer in a withdrawable status.</p>
          <Link to="/employee/activities" className="inline-flex mt-4 text-primary text-sm font-bold">
            Back to activities
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto w-full px-6 py-10">
      <div className="mb-5">
        <Button
          variant="ghost"
          className="h-9 px-2 text-slate-500 hover:text-slate-900"
          onClick={() => navigate("/employee/activities")}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to activities
        </Button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-7 py-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl font-display text-slate-900">Withdraw from Activity</h1>
              <p className="text-xs text-slate-500 mt-0.5">{activity.title}</p>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="px-7 py-6 space-y-5">
            <p className="text-sm text-slate-600 leading-relaxed">
              Your manager will be notified immediately. This action is logged in your history but does not affect your skill score.
            </p>

            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-rose-500">
                Reason for withdrawal <span className="text-rose-400">*</span>
              </p>
              <Textarea
                placeholder="e.g., Schedule conflict due to an urgent project deadline, personal emergency, etc."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-36 bg-slate-50 border-slate-200 rounded-2xl p-4 text-sm resize-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300"
              />
              {reason.length > 0 && reason.trim().length === 0 && (
                <p className="text-xs text-rose-500">Reason cannot be empty.</p>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="px-7 py-5 border-t border-slate-100 bg-white flex gap-3">
          <Button
            variant="outline"
            disabled={submitting}
            onClick={() => navigate("/employee/activities")}
            className="flex-1 rounded-xl h-11 font-bold text-[10px] uppercase tracking-widest"
          >
            Cancel
          </Button>
          <Button
            disabled={!reason.trim() || submitting}
            onClick={submitWithdrawal}
            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-xl h-11 font-bold text-[10px] uppercase tracking-widest"
          >
            {submitting ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <LogOut className="w-3 h-3 mr-2" />}
            Confirm Withdrawal
          </Button>
        </div>
      </div>
    </div>
  )
}
