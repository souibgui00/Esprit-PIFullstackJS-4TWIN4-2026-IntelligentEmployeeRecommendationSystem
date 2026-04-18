"use client"

import React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useData } from "/lib/data-store"
import { DashboardHeader } from "/components/dashboard/header"
import { EmployeeProfile } from "/components/employees/employee-profile"
import { Badge } from "/components/ui/badge"
import { Button } from "/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function EmployeeProfileViewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { employees, loading } = useData()

  const employee = employees?.find((e) => e.id === id || e._id === id)

  if (loading && !employee) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="flex flex-col bg-[#F8FAFC] min-h-screen">
        <DashboardHeader
          title="USER NOT FOUND"
          description="THE REQUESTED USER COULD NOT BE FOUND IN THE SYSTEM"
        />
        <div className="flex items-center justify-center flex-1 p-20">
          <div className="text-center space-y-4">
            <p className="text-2xl font-black text-slate-800 tracking-tight">USER NOT FOUND</p>
            <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">THE REQUESTED USER PROFILE DOES NOT EXIST.</p>
            <Button onClick={() => navigate(-1)} className="mt-4 bg-slate-900 hover:bg-primary text-white">
              GO BACK
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-[#F8FAFC] min-h-screen page-transition text-slate-600">
      <DashboardHeader
        title="USER PROFILE"
        description={`CONSULT ${employee.name?.toUpperCase() || "USER"} PROFILE`}
      />

      <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
        <div className="mb-5">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="h-10 px-4 rounded-xl font-black text-[9px] tracking-wide uppercase border-slate-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            BACK TO USERS
          </Button>
        </div>

        <div className="bg-white rounded-3xl shadow-premium overflow-hidden ring-1 ring-slate-100">
          <div className="bg-slate-950 h-28 md:h-36 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-[80px] -mr-44 -mt-44 opacity-60"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40"></div>
          </div>

          <div className="px-6 md:px-10 -mt-12 md:-mt-16 relative z-10 pb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
              <div className="bg-white p-2 rounded-3xl shadow-premium inline-block ring-2 ring-slate-50/60">
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-slate-50 flex items-center justify-center text-4xl font-black text-slate-300 border border-slate-100 shadow-inner">
                  {employee?.name?.charAt(0)}
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <Badge className="bg-primary/10 text-primary border-none px-4 py-1 rounded-xl font-black text-[9px] uppercase tracking-[0.12em] mb-2 shadow-sm text-center">
                ACTIVE {employee?.role || "EMPLOYEE"}
              </Badge>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight leading-tight mb-1">
                {employee?.name}<span className="text-primary">.</span>
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.14em] opacity-80 pl-1">
                {employee?.position || employee?.role} // SECTOR: {employee?.department}
              </p>
            </div>

            <div className="pt-2">
              <EmployeeProfile employee={employee} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
