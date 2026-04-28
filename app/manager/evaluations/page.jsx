"use client"

import { useState, useEffect } from "react"
import { useData } from "@/lib/data-store"
import { useAuth } from "@/lib/auth-context"
import { useSearchParams } from "react-router-dom"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DashboardHeader } from "@/components/dashboard/header"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { ClipboardCheck, Plus, Eye, CheckCircle2, AlertCircle, Clock, Trash2, User, Target, ArrowLeft } from "lucide-react"

export default function ManagerEvaluationsPage() {
  const { evaluations, employees, skills, addEvaluation, updateEvaluation, deleteEvaluation, departments } = useData()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const managerDept = departments.find(d => d.manager_id === user?.id)
  const deptName = managerDept?.name
  const deptEmployees = employees.filter(e => deptName && e.department === deptName)
  const deptEvaluations = evaluations.filter(ev => deptEmployees.some(e => e.id === ev.employeeId))

  useEffect(() => {
    const preselectId = searchParams.get("employee")
    if (preselectId && deptEmployees.some(e => e.id === preselectId)) {
      navigate(`/manager/evaluations/create?employee=${preselectId}`)
    }
  }, [searchParams, navigate, deptEmployees])

  const handleDelete = (id) => {
    deleteEvaluation(id)
    toast.success("Assessment Deleted", { description: "The assessment record has been removed." })
  }

  return (
    <section className="flex flex-col bg-[#F8FAFC] min-h-screen" aria-label="Manager evaluations">
      <DashboardHeader title="Evaluations" description="Team skill assessments and performance reviews" />

      <div className="flex-1 p-8 space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-200">
              <ClipboardCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Evaluation Registry</h1>
              <p className="text-sm text-slate-500">Monitor team competency assessments and performance metrics.</p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/manager/evaluations/create")}
            className="bg-primary hover:bg-primary/90 text-white font-semibold py-6 px-8 rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Configure Assessment
          </Button>
        </div>

        <article className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" aria-label="Evaluations Table">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100 h-14">
                <TableCell className="px-8 font-bold text-slate-500 text-xs tracking-wider">Personnel</TableCell>
                <TableCell className="px-8 font-bold text-slate-500 text-xs tracking-wider">Competency Area</TableCell>
                <TableCell className="px-8 font-bold text-slate-500 text-xs tracking-wider">Performance Score</TableCell>
                <TableCell className="px-8 font-bold text-slate-500 text-xs tracking-wider">Status</TableCell>
                <TableCell className="px-8 font-bold text-slate-500 text-xs tracking-wider text-right">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deptEvaluations.map((evaluation) => {
                const emp = employees.find(e => e.id === evaluation.employeeId)
                const skill = skills.find(s => s.id === evaluation.skillId)
                return (
                  <TableRow key={evaluation.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                    <TableCell className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-slate-100 shadow-sm">
                          <AvatarImage src={emp?.avatar} />
                          <AvatarFallback className="text-xs">{emp?.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 group-hover:text-primary transition-colors text-sm">{emp?.name}</span>
                          <span className="text-[11px] text-slate-500">{emp?.position}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none px-3 font-semibold text-xs">
                          {skill?.name || "Unknown Competency"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-4">
                      {evaluation.score ? (
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all duration-1000",
                                evaluation.score >= 80 ? "bg-emerald-500" : evaluation.score >= 50 ? "bg-primary" : "bg-amber-500"
                              )}
                              style={{ width: `${evaluation.score}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-900 text-sm">{evaluation.score}%</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-8 py-4">
                      <Badge className={cn(
                        "text-xs font-medium",
                        evaluation.status === "completed" ? "bg-emerald-100 text-emerald-800" :
                          evaluation.status === "pending" ? "bg-amber-100 text-amber-800" :
                            "bg-slate-100 text-slate-800"
                      )}>
                        {evaluation.status === "completed" ? "Evaluated" :
                          evaluation.status === "pending" ? "In Progress" :
                            evaluation.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900">
                          <Eye className="h-4.5 w-4.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(evaluation.id)} className="h-9 w-9 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600">
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {deptEvaluations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <ClipboardCheck className="h-12 w-12 text-slate-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">No Evaluations Recorded</h3>
                        <p className="text-sm text-slate-500 mb-4">Initialize competency assessments to track team performance metrics.</p>
                        <Button onClick={() => navigate("/manager/evaluations/create")}>
                          Configure First Assessment
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </article>
      </div>
    </section>
  )
}




