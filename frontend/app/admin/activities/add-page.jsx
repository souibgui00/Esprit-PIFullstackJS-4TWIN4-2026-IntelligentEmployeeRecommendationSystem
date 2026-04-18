"use client"

import React from "react"
import { ActivityForm } from "@/components/activities/activity-form"
import { DashboardHeader } from "@/components/dashboard/header"

export default function AdminActivityAddPage() {
    return (
        <div className="flex flex-col bg-[#F8FAFC] min-h-screen page-transition">
            <DashboardHeader
                title="Add Activity"
                description="Create a new activity or training program for employees."
            />
            <div className="flex-1 p-10 max-w-7xl mx-auto w-full">
                <ActivityForm mode="create" />
            </div>
        </div>
    )
}
