"use client"

import { useState } from "react"
import { useData } from "@/lib/data-store"
import { DashboardHeader } from "@/components/dashboard/header"
import { EmployeeTable } from "@/components/employees/employee-table"
import { cn } from "@/lib/utils"

import { Search, Plus, Filter, Check, ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useNavigate } from "react-router-dom"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"

export default function AdminEmployeesPage() {
  const { employees } = useData()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("score-desc")
  const [deptFilter, setDeptFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [managerFilter, setManagerFilter] = useState("all")

  const rolePrefix = user?.role?.toLowerCase() === "hr" ? "/hr" : "/admin"

  const uniqueDepts = Array.from(new Set(employees?.map(e => e.department).filter(Boolean)))
  const activeFiltersCount = [deptFilter, roleFilter, managerFilter].filter(f => f !== "all").length

  const handleClearFilters = () => {
    setDeptFilter("all")
    setRoleFilter("all")
    setManagerFilter("all")
  }

    const handleViewEmployee = (employee) => {
        const employeeId = employee?.id || employee?._id
        if (!employeeId) return
        navigate(`${rolePrefix}/employees/${employeeId}`)
    }

  return (
    <main id="main-content" className="flex flex-col bg-[#F8FAFC] min-h-screen page-transition text-slate-600">
      <DashboardHeader title="Users" description="Manage your team members and their profiles." />

      <section aria-label="Employee management content" className="flex-1 p-6 md:p-10 max-w-350 mx-auto w-full animate-in fade-in duration-700 space-y-12">
        <section aria-labelledby="filters-heading" className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-4">
            <h2 id="filters-heading" className="sr-only">Search and Filter Options</h2>
            <div className="flex flex-wrap items-center gap-6 w-full lg:w-auto">
                <div className="relative group w-full md:w-125">
                    <Label htmlFor="employee-search" className="sr-only">
                        Search employees by name, email, or ID
                    </Label>
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" aria-hidden="true" />
                    <input
                        id="employee-search"
                        type="text"
                        placeholder="SEARCH USERS..."
                        aria-label="Search employees by name, email, or ID"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-16 pr-6 h-18 bg-white border-2 border-slate-50 rounded-[2.5rem] text-[11px] font-black tracking-[0.2em] text-slate-950 placeholder:text-slate-300 focus:outline-none focus:border-primary/20 focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 shadow-premium transition-all uppercase"
                    />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button 
                            aria-label={activeFiltersCount > 0 ? `${activeFiltersCount} active filters, click to modify` : "Open filter options"}
                            variant="outline"
                            className={cn(
                                "h-18 px-10 rounded-[2.5rem] font-black text-[11px] tracking-widest uppercase transition-all shadow-premium gap-4 border-2 border-slate-50 focus:ring-2 focus:ring-offset-2 focus:ring-primary/50",
                                activeFiltersCount > 0 ? "bg-primary/5 border-primary/20 text-primary" : "bg-white text-slate-900 hover:bg-slate-50"
                            )}
                        >
                            <Filter className="h-6 w-6 text-primary" aria-hidden="true" />
                            {activeFiltersCount > 0 ? `Filters (${activeFiltersCount})` : "Options"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-95 p-10 bg-white border-none rounded-[3rem] shadow-2xl space-y-10 mt-6 animate-in fade-in slide-in-from-top-4" align="end">
                        <div className="space-y-10">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Advanced Filters</h4>
                                {activeFiltersCount > 0 && (
                                    <button type="button" onClick={handleClearFilters} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 rounded px-2 py-1">Clear</button>
                                )}
                            </div>

                            <div className="space-y-6">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mastery Sort</label>
                                <div className="flex flex-col gap-3">
                                    {[
                                        { id: "score-desc", label: "Top Mastery First", icon: ArrowDownWideNarrow },
                                        { id: "score-asc", label: "Needs Training", icon: ArrowUpNarrowWide }
                                    ].map(opt => {
                                        const Icon = opt.icon
                                        return (
                                        <button 
                                            type="button"
                                            key={opt.id}
                                            onClick={() => setSortBy(opt.id)}
                                            aria-pressed={sortBy === opt.id}
                                            className={cn("px-6 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-left transition-all border flex items-center justify-between", sortBy === opt.id ? "bg-slate-950 border-slate-950 text-white shadow-xl" : "bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100 hover:scale-[1.02]")}
                                        >
                                            <span className="flex items-center gap-2">
                                                <Icon className="w-4 h-4" aria-hidden="true" />
                                                {opt.label}
                                            </span>
                                            {sortBy === opt.id && <Check className="w-4 h-4" aria-hidden="true" />}
                                        </button>
                                    )})}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sector Filter</label>
                                <div className="max-h-50 overflow-y-auto no-scrollbar flex flex-col gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setDeptFilter("all")}
                                        aria-pressed={deptFilter === "all"}
                                        className={cn("px-6 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-left transition-all border", deptFilter === "all" ? "bg-primary border-primary text-white shadow-xl" : "bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100 hover:scale-[1.02]")}
                                    >Universal Team</button>
                                    {uniqueDepts.map(dept => (
                                        <button 
                                            type="button"
                                            key={dept}
                                            onClick={() => setDeptFilter(dept)}
                                            aria-pressed={deptFilter === dept}
                                            className={cn("px-6 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-left transition-all border", deptFilter === dept ? "bg-primary border-primary text-white shadow-xl" : "bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100 hover:scale-[1.02]")}
                                        >{dept}</button>
                                    ))}
                                </div>
                            </div>

                            <Button 
                                variant="ghost" 
                                onClick={handleClearFilters}
                                className="w-full h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-all active:scale-95"
                            >Reset Dashboard</Button>
                        </div>
                    </PopoverContent>
                </Popover>

                <Button
                    aria-label="Add a new employee to the system"
                    onClick={() => navigate(`${rolePrefix}/employees/add`)}
                    className="bg-slate-950 hover:bg-primary text-white h-18 px-12 rounded-[2.5rem] font-black text-[12px] tracking-widest uppercase transition-all shadow-xl active:scale-95 focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 flex items-center gap-4"
                >
                    <Plus className="h-6 w-6" aria-hidden="true" />
                    New User
                </Button>
            </div>
        </section>

        <section aria-label="Employee directory table" className="bg-white border-2 border-slate-50 rounded-[4rem] shadow-premium overflow-hidden min-h-162.5 pt-4 p-4 animate-in slide-in-from-bottom-5 duration-1000">
            <EmployeeTable 
                onSelectEmployee={handleViewEmployee}
                selectedEmployeeId={null}
                externalSearch={searchQuery}
                sortBy={sortBy}
                deptFilter={deptFilter}
                roleFilter={roleFilter}
                managerFilter={managerFilter}
            />
        </section>
      </section>
    </main>
  )
}
