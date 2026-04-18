"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "/components/ui/card"
import { Badge } from "/components/ui/badge"
import { Button } from "/components/ui/button"
import { Progress } from "/components/ui/progress"
import { Separator } from "/components/ui/separator"
import { useData } from "/lib/data-store"
import { getActivityTypeLabel, getStatusColor, getSkillLevelColor, getSkillTypeLabel, cn } from "/lib/utils"
import {
  X,
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
  Brain,
  Sparkles,
  UserPlus,
  Edit
} from "lucide-react"

import { ActivityDialog } from "/components/dialogs/activity-dialog"
import { EnrollmentDialog } from "/components/dialogs/enrollment-dialog"



export function ActivityDetail({ activity: initialActivity, onClose, onGetRecommendations }) {
  const { activities, enrollments } = useData()

  // Get latest activity data from store
  const activity = activities.find(a => a.id === initialActivity.id) || initialActivity

  const [activityDialogOpen, setActivityDialogOpen] = useState(false)
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false)

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
      case "upskilling": return "Deep Upskilling"
      case "consolidation": return "Core Consolidation"
      case "expertise": return "Expertise Sync"
      default: return priority?.toUpperCase()
    }
  }

  const Icon = getTypeIcon(activity.type)
  const enrolledCount = enrollments[activity.id || activity._id]?.length || activity.enrolledCount || 0
  const seatsRemaining = activity.availableSeats - enrolledCount
  const fillPercentage = (enrolledCount / activity.availableSeats) * 100

  return (
    <Card className="border-none shadow-none bg-white rounded-[4px] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#EEEEEE]/30 rounded-full -mr-24 -mt-24 pointer-events-none"></div>

      <CardHeader className="relative p-10 pb-10 border-b border-[#EEEEEE]">
        <button
          onClick={onClose}
          className="absolute right-8 top-8 p-3 bg-[#EEEEEE] rounded-[4px] hover:bg-[#F28C1B] hover:text-white text-[#222222] transition-all z-10"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-8 pt-4 relative">
          <div className="rounded-[4px] p-6 bg-[#EEEEEE] text-[#F28C1B] shadow-sm">
            <Icon className="h-10 w-10" />
          </div>
          <div className="flex-1 pr-12">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge variant="outline" className="text-[9px] font-bold tracking-widest rounded-[2px] bg-[#EEEEEE] text-[#222222] border-none px-3 py-1.5 ">
                {getActivityTypeLabel(activity.type).toUpperCase()}
              </Badge>
              <Badge className={cn("text-[9px] font-bold tracking-widest rounded-[2px] border-none px-3 py-1.5 ",
                activity.status === "upcoming" ? "bg-amber-500/10 text-amber-500" :
                  activity.status === "ongoing" ? "bg-emerald-500/10 text-emerald-500" :
                    "bg-gray-100 text-gray-500"
              )}>
                {activity.status}
              </Badge>
            </div>
            <CardTitle className="text-3xl font-bold text-[#222222] leading-none tracking-tighter mb-1">
              {activity.title}
            </CardTitle>
            <p className="text-[10px] font-bold text-[#F28C1B] tracking-[.4em] mt-2 shadow-shadow shadow-[#F28C1B]/10">STATUS: {activity.status.toUpperCase()}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-12 p-10">
        {/* Quick Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => setActivityDialogOpen(true)}
            className="flex-1 bg-[#EEEEEE] text-[#222222] font-bold rounded-[4px] text-[10px] h-14 tracking-widest hover:bg-[#F28C1B] hover:text-white transition-all flex items-center justify-center gap-3 active:scale-95 "
          >
            <Edit className="h-4 w-4" />
            Edit Activity
          </button>
          <button
            onClick={() => setEnrollmentDialogOpen(true)}
            className="flex-1 bg-[#222222] text-white font-bold rounded-[4px] text-[10px] h-14 tracking-widest hover:bg-[#F28C1B] transition-all flex items-center justify-center gap-3 active:scale-95 "
          >
            <UserPlus className="h-4 w-4" />
            Manage Participants
          </button>
        </div>

        {/* Description */}
        <div className="relative">
          <h4 className="text-[10px] font-bold text-[#F28C1B] tracking-[0.3em] mb-4 ">Description</h4>
          <p className="text-xs text-gray-500 font-medium leading-relaxed border-l-2 border-[#EEEEEE] pl-6 py-1">
            "{activity.description}"
          </p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-6">
          <div className="p-6 rounded-[4px] bg-[#F8FAFC] border border-[#EEEEEE] hover:border-[#F28C1B]/20 transition-all">
            <p className="text-[9px] font-bold text-gray-300 tracking-widest mb-2 leading-none">Start Date</p>
            <p className="text-sm font-bold text-[#222222] tracking-tighter ">
              {new Date(activity.startDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              })}
            </p>
          </div>
          <div className="p-6 rounded-[4px] bg-[#F8FAFC] border border-[#EEEEEE] hover:border-[#F28C1B]/20 transition-all">
            <p className="text-[9px] font-bold text-gray-300 tracking-widest mb-2">Duration</p>
            <p className="text-sm font-bold text-[#222222] tracking-tighter leading-none">{activity.duration}</p>
          </div>
          <div className="p-6 rounded-[4px] bg-[#F8FAFC] border border-[#EEEEEE] hover:border-[#F28C1B]/20 transition-all">
            <p className="text-[9px] font-bold text-gray-300 tracking-widest mb-2">Location</p>
            <p className="text-sm font-bold text-[#222222] tracking-tighter leading-none">{activity.location}</p>
          </div>
          <div className="p-6 rounded-[4px] bg-[#F8FAFC] border border-[#EEEEEE] hover:border-[#F28C1B]/20 transition-all">
            <p className="text-[9px] font-bold text-gray-300 tracking-widest mb-2">Priority</p>
            <p className="text-sm font-bold text-[#F28C1B] tracking-tighter leading-none">{getPriorityLabel(activity.priorityContext)}</p>
          </div>
        </div>

        {/* Seats */}
        <div className="bg-[#EEEEEE]/50 p-8 rounded-[4px] border border-[#EEEEEE]">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-[10px] font-bold text-[#222222] tracking-widest flex items-center gap-3 ">
              <Users className="h-4 w-4 text-[#F28C1B]" />
              Capacity
            </h4>
            <span className={cn(
              "text-sm font-bold tracking-tighter ",
              seatsRemaining <= 3 ? "text-rose-500" : "text-[#222222]"
            )}>
              {enrolledCount} / {activity.availableSeats} Units
            </span>
          </div>
          <div className="h-1.5 w-full bg-[#EEEEEE] rounded-full overflow-hidden">
            <div className="h-full bg-[#F28C1B] transition-all duration-1000 origin-left" style={{ width: `${fillPercentage}%` }}></div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <p className="text-[9px] text-gray-400 font-bold tracking-[0.2em] ">
              {seatsRemaining} operational slots identified
            </p>
            <span className="text-[9px] font-bold text-[#222222] bg-white px-3 py-1 rounded-[2px]">{Math.round(fillPercentage)}% LOAD</span>
          </div>
        </div>

        {/* Required Skills */}
        <div>
          <h4 className="text-[10px] font-bold text-[#F28C1B] tracking-[0.3em] mb-6 flex items-center gap-3 ">
            <Sparkles className="h-4 w-4" />
            Required Skills
          </h4>
          <div className="space-y-4">
            {activity.requiredSkills.map((rs) => (
              <div
                key={rs.skillId}
                className="flex items-center justify-between p-5 rounded-[4px] bg-white border border-[#EEEEEE] shadow-sm hover:border-[#F28C1B]/30 hover:shadow-lg hover:shadow-[#F28C1B]/5 transition-all group"
              >
                <div>
                  <p className="text-sm font-bold text-[#222222] tracking-tighter group-hover:text-[#F28C1B] transition-colors">{rs.skill?.name || 'Skill Point'}</p>
                  <p className="text-[9px] text-gray-400 font-bold tracking-widest mt-1">{getSkillTypeLabel(rs.skill?.type)}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end">
                    <p className="text-[8px] font-bold text-gray-300 tracking-widest mb-1">REQ LEVEL</p>
                    <Badge className={cn("text-[9px] font-bold tracking-widest rounded-[2px] border-none px-3 py-1 ", getSkillLevelColor(rs.requiredLevel))}>
                      {rs.requiredLevel}
                    </Badge>
                  </div>
                  <div className="h-10 w-[1px] bg-[#EEEEEE]"></div>
                  <div className="flex flex-col items-end">
                    <p className="text-[8px] font-bold text-gray-300 tracking-widest mb-1">WEIGHT</p>
                    <span className="text-[10px] font-bold text-[#222222] tracking-widest bg-[#EEEEEE] px-2 py-1 rounded-[2px]">
                      {rs.weight}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-6 relative">
          <button
            className="w-full bg-[#f28c1b] text-white font-black hover:bg-[#D97812] tracking-[0.2em] text-[11px] h-20 rounded-[4px] shadow-2xl shadow-[#F28C1B]/20 transition-all active:scale-95 flex items-center justify-center gap-4 group "
            onClick={onGetRecommendations}
          >
            <Brain className="h-6 w-6 group-hover:scale-110 transition-transform" />
            Get AI Recommendations
          </button>
        </div>
      </CardContent>

      <ActivityDialog
        open={activityDialogOpen}
        onOpenChange={setActivityDialogOpen}
        activity={activity}
        mode="edit"
      />

      <EnrollmentDialog
        open={enrollmentDialogOpen}
        onOpenChange={setEnrollmentDialogOpen}
        activity={activity}
      />
    </Card>
  )
}

