"use client"

import { Card, CardContent, CardHeader, CardTitle } from "/components/ui/card"
import { Users, Sparkles, Calendar, TrendingUp, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react"
import { cn } from "/lib/utils"
import { useData } from "/lib/data-store"

export function StatsCards() {
  const { employees, activities, evaluations, participations, loading } = useData()

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-2xl" />
        ))}
      </div>
    )
  }

  const activeActivitiesCount = activities?.filter(a => a.status === "active").length || 0
  const upcomingActivitiesCount = activities?.filter(a => a.status === "upcoming" || a.workflowStatus === "approved").length || 0
  
  // Calculate completion rate based on participations
  const totalParticipations = participations?.length || 0
  const completedParticipations = participations?.filter(p => p.status === "completed").length || 0
  const completionRate = totalParticipations > 0
    ? ((completedParticipations / totalParticipations) * 100).toFixed(1)
    : "0.0"

  const stats = [
    {
      title: "Total Users",
      value: employees?.length || 0,
      change: null,
      icon: Users,
      description: "Employees in the system",
      color: "orange"
    },
    {
      title: "Active Development",
      value: activeActivitiesCount,
      change: upcomingActivitiesCount > 0 ? `${upcomingActivitiesCount} Planned` : null,
      trend: "up",
      icon: Calendar,
      description: "Active and upcoming activities",
      color: "blue"
    },
    {
      title: "Skill Validations",
      value: evaluations?.length || 0,
      change: null,
      icon: Sparkles,
      description: "Total performance reviews",
      color: "blue"
    },
    {
      title: "Dev Completion",
      value: `${completionRate}%`,
      change: null,
      icon: TrendingUp,
      description: "Completed activities",
      color: "purple"
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon

        return (
          <Card key={stat.title} className="relative overflow-hidden bg-white border border-slate-100 rounded-2xl shadow-sm group hover:border-primary/30 transition-all duration-500">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-[10px] font-sans font-medium text-slate-400 tracking-[0.2em] ">
                {stat.title}
              </CardTitle>
              <div className={cn(
                "p-2.5 rounded-xl transition-all duration-500",
                stat.color === "orange" ? "bg-orange-50 text-orange-500 group-hover:bg-primary group-hover:text-white" :
                  stat.color === "blue" ? "bg-blue-50 text-accent-blue group-hover:bg-accent-blue group-hover:text-white" :
                    stat.color === "emerald" ? "bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white" :
                      "bg-blue-50 text-accent-blue group-hover:bg-accent-blue group-hover:text-white"
              )}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-display font-semibold text-slate-900 tracking-tighter">{stat.value}</span>
                {stat.change && (
                  <div className={cn(
                    "flex items-center gap-0.5 text-[9px] font-sans font-medium tracking-widest",
                    stat.trend === "up" ? "text-emerald-500" : "text-slate-500"
                  )}>
                    {stat.trend === "up" && <ArrowUpRight className="h-3 w-3" />}
                    {stat.change}
                  </div>
                )}
              </div>
              <p className="mt-3 text-[9px] font-sans font-medium text-slate-400 tracking-widest uppercase opacity-60 leading-relaxed">{stat.description}</p>

              <div className={cn(
                "absolute bottom-0 left-0 w-full h-1 bg-transparent group-hover:opacity-100 transition-all duration-500",
                stat.color === "orange" ? "bg-primary" :
                  stat.color === "blue" ? "bg-accent-blue" :
                    stat.color === "emerald" ? "bg-emerald-500" : "bg-accent-blue"
              )}></div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
