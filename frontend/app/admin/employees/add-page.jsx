"use client"

import React from "react"
import { EmployeeForm } from "/components/employees/employee-form"
import { DashboardHeader } from "/components/dashboard/header"

export default function AdminEmployeeAddPage() {
    return (
        <div className="flex flex-col bg-[#F8FAFC] min-h-screen page-transition">
            <DashboardHeader
                title="Add User"
                description="Create a new user profile and assign them to a department"
            />
            <div className="flex-1 p-10 max-w-7xl mx-auto w-full">
                <EmployeeForm mode="create" />
            </div>
        </div>
    )
}
