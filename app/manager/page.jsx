"use client"

import { useState } from "react"
import { useData } from "@/lib/data-store"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DashboardHeader } from "@/components/dashboard/header"
import { PendingValidationsPanel } from "@/components/dashboard/PendingValidationsPanel"


import { useNavigate } from "react-router-dom"
import {
  Users,
  TrendingUp,
  Calendar,
  Target,
  Briefcase,
  Clock,
  ArrowRight,
  BarChart3,
  Activity,
  Eye,
  ClipboardList,
  Trophy
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ManagerDashboard() {
  const { employees, activities, enrollments, departments } = useData()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [validationKey, setValidationKey] = useState(0) // incremented to refresh pending validations

  // Helper to extract a string ID from various formats
  const getDeptId = (d) => {
    if (!d) return null;
    if (typeof d === "string") return d;
    const id = d.$oid || d._id || d.id;
    if (id) return id.toString();
    if (typeof d === 'object' && d.toString) return d.toString();
    return null;
  };

  const getDeptName = (d) => {
    if (!d) return "Unassigned";
    if (typeof d === "string") return d;
    return d.name || "Unassigned";
  };

  const managerDept = departments?.find(d => {
    const mId = d.manager_id?._id || d.manager_id?.id || d.manager_id;
    return mId?.toString() === user?.id?.toString();
  });

  const uDeptId = getDeptId(user?.department_id) || getDeptId(user?.department) || getDeptId(managerDept);
  const uDeptName = getDeptName(user?.department_id) || getDeptName(user?.department) || user?.department || managerDept?.name || "Unassigned";

  // Filter employees robustly to only show team members
  const teamMembers = (employees || []).filter(employee => {
    const isSelf = (employee.id || employee._id) === (user?.id || user?._id);
    if (isSelf) return false;

    // Only show regular employees to the manager
    const role = employee.role?.toLowerCase();
    if (role === "admin" || role === "hr") return false;

    const eDeptId = getDeptId(employee?.department_id) || getDeptId(employee?.department);
    const eDeptName = employee?.department || getDeptName(employee?.department_id) || "Unassigned";

    let isSameDept = false;
    if (uDeptId && eDeptId && uDeptId === eDeptId) {
      isSameDept = true;
    } else if (uDeptName !== "Unassigned" && eDeptName !== "Unassigned" &&
      String(uDeptName).toLowerCase().trim() === String(eDeptName).toLowerCase().trim()) {
      isSameDept = true;
    } else if (uDeptId && eDeptName.length === 24 && uDeptId === eDeptName) {
      isSameDept = true;
    }

    return isSameDept;
  });

  // Calculate team stats using filtered list
  const teamSize = teamMembers.length
  const activeActivities = activities?.filter(a => a.status === "active").length || 0
  const employeesWithPerf = teamMembers.filter((e) => e.performance != null && e.performance !== undefined)
  const avgPerformance = employeesWithPerf.length > 0
    ? employeesWithPerf.reduce((acc, emp) => acc + emp.performance, 0) / employeesWithPerf.length
    : null

  const quickActions = [
    {
      title: "Team Overview",
      description: "View team performance and metrics",
      icon: Users,
      href: "/manager/team",
      color: "bg-blue-50 text-blue-600 border-blue-100"
    },
    {
      title: "Assign Activities",
      description: "Assign training and development activities",
      icon: Calendar,
      href: "/manager/activities",
      color: "bg-green-50 text-green-600 border-green-100"
    },
    {
      title: "Skill Management",
      description: "Manage team skills and competencies",
      icon: Target,
      href: "/manager/skills",
      color: "bg-purple-50 text-purple-600 border-purple-100"
    },
    {
      title: "Performance Analytics",
      description: "View team analytics and insights",
      icon: BarChart3,
      href: "/manager/performance",
      color: "bg-orange-50 text-orange-600 border-orange-100"
    }
  ]

  return (
    <section className="flex flex-col bg-[#F8FAFC] min-h-screen page-transition" aria-label="Manager Dashboard">
      <DashboardHeader title="Overview" description="Organizational performance and talent management">
        <div className="flex items-center gap-6 px-6 py-2 bg-white rounded-xl border border-slate-100 shadow-sm h-10">
          <div className="flex flex-col">
            <span className="text-[7px] font-black text-slate-300 tracking-[0.3em] leading-none mb-1 uppercase">Manager Console</span>
            <span className="text-[10px] font-black text-slate-900 tracking-tight leading-none">Welcome, {user?.name?.split(" ")[0] || "Manager"}</span>
          </div>
          <div className="w-px h-6 bg-slate-100"></div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Users className="h-3 w-3 text-orange-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] font-black text-slate-300 tracking-[0.3em] leading-none mb-1 uppercase">Command</span>
              <span className="text-[10px] font-black text-slate-900 uppercase">{teamSize} Personnel</span>
            </div>
          </div>
        </div>
      </DashboardHeader>

      <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-12 animate-in fade-in duration-700">

        {/* Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8" aria-label="Statistics">
          <div className="card-premium p-8 group hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 tracking-widest">Team size</p>
                <p className="stat-number text-3xl text-slate-900 mt-2">{teamSize}</p>
              </div>
              <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
                <Users className="w-7 h-7 text-indigo-500 group-hover:text-white transition-colors" />
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold tracking-wider">Team members</span>
            </div>
          </div>

          <div className="card-premium p-8 group hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 tracking-widest">Active programs</p>
                <p className="stat-number text-3xl text-slate-900 mt-2">{activeActivities}</p>
              </div>
              <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
                <Activity className="w-7 h-7 text-orange-500 group-hover:text-white transition-colors" />
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold tracking-wider">Active</span>
            </div>
          </div>

          <div className="card-premium p-8 group hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 tracking-widest">Mean Performance</p>
                <p className="stat-number text-3xl text-slate-900 mt-2">
                  {avgPerformance != null ? `${Math.round(avgPerformance)}%` : "—"}
                </p>
              </div>
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                <TrendingUp className="w-7 h-7 text-emerald-500 group-hover:text-white transition-colors" />
              </div>
            </div>
            {avgPerformance != null && (
              <div className="mt-6 flex items-center gap-2">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${avgPerformance}%` }}></div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ─── Pending Validations ────────────────────────────────────────── */}
        <section className="card-premium p-8 space-y-2" aria-label="Pending Validations">
          <PendingValidationsPanel
            key={validationKey}
            onValidated={() => setValidationKey(k => k + 1)}
          />
        </section>

        {/* Quick Actions */}
        <section className="space-y-6" aria-label="Quick Actions">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-display font-bold text-slate-900">Quick actions</h3>
            <div className="h-[1px] flex-1 bg-slate-100"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.href)}
                className="card-premium p-8 hover:bg-white text-left group border-slate-100 hover:border-orange-500/30 transition-all duration-500"
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:shadow-lg transition-all duration-500",
                  index === 0 ? "bg-blue-500/10 text-blue-500 shadow-blue-500/10" :
                    index === 1 ? "bg-orange-500/10 text-orange-500 shadow-orange-500/10" :
                      index === 2 ? "bg-purple-500/10 text-purple-500 shadow-purple-500/10" :
                        "bg-indigo-500/10 text-indigo-500 shadow-indigo-500/10"
                )}>
                  <action.icon className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-orange-500 transition-colors">
                  {action.title}
                </h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed m-0">
                  {action.description}
                </p>
                <div className="flex items-center gap-2 mt-6 text-slate-400 group-hover:text-orange-500 transition-colors">
                  <span className="text-[10px] font-bold tracking-widest">Open</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="card-premium border-none" aria-label="Recent activity">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-xl font-display font-bold text-slate-900">Recent activity</h3>
            <button className="text-xs font-bold text-orange-500 hover:text-orange-600 tracking-widest transition-colors">View all</button>
          </div>
          <div className="p-8">
            <div className="grid gap-4">
              {activities?.slice(0, 3).map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-orange-500/10 hover:bg-white transition-all duration-500 group/item">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover/item:shadow-orange-500/10 transition-all">
                      <Calendar className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 leading-none">{activity.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">{enrollments[activity.id || activity._id]?.length || activity.participants?.length || 0} participants</p>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">{activity.type || "Training"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={cn("rounded-lg px-3 py-1 text-[10px] font-bold border-none tracking-widest uppercase",
                      activity.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-200 text-slate-600")}>
                      {activity.status}
                    </Badge>
                    <button
                      onClick={() => navigate(`/manager/program-analysis/${activity.id || activity._id}`)}
                      className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-orange-500 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/5 transition-all active:scale-95"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>


    </section>
  )
}
