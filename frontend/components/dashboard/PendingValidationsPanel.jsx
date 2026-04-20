"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog"
import {
  CheckCircle2, XCircle, Star, Loader2, Trophy, AlertCircle, ClipboardCheck
} from "lucide-react"

function StarDisplay({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${s <= value ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
        />
      ))}
    </div>
  )
}

/**
 * PendingValidationsPanel
 * Shows all participations in "awaiting_manager" status for this manager's employees.
 * Manager can Validate (triggers skill score update) or Reject (requires reason).
 *
 * Props:
 *  - onValidated: () => void — called after any validation/rejection to refresh parent
 */
export function PendingValidationsPanel({ onValidated }) {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [rejectModal, setRejectModal] = useState(null) // { participationId, employeeName, activityTitle }
  const [rejectReason, setRejectReason] = useState("")
  const [submitting, setSubmitting] = useState(null) // participationId being processed

  const { user } = useAuth()
  const { employees, departments } = useData()

  // Find exactly who this manager is managing to filter results locally
  const getDeptId = (d) => d?.$oid || d?._id || d?.id || d
  const managerDept = departments.find(d => {
    const mId = d.manager_id?._id || d.manager_id?.id || d.manager_id
    return mId?.toString() === user?.id?.toString()
  })
  const uDeptId = getDeptId(user?.department_id) || getDeptId(user?.department) || getDeptId(managerDept)
  const uDeptName = user?.department?.name || user?.department || managerDept?.name || "Unassigned"

  const deptEmployeesIds = employees.filter(e => {
    if ((e.id || e._id) === (user?.id || user?._id)) return false
    const eDeptId = getDeptId(e.department_id) || getDeptId(e.department)
    const eDeptName = e.department || e.department_id?.name || "Unassigned"
    if (uDeptId && eDeptId && uDeptId === eDeptId) return true
    if (uDeptName !== "Unassigned" && String(uDeptName).toLowerCase().trim() === String(eDeptName).toLowerCase().trim()) return true
    return false
  }).map(e => String(e.id || e._id));

  const deptEmployeesIdsString = deptEmployeesIds.join(",");

  const fetchPending = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get("/participations")
      const filtered = (data || []).filter(p => {
        if (p.status !== "awaiting_manager") return false;
        const pUserStr = String(p.userId?._id || p.userId?.id || p.userId);
        return deptEmployeesIdsString.includes(pUserStr); // string contains substring checks safely
      })
      setPending(filtered)
    } catch (err) {
      console.error("[PendingValidationsPanel] Failed to fetch:", err)
    } finally {
      setLoading(false)
    }
  }, [deptEmployeesIdsString])

  useEffect(() => {
    fetchPending()
  }, [fetchPending])

  const handleValidate = async (participationId) => {
    setSubmitting(participationId)
    try {
      await api.post(`/participations/${participationId}/validate`, { validate: true })
      toast.success("🎓 Completion Validated!", {
        description: "Skill scores have been automatically updated for this employee."
      })
      await fetchPending()
      onValidated?.()
    } catch (err) {
      toast.error("Validation failed", { description: err.message })
    } finally {
      setSubmitting(null)
    }
  }

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      toast.error("A rejection reason is required.")
      return
    }
    if (!rejectModal) return
    setSubmitting(rejectModal.participationId)
    try {
      await api.post(`/participations/${rejectModal.participationId}/validate`, {
        validate: false,
        rejectionReason: rejectReason.trim()
      })
      toast.success("Rejection recorded", {
        description: `The completion for ${rejectModal.employeeName} has been marked as not completed.`
      })
      setRejectModal(null)
      setRejectReason("")
      await fetchPending()
      onValidated?.()
    } catch (err) {
      toast.error("Failed to reject", { description: err.message })
    } finally {
      setSubmitting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
      </div>
    )
  }

  if (pending.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="w-16 h-16 bg-green-50 rounded-3xl flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-300" />
        </div>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          No pending validations
        </p>
        <p className="text-xs text-slate-400">
          All completions have been reviewed.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Pending Validations
            </h3>
            <p className="text-xs text-slate-500">
              {pending.length} completion{pending.length > 1 ? "s" : ""} awaiting your final decision
            </p>
          </div>
          <Badge className="ml-auto bg-amber-100 text-amber-700 border-none font-black text-xs px-3 py-1 rounded-xl">
            {pending.length} Pending
          </Badge>
        </div>

        {/* Validation cards */}
        {pending.map((p) => {
          const employee = p.userId || {}
          const activity = p.activityId || {}
          const isProcessing = submitting === p._id

          return (
            <div
              key={p._id}
              className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                {/* Employee info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="w-10 h-10 rounded-2xl border border-slate-100 shrink-0">
                    <AvatarImage src={employee.avatar} />
                    <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-sm rounded-2xl">
                      {employee.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{employee.name || "Employee"}</p>
                    <p className="text-[10px] text-slate-400 truncate font-medium">{employee.email}</p>
                  </div>
                </div>

                {/* Activity info */}
                <div className="flex-1 min-w-0 border-l border-slate-100 pl-4">
                  <p className="font-bold text-slate-800 text-sm truncate">{activity.title || "Activity"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {activity.type && (
                      <Badge className="bg-slate-100 text-slate-500 border-none text-[9px] font-black uppercase tracking-wider px-2 py-0.5">
                        {activity.type}
                      </Badge>
                    )}
                    {activity.level && (
                      <Badge className="bg-blue-50 text-blue-600 border-none text-[9px] font-black uppercase tracking-wider px-2 py-0.5">
                        {activity.level}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Organizer rating & note */}
                <div className="border-l border-slate-100 pl-4 space-y-1 shrink-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Your Rating</p>
                  <StarDisplay value={p.organizerRating || 0} />
                  {p.organizerNote && (
                    <p className="text-[10px] text-slate-500 font-medium italic max-w-45 line-clamp-2 mt-1">
                      "{p.organizerNote}"
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0 md:self-center">
                  <Button
                    onClick={() => {
                        window.location.href = `/manager/validation/${p._id}`
                    }}
                    size="sm"
                    aria-label={`Review validation report for ${employee.name || "employee"}`}
                    className="bg-primary hover:bg-primary-dark text-white font-black text-[9px] uppercase tracking-wider px-5 h-9 rounded-2xl gap-1.5 transition-all shadow-md shadow-primary/20"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Review Validation Report
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
