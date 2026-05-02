"use client"

import { useData } from "@/lib/data-store"
import { useMemo } from "react"
import { CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export function HrParticipationStats() {
  const { participations } = useData()

  const stats = useMemo(() => {
    if (!participations || !Array.isArray(participations)) {
      return { total: 0, accepted: 0, declined: 0, pending: 0 }
    }

    let accepted = 0
    let declined = 0
    let pending = 0

    participations.forEach(p => {
      // If it has progressed beyond 'accepted', it means it was accepted initially
      if (
        p.status === "accepted" || 
        p.status === "in_progress" || 
        p.status === "awaiting_organizer" || 
        p.status === "awaiting_manager" || 
        p.status === "validated" || 
        p.status === "completed"
      ) {
        accepted++
      } else if (p.status === "declined" || p.status === "rejected") {
        declined++
      } else if (p.status === "pending_response") {
        pending++
      } else if (p.status === "not_completed" && p.declinedAt) {
        declined++
      } else if (p.status === "not_completed") {
        // Technically accepted initially, just failed to complete
        accepted++
      }
    })

    const total = accepted + declined + pending

    return { total, accepted, declined, pending }
  }, [participations])

  if (stats.total === 0) return null

  const acceptedPct = Math.round((stats.accepted / stats.total) * 100) || 0
  const declinedPct = Math.round((stats.declined / stats.total) * 100) || 0
  const pendingPct = Math.round((stats.pending / stats.total) * 100) || 0

  return (
    <div className="bg-white rounded-[3rem] p-8 shadow-premium border border-slate-50 overflow-hidden">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
        </div>
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest leading-none">
          Activity Offer Acceptance Rates
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <p className="text-[10px] font-black text-green-700 uppercase tracking-widest">Accepted</p>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.accepted}</p>
          <p className="text-xs font-bold text-slate-500 mt-1">{acceptedPct}% of total</p>
        </div>

        <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <p className="text-[10px] font-black text-red-700 uppercase tracking-widest">Declined</p>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.declined}</p>
          <p className="text-xs font-bold text-slate-500 mt-1">{declinedPct}% of total</p>
        </div>

        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">No Response</p>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.pending}</p>
          <p className="text-xs font-bold text-slate-500 mt-1">{pendingPct}% of total</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>Acceptance Ratio</span>
          <span className={acceptedPct > 70 ? "text-green-600" : "text-amber-500"}>{acceptedPct}%</span>
        </div>
        <Progress value={acceptedPct} className="h-3" />
        <p className="text-[10px] text-slate-400 mt-2 italic font-medium leading-relaxed">
          * A high declination rate may indicate mismatched assignments or scheduling conflicts. Check declination reasons in the analytics panel.
        </p>
      </div>
    </div>
  )
}
