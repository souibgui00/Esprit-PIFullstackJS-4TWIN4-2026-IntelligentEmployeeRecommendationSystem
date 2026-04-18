"use client"

import React from "react"
import { useParams } from "react-router-dom"
import { useData } from "/lib/data-store"
import { SkillForm } from "/components/skills/skill-form"
import { DashboardHeader } from "/components/dashboard/header"
import { Loader2, Brain } from "lucide-react"

export default function AdminSkillEditPage() {
    const { id } = useParams()
    const { skills, loading } = useData()

    const skill = skills?.find(s => s.id === id || s._id === id)

    if (loading && !skill) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        )
    }

    if (!skill) {
        return (
            <div className="flex flex-col bg-[#F8FAFC] min-h-screen">
                <DashboardHeader
                    title="Skill Not Found"
                    description="We couldn't find the skill you're looking for."
                />
                <div className="flex items-center justify-center flex-1 p-20">
                    <div className="flex flex-col items-center text-center space-y-6 bg-white p-16 rounded-[40px] shadow-2xl shadow-slate-200 border border-slate-100 border-dashed">
                        <div className="w-20 h-20 bg-slate-50 rounded-[30px] flex items-center justify-center text-slate-300">
                            <Brain className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-2xl font-black text-slate-800 tracking-tight">SKILL NOT FOUND</p>
                            <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">The skill might have been deleted or the link is broken.</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col bg-[#F8FAFC] min-h-screen page-transition">
            <DashboardHeader
                title={`Edit: ${skill.name}`}
                description={`Update details for ${(skill.category || skill.type || "skill").toString().toUpperCase()} skills`}
            />
            <div className="flex-1 p-10 max-w-7xl mx-auto w-full">
                <SkillForm skill={skill} mode="edit" />
            </div>
        </div>
    )
}
