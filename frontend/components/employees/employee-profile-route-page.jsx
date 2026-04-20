"use client"

import { useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ChevronLeft } from "lucide-react"

import { useData } from "@/lib/data-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmployeeProfile } from "@/components/employees/employee-profile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"

export function EmployeeProfileRoutePage({ rolePrefix = "/admin", accentClass = "text-primary" }) {
  const navigate = useNavigate()
  const { employeeId } = useParams()
  const { employees = [] } = useData()

  const employee = useMemo(() => {
    return employees.find((item) => String(item.id || item._id) === String(employeeId)) || null
  }, [employees, employeeId])

  const avatarSrc = employee?.avatar || employee?.facePicture || employee?.profilePicture || undefined

  if (!employee) {
    return (
      <div className="max-w-6xl mx-auto w-full px-6 md:px-10 py-10">
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-sm">
          <p className="text-slate-700 font-semibold">Employee not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(`${rolePrefix}/employees`)}>
            Back to employees
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-6 md:px-10 py-8 md:py-10 space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate(`${rolePrefix}/employees`)}
        className="h-9 px-2 text-slate-600"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to employees
      </Button>

      <div className="bg-white rounded-[2.5rem] shadow-premium overflow-hidden ring-1 ring-slate-100">
        <div className="bg-slate-950 h-36 md:h-44 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-primary/20 rounded-full blur-[100px] -mr-64 -mt-64 opacity-60"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40"></div>
        </div>

        <div className="px-8 md:px-14 -mt-16 md:-mt-20 relative z-10 pb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8">
            <div className="bg-white p-3 rounded-3xl shadow-mega inline-block ring-4 ring-slate-50/50">
              <Avatar className="w-24 h-24 md:w-32 md:h-32 rounded-3xl border-2 border-slate-100 shadow-inner bg-slate-50">
                <AvatarImage src={avatarSrc} alt={employee.name || "Employee"} className="object-cover" />
                <AvatarFallback className="text-4xl font-display text-slate-300 bg-slate-50">
                  {getInitials(employee.name)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            <Badge className="bg-primary/10 text-primary border-none px-4 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] mb-3 shadow-sm text-center">
              Active {employee.role || "Employee"}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-display text-slate-900 tracking-tight leading-none">
              {employee.name}
            </h1>
            <p className={`text-[12px] font-bold uppercase tracking-[0.22em] opacity-70 ${accentClass}`}>
              {employee.position || employee.role} / Sector: {employee.department}
            </p>
          </div>

          <EmployeeProfile employee={employee} />
        </div>
      </div>
    </div>
  )
}
