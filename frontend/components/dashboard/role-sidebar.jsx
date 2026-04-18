"use client"

import { cn } from "/lib/utils"
import {
  LayoutDashboard,
  Users,
  Sparkles,
  Calendar,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Brain,
  Target,
  Trophy,
  BookOpen,
  Shield,
} from "lucide-react"
import { Button } from "/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "/components/ui/tooltip"
import { useState } from "react"
import { useAuth, getRoleLabel } from "/lib/auth-context"
import { useData } from "/lib/data-store"
import { Link, useLocation, useNavigate } from "react-router-dom"

const navItems = [
  // Admin items
  { href: "/admin", label: "Overview", icon: LayoutDashboard, roles: ["admin"] },
  { href: "/admin/employees", label: "Users", icon: Users, roles: ["admin"] },
  { href: "/admin/skills", label: "Skills", icon: Brain, roles: ["admin"] },
  { href: "/admin/activities", label: "Programs", icon: Calendar, roles: ["admin"] },
  { href: "/admin/audit", label: "Audit Logs", icon: Shield, roles: ["admin"] },

  // HR items (same as admin)
  { href: "/hr", label: "Overview", icon: LayoutDashboard, roles: ["hr"] },
  { href: "/hr/employees", label: "Users", icon: Users, roles: ["hr"] },
  { href: "/hr/skills", label: "Skills", icon: Brain, roles: ["hr"] },
  { href: "/hr/activities", label: "Programs", icon: Calendar, roles: ["hr"] },
  { href: "/hr/recommendations", label: "Recommendations", icon: Sparkles, roles: ["hr"] },
  { href: "/hr/audit", label: "Audit Logs", icon: Shield, roles: ["hr"] },

  // Manager items
  { href: "/manager", label: "Overview", icon: LayoutDashboard, roles: ["manager"] },
  { href: "/manager/employees", label: "Users", icon: Users, roles: ["manager"] },
  { href: "/manager/skills", label: "Skills", icon: Brain, roles: ["manager"] },
  { href: "/manager/activities", label: "Programs", icon: Calendar, roles: ["manager"] },
  { href: "/manager/assignments", label: "Assignments", icon: Target, roles: ["manager"] },
  { href: "/manager/evaluations", label: "Evaluations", icon: Trophy, roles: ["manager"] },
  { href: "/manager/profile", label: "Profile", icon: Users, roles: ["manager"] },

  // Employee items
  { href: "/employee", label: "My Feed", icon: LayoutDashboard, roles: ["employee"] },
  { href: "/employee/activities", label: "Learning Center", icon: BookOpen, roles: ["employee"] },
  { href: "/employee/hub", label: "Community", icon: Users, roles: ["employee"] },
  { href: "/employee/profile", label: "My Profile", icon: Settings, roles: ["employee"] },
]

export function RoleSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { employees, skills, activities } = useData()
  const [collapsed, setCollapsed] = useState(false)

  if (!user) return null

  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role))

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const getInitials = (name) => {
    return name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U"
  }

  const getItemCount = (label) => {
    if (user.role !== "hr" && user.role !== "admin") return null
    switch (label) {
      case "Users": return employees?.length ?? 0
      case "Skills": return skills?.length ?? 0
      case "Programs": return activities?.length ?? 0
      default: return null
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col bg-[#2C2C2C] text-slate-300 transition-all duration-300 shadow-2xl shadow-black/20",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {/* Modern Logo */}
        <div className={cn("flex h-16 items-center px-6 border-b border-[#3E3E3E]", collapsed ? "justify-center" : "gap-3")}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F28C1B] shadow-lg shadow-orange-500/10">
            <Brain className="h-5.5 w-5.5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.01em", lineHeight: 1.2 }}>MAGHREBIA</span>
              <span style={{ fontSize: "0.6875rem", fontWeight: 400, color: "#F28C1B", letterSpacing: "0.05em", textTransform: "uppercase", marginTop: 2 }}>SkillMatch Engine</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto scrollbar-hide">
          {!collapsed && <p style={{ fontSize: "0.6875rem", fontWeight: 500, color: "#64748B", letterSpacing: "0.07em", textTransform: "", marginBottom: "1rem", marginLeft: "0.5rem", padding: "0 0.5rem" }}>Menu</p>}
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/")
            const Icon = item.icon

            const linkContent = (
              <Link
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all group",
                  isActive
                    ? "bg-[#F28C1B] text-white shadow-lg shadow-orange-500/20"
                    : "text-slate-400 hover:text-white hover:bg-[#3E3E3E]",
                  collapsed && "justify-center px-0 h-11 w-11 mx-auto"
                )}
                style={{ fontSize: "0.8125rem", fontWeight: 500 }}
              >
                <Icon className={cn("h-5 w-5 shrink-0 transition-transform duration-300", isActive ? "stroke-[2.5]" : "group-hover:scale-110")} />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between">
                    <span className="truncate">{item.label}</span>
                    {getItemCount(item.label) && (
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors",
                        isActive ? "bg-white/20 text-white" : "bg-[#3E3E3E] text-slate-400"
                      )}>
                        {getItemCount(item.label)}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-900 text-white border-slate-800 text-xs font-semibold px-3 py-1.5 shadow-xl">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.href}>{linkContent}</div>
          })}
        </nav>

        {/* Professional User Section */}
        <div className="p-4 border-t border-[#3E3E3E] bg-[#3E3E3E]/20">
          <div className={cn("flex items-center gap-3 rounded-xl p-2 bg-[#3E3E3E]/40 border border-[#3E3E3E] transition-all hover:bg-[#3E3E3E]/60 cursor-pointer", collapsed && "justify-center px-2")}>
            <Avatar className="h-9 w-9 rounded-lg border border-[#3E3E3E] shadow-sm">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-slate-700 text-white text-xs font-bold rounded-lg ">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#fff" }} className="truncate leading-tight">{user.name}</p>
                <p style={{ fontSize: "0.6875rem", fontWeight: 400, color: "#F28C1B", textTransform: "", letterSpacing: "0.05em", marginTop: 2 }}>{getRoleLabel(user.role)}</p>
              </div>
            )}
          </div>

          <div className={cn("mt-4 flex gap-2", collapsed ? "flex-col items-center" : "")}>
            {collapsed ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Settings</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Sign Out</TooltipContent>
                </Tooltip>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="flex-1 justify-start h-10 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg font-semibold text-xs transition-all">
                  <Settings className="mr-3 h-4 w-4" />
                  Settings
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Clean Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-[#3E3E3E] bg-[#2C2C2C] text-slate-400 shadow-xl hover:text-white hover:border-[#F28C1B] z-50 transition-all"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      </aside>
    </TooltipProvider>
  )
}

