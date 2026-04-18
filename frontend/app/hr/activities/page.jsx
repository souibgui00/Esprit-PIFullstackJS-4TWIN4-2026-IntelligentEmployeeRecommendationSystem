"use client"

import { useState } from "react"
import { useData } from "/lib/data-store"
import { DashboardHeader } from "/components/dashboard/header"
import { ActivityTable } from "/components/activities/activity-table"
import { cn } from "/lib/utils"
import { Search, Plus, BookOpen } from "lucide-react"
import { Button } from "/components/ui/button"
import { useNavigate } from "react-router-dom"
import { useAuth } from "/lib/auth-context"

export default function HRActivitiesPage() {
  const { activities, enrollments, deleteActivity } = useData()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  const handleEditActivity = (activity) => navigate(`/hr/activities/${activity.id || activity._id}/edit`)
  const handleViewActivity = (activity) => navigate(`/hr/activities/details/${activity.id || activity._id}`)
  
  const handleDeleteActivity = async (id) => {
    try {
      await deleteActivity(id)
    } catch (error) {
      console.error("Deletion failed", error)
    }
  }

  const filteredActivities = activities?.filter(a => {
    const matchesSearch = (a.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
                         (a.description?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || a.type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="flex flex-col bg-[#F8FAFC] min-h-screen page-transition">
      <DashboardHeader 
        title="Training & Learning Hub" 
        description="A clear list of all current programs and skill-building sessions." 
      />

      <div className="flex-1 p-6 md:p-10 max-w-350 mx-auto w-full animate-in fade-in duration-700 space-y-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-4">
            <div className="flex-1 max-w-2xl relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                <input
                    type="text"
                    placeholder="Search by program name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-16 pr-6 h-18 bg-white border-2 border-slate-50 rounded-[2.5rem] text-[11px] font-black tracking-[0.2em] text-slate-950 placeholder:text-slate-300 focus:outline-none focus:border-orange-500/20 shadow-premium transition-all uppercase"
                />
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <div className="flex bg-white/50 backdrop-blur-xl p-2 rounded-[2.5rem] border-2 border-slate-50 shadow-premium">
                    {[
                        { id: "all", label: "Show All" },
                        { id: "COURSE", label: "Courses" },
                        { id: "WORKSHOP", label: "Workshops" },
                    ].map(type => (
                        <button
                            key={type.id}
                            onClick={() => setTypeFilter(type.id)}
                            className={cn(
                                "px-8 py-4 rounded-4xl text-[10px] font-black uppercase tracking-widest transition-all",
                                typeFilter === type.id ? "bg-slate-950 text-white shadow-xl" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>

                <Button
                    onClick={() => navigate(`/hr/activities/new`)}
                    className="bg-primary hover:bg-orange-600 text-white h-18 px-12 rounded-[2.5rem] font-black text-[12px] tracking-widest uppercase transition-all shadow-xl active:scale-95 flex items-center gap-4"
                >
                    <Plus className="h-6 w-6" />
                    Add Session
                </Button>
            </div>
        </div>

        <div className="bg-white border-2 border-slate-50 rounded-[4rem] shadow-premium overflow-hidden min-h-150 pt-4 p-4 animate-in slide-in-from-bottom-5 duration-1000">
            <ActivityTable 
                activities={filteredActivities || []} 
                enrollments={enrollments}
                onDelete={handleDeleteActivity}
                onEdit={handleEditActivity}
                onView={handleViewActivity}
                externalSearch={searchQuery}
            />
        </div>
      </div>
    </div>
  )
}
