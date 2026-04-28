"use client"

import React from "react"
import { ActivityForm } from "@/components/activities/activity-form"
import { DashboardHeader } from "@/components/dashboard/header"

export default function AdminActivityAddPage() {
    return (
        <main id="main-content" className="flex flex-col bg-[#F8FAFC] min-h-screen page-transition" aria-label="Create activity page">
            <DashboardHeader
                title="Add Activity"
                description="Create a new activity or training program for employees."
            />
            <section className="flex-1 p-10 max-w-7xl mx-auto w-full" aria-label="Activity creation form">
                <ActivityForm mode="create" />
            </section>
        </main>
    )
}
