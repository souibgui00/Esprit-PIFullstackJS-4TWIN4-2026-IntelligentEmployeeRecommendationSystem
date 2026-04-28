"use client"

import React, { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableCaption,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { useData } from "@/lib/data-store"
import { cn, getInitials } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Users,
  Building2,
  Activity,
  UserCheck,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Mail,
  MoreVertical
} from "lucide-react"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"

export function EmployeeTable({
  onSelectEmployee,
  selectedEmployeeId,
  externalSearch = "",
  sortBy = "score-desc",
  deptFilter = "all",
  roleFilter = "all",
  managerFilter = "all"
}) {
  const { employees, deleteEmployee } = useData()
  const { user } = useAuth()
  const navigate = useNavigate()
  const rolePrefix = user?.role?.toLowerCase() === "hr" ? "/hr" : "/admin"

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Reset to first page when filtering
  React.useEffect(() => {
    setCurrentPage(1)
  }, [externalSearch, sortBy, deptFilter, roleFilter, managerFilter])

  const allowedEmployees = employees.filter((employee) => {
    const currentUserRole = user?.role?.toLowerCase();
    const targetRole = employee.role?.toLowerCase() || employee.position?.toLowerCase();

    // Hide the main Admin from the general roster to maintain operational focus
    if (targetRole === "admin") return false;

    if (currentUserRole === "manager") {
      // Helper to extract a string ID from various formats (_id, $oid, or plain string)
      const getDeptId = (d) => {
        if (!d) return null;
        if (typeof d === "string") return d;
        // Handle MongoDB extended JSON format { $oid: '...' }
        const id = d.$oid || d._id || d.id;
        if (id) return id.toString();
        // Fallback for cases where the object might BE the id (like ObjectId instance)
        if (typeof d === 'object' && d.toString) return d.toString();
        return null;
      };

      const getDeptName = (d) => {
        if (!d) return "Unassigned";
        if (typeof d === "string") return d;
        return d.name || "Unassigned";
      };

      // Get identifiers for current user (manager)
      const uDeptId = getDeptId(user?.department_id) || getDeptId(user?.department);
      const uDeptName = getDeptName(user?.department_id) || getDeptName(user?.department) || user?.department || "Unassigned";

      // Get identifiers for target employee
      const eDeptId = getDeptId(employee?.department_id) || getDeptId(employee?.department);
      const eDeptName = employee?.department || getDeptName(employee?.department_id) || "Unassigned";

      let isSameDept = false;

      // priority 1: Match by ID (most accurate)
      if (uDeptId && eDeptId && uDeptId === eDeptId) {
        isSameDept = true;
      }
      // priority 2: Match by Name (case-insensitive)
      else if (uDeptName !== "Unassigned" && eDeptName !== "Unassigned" &&
        String(uDeptName).toLowerCase().trim() === String(eDeptName).toLowerCase().trim()) {
        isSameDept = true;
      }
      // priority 3: Fallback mismatch check (e.g. comparing uDeptId string with eDeptName if one is hex)
      else if (uDeptId && eDeptName.length === 24 && uDeptId === eDeptName) {
        isSameDept = true;
      }

      // Hide if they are not in the same department
      if (!isSameDept) return false;
    }

    return true;
  });

  const filteredEmployees = allowedEmployees
    .filter((employee) => {
      const effectiveSearch = externalSearch || ""

      // Basic Search
      const matchesSearch = (
        (employee.name?.toLowerCase() || "").includes(effectiveSearch.toLowerCase()) ||
        (employee.email?.toLowerCase() || "").includes(effectiveSearch.toLowerCase())
      )
      if (!matchesSearch) return false

      // Department Filter
      if (deptFilter !== "all" && employee.department !== deptFilter) return false

      // Role Filter
      if (roleFilter !== "all" && (employee.position || employee.role) !== roleFilter) return false

      // Manager Filter
      if (managerFilter !== "all") {
        const hasManager = employees.some(e =>
          (e.role === "MANAGER" || e.role === "HR") &&
          e.department === employee.department &&
          (e.id !== employee.id && e._id !== employee._id)
        )
        if (managerFilter === "assigned" && !hasManager) return false
        if (managerFilter === "unassigned" && hasManager) return false
      }

      return true
    })
    .sort((a, b) => {
      if (sortBy === "score-desc") return (b.rankScore || 0) - (a.rankScore || 0)
      if (sortBy === "score-asc") return (a.rankScore || 0) - (b.rankScore || 0)
      return 0
    })

  // Pagination Logic
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleDelete = (id, name, e) => {
    e.stopPropagation()
    deleteEmployee(id)
    toast.success(`${name} removed successfully`)
  }

  const handleEdit = (employee, e) => {
    e.stopPropagation()
    navigate(`${rolePrefix}/employees/edit/${employee.id || employee._id}`)
  }

  const handleRowKeyDown = (employee, event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onSelectEmployee?.(employee)
    }
  }

  const getStatusConfig = (employee) => {
    if (employee.status?.toLowerCase() === "suspended") {
      return { color: "bg-rose-500/10 text-rose-500 border-rose-500/20", icon: <XCircle className="w-3 h-3" />, label: "Suspended" }
    }

    if (employee.en_ligne || employee.id === user?.id || employee._id === user?.id || employee.id === user?._id || employee._id === user?._id) {
      return { color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: <CheckCircle className="w-3 h-3" />, label: "Online" }
    }

    return { color: "bg-slate-500/10 text-slate-500 border-slate-500/20", icon: <Activity className="w-3 h-3" />, label: "Offline" }
  }

  return (
    <section className="space-y-8" aria-label="Employees Table Overview">

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="group bg-white border border-slate-100 rounded-4xl p-10 shadow-premium hover:-translate-y-1.25 transition-all duration-500">
          <div className="flex items-center gap-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-lg shadow-primary/5">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-4xl font-black text-slate-900 tracking-tight leading-none">{allowedEmployees.length}</p>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-3">Total Users</p>
            </div>
          </div>
        </div>

        <div className="group bg-white border border-slate-100 rounded-4xl p-10 shadow-premium hover:-translate-y-1.25 transition-all duration-500">
          <div className="flex items-center gap-8">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-lg shadow-emerald-500/5">
              <UserCheck className="w-8 h-8" />
            </div>
            <div>
              <p className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                {allowedEmployees.filter(e => e.status?.toLowerCase() === "active").length}
              </p>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-3">Active Users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-100 rounded-[40px] shadow-premium overflow-hidden" id="user-table-top">
        <div className="overflow-x-auto">
          <Table>
            <TableCaption className="sr-only">
              Employee directory with department, manager, position, status, and score columns.
            </TableCaption>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                <TableHead scope="col" className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">User Name</TableHead>
                <TableHead scope="col" className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Department</TableHead>
                <TableHead scope="col" className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Manager</TableHead>
                <TableHead scope="col" className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Position</TableHead>
                <TableHead scope="col" className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</TableHead>
                <TableHead scope="col" className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Score</TableHead>
                <TableHead scope="col" className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEmployees.map((employee) => {
                const statusConfig = getStatusConfig(employee)
                const isSelected = selectedEmployeeId === employee.id || selectedEmployeeId === employee._id

                return (
                  <TableRow
                    key={employee.id || employee._id}
                    className={cn(
                      "group hover:bg-slate-50/30 cursor-pointer transition-all duration-300 border-b border-slate-50 last:border-0",
                      isSelected && "bg-primary/3"
                    )}
                    onClick={() => onSelectEmployee?.(employee)}
                    onKeyDown={(event) => handleRowKeyDown(employee, event)}
                    tabIndex={0}
                    role="button"
                    aria-label={`View details for ${employee.name}`}
                  >
                    <TableCell className="px-10 py-6">
                      <div className="flex items-center gap-5">
                        <div className="relative">
                          <Avatar className="h-14 w-14 rounded-2xl shadow-premium border-2 border-white ring-1 ring-slate-100 group-hover:scale-105 transition-transform duration-500">
                            <AvatarImage src={employee.avatar} className="object-cover" />
                            <AvatarFallback className="bg-slate-900 text-white font-black text-sm">
                              {getInitials(employee.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className={cn(
                            "absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full z-10",
                            (employee.en_ligne || employee.id === user?.id || employee._id === user?.id || employee.id === user?._id || employee._id === user?._id) ? "bg-emerald-500" : "bg-slate-300"
                          )}></span>
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-slate-900 text-base tracking-tight leading-none group-hover:text-primary transition-colors">
                            {employee.name}
                          </p>
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 text-slate-300" />
                            <p className="text-xs font-bold text-slate-400 tracking-tight">{employee.email}</p>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                            {employee.role?.toLowerCase() === "hr" ? "-" : (employee.department || "Unassigned")}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const dept = employees.find(e =>
                            (e.role === "MANAGER" || e.role === "HR") &&
                            e.department === employee.department &&
                            (e.id !== employee.id && e._id !== employee._id)
                          )
                          return (
                            <>
                              <div className={cn("w-2 h-2 rounded-full", dept ? "bg-emerald-500" : "bg-rose-500")} />
                              <span className="text-[11px] font-bold text-slate-900 truncate uppercase tracking-tight">
                                {dept?.name || "Unassigned"}
                              </span>
                            </>
                          )
                        })()}
                      </div>
                    </TableCell>

                    <TableCell className="px-8 py-6">
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-4 py-1.5 rounded-xl border-none font-black text-[10px] tracking-widest uppercase shadow-sm",
                          employee.role?.toLowerCase() === "admin" ? "bg-slate-950 text-white" :
                            employee.role?.toLowerCase() === "manager" ? "bg-primary text-white" :
                              "bg-slate-100 text-slate-500"
                        )}
                      >
                        {employee.position || employee.role || "User"}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-8 py-6">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border font-black text-[10px] tracking-widest uppercase",
                        statusConfig.color
                      )}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </div>
                    </TableCell>

                    <TableCell className="px-8 py-6">
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900 leading-none">
                            {Math.round(employee.rankScore || 0)}
                          </span>
                          <span className="text-[9px] font-black text-primary opacity-40">/ 120</span>
                        </div>
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">
                          {employee.rank || "Junior"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="px-10 py-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-12 w-12 p-0 hover:bg-white hover:shadow-premium rounded-2xl transition-all" aria-label={`Open actions for ${employee.name}`}>
                            <MoreVertical className="h-5 w-5 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-none shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); onSelectEmployee?.(employee) }}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 rounded-xl hover:bg-slate-50 cursor-pointer transition-all"
                          >
                            <Eye className="w-4 h-4 text-slate-400" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleEdit(employee, e)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 rounded-xl hover:bg-slate-50 cursor-pointer transition-all"
                          >
                            <Edit className="w-4 h-4 text-slate-400" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-50 mx-2" />
                          <DropdownMenuItem
                            onClick={(e) => handleDelete(employee.id, employee.name, e)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-600 rounded-xl hover:bg-rose-50 cursor-pointer transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Empty State Integration */}
        {filteredEmployees.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
              <Users className="w-8 h-8" />
            </div>
            <p className="text-sm font-black text-slate-900 uppercase tracking-widest">No matching users</p>
            <p className="text-xs text-slate-400 mt-2 font-medium">Try searching for a different name or role.</p>
          </div>
        )}
      </div>

      {/* Modern Pagination Footer */}
      <div className="flex flex-col md:flex-row items-center justify-between px-10 pt-4 gap-6">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" aria-live="polite">
          Page <span className="text-slate-900">{currentPage}</span> of {totalPages || 1} — Showing <span className="text-slate-900">{paginatedEmployees.length}</span> Users
        </p>

        <nav aria-label="Pagination" className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className="h-12 px-6 rounded-2xl border-2 border-slate-50 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Prev
          </Button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array[index - 1] !== page - 1 && <span className="text-slate-300 font-bold">...</span>}
                  <Button
                    onClick={() => handlePageChange(page)}
                    aria-label={`Go to page ${page}`}
                    aria-current={currentPage === page ? "page" : undefined}
                    className={cn(
                      "h-12 w-12 rounded-2xl font-black text-[11px] transition-all duration-300 active:scale-95",
                      currentPage === page
                        ? "bg-slate-950 text-white shadow-xl shadow-slate-900/20"
                        : "bg-white text-slate-400 border-2 border-slate-50 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    {page}
                  </Button>
                </React.Fragment>
              ))
            }
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            aria-label="Next page"
            className="h-12 px-6 rounded-2xl border-2 border-slate-50 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next
          </Button>
        </nav>
      </div>
    </section>
  )
}
