"use client"

import React from "react"
import { SkillForm } from "/components/skills/skill-form"
import { DashboardHeader } from "/components/dashboard/header"

export default function AdminSkillNewPage() {
    return (
        <div className="flex flex-col bg-[#F8FAFC] min-h-screen page-transition">
            <DashboardHeader
                title="Add skill"
                description="ESTABLISH NEW ORGANIZATIONAL CAPABILITIES WITHIN THE SKILLS TAXONOMY MATRIX"
            />
            <div className="flex-1 p-10 max-w-7xl mx-auto w-full">
                <SkillForm mode="create" />
            </div>
        </div>
    )
}
