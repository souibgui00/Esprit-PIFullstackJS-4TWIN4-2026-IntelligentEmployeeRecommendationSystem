"use client"

import React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
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
} from "@/components/ui/dropdown-menu"
import { useData } from "@/lib/data-store"
import { cn } from "@/lib/utils"
import {
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Users,
  Target,
  Zap,
  Clock,
  CheckCircle,
  BookOpen
} from "lucide-react"
import { useNavigate } from "react-router-dom"

export function ActivityTable({ 
  activities = [], 
  enrollments = {},
  onDelete,
  onEdit,
  onView,
  externalSearch = ""
}) {
  const navigate = useNavigate()

  // Pagination State
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 6

  // Reset to first page when filtering/searching
  React.useEffect(() => {
    setCurrentPage(1)
  }, [externalSearch, activities])

  // Pagination Logic
  const totalPages = Math.ceil(activities.length / itemsPerPage)
  const paginatedActivities = activities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return { color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: <Zap className="w-3 h-3" />, label: "Active" }
      case "upcoming":
        return { color: "bg-orange-500/10 text-orange-600 border-orange-500/20", icon: <Clock className="w-3 h-3" />, label: "Upcoming" }
      case "completed":
        return { color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: <CheckCircle className="w-3 h-3" />, label: "Completed" }
      default:
        return { color: "bg-slate-500/10 text-slate-500 border-slate-500/20", icon: <Calendar className="w-3 h-3" />, label: status || "Draft" }
    }
  }

  return (
    <div className="space-y-8">
      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="group bg-white border border-slate-100 rounded-[32px] p-8 shadow-premium hover:translate-y-[-5px] transition-all duration-500">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-slate-900/10 rounded-2xl flex items-center justify-center text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-lg">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 tracking-tight leading-none">{activities.length}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Total Activities</p>
            </div>
          </div>
        </div>

        <div className="group bg-white border border-slate-100 rounded-[32px] p-8 shadow-premium hover:translate-y-[-5px] transition-all duration-500">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-lg">
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                {activities.filter(a => a.workflowStatus === "approved").length}
              </p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Accepted</p>
            </div>
          </div>
        </div>

        <div className="group bg-white border border-slate-100 rounded-[32px] p-8 shadow-premium hover:translate-y-[-5px] transition-all duration-500">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all shadow-lg">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                {activities.filter(a => new Date(a.date || a.startDate) > new Date()).length}
              </p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Upcoming</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-100 rounded-[40px] shadow-premium overflow-hidden min-h-[500px]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                <TableHead className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Activity Name</TableHead>
                <TableHead className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</TableHead>
                <TableHead className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Attendance</TableHead>
                <TableHead className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</TableHead>
                <TableHead className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedActivities.length > 0 ? (
                paginatedActivities.map((activity) => {
                  const enrollmentList = enrollments[activity.id || activity._id] || []
                  const statusCfg = getStatusConfig(activity.status)
                  const occupancyPercent = Math.min((enrollmentList.length / (activity.capacity || 1)) * 100, 100)

                  return (
                    <TableRow
                      key={activity.id || activity._id}
                      className="group hover:bg-slate-50/30 cursor-pointer transition-all duration-300 border-b border-slate-50 last:border-0"
                      onClick={() => onView?.(activity)}
                    >
                      <TableCell className="px-10 py-6">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                            <Target className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-black text-slate-900 text-base tracking-tight leading-none group-hover:text-primary transition-colors uppercase">
                              {activity.title}
                            </p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activity.type}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-8 py-6">
                         <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-slate-300" />
                            <span className="text-sm font-bold text-slate-600">
                               {new Date(activity.date || activity.startDate).toLocaleDateString()}
                            </span>
                         </div>
                      </TableCell>

                      <TableCell className="px-8 py-6">
                        <div className="space-y-2 min-w-[120px]">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                             <span>{enrollmentList.length} / {activity.capacity}</span>
                             <span>{Math.round(occupancyPercent)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                             <div 
                                className={cn("h-full transition-all duration-1000", 
                                  occupancyPercent > 80 ? "bg-rose-500" : occupancyPercent > 40 ? "bg-emerald-500" : "bg-primary"
                                )} 
                                style={{ width: `${occupancyPercent}%` }}
                             />
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-8 py-6">
                        <div className={cn(
                          "inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border font-black text-[10px] tracking-widest uppercase",
                          statusCfg.color
                        )}>
                          {statusCfg.icon}
                          {statusCfg.label}
                        </div>
                      </TableCell>

                      <TableCell className="px-10 py-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-10 w-10 p-0 hover:bg-white hover:shadow-premium rounded-xl transition-all">
                              <MoreVertical className="h-5 w-5 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl border-none shadow-2xl">
                            <DropdownMenuItem 
                              onClick={(e) => { e.stopPropagation(); onView?.(activity) }}
                              className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 rounded-xl hover:bg-slate-50 cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-slate-400" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => { e.stopPropagation(); onEdit?.(activity) }}
                              className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 rounded-xl hover:bg-slate-50 cursor-pointer"
                            >
                              <Edit className="w-4 h-4 text-slate-400" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-50 mx-2" />
                            <DropdownMenuItem 
                              onClick={(e) => { e.stopPropagation(); onDelete?.(activity.id || activity._id) }}
                              className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-600 rounded-xl hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
                        <Target className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-widest">No activities found</p>
                      <p className="text-xs text-slate-400 mt-2 font-medium">Add a new activity or change filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modern Pagination Footer */}
      <div className="flex flex-col md:flex-row items-center justify-between px-10 pt-4 gap-6">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Page <span className="text-slate-900">{currentPage}</span> of {totalPages || 1} — Showing <span className="text-slate-900">{paginatedActivities.length}</span> Activities
        </p>
        
        <div className="flex items-center gap-3">
           <Button
             variant="outline"
             size="sm"
             onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
             disabled={currentPage === 1}
             className="h-10 px-6 rounded-2xl border-2 border-slate-50 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
           >
             Prev
           </Button>

           <div className="flex items-center gap-2">
             {Array.from({ length: totalPages }, (_, i) => i + 1)
               .filter(p => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
               .map((page, index, array) => (
                 <React.Fragment key={page}>
                   {index > 0 && array[index-1] !== page - 1 && <span className="text-slate-300 font-bold">...</span>}
                   <Button
                     onClick={() => handlePageChange(page)}
                     className={cn(
                       "h-10 w-10 rounded-xl font-black text-[11px] transition-all duration-300 active:scale-95",
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
             className="h-10 px-6 rounded-2xl border-2 border-slate-50 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
           >
             Next
           </Button>
        </div>
      </div>
    </div>
  )
}
