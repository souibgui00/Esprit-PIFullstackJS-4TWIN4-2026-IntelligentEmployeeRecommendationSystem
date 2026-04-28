"use client"

import React from "react"
import { useParams } from "react-router-dom"
import { useData } from "@/lib/data-store"
import { EmployeeForm } from "@/components/employees/employee-form"
import { DashboardHeader } from "@/components/dashboard/header"
import { Loader2 } from "lucide-react"

export default function AdminEmployeeEditPage() {
    const { id } = useParams()
    const { employees, loading } = useData()

    const employee = employees?.find(e => e.id === id || e._id === id)

    if (loading && !employee) {
        return (
            <main id="main-content" className="flex h-screen items-center justify-center" aria-label="Loading user">
                <section role="status" aria-live="polite" className="flex items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" aria-hidden="true" />
                    <p className="text-sm font-semibold text-slate-600">Loading user...</p>
                </section>
            </main>
        )
    }

    if (!employee) {
        return (
            <main id="main-content" className="flex flex-col bg-[#F8FAFC] min-h-screen" aria-label="User not found">
                <DashboardHeader
                    title="User Not Found"
                    description="The requested user could not be found in the system"
                />
                <section className="flex items-center justify-center flex-1 p-20" aria-label="Missing user message">
                    <article className="text-center space-y-4" role="status" aria-live="polite">
                        <p className="text-2xl font-black text-slate-800 tracking-tight">User Not Found</p>
                        <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">The requested user profile does not exist.</p>
                    </article>
                </section>
            </main>
        )
    }

    return (
        <main id="main-content" className="flex flex-col bg-[#F8FAFC] min-h-screen page-transition" aria-label="Edit user page">
            <DashboardHeader
                title={`Edit: ${employee.name}`}
                description={`Update information for ${employee.matricule}`}
            />
            <section className="flex-1 p-10 max-w-7xl mx-auto w-full" aria-label="User edit form">
                <EmployeeForm employee={employee} mode="edit" />
            </section>
        </main>
    )
}
