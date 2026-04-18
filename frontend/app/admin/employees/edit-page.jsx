"use client"

import React from "react"
import { useParams } from "react-router-dom"
import { useData } from "/lib/data-store"
import { EmployeeForm } from "/components/employees/employee-form"
import { DashboardHeader } from "/components/dashboard/header"
import { Loader2 } from "lucide-react"

export default function AdminEmployeeEditPage() {
    const { id } = useParams()
    const { employees, loading } = useData()

    const employee = employees?.find(e => e.id === id || e._id === id)

    if (loading && !employee) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        )
    }

    if (!employee) {
        return (
            <div className="flex flex-col bg-[#F8FAFC] min-h-screen">
                <DashboardHeader
                    title="User Not Found"
                    description="The requested user could not be found in the system"
                />
                <div className="flex items-center justify-center flex-1 p-20">
                    <div className="text-center space-y-4">
                        <p className="text-2xl font-black text-slate-800 tracking-tight">User Not Found</p>
                        <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">The requested user profile does not exist.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col bg-[#F8FAFC] min-h-screen page-transition">
            <DashboardHeader
                title={`Edit: ${employee.name}`}
                description={`Update information for ${employee.matricule}`}
            />
            <div className="flex-1 p-10 max-w-7xl mx-auto w-full">
                <EmployeeForm employee={employee} mode="edit" />
            </div>
        </div>
    )
}
