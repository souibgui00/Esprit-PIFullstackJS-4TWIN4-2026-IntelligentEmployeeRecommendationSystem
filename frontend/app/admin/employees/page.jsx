"use client"

import { useState } from "react"
import { useData } from "/lib/data-store"
import { DashboardHeader } from "/components/dashboard/header"
import { EmployeeTable } from "/components/employees/employee-table"
import { cn } from "/lib/utils"

import { Search, Plus, Filter, Check, Edit3 } from "lucide-react"
import { Button } from "/components/ui/button"
import { useAuth } from "/lib/auth-context"
import { useNavigate } from "react-router-dom"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "/components/ui/popover"

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

    const handleSelectEmployee = (employee) => {
        const employeeId = employee?.id || employee?._id
        if (!employeeId) return
        navigate(`${rolePrefix}/employees/profile/${employeeId}`)
    }

  const uniqueDepts = Array.from(new Set(employees?.map(e => e.department).filter(Boolean)))
  const activeFiltersCount = [deptFilter, roleFilter, managerFilter].filter(f => f !== "all").length

  const handleClearFilters = () => {
    setDeptFilter("all")
    setRoleFilter("all")
    setManagerFilter("all")
  }

  return (
    <div className="flex flex-col bg-[#F8FAFC] min-h-screen page-transition text-slate-600">
      <DashboardHeader title="Users" description="Manage your team members and their profiles." />

      <div className="flex-1 p-6 md:p-10 max-w-350 mx-auto w-full animate-in fade-in duration-700 space-y-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-4">
            <div className="flex flex-wrap items-center gap-6 w-full lg:w-auto">
                <div className="relative group w-full md:w-125">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="SEARCH USERS..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-16 pr-6 h-18 bg-white border-2 border-slate-50 rounded-[2.5rem] text-[11px] font-black tracking-[0.2em] text-slate-950 placeholder:text-slate-300 focus:outline-none focus:border-primary/20 shadow-premium transition-all uppercase"
                    />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button 
                            variant="outline"
                            className={cn(
                                "h-18 px-10 rounded-[2.5rem] font-black text-[11px] tracking-widest uppercase transition-all shadow-premium gap-4 border-2 border-slate-50",
                                activeFiltersCount > 0 ? "bg-primary/5 border-primary/20 text-primary" : "bg-white text-slate-900 hover:bg-slate-50"
                            )}
                        >
                            <Filter className="h-6 w-6 text-primary" />
                            {activeFiltersCount > 0 ? `Filters (${activeFiltersCount})` : "Options"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-95 p-10 bg-white border-none rounded-[3rem] shadow-2xl space-y-10 mt-6 animate-in fade-in slide-in-from-top-4" align="end">
                        <div className="space-y-10">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Advanced Filters</h4>
                                {activeFiltersCount > 0 && (
                                    <button onClick={handleClearFilters} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline">Clear</button>
                                )}
                            </div>

                            <div className="space-y-6">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mastery Sort</label>
                                <div className="flex flex-col gap-3">
                                    {[
                                        { id: "score-desc", label: "Top Mastery First " },
                                        { id: "score-asc", label: "Needs Training " }
                                    ].map(opt => (
                                        <button 
                                            key={opt.id}
                                            onClick={() => setSortBy(opt.id)}
                                            className={cn("px-6 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-left transition-all border flex items-center justify-between", sortBy === opt.id ? "bg-slate-950 border-slate-950 text-white shadow-xl" : "bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100 hover:scale-[1.02]")}
                                        >
                                            {opt.label}
                                            {sortBy === opt.id && <Check className="w-4 h-4" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sector Filter</label>
                                <div className="max-h-50 overflow-y-auto no-scrollbar flex flex-col gap-3">
                                    <button 
                                        onClick={() => setDeptFilter("all")}
                                        className={cn("px-6 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-left transition-all border", deptFilter === "all" ? "bg-primary border-primary text-white shadow-xl" : "bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100 hover:scale-[1.02]")}
                                    >Universal Team</button>
                                    {uniqueDepts.map(dept => (
                                        <button 
                                            key={dept}
                                            onClick={() => setDeptFilter(dept)}
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
                    onClick={() => navigate(`${rolePrefix}/employees/add`)}
                    className="bg-slate-950 hover:bg-primary text-white h-18 px-12 rounded-[2.5rem] font-black text-[12px] tracking-widest uppercase transition-all shadow-xl active:scale-95 flex items-center gap-4"
                >
                    <Plus className="h-6 w-6" />
                    New User
                </Button>
            </div>
        </div>

        <div className="bg-white border-2 border-slate-50 rounded-[4rem] shadow-premium overflow-hidden min-h-162.5 pt-4 p-4 animate-in slide-in-from-bottom-5 duration-1000">
            <EmployeeTable 
                onSelectEmployee={handleSelectEmployee}
                externalSearch={searchQuery}
                sortBy={sortBy}
                deptFilter={deptFilter}
                roleFilter={roleFilter}
                managerFilter={managerFilter}
            />
        </div>
      </div>
    </div>
  )
}
