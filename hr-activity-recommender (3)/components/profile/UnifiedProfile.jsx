"use client"

import React, { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-store"
import { DashboardHeader } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import { 
    Shield, ShieldCheck, Mail, Building, Briefcase, 
    Zap, Lock, Users, Target, Activity, LayoutGrid, 
    Settings, Compass, Award, Sparkles, TrendingUp, Star
} from "lucide-react"
import { cn, getInitials } from "@/lib/utils"
import { ProfileSettings } from "./ProfileSettings"
import { ParticipationHistory } from "./ParticipationHistory"
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"

export default function UnifiedProfile() {
    const { user, getRoleLabel, refreshProfile } = useAuth()
    const { employees, activities, departments, selfEvaluateSkill, participations, evaluations, skills } = useData()
    const [activeTab, setActiveTab] = useState("overview") // overview | history | settings

    const [evalDialog, setEvalDialog] = useState(false)
    const [selectedSkill, setSelectedSkill] = useState(null)
    const [evalScore, setEvalScore] = useState(50)
    const [isUpdatingEval, setIsUpdatingEval] = useState(false)

    const role = user?.role?.toLowerCase() || "employee"

    // Role-specific data resolution
    const employeeProfile = employees.find(e => e.userId === user?.id) || user

    return (
        <div className="flex flex-col bg-[#F8FAFC] min-h-screen">
            <DashboardHeader 
                title="User Profile" 
                description="Manage your personal information and account settings."
            />

            <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-10 animate-in fade-in duration-700">
                
                {/* 1. Header Navigation */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-200 pb-8">
                    <div className="flex items-center gap-8">
                        <TabButton 
                            active={activeTab === "overview"} 
                            onClick={() => setActiveTab("overview")}
                            icon={Compass}
                            label="Overview"
                        />
                        {role !== "admin" && (
                            <TabButton 
                                active={activeTab === "history"} 
                                onClick={() => setActiveTab("history")}
                                icon={Activity}
                                label="History"
                            />
                        )}
                        {role === "employee" && (
                            <TabButton 
                                active={activeTab === "feedback"} 
                                onClick={() => setActiveTab("feedback")}
                                icon={Star}
                                label="Feedback"
                            />
                        )}
                        <TabButton 
                            active={activeTab === "settings"} 
                            onClick={() => setActiveTab("settings")}
                            icon={Settings}
                            label="Settings"
                        />
                    </div>
                    
                    <div className="flex items-center gap-4 bg-white px-6 py-2 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex flex-col items-end">
                            <span className="text-[7px] font-black text-slate-300 tracking-[0.2em] uppercase">Account Role</span>
                            <span className="text-[10px] font-black text-slate-900 uppercase">{getRoleLabel()}</span>
                        </div>
                        <div className="w-px h-6 bg-slate-100"></div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center">
                                <Shield className="h-4 w-4 text-orange-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {activeTab === "overview" ? (
                    <div className="grid gap-10 lg:grid-cols-12">
                        {/* Sidebar: Identity Card */}
                        <div className="lg:col-span-4 space-y-8">
                            <Card className="card-premium p-8 bg-white border-none shadow-premium relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/[0.02] rounded-full -mr-32 -mt-32 transition-all group-hover:bg-orange-500/[0.05]"></div>
                                
                                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                    <div className="relative group">
                                        <div className="absolute -inset-1.5 bg-gradient-to-tr from-orange-500 to-amber-300 rounded-[2.5rem] opacity-20 blur-md group-hover:opacity-40 transition-all"></div>
                                        <Avatar className="h-28 w-28 rounded-[2.5rem] border-4 border-white shadow-2xl relative">
                                            <AvatarImage src={user?.avatar} />
                                            <AvatarFallback className="bg-slate-900 text-white text-2xl font-black font-display">
                                                {getInitials(user?.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white border-2 border-white shadow-lg">
                                            <ShieldCheck className="w-4 h-4 text-orange-500" />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-display font-black text-slate-900 tracking-tighter capitalize">{user?.name}</h2>
                                        <Badge className="bg-orange-500/[0.08] text-orange-600 text-[10px] font-black px-4 py-1 rounded-full border border-orange-500/10 tracking-widest uppercase">
                                            {getRoleLabel()}
                                        </Badge>
                                    </div>

                                    <div className="w-full pt-8 border-t border-slate-50 space-y-5">
                                        <InfoRow icon={Mail} label="Email Address" value={user?.email} />
                                        {role !== "admin" && <InfoRow icon={Building} label="Department" value={employeeProfile?.department || "Executive"} />}
                                        <InfoRow icon={Briefcase} label="Position" value={employeeProfile?.position || "Staff"} />
                                    </div>
                                </div>
                            </Card>

                            {/* Role Specialization Stat */}
                            <RoleSummaryCard role={role} employees={employees} activities={activities} user={user} departments={departments} />
                        </div>

                        {/* Main Content Area */}
                        <div className="lg:col-span-8 space-y-10">
                            <RoleSpecificContent 
                                role={role} 
                                employees={employees} 
                                activities={activities} 
                                user={user} 
                                departments={departments} 
                                onEvalClick={(skill) => {
                                    setSelectedSkill(skill)
                                    setEvalScore(skill.score || skill.proficiencyScore || 50)
                                    setEvalDialog(true)
                                }}
                            />
                        </div>
                    </div>
                ) : activeTab === "history" ? (
                    <div className="max-w-4xl mx-auto w-full pb-20">
                        <ParticipationHistory user={user} participations={participations} activities={activities} />
                    </div>
                ) : activeTab === "feedback" && role === "employee" ? (
                    <div className="max-w-4xl mx-auto w-full pb-20 space-y-6">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                                <Award className="w-6 h-6 text-orange-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-display font-black text-slate-900 tracking-tight">Manager Feedback</h3>
                                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Performance Evaluations</p>
                            </div>
                        </div>

                        {evaluations?.filter(e => e.employeeId === (user?.userId || user?.id)).map(ev => {
                            const act = ev.activityId ? activities.find(a => a.id === ev.activityId) : null
                            const skill = skills.find(s => s.id === ev.skillId)
                            return (
                                <Card key={ev.id || ev._id} className="p-8 border-none shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/[0.02] rounded-full -mr-16 -mt-16 group-hover:bg-primary/[0.05] transition-all"></div>
                                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
                                        <div className="space-y-4 flex-1">
                                            <div className="flex items-center gap-3">
                                                <Badge className="bg-primary/10 text-primary border-none text-[10px] uppercase font-black tracking-widest px-3 py-1">
                                                    {skill?.name || "Skill Assessment"}
                                                </Badge>
                                                {act && (
                                                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-500 border-slate-200">
                                                        Activity: {act.title}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-slate-600 font-medium leading-relaxed">
                                                "{ev.comment || "No additional comments provided."}"
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {new Date(ev.createdAt || ev.date).toLocaleDateString()} • Evaluated by Manager
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-center justify-center bg-slate-50 rounded-2xl p-6 min-w-[120px] border border-slate-100/50">
                                            <span className="text-4xl font-black font-display text-slate-900 tracking-tighter">{ev.score}%</span>
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Score</span>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}

                        {evaluations?.filter(e => e.employeeId === (user?.userId || user?.id)).length === 0 && (
                            <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <Shield className="w-8 h-8 text-slate-300" />
                                </div>
                                <h4 className="text-lg font-bold text-slate-900">No Feedback Yet</h4>
                                <p className="text-sm text-slate-500 mt-1 max-w-sm">You haven't received any manager evaluations or feedback.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto w-full pb-20">
                        <ProfileSettings />
                    </div>
                )}
            </div>

            {/* skill calibration dialog */}
            <Dialog open={evalDialog} onOpenChange={setEvalDialog}>
                <DialogContent className="sm:max-w-md rounded-[32px] bg-white border-none p-10 overflow-hidden shadow-2xl">
                    <DialogHeader className="text-left space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                            <Target className="w-7 h-7" />
                        </div>
                        <DialogTitle className="text-3xl font-black text-slate-900 tracking-tighter">Skill Assessment</DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium text-base leading-relaxed">
                            Rate your proficiency in <span className="text-primary font-black uppercase">{selectedSkill?.skill?.name}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-10 space-y-10">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CURRENT_RATING</span>
                            <span className="text-4xl font-black text-primary tracking-tighter italic">{evalScore}%</span>
                        </div>

                        <Slider
                            value={[evalScore]}
                            onValueChange={(vals) => setEvalScore(vals[0])}
                            max={100}
                            step={1}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={async () => {
                                setIsUpdatingEval(true)
                                try {
                                    await selfEvaluateSkill(selectedSkill.skillId || selectedSkill.skill?._id, evalScore)
                                    await refreshProfile()
                                    toast.success("Skills Updated", {
                                        description: `Your proficiency in ${selectedSkill.skill?.name} has been updated.`
                                    })
                                    setEvalDialog(false)
                                } catch (err) {
                                    toast.error("Update Failed", { description: "Skill data update failed." })
                                } finally {
                                    setIsUpdatingEval(false)
                                }
                            }}
                            disabled={isUpdatingEval}
                            className="w-full h-14 rounded-xl bg-slate-900 hover:bg-primary text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95"
                        >
                            {isUpdatingEval ? "Synchronizing..." : "Update Evaluation"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function TabButton({ active, onClick, icon: Icon, label }) {
    return (
        <button 
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 px-6 py-3 rounded-2xl transition-all font-black text-[10px] tracking-widest uppercase",
                active 
                    ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10" 
                    : "bg-white text-slate-400 hover:text-slate-900 border border-slate-100"
            )}
        >
            <Icon className={cn("w-4 h-4", active ? "text-orange-500" : "text-slate-300")} />
            {label}
        </button>
    )
}

function InfoRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center gap-4 text-left">
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <div>
                <p className="text-[7px] font-black text-slate-300 tracking-[0.2em] uppercase">{label}</p>
                <p className="text-[10px] font-bold text-slate-900 tracking-tight">{value || "N/A"}</p>
            </div>
        </div>
    )
}

function RoleSummaryCard({ role, employees, activities, user, departments }) {
    if (role === "admin") {
        return (
            <Card className="p-8 bg-slate-900 border-none shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 opacity-5 blur-3xl"></div>
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-orange-500" />
                        <span className="text-[10px] font-black text-white tracking-widest uppercase">Access Level</span>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-3xl font-black font-display text-white tracking-tighter">Lvl 3</p>
                                <p className="text-[8px] font-black text-slate-500 tracking-widest uppercase">Full Access</p>
                            </div>
                            <Zap className="w-10 h-10 text-orange-500/20" />
                        </div>
                    </div>
                </div>
            </Card>
        )
    }

    if (role === "manager" || role === "hr") {
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

    const teamSize = role === "manager" 
        ? employees.filter(employee => {
            const isSelf = (employee.id || employee._id) === (user?.id || user?._id);
            if (isSelf) return false;
            
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
            return isSameDept && (employee.role?.toLowerCase() !== "hr" && employee.role?.toLowerCase() !== "admin");
        }).length
        : employees.length
        
        return (
            <Card className="p-8 bg-white border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/[0.02] rounded-full -mr-16 -mt-16 group-hover:bg-primary/[0.05] transition-all" />
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-primary" />
                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Management Scope</span>
                    </div>
                    <div className="space-y-2">
                        <p className="text-4xl font-black font-display text-slate-900 tracking-tighter">{teamSize}</p>
                        <p className="text-[8px] font-black text-slate-500 tracking-widest uppercase">Total Team Members</p>
                    </div>
                </div>
            </Card>
        )
    }

    if (role === "employee") {
        const employee = employees.find(e => e.userId === user?.id)
        const nodes = employee?.skills?.length || 0
        const calibration = nodes > 0
            ? Math.round(employee.skills.reduce((acc, s) => acc + (s.score || s.proficiencyScore || 0), 0) / nodes)
            : 0

        return (
            <Card className="p-8 bg-white border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/[0.02] rounded-full -mr-16 -mt-16 group-hover:bg-primary/[0.05] transition-all" />
                <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-3">
                        <Zap className="w-5 h-5 text-[#F28C1B]" />
                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Skill Overview</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                            <p className="text-2xl font-black font-display text-slate-900 tracking-tighter">{nodes}</p>
                            <p className="text-[7px] font-black text-slate-400 tracking-widest uppercase">Skills Count</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                            <p className="text-2xl font-black font-display text-[#F28C1B] tracking-tighter">{calibration}%</p>
                            <p className="text-[7px] font-black text-slate-400 tracking-widest uppercase">Proficiency</p>
                        </div>
                    </div>
                </div>
            </Card>
        )
    }

    return null
}

function RoleSpecificContent({ role, employees, activities, user, departments, onEvalClick }) {
    if (role === "admin") {
        return (
            <div className="space-y-8">
                <div className="flex items-center gap-4 px-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg">
                        <ShieldCheck className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-display font-black text-slate-900 tracking-tight">System Permissions</h3>
                        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Administrator Access Areas</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        { title: "System Configuration", desc: "Full control over system settings and platform security.", icon: Zap },
                        { title: "Audit Logs", desc: "Monitor all system activities and security events.", icon: Shield },
                        { title: "Insights & Reports", desc: "Access organizational performance data and analytics.", icon: TrendingUp },
                        { title: "System Policy", desc: "Manage global user permissions and security standards.", icon: Lock }
                    ].map((priv, i) => (
                        <Card key={i} className="bg-white border-none shadow-sm p-6 hover:shadow-md transition-all group">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                                    <priv.icon className="w-4 h-4 text-orange-500 group-hover:text-white" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-black text-slate-900 tracking-tight">{priv.title}</h4>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{priv.desc}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="p-8 rounded-[32px] bg-slate-900 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500 opacity-5 blur-3xl"></div>
                    <div className="relative z-10 flex gap-8 items-center">
                        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                            <Lock className="w-8 h-8 text-orange-500" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-bold text-white tracking-tight">Security Status: Secure</h4>
                            <p className="text-xs text-slate-400 font-medium max-w-lg">
                                You have full administrator access. Please verify all changes before applying them system-wide.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (role === "manager" || role === "hr") {
        // Utils
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

        const teamSize = role === "manager" 
            ? employees.filter(employee => {
                const isSelf = (employee.id || employee._id) === (user?.id || user?._id);
                if (isSelf) return false;
                
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
                return isSameDept && (employee.role?.toLowerCase() !== "hr" && employee.role?.toLowerCase() !== "admin");
            }).length
            : employees.length
            
        const activeActivities = activities.filter(a => a.status === "active" || a.status === "upcoming").length
        
        return (
            <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard label="Direct Reports" value={teamSize} icon={Users} color="text-indigo-500" />
                    <StatCard label="Active Programs" value={activeActivities} icon={Activity} color="text-emerald-500" />
                    <StatCard label="Avg Team Score" value="78%" icon={Sparkles} color="text-orange-500" />
                </div>

                <div className="space-y-6">
                    <h3 className="text-xl font-display font-black text-slate-900 tracking-tight ml-4 flex items-center gap-3">
                        <LayoutGrid className="w-5 h-5 text-primary" />
                        Management Tools
                    </h3>
                    <div className="grid gap-6">
                        {[
                            { title: "Team Training", desc: "Manage employees' training and development programs.", icon: Target },
                            { title: "Skill Assessments", desc: "Analyze and update skill levels for your department staff.", icon: Award },
                            { title: "Department Planning", desc: "Review team availability and allocate training resources effectively.", icon: LayoutGrid }
                        ].map((module, i) => (
                            <Card key={i} className="bg-white border border-slate-100 shadow-sm p-8 hover:border-primary/20 transition-all group cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                            <module.icon className="w-6 h-6 text-slate-400 group-hover:text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-black text-slate-900 tracking-tight group-hover:text-primary transition-colors">{module.title}</h4>
                                            <p className="text-xs text-slate-500 font-medium">{module.desc}</p>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:border-primary group-hover:text-primary transition-all">
                                        <TrendingUp className="w-4 h-4" />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (role === "employee") {
        const employee = employees.find(e => e.userId === user?.id)
        
        return (
            <div className="space-y-10">
                <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#F28C1B]/10 flex items-center justify-center border border-[#F28C1B]/20">
                            <Award className="w-6 h-6 text-[#F28C1B]" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-display font-black text-slate-900 tracking-tight">My Skills</h3>
                            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Personnel Skill Level</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                    {employee?.skills?.map((s, idx) => (
                        <Card key={idx} className="bg-white border-none shadow-sm p-8 group hover:shadow-xl hover:translate-y-[-4px] transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/[0.02] rounded-full -mr-12 -mt-12 group-hover:bg-primary/[0.05] transition-all"></div>
                            <div className="flex items-center justify-between mb-8">
                                <div className="space-y-1">
                                    <h4 className="text-xl font-black text-slate-900 tracking-tight capitalize">{s.skillId?.name || s.skill?.name || `Skill ${idx + 1}`}</h4>
                                    <p className="text-[9px] font-black text-[#F28C1B] tracking-widest uppercase">{s.skillId?.category || s.skill?.category || "General Core"}</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                                    <Star className={cn("w-5 h-5", (s.score || s.proficiencyScore) > 70 ? "fill-[#F28C1B] text-[#F28C1B]" : "text-slate-300")} />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                <div>
                                    <p className="text-[7px] font-black text-slate-300 tracking-[0.2em] uppercase mb-1">Proficiency</p>
                                    <p className="text-2xl font-black text-slate-900 tracking-tighter italic">{s.score || s.proficiencyScore || 0}%</p>
                                </div>
                                <Button 
                                    onClick={() => onEvalClick(s)}
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-10 w-10 rounded-full bg-slate-50 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                >
                                    <Target className="w-4 h-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                    
                    {/* Ghost Slot for New Skills */}
                    <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 flex flex-col items-center justify-center text-center space-y-4 hover:border-primary/20 hover:bg-primary/[0.02] transition-all group cursor-pointer h-full min-h-[160px]">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                            <Zap className="w-5 h-5 text-slate-300 group-hover:text-primary" />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase group-hover:text-primary transition-colors">Add New Skill</p>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center h-[400px] text-slate-400 space-y-4">
            <LayoutGrid className="w-16 h-16 opacity-10" />
            <p className="text-xs font-black tracking-widest uppercase">Loading Content...</p>
        </div>
    )
}

function StatCard({ label, value, icon: Icon, color }) {
    return (
        <Card className="bg-white border-none shadow-sm p-8 group hover:shadow-lg transition-all">
            <div className="flex justify-between items-start mb-6">
                <div className={cn("p-2.5 rounded-xl bg-slate-50 group-hover:bg-slate-900 transition-colors", color)}>
                    <Icon className="w-4 h-4 group-hover:text-white" />
                </div>
            </div>
            <p className="text-[10px] font-black text-slate-300 tracking-[0.2em] uppercase mb-1">{label}</p>
            <p className="text-3xl font-black font-display text-slate-900 tracking-tighter">{value}</p>
        </Card>
    )
}
