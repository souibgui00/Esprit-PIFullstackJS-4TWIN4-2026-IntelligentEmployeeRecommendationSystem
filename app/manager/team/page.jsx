"use client"

import { useState } from "react"
import { useData } from "@/lib/data-store"
import { useAuth } from "@/lib/auth-context"
import { useNavigate } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Info, ClipboardCheck, TrendingUp, TrendingDown, Minus, Users, Mail, Phone, Calendar as CalendarIcon, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ManagerTeamPage() {
  const { employees, departments } = useData()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState("")
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

  const managerDept = departments.find(d => {
    const mId = d.manager_id?._id || d.manager_id?.id || d.manager_id;
    return mId?.toString() === user?.id?.toString();
  });

  const uDeptId = getDeptId(user?.department_id) || getDeptId(user?.department) || getDeptId(managerDept);
  const uDeptName = getDeptName(user?.department_id) || getDeptName(user?.department) || user?.department || managerDept?.name || "Unassigned";

  // Filter employees robustly
  const allowedEmployees = employees.filter(employee => {
    const isSelf = (employee.id || employee._id) === (user?.id || user?._id);
    if (isSelf) return false; // Hide manager from their own team view

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

  const deptEmployees = allowedEmployees.filter(e =>
    (e.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (e.position?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const getSkillTypeLabel = (type) => {
    const labels = {
      'technical': 'Technical',
      'soft': 'Soft Skill',
      'behavioral': 'Behavioral',
      'domain': 'Domain Expert'
    };
    return labels[type?.toLowerCase()] || 'Professional';
  };

  const getAvgScore = (employee) => {
    if (!employee?.skills || employee.skills.length === 0) return 0
    const total = employee.skills.reduce((s, sk) => s + (sk.score || 0), 0)
    const avg = total / employee.skills.length
    // If scores are out of 120, normalize to 100 for display percentage
    return Math.round(avg > 10 ? (avg / 120) * 100 : avg * 10)
  }

  const getProgressionIcon = (progression) => {
    if (progression > 0) return <TrendingUp className="h-3 w-3 text-emerald-500" />
    if (progression < 0) return <TrendingDown className="h-3 w-3 text-rose-500" />
    return <Minus className="h-3 w-3 text-slate-400" />
  }

  return (
    <section className="flex flex-col bg-[#F8FAFC] min-h-screen" aria-label="Manager team">
      <DashboardHeader title="Team" description="Team members and overview" />

      <div className="flex-1 p-8 space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-200">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Roster</h1>
              <p className="text-sm text-slate-500">Manage and assess your department team members.</p>
            </div>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              placeholder="Search by name or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg h-11 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none shadow-sm"
            />
          </div>
        </div>

        <article className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" aria-label="Team member list">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Employee</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Experience</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Avg. Score</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deptEmployees.map((employee) => {
                  const avgScore = getAvgScore(employee)
                  return (
                    <tr key={employee.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-slate-100 shadow-sm">
                            <AvatarImage src={employee.avatar} className="object-cover" />
                            <AvatarFallback className="bg-slate-100 text-slate-500 font-medium text-xs">{employee.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors truncate">{employee.name}</p>
                            <p className="text-xs text-slate-500 truncate">{employee.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700 font-medium">{employee.position}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500">{employee.yearsOfExperience} Years</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary/70 transition-all duration-700" style={{ width: `${avgScore}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-700 w-8">{avgScore}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/manager/employees/${employee.id || employee._id}`)}
                            className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all"
                            title="View Profile"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/manager/evaluations?employee=${employee.id}`)}
                            className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-primary hover:text-white transition-all"
                            title="Start Assessment"
                          >
                            <ClipboardCheck className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  )
}







