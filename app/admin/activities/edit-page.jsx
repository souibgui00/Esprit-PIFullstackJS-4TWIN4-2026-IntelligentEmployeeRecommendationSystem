"use client"

import React from "react"
import { useParams } from "react-router-dom"
import { useData } from "@/lib/data-store"
import { ActivityForm } from "@/components/activities/activity-form"
import { DashboardHeader } from "@/components/dashboard/header"
import { Loader2, Activity as ActivityIcon } from "lucide-react"

export default function AdminActivityEditPage() {
    const { id } = useParams()
    const { activities, loading } = useData()

    const activity = activities?.find(a => a.id === id || a._id === id)

    if (loading && !activity) {
        return (
            <main id="main-content" className="flex h-screen items-center justify-center" aria-label="Loading activity">
                <section role="status" aria-live="polite" className="flex items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" aria-hidden="true" />
                    <p className="text-sm font-semibold text-slate-600">Loading activity...</p>
                </section>
            </main>
        )
    }

    if (!activity) {
        return (
            <main id="main-content" className="flex flex-col bg-[#F8FAFC] min-h-screen" aria-label="Activity not found">
                <DashboardHeader
                    title="Activity Not Found"
                    description="The requested activity could not be found in the system."
                />
                <section className="flex items-center justify-center flex-1 p-20" aria-label="Missing activity message">
                    <article className="flex flex-col items-center text-center space-y-6 bg-white p-16 rounded-[40px] shadow-2xl shadow-slate-200 border border-slate-100 border-dashed" role="status" aria-live="polite">
                        <div className="w-20 h-20 bg-slate-50 rounded-[30px] flex items-center justify-center text-slate-300" aria-hidden="true">
                            <ActivityIcon className="w-10 h-10" />
                        </div>
                        <section className="space-y-2" aria-labelledby="activity-not-found-heading">
                            <p className="text-2xl font-black text-slate-800 tracking-tight">ACTIVITY NOT FOUND</p>
                            <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">The activity ID is invalid or has been deleted.</p>
                        </section>
                    </article>
                </section>
            </main>
        )
    }

    return (
        <main id="main-content" className="flex flex-col bg-[#F8FAFC] min-h-screen page-transition" aria-label="Edit activity page">
            <DashboardHeader
                title={`Edit: ${activity.title}`}
                description="Update the details and configuration for this activity."
            />
            <section className="flex-1 p-10 max-w-7xl mx-auto w-full space-y-10" aria-label="Activity edit form">
                {activity.workflowStatus === 'rejected' && (
                    <article className="bg-[#0F111A] rounded-[40px] p-10 shadow-2xl relative overflow-hidden group animate-in slide-in-from-bottom duration-700" aria-label="Rejection feedback">
                        <div className="absolute -top-10 -right-10 w-48 h-48 bg-rose-500/10 rounded-full blur-[100px] group-hover:bg-rose-500/20 transition-all duration-1000"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                            <div className="flex-1 space-y-4">
                                <div className="h-10 w-10 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20" aria-hidden="true">
                                    <ActivityIcon className="h-5 w-5 text-rose-500" aria-hidden="true" />
                                </div>
                                <h4 className="text-white font-black text-2xl uppercase tracking-tighter italic">Rejection Feedback Received</h4>
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                    <p className="text-slate-200 text-sm leading-relaxed font-bold italic underline decoration-rose-500/40 underline-offset-8">
                                        "{activity.rejectionReason || 'No specific reason provided by the manager.'}"
                                    </p>
                                </div>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] pt-2">
                                    Requested by {activity.rejectedBy || 'Department Manager'} on {activity.rejectedAt ? new Date(activity.rejectedAt).toLocaleDateString() : 'Recent Date'}
                                </p>
                            </div>
                            <div className="hidden lg:block w-32 h-32 rounded-full border-8 border-rose-500/20 border-t-rose-500 animate-spin-slow"></div>
                        </div>
                    </article>
                )}
                <ActivityForm activity={activity} mode="edit" />
            </section>
        </main>
    )
}
