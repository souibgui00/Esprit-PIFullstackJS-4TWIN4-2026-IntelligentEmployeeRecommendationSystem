"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "/components/ui/card"
import { Badge } from "/components/ui/badge"
import { Calendar, MapPin, Users, ArrowRight, Loader2, Zap } from "lucide-react"
import { useData } from "/lib/data-store"
import { getActivityTypeLabel, cn } from "/lib/utils"
import { Link } from "react-router-dom"

export function UpcomingActivities() {
  const { activities, loading, enrollments } = useData()
  const upcomingActivities = activities
    ?.filter(a =>
      (a.status === "upcoming" || a.status === "active" || a.status === "open") &&
      (a.workflowStatus === "approved" || !a.workflowStatus)
    )
    ?.sort((a, b) => new Date(a.date) - new Date(b.date))
    ?.slice(0, 4) || []

  if (loading && activities.length === 0) {
    return (
      <Card className="bg-white border border-slate-100 rounded-2xl shadow-sm h-[500px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    )
  }

  return (
    <Card className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden group">
      <CardHeader className="flex flex-row items-center justify-between p-10 pb-4 border-b border-slate-50">
        <div>
          <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Upcoming Activities</CardTitle>
          <CardDescription className="text-[10px] font-bold text-slate-400 tracking-widest mt-1 uppercase">Recently scheduled training and tasks</CardDescription>
        </div>
        <Link to="/admin/activities" className="flex items-center gap-2 text-[10px] font-black text-primary tracking-[0.2em] hover:translate-x-1 transition-transform uppercase">
          VIEW ALL
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent className="p-10 space-y-6">
        {upcomingActivities.length > 0 ? (
          upcomingActivities.map((activity) => (
            <div
              key={activity.id || activity._id}
              className="flex items-start gap-5 p-6 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:border-primary/30 hover:bg-white hover:shadow-xl hover:shadow-primary/5 group/item"
            >
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-black text-slate-900 tracking-tight group-hover/item:text-primary transition-colors text-lg">{activity.title}</h4>
                    <div className="mt-3 flex items-center gap-3">
                      <Badge variant="outline" className="text-[9px] font-black tracking-widest rounded-lg bg-white text-slate-500 border-slate-200 px-3 py-1 uppercase">
                        {getActivityTypeLabel(activity.type)}
                      </Badge>
                      <Badge className={cn("text-[8px] font-black tracking-widest rounded-lg border-none px-3 py-1 uppercase shadow-sm",
                        activity.status === "upcoming" ? "bg-orange-500 text-white shadow-orange-500/20" : "bg-emerald-500 text-white shadow-emerald-500/20"
                      )}>
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 tracking-widest uppercase">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    {new Date(activity.startDate).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 tracking-widest uppercase">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {activity.location || "TBD"}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-900 tracking-widest bg-white border border-slate-100 px-3 py-1.5 rounded-lg shadow-sm">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    {enrollments[activity.id || activity._id]?.length || activity.enrolledCount || 0} / {activity.availableSeats} SEATS
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
              <Zap className="w-8 h-8" />
            </div>
            <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">No upcoming activities scheduled</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
