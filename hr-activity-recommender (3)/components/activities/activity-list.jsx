"use client"

import React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useData } from "@/lib/data-store"
import { getActivityTypeLabel, getStatusColor, getSkillLevelColor, cn } from "@/lib/utils"
import {
  Search,
  Calendar,
  MapPin,
  Users,
  Clock,
  Target,
  GraduationCap,
  Award,
  Briefcase,
  FileCheck,
  Compass,
  Filter,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  ArrowRight
} from "lucide-react"

import { ActivityDialog } from "@/components/dialogs/activity-dialog"
import { EnrollmentDialog } from "@/components/dialogs/enrollment-dialog"
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { toast } from "sonner"



export function ActivityList({ onSelectActivity }) {
  const { activities, deleteActivity, enrollments } = useData()
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  // Dialog states
  const [activityDialogOpen, setActivityDialogOpen] = useState(false)
  const [activityDialogMode, setActivityDialogMode] = useState("create")
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [activityToDelete, setActivityToDelete] = useState(null)

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = typeFilter === "all" || activity.type === typeFilter

    return matchesSearch && matchesType
  })

  const getTypeIcon = (type) => {
    switch (type) {
      case "training": return GraduationCap
      case "certification": return Award
      case "project": return Briefcase
      case "mission": return Compass
      case "audit": return FileCheck
      default: return Target
    }
  }

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case "upskilling": return "Skill Improvement"
      case "consolidation": return "Knowledge Foundation"
      case "expertise": return "Expertise Sharing"
      default: return priority?.toUpperCase()
    }
  }

  // Activity counts by status
  const statusCounts = {
    all: activities.length,
    upcoming: activities.filter((a) => a.status === "upcoming").length,
    ongoing: activities.filter((a) => a.status === "ongoing").length,
    completed: activities.filter((a) => a.status === "completed").length,
  }

  const handleCreateActivity = () => {
    setSelectedActivity(null)
    setActivityDialogMode("create")
    setActivityDialogOpen(true)
  }

  const handleEditActivity = (activity, e) => {
    e.stopPropagation()
    setSelectedActivity(activity)
    setActivityDialogMode("edit")
    setActivityDialogOpen(true)
  }

  const handleDeleteClick = (activity, e) => {
    e.stopPropagation()
    setActivityToDelete(activity)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (activityToDelete) {
      deleteActivity(activityToDelete.id)
      toast.success(`${activityToDelete.title} has been deleted`)
      setActivityToDelete(null)
    }
    setDeleteDialogOpen(false)
  }

  return (
    <div className="space-y-10 p-10">
      {/* Filters */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between pb-10 border-b border-[#EEEEEE]">
        <div className="relative flex-1 max-w-xl group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#F28C1B] transition-colors" />
          <input
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#EEEEEE] border-none rounded-[4px] py-4 pl-14 pr-6 text-[10px] font-bold text-[#222222] tracking-widest focus:outline-none focus:ring-1 focus:ring-[#F28C1B]/50 transition-all placeholder:text-gray-300"
          />
        </div>
        <div className="flex items-center gap-6">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] h-14 bg-white border-[#EEEEEE] rounded-[4px] text-[10px] font-bold tracking-widest hover:border-[#F28C1B]/30 transition-all">
              <SelectValue placeholder="TYPE FILTER" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#EEEEEE] rounded-[4px]">
              <SelectItem value="all" className="text-[10px] font-bold tracking-widest py-4 ">ALL TYPES</SelectItem>
              <SelectItem value="training" className="text-[10px] font-bold tracking-widest py-4 ">TRAINING</SelectItem>
              <SelectItem value="certification" className="text-[10px] font-bold tracking-widest py-4 ">CERTIFICATION</SelectItem>
              <SelectItem value="project" className="text-[10px] font-bold tracking-widest py-4 ">PROJECT</SelectItem>
              <SelectItem value="mission" className="text-[10px] font-bold tracking-widest py-4 ">MISSION</SelectItem>
              <SelectItem value="audit" className="text-[10px] font-bold tracking-widest py-4 ">AUDIT</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={handleCreateActivity}
            className="h-14 px-10 bg-[#222222] text-white rounded-[4px] text-[10px] font-bold tracking-[0.2em] shadow-lg shadow-[#222222]/10 active:scale-95 hover:bg-[#F28C1B] transition-all flex items-center gap-3"
          >
            <Plus className="h-4 w-4" /> ADD ACTIVITY
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-[#EEEEEE] p-1 rounded-[4px] h-12 mb-10">
          <TabsTrigger value="all" className="px-8 font-bold text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#222222] rounded-[2px] transition-all whitespace-nowrap ">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="upcoming" className="px-8 font-bold text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#222222] rounded-[2px] transition-all whitespace-nowrap ">Upcoming ({statusCounts.upcoming})</TabsTrigger>
          <TabsTrigger value="ongoing" className="px-8 font-bold text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#222222] rounded-[2px] transition-all whitespace-nowrap ">Ongoing ({statusCounts.ongoing})</TabsTrigger>
          <TabsTrigger value="completed" className="px-8 font-bold text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#222222] rounded-[2px] transition-all whitespace-nowrap ">Completed ({statusCounts.completed})</TabsTrigger>
        </TabsList>

        {["all", "upcoming", "ongoing", "completed"].map((status) => (
          <TabsContent key={status} value={status} className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid gap-8 md:grid-cols-2">
              {filteredActivities
                .filter((a) => status === "all" || a.status === status)
                .map((activity) => {
                  const Icon = getTypeIcon(activity.type)
                  const seatsRemaining = activity.availableSeats - (enrollments[activity.id || activity._id]?.length || activity.enrolledCount || 0)

                  return (
                    <Card
                      key={activity.id}
                      className="cursor-pointer transition-all hover:border-[#F28C1B]/30 hover:shadow-xl hover:shadow-[#F28C1B]/5 border-[#EEEEEE] bg-white rounded-[4px] group relative overflow-hidden"
                      onClick={() => onSelectActivity?.(activity)}
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#EEEEEE]/30 rounded-full -mr-12 -mt-12 group-hover:bg-[#F28C1B]/5 transition-colors"></div>
                      <CardHeader className="pb-6 p-8 relative">
                        <div className="flex items-start justify-between gap-6">
                          <div className="flex items-start gap-6">
                            <div className="rounded-[4px] p-4 bg-[#EEEEEE] text-[#F28C1B] group-hover:bg-[#F28C1B] group-hover:text-white transition-all">
                              <Icon className="h-6 w-6" />
                            </div>
                            <div>
                              <CardTitle className="text-xl font-bold text-[#222222] leading-none tracking-tighter mb-4 group-hover:text-[#F28C1B] transition-colors">
                                {activity.title}
                              </CardTitle>
                              <div className="flex flex-wrap items-center gap-3">
                                <Badge variant="outline" className="text-[8px] font-bold tracking-widest rounded-[2px] bg-[#EEEEEE] text-gray-500 border-none px-2.5 py-1 ">
                                  {activity.type.toUpperCase()}
                                </Badge>
                                <Badge className={cn("text-[8px] font-bold tracking-widest rounded-[2px] border-none px-2.5 py-1 ",
                                  activity.status === "upcoming" ? "bg-amber-500/10 text-amber-500" :
                                    activity.status === "ongoing" ? "bg-emerald-500/10 text-emerald-500" :
                                      "bg-gray-100 text-gray-500"
                                )}>
                                  {activity.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 p-8">
                        <p className="text-xs text-gray-500 font-medium mb-8 line-clamp-2 leading-relaxed border-l-2 border-[#EEEEEE] pl-4">
                          "{activity.description}"
                        </p>

                        <div className="grid grid-cols-2 gap-6 mb-8 pt-4">
                          <div className="flex items-center gap-4 text-gray-400">
                            <Calendar className="h-4 w-4 text-[#F28C1B]" />
                            <span className="text-[9px] font-bold tracking-widest text-[#222222]">
                              {new Date(activity.startDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-gray-400">
                            <Users className={cn(
                              "h-4 w-4",
                              seatsRemaining <= 3 ? "text-rose-500" : "text-emerald-500"
                            )}>
                            </Users>
                            <span className="text-[9px] font-bold tracking-widest text-[#222222]">{seatsRemaining} SEATS LEFT</span>
                          </div>
                        </div>

                        <div className="pt-8 border-t border-[#EEEEEE] flex items-center justify-between">
                          <span className="flex items-center gap-3 text-[9px] font-bold text-[#F28C1B] tracking-[0.2em] ">
                            <Target className="h-4 w-4" />
                            {getPriorityLabel(activity.priorityContext)}
                          </span>
                          <div className="flex items-center gap-3 text-[#222222] text-[9px] font-bold tracking-widest group-hover:translate-x-1 transition-transform ">
                            VIEW DETAILS <ArrowRight className="w-4 h-4 text-[#F28C1B]" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
            {filteredActivities.filter((a) => status === "all" || a.status === status).length === 0 && (
              <div className="text-center py-24 border border-[#EEEEEE] border-dashed rounded-[4px] text-[10px] font-bold text-gray-400 tracking-widest ">
                NO ACTIVITIES FOUND IN THIS SECTION.
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Results count */}
      <div className="flex items-center justify-between pt-10 border-t border-[#EEEEEE]">
        <p className="text-[10px] font-bold text-gray-400 tracking-[0.3em]">
          Total results: <span className="text-[#222222]">{filteredActivities.length}</span> / {activities.length} Activities
        </p>
        <div className="flex gap-3">
          {[1, 2, 3].map(p => (
            <button key={p} className={cn("w-10 h-10 rounded-[4px] text-[10px] font-bold transition-all border", p === 1 ? "bg-[#222222] text-white border-[#222222]" : "bg-white text-gray-400 border-[#EEEEEE] hover:border-[#F28C1B]/30 hover:text-[#F28C1B]")}>{p}</button>
          ))}
        </div>
      </div>

      {/* Dialogs */}
      <ActivityDialog
        open={activityDialogOpen}
        onOpenChange={setActivityDialogOpen}
        activity={selectedActivity}
        mode={activityDialogMode}
      />

      {selectedActivity && (
        <EnrollmentDialog
          open={enrollmentDialogOpen}
          onOpenChange={setEnrollmentDialogOpen}
          activity={selectedActivity}
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Activity"
        description={`Are you sure you want to delete activity "${activityToDelete?.title}"? This action cannot be undone and will remove all enrolled participants.`}
        confirmText="Confirm Delete"
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </div>
  )
}

