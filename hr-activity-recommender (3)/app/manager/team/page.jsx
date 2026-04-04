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
  const [selectedEmployee, setSelectedEmployee] = useState(null)

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
    <div className="flex flex-col bg-[#F8FAFC] min-h-screen">
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

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
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
                            onClick={() => setSelectedEmployee(employee)}
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
        </div>
      </div>

      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="max-w-[700px] bg-white border-none rounded-xl p-0 overflow-hidden shadow-2xl">
          <div className="bg-slate-900 px-8 py-10 relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Users className="w-32 h-32 text-white" />
            </div>
            <DialogHeader className="relative z-10">
              <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/30 tracking-wider mb-2 bg-primary/5">Personnel Profile</Badge>
              <DialogTitle className="text-2xl font-bold text-white tracking-tight">
                {selectedEmployee?.name}
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-sm">
                Comprehensive overview of performance and metrics.
              </DialogDescription>
            </DialogHeader>
          </div>

          {selectedEmployee && (
            <div className="flex flex-col">
              <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-8 bg-slate-50/30">
                <Avatar className="h-24 w-24 rounded-2xl border-2 border-white shadow-xl bg-white">
                  <AvatarImage src={selectedEmployee.avatar} className="object-cover" />
                  <AvatarFallback className="text-2xl font-bold text-slate-400">{selectedEmployee.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 border-slate-200 text-slate-600 tracking-wider">{selectedEmployee.department}</Badge>
                    <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 border-slate-200 text-slate-600 tracking-wider">ID: {selectedEmployee.matricule}</Badge>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedEmployee.position}</h3>
                  <div className="grid grid-cols-2 gap-4 mt-4 text-slate-500">
                    <div className="flex items-center gap-2 text-xs">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {selectedEmployee.email}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {selectedEmployee.telephone}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center min-w-[100px]">
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-1">Tenure</p>
                  <p className="text-xl font-bold text-slate-900">{selectedEmployee.yearsOfExperience} <span className="text-sm font-medium text-slate-400">Yrs</span></p>
                </div>
              </div>

              <Tabs defaultValue="skills" className="w-full">
                <div className="px-8 border-b border-slate-100 bg-white">
                  <TabsList className="bg-transparent p-0 gap-6 h-12">
                    <TabsTrigger value="skills" className="bg-transparent border-none p-0 text-sm font-semibold text-slate-400 data-[state=active]:text-primary relative h-full rounded-none outline-none group/tab">
                      Skill Assessment
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 group-data-[state=active]/tab:scale-x-100 transition-transform duration-300" />
                    </TabsTrigger>
                    <TabsTrigger value="info" className="bg-transparent border-none p-0 text-sm font-semibold text-slate-400 data-[state=active]:text-primary relative h-full rounded-none outline-none group/tab">
                      Work Details
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 group-data-[state=active]/tab:scale-x-100 transition-transform duration-300" />
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-8 max-h-[400px] overflow-y-auto">
                  <TabsContent value="skills" className="mt-0 outline-none space-y-4">
                    {selectedEmployee.skills?.map((skill) => (
                      <div key={skill.skillId?._id || skill.skillId} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-primary/20 transition-all shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm",
                            (skill.score > 80) ? "bg-slate-900" : (skill.score > 50) ? "bg-primary" : "bg-slate-300"
                          )}>
                            {(skill.level?.[0] || 'B').toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{skill.skillId?.name || "Specialized Skill"}</p>
                            <p className="text-xs text-slate-400">{getSkillTypeLabel(skill.skillId?.type)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right shrink-0">
                            <p className="text-base font-bold text-slate-900 leading-none">{Math.round((skill.score || 0) * 10) / 10}</p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              {getProgressionIcon(skill.progression || 0)}
                              <span className={cn(
                                "text-[10px] font-bold",
                                (skill.progression || 0) > 0 ? "text-emerald-500" : (skill.progression || 0) < 0 ? "text-rose-500" : "text-slate-400"
                              )}>
                                {skill.progression > 0 ? "+" : ""}{skill.progression || 0}%
                              </span>
                            </div>
                          </div>
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary/70 transition-all duration-700" style={{ width: `${Math.min(((skill.score || 0) / 120) * 100, 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="info" className="mt-0 outline-none space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                          <CalendarIcon className="w-4 h-4 text-primary" />
                          <p className="text-[11px] font-bold text-slate-400 tracking-wider">Join Date</p>
                        </div>
                        <p className="text-sm font-semibold text-slate-700">
                           {selectedEmployee.date_embauche ? new Date(selectedEmployee.date_embauche).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Briefcase className="w-4 h-4 text-primary" />
                          <p className="text-[11px] font-bold text-slate-400 tracking-wider">Contract Type</p>
                        </div>
                        <p className="text-sm font-semibold text-slate-700">Full-time Permanent</p>
                      </div>
                    </div>
                    <div className="p-6 rounded-xl border border-slate-100 bg-slate-50/50">
                      <p className="text-[11px] font-bold text-slate-400 tracking-wider mb-2">Role description</p>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        {selectedEmployee.jobDescription || "No job description provided."}
                      </p>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>

              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/30">
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="bg-white border border-slate-200 text-slate-600 font-semibold py-2 px-6 rounded-lg text-sm hover:bg-slate-50 transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    navigate(`/manager/evaluations?employee=${selectedEmployee.id}`)
                    setSelectedEmployee(null)
                  }}
                  className="bg-primary text-white font-semibold py-2 px-6 rounded-lg text-sm shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  Request Assessment
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}







