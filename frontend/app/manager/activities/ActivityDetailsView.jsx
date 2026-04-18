"use client"

import { useParams, useNavigate } from "react-router-dom"
import { useData } from "@/lib/data-store"
import { useAuth } from "@/lib/auth-context"
import { DashboardHeader } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Calendar,
    Clock,
    Users,
    MapPin,
    ArrowLeft,
    Target,
    AlertCircle,
    UserPlus,
    ShieldCheck,
    ShieldAlert,
    ShieldQuestion,
    Award,
    MessageCircle
} from "lucide-react"
import { cn, getInitials } from "@/lib/utils"

export default function ActivityDetailsView() {
    const { activityId } = useParams()
    const navigate = useNavigate()
    const { activities, employees, departments, enrollments, skills } = useData()
    const { user } = useAuth()

    const activity = activities.find(a => a.id === activityId || a._id === activityId)

    const isManager = user?.role?.toLowerCase() === "manager"
    const isAdminOrHR = user?.role?.toLowerCase() === "admin" || user?.role?.toLowerCase() === "hr"

    const getIdString = (v) => {
        if (v == null) return ""
        if (typeof v === "string") return v
        if (typeof v === "object") return String(v._id || v.id || "")
        return String(v)
    }

    const getDeptManagerId = (d) => {
        if (!d) return ""
        return getIdString(d.manager_id)
    }

    const currentUserId = getIdString(user?.id || user?._id)
    const managerDept = isManager ? departments.find(d => getDeptManagerId(d) === currentUserId) : null
    const deptName = managerDept?.name || ""
    const deptId = managerDept?._id ?? managerDept?.id ?? ""

    const enrolledEmployees = (enrollments[activity?.id || activity?._id] || [])
        .map(id => employees.find(e => String(e.id) === String(id) || String(e._id) === String(id)))
        .filter(Boolean)
        .filter(employee => {
            if (isAdminOrHR) return true
            if (!isManager) return false
            const employeeDeptId = getIdString(employee.department_id || employee.department)
            return deptId && employeeDeptId
                ? String(employeeDeptId) === String(deptId)
                : employee.department === deptName
        })

    const getActivityTypeLabel = (type) => {
        switch (type) {
            case "training": return "Professional Development"
            case "certification": return "Certification Program"
            case "project": return "Applied Learning Project"
            default: return "Development Activity"
        }
    }

    if (!activity) {
        return (
            <div className="flex flex-col bg-[#F8FAFC] min-h-screen">
                <DashboardHeader title="Activity Not Found" description="The requested activity could not be located" />
                <div className="flex-1 flex items-center justify-center">
                    <Card className="max-w-md">
                        <CardContent className="p-8 text-center">
                            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Activity Not Located</h3>
                            <p className="text-sm text-slate-500 mb-4">The specified activity identifier is invalid or expired.</p>
                            <Button onClick={() => navigate(-1)}>
                                Return back
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col bg-[#F8FAFC] min-h-screen page-transition">
            <DashboardHeader title="Activity Portfolio" description="Program verification and roster management" />

            <div className="flex-1 p-6 md:p-10 max-w-[1400px] mx-auto w-full space-y-10 animate-in fade-in duration-700">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row gap-10">
                    {/* Main Info Card */}
                    <div className="flex-1 bg-white border border-slate-100 rounded-[48px] p-12 shadow-premium relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        
                        <div className="relative z-10 space-y-10">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-primary/10 text-primary border-none px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest whitespace-nowrap">
                                            {getActivityTypeLabel(activity.type)}
                                        </Badge>
                                        <div className={cn(
                                            "px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest border",
                                            activity.status === "active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                                        )}>
                                            {activity.status?.toUpperCase()}
                                        </div>
                                    </div>
                                    <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-[1.1] uppercase max-w-2xl">
                                        {activity.title}
                                    </h2>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="ghost" onClick={() => navigate(-1)} className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-900 transition-all">
                                        <ArrowLeft className="w-6 h-6" />
                                    </Button>
                                    {isManager && (
                                        <Button onClick={() => navigate(`/manager/program-enroll/${activity.id || activity._id}`)} className="h-14 px-8 rounded-2xl bg-slate-950 text-white font-black text-[11px] tracking-widest uppercase hover:bg-primary transition-all shadow-xl active:scale-95 flex items-center gap-3">
                                            <UserPlus className="w-5 h-5" />
                                            Manage Roster
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-3xl">
                                {activity.description}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-10 border-t border-slate-50">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Date & Schedule</span>
                                    </div>
                                    <p className="text-lg font-black text-slate-900">{new Date(activity.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Duration</span>
                                    </div>
                                    <p className="text-lg font-black text-slate-900">{activity.duration}</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Location</span>
                                    </div>
                                    <p className="text-lg font-black text-slate-900">{activity.location || "On-site HQ"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Capacity Circular Widget */}
                    <div className="lg:w-[400px] bg-slate-950 rounded-[48px] p-12 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-primary/20 to-transparent"></div>
                        <div className="relative z-10 space-y-10">
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Program Capacity</h4>
                                <p className="text-3xl font-black">Attendance Hub</p>
                            </div>

                            <div className="flex flex-col items-center py-6">
                                <div className="relative w-48 h-48 flex items-center justify-center">
                                    <svg className="w-full h-full -rotate-90">
                                        <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
                                        <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={2 * Math.PI * 88} strokeDashoffset={2 * Math.PI * 88 * (1 - (enrolledEmployees.length / activity.capacity))} strokeLinecap="round" className="text-primary" />
                                    </svg>
                                    <div className="absolute text-center">
                                        <p className="text-5xl font-black leading-none">{enrolledEmployees.length}</p>
                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">{activity.capacity} max</p>
                                    </div>
                                </div>
                                <div className="mt-10 grid grid-cols-2 gap-10 w-full">
                                    <div className="text-center">
                                        <p className="text-2xl font-black">{activity.capacity - enrolledEmployees.length}</p>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Free Slots</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-primary">{Math.round((enrolledEmployees.length / activity.capacity) * 100)}%</p>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Occupancy</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 pt-10 border-t border-white/5">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                                    activity.workflowStatus === "approved" ? "bg-emerald-500" : activity.workflowStatus === "rejected" ? "bg-rose-500" : "bg-amber-500"
                                )}>
                                    {activity.workflowStatus === "approved" ? <ShieldCheck className="w-6 h-6" /> : activity.workflowStatus === "rejected" ? <ShieldAlert className="w-6 h-6" /> : <ShieldQuestion className="w-6 h-6" />}
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Workflow Status</p>
                                    <p className="text-sm font-black uppercase tracking-tight">{activity.workflowStatus || "PENDING REVIEW"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Audit Feedback for Rejection */}
                {activity.workflowStatus === "rejected" && activity.rejectionReason && (
                    <div className="bg-[#0F111A] rounded-[48px] p-12 shadow-2xl relative overflow-hidden group animate-in slide-in-from-bottom duration-700">
                         <div className="absolute -top-10 -right-10 w-48 h-48 bg-rose-500/10 rounded-full blur-[100px] group-hover:bg-rose-500/20 transition-all duration-1000"></div>
                         <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                            <div className="w-20 h-20 bg-rose-500/10 rounded-[32px] flex items-center justify-center border border-rose-500/20 shrink-0 shadow-lg shadow-rose-500/5">
                                <MessageCircle className="w-10 h-10 text-rose-500" />
                            </div>
                            <div className="flex-1 space-y-6">
                                <div className="space-y-2">
                                    <h4 className="text-[11px] font-black text-rose-500 uppercase tracking-[0.25em]">Strategic Audit Feedback</h4>
                                    <p className="text-2xl font-black text-white tracking-tight leading-relaxed italic underline decoration-rose-500/30 underline-offset-8">"{activity.rejectionReason}"</p>
                                </div>
                                <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-2xl opacity-70">The manager has requested modifications to this program. Please integrate the feedback above and resubmit the activity for final authorization.</p>
                            </div>
                            {isAdminOrHR && (
                                <Button 
                                    onClick={() => navigate(`/${user.role.toLowerCase()}/activities/${activity.id || activity._id}/edit`)}
                                    className="h-16 px-10 rounded-[28px] bg-white text-slate-950 font-black text-[11px] tracking-[0.15em] uppercase hover:bg-rose-500 hover:text-white transition-all shadow-xl active:scale-95 shrink-0"
                                >
                                    Revise & Resubmit
                                </Button>
                            )}
                         </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Knowledge Requirements */}
                    <div className="bg-white border border-slate-100 rounded-[48px] p-12 shadow-premium space-y-10">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Knowledge Points</h3>
                                <p className="text-sm font-medium text-slate-400">Required competencies and baseline levels</p>
                            </div>
                            <Target className="w-10 h-10 text-slate-100" />
                        </div>

                        <div className="space-y-4">
                            {activity.requiredSkills && activity.requiredSkills.length > 0 ? activity.requiredSkills.map(rs => {
                                const matchingSkill = skills?.find(s => s.id === rs.skillId || s._id === rs.skillId) || rs.skill || rs.skillId;
                                return (
                                    <div key={Math.random()} className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-lg transition-all duration-500">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                                                <Award className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 uppercase text-[13px]">{matchingSkill?.name || rs.name || 'Core Competency'}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Prerequisite Skill</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-slate-950 text-white border-none px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                            Lvl {rs.requiredLevel || rs.level || '1'}
                                        </Badge>
                                    </div>
                                )
                            }) : (
                                <div className="py-12 text-center text-slate-300 italic font-medium">No specialized competencies defined</div>
                            )}
                        </div>
                    </div>

                    {/* Personnel Roster */}
                    <div className="bg-white border border-slate-100 rounded-[48px] p-12 shadow-premium space-y-10">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Personnel Roster</h3>
                                <p className="text-sm font-medium text-slate-400">Verified participants and department staff</p>
                            </div>
                            <Users className="w-10 h-10 text-slate-100" />
                        </div>

                        <div className="space-y-2 max-h-[480px] overflow-y-auto no-scrollbar pr-2">
                            {enrolledEmployees.length > 0 ? enrolledEmployees.map(employee => (
                                <div key={employee.id} className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 group hover:bg-white hover:shadow-premium transition-all duration-500">
                                    <div className="flex items-center gap-5">
                                        <Avatar className="h-14 w-14 rounded-2xl border-2 border-white shadow-sm ring-1 ring-slate-100">
                                            <AvatarImage src={employee.avatar} className="object-cover" />
                                            <AvatarFallback className="bg-slate-900 text-white font-black text-sm">{getInitials(employee.name)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-black text-slate-900 uppercase text-[13px]">{employee.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{employee.position}</p>
                                        </div>
                                    </div>
                                    <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/20"></div>
                                </div>
                            )) : (
                                <div className="py-20 text-center space-y-4">
                                    <Users className="w-12 h-12 text-slate-200 mx-auto" />
                                    <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No verified enrollments yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
