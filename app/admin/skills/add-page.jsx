"use client"

import React from "react"
import { SkillForm } from "@/components/skills/skill-form"
import { DashboardHeader } from "@/components/dashboard/header"

export default function AdminSkillAddPage() {
    return (
        <main id="main-content" className="flex flex-col bg-[#F8FAFC] min-h-screen page-transition" aria-label="Create skill page">
            <DashboardHeader
                title="Add skill"
                description="Add a new skill to the organizational library"
            />
            <section className="flex-1 p-10 max-w-7xl mx-auto w-full" aria-label="Skill creation form">
                <SkillForm mode="create" />
            </section>
        </main>
    )
}
