"use client"

import React from "react"

import { RoleSidebar } from "@/components/dashboard/role-sidebar"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function EmployeeLayout({ children }) {
  return (
    <AuthGuard allowedRoles={["employee"]}>
      <div className="min-h-screen bg-background">
        <RoleSidebar />
        <main className="pl-16 lg:pl-64 transition-all duration-300">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}



