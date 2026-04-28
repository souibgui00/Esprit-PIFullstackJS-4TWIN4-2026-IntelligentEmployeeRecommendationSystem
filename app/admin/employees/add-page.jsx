"use client"

import React from "react"
import { EmployeeForm } from "@/components/employees/employee-form"
import { DashboardHeader } from "@/components/dashboard/header"

export default function AdminEmployeeAddPage() {
    return (
        <main id="main-content" className="flex flex-col bg-[#F8FAFC] min-h-screen page-transition" aria-label="Create user page">
            <DashboardHeader
                title="Add User"
                description="Create a new user profile and assign them to a department"
            />
            <section className="flex-1 p-10 max-w-7xl mx-auto w-full" aria-label="User creation form">
                <EmployeeForm mode="create" />
            </section>
        </main>
    )
}
