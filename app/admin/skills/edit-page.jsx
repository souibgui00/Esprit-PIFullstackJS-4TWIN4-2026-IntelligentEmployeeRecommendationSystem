"use client"

import React from "react"
import { useParams } from "react-router-dom"
import { useData } from "@/lib/data-store"
import { SkillForm } from "@/components/skills/skill-form"
import { DashboardHeader } from "@/components/dashboard/header"
import { Loader2, Brain } from "lucide-react"

export default function AdminSkillEditPage() {
    const { id } = useParams()
    const { skills, loading } = useData()

    const skill = skills?.find(s => s.id === id || s._id === id)

    if (loading && !skill) {
        return (
            <main id="main-content" className="flex h-screen items-center justify-center" aria-label="Loading skill">
                <section role="status" aria-live="polite" className="flex items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" aria-hidden="true" />
                    <p className="text-sm font-semibold text-slate-600">Loading skill...</p>
                </section>
            </main>
        )
    }

    if (!skill) {
        return (
            <main id="main-content" className="flex flex-col bg-[#F8FAFC] min-h-screen" aria-label="Skill not found">
                <DashboardHeader
                    title="Skill Not Found"
                    description="We couldn't find the skill you're looking for."
                />
                <section className="flex items-center justify-center flex-1 p-20" aria-label="Missing skill message">
                    <article className="flex flex-col items-center text-center space-y-6 bg-white p-16 rounded-[40px] shadow-2xl shadow-slate-200 border border-slate-100 border-dashed" role="status" aria-live="polite">
                        <div className="w-20 h-20 bg-slate-50 rounded-[30px] flex items-center justify-center text-slate-300" aria-hidden="true">
                            <Brain className="w-10 h-10" aria-hidden="true" />
                        </div>
                        <section className="space-y-2" aria-labelledby="skill-not-found-heading">
                            <p className="text-2xl font-black text-slate-800 tracking-tight">SKILL NOT FOUND</p>
                            <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">The skill might have been deleted or the link is broken.</p>
                        </section>
                    </article>
                </section>
            </main>
        )
    }

    return (
        <main id="main-content" className="flex flex-col bg-[#F8FAFC] min-h-screen page-transition" aria-label="Edit skill page">
            <DashboardHeader
                title={`Edit: ${skill.name}`}
                description={`Update details for ${skill.category.toUpperCase()} skills`}
            />
            <section className="flex-1 p-10 max-w-7xl mx-auto w-full" aria-label="Skill edit form">
                <SkillForm skill={skill} mode="edit" />
            </section>
        </main>
    )
}
