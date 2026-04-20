"use client"

import { useState, useEffect } from "react"
import { useData } from "@/lib/data-store"
import { api } from "@/lib/api"
import { DashboardHeader } from "@/components/dashboard/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Plus,
  Calendar,
  Clock,
  Users,
  Search,
  Target,
  Zap,
  MoreVertical,
  Activity as ActivityIcon,
  Trash2,
  Edit2,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Eye,
  CheckCircle,
  XCircle,
  SlidersHorizontal,
  ArrowUpDown,
  BookOpen,
  ArrowRight,
  TrendingUp,
  X
} from "lucide-react"
import { ActivityTable } from "@/components/activities/activity-table"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"

function StatCard({ label, value, icon: Icon, color, trend }) {
  const colors = {
    orange: "bg-orange-50 text-[#F28C1B] border-orange-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-[#1E5FA8] border-blue-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100"
  }

  return (
    <div className="bg-white border-2 border-slate-50 rounded-[3rem] p-10 shadow-premium group hover:translate-y-[-10px] transition-all duration-700 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
      
      <div className="relative z-10 flex flex-col h-full justify-between gap-8">
        <div className="flex items-center justify-between">
          <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center border shadow-lg shadow-current/5", colors[color])}>
            <Icon className="w-7 h-7" />
          </div>
          {trend && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-300 tracking-[0.2em] uppercase ml-1">{label}</p>
          <div className="flex items-end gap-3 leading-none pt-1">
            <p className="text-5xl font-black text-slate-900 tracking-tighter">{value}</p>
            <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest mb-1">Units</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminActivitiesPage() {
  const { activities, enrollments, deleteActivity, fetchActivities } = useData()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [activityRequests, setActivityRequests] = useState([])
  const [reviewingRequest, setReviewingRequest] = useState(null)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewReason, setReviewReason] = useState("")
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)


  // Strategic Filter States
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [filterOccupancy, setFilterOccupancy] = useState("all")
  const [sortBy, setSortBy] = useState("date-asc")

  useEffect(() => {
    fetchActivityRequests()
  }, [])

  const fetchActivityRequests = async () => {
    try {
      const requests = await api.get("/activity-requests/pending")
      setActivityRequests(requests)
    } catch (error) {
      console.error("Failed to fetch activity requests:", error)
    }
  }

  const handleApproveRequest = async (requestId) => {
    try {
      await api.patch(`/activity-requests/${requestId}/review`, { status: "APPROVED" })
      toast.success("Request approved!", { description: "Activity has been created successfully." })
      setActivityRequests(prev => prev.filter(r => r._id !== requestId))
      await Promise.all([fetchActivities(), fetchActivityRequests()])
    } catch (error) {
      toast.error("Failed to approve request", { description: error.message })
    }
  }

  const handleRejectRequest = (request) => {
    setReviewingRequest(request)
    setReviewModalOpen(true)
  }

  const submitReview = async (status) => {
    setIsSubmittingReview(true)
    try {
      await api.patch(`/activity-requests/${reviewingRequest._id}/review`, {
        status: "REJECTED",
        rejectionReason: reviewReason,
      })
      toast.success("Request rejected!", { description: "Manager has been notified." })
      setReviewModalOpen(false)
      setReviewingRequest(null)
      setReviewReason("")
      setActivityRequests(prev => prev.filter(r => r._id !== reviewingRequest._id))
      await fetchActivityRequests()
    } catch (error) {
      toast.error("Failed to process request", { description: error.message })
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleCreateActivity = () => navigate("new")
  const handleEditActivity = (activity) => navigate(`${activity.id || activity._id}/edit`)
  const handleViewActivity = (activity) => navigate(`details/${activity.id || activity._id}`)
  
  const handleDeleteActivity = async (id) => {
    try {
      await deleteActivity(id)
      toast.success("Activity deleted", { description: "The activity has been removed successfully." })
    } catch (error) {
      toast.error("Deletion failed", { description: "Please try again later." })
    }
  }

  const filteredActivities = (activities || []).filter(activity => {
    const matchesSearch = (activity.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (activity.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filterStatus === "all" || activity.status === filterStatus
    const matchesType = filterType === "all" || activity.type === filterType
    
    const enrollmentList = enrollments[activity.id || activity._id] || []
    const occupancy = enrollmentList.length / activity.capacity
    let matchesOccupancy = true
    if (filterOccupancy === "full") matchesOccupancy = occupancy >= 0.9
    if (filterOccupancy === "filling") matchesOccupancy = occupancy < 0.9 && occupancy > 0.1
    if (filterOccupancy === "empty") matchesOccupancy = occupancy <= 0.1

    return matchesSearch && matchesStatus && matchesType && matchesOccupancy
  })

  const sortedActivities = [...filteredActivities].sort((a, b) => {
    const aEnroll = enrollments[a.id || a._id]?.length || 0
    const bEnroll = enrollments[b.id || b._id]?.length || 0
    const aOcc = aEnroll / a.capacity
    const bOcc = bEnroll / b.capacity

    if (sortBy === "date-asc") return new Date(a.date) - new Date(b.date)
    if (sortBy === "date-desc") return new Date(b.date) - new Date(a.date)
    if (sortBy === "occupancy-desc") return bOcc - aOcc
    return 0
  })

  const activeFiltersCount = [filterStatus, filterType, filterOccupancy].filter(f => f !== "all").length

  return (
    <div className="flex flex-col bg-[#F8FAFC] min-h-screen text-slate-600">
      <DashboardHeader title="Activities" description="Manage your training programs, workshops, and sessions." />

      <div className="flex-1 p-6 md:p-10 max-w-[1400px] mx-auto w-full animate-in fade-in duration-700 space-y-12">
          

        {/* Global Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-4">
          <div className="flex-1 max-w-2xl relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
              <input
                  type="text"
                  placeholder="SEARCH ACTIVITIES..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-16 pr-6 h-16 bg-white border-2 border-slate-50 rounded-[2rem] text-[11px] font-black tracking-[0.2em] text-slate-950 placeholder:text-slate-300 focus:outline-none focus:border-primary/20 shadow-premium transition-all uppercase"
              />
          </div>

          <div className="flex flex-wrap items-center gap-3">
              <Popover>
                  <PopoverTrigger asChild>
                      <Button 
                          variant="outline"
                          className={cn(
                              "h-16 px-8 rounded-[2rem] font-black text-[11px] tracking-widest uppercase transition-all shadow-premium gap-4 border-2 border-slate-50",
                              activeFiltersCount > 0 ? "bg-primary/5 border-primary/20 text-primary" : "bg-white text-slate-900 hover:bg-slate-50"
                          )}
                      >
                          <SlidersHorizontal className="h-5 w-5 text-primary" />
                          {activeFiltersCount > 0 ? `Filters (${activeFiltersCount})` : "Configure"}
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-10 bg-white border-none rounded-[3.5rem] shadow-mega space-y-10 mt-6 animate-in fade-in slide-in-from-top-4" align="end">
                      <div className="space-y-10">
                          <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                              <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Filters</h4>
                              {activeFiltersCount > 0 && (
                                  <button onClick={() => {setFilterStatus("all"); setFilterType("all"); setFilterOccupancy("all")}} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline">Clear All</button>
                              )}
                          </div>

                          <div className="space-y-8">
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 pl-1">Status</label>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                  <SelectTrigger className="h-16 rounded-[1.5rem] border-2 border-slate-50 bg-slate-50/50 font-black text-[10px] uppercase tracking-widest focus:ring-primary/20">
                                    <SelectValue placeholder="All Status" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-[2rem] border-none shadow-2xl p-2">
                                    <SelectItem value="all" className="rounded-xl py-4 font-black uppercase text-[9px] tracking-widest mb-1">All Activities</SelectItem>
                                    <SelectItem value="active" className="rounded-xl py-4 font-black uppercase text-[9px] tracking-widest mb-1">Active</SelectItem>
                                    <SelectItem value="upcoming" className="rounded-xl py-4 font-black uppercase text-[9px] tracking-widest mb-1">Upcoming</SelectItem>
                                    <SelectItem value="completed" className="rounded-xl py-4 font-black uppercase text-[9px] tracking-widest">Completed</SelectItem>
                                  </SelectContent>
                                </Select>
                             </div>

                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 pl-1">Category</label>
                                <Select value={filterType} onValueChange={setFilterType}>
                                  <SelectTrigger className="h-16 rounded-[1.5rem] border-2 border-slate-50 bg-slate-50/50 font-black text-[10px] uppercase tracking-widest focus:ring-primary/20">
                                    <SelectValue placeholder="All Categories" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-[2rem] border-none shadow-2xl p-2">
                                    <SelectItem value="all" className="rounded-xl py-4 font-black uppercase text-[9px] tracking-widest mb-1">All Categories</SelectItem>
                                    <SelectItem value="training" className="rounded-xl py-4 font-black uppercase text-[9px] tracking-widest mb-1">Training</SelectItem>
                                    <SelectItem value="workshop" className="rounded-xl py-4 font-black uppercase text-[9px] tracking-widest mb-1">Workshop</SelectItem>
                                    <SelectItem value="mentoring" className="rounded-xl py-4 font-black uppercase text-[9px] tracking-widest mb-1">Mentoring</SelectItem>
                                    <SelectItem value="webinar" className="rounded-xl py-4 font-black uppercase text-[9px] tracking-widest">Webinar</SelectItem>
                                  </SelectContent>
                                </Select>
                             </div>
                          </div>

                          <Button 
                            variant="ghost" 
                            onClick={() => {setFilterStatus("all"); setFilterType("all"); setFilterOccupancy("all")}}
                            className="w-full h-16 rounded-2xl text-[11px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-all active:scale-95 shadow-inner"
                          >Clear Selection</Button>
                      </div>
                  </PopoverContent>
              </Popover>

              <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-16 w-[240px] px-8 rounded-[2rem] bg-white border-2 border-slate-50 shadow-premium hover:bg-slate-50 transition-all font-black text-[11px] uppercase tracking-widest text-slate-900 focus:ring-primary/20">
                      <div className="flex items-center gap-4">
                        <ArrowUpDown className="h-5 w-5 text-primary" />
                        <SelectValue placeholder="Sort" />
                      </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-[2.5rem] border-none shadow-mega p-3 bg-white/95 backdrop-blur-xl">
                      <SelectItem value="date-asc" className="rounded-2xl py-4 px-6 text-[10px] font-black uppercase tracking-widest mb-2 transition-all hover:bg-slate-50">
                        <span className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Closest Launch
                        </span>
                      </SelectItem>
                      <SelectItem value="date-desc" className="rounded-2xl py-4 px-6 text-[10px] font-black uppercase tracking-widest mb-2 transition-all hover:bg-slate-50">
                        <span className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Distant Roadmap
                        </span>
                      </SelectItem>
                      <SelectItem value="occupancy-desc" className="rounded-2xl py-4 px-6 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-50">
                        <span className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Highest Attendance
                        </span>
                      </SelectItem>
                  </SelectContent>
              </Select>

              <Button
                  onClick={handleCreateActivity}
                  className="bg-slate-950 hover:bg-primary text-white h-16 px-10 rounded-[2rem] font-black text-[12px] tracking-widest uppercase transition-all shadow-xl active:scale-95 flex items-center gap-4"
              >
                  <Plus className="h-5 w-5" />
                  New Activity
              </Button>
          </div>
        </div>

        {/* Dynamic Activity Table */}
        <ActivityTable 
          activities={sortedActivities} 
          enrollments={enrollments}
          onDelete={handleDeleteActivity}
          onEdit={handleEditActivity}
          onView={handleViewActivity}
          externalSearch={searchQuery}
        />

        {/* Strategic Requests Management (If Any) */}
        {activityRequests && activityRequests.length > 0 && (
          <div className="pt-24 space-y-16 border-t-2 border-dashed border-slate-100">
            <div className="space-y-4 text-center relative">
               <Badge className="bg-orange-50 text-orange-600 border-orange-100 font-black uppercase text-[10px] tracking-widest px-6 py-2 rounded-2xl mb-4 inline-flex items-center gap-2"><ShieldAlert className="w-3.5 h-3.5" />Pending Approval</Badge>
               <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Activity Requests<span className="text-primary">.</span></h2>
               <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] opacity-60">Requests from managers awaiting review</p>
             </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
              {activityRequests.map((request) => (
                <div key={request._id} className="group bg-white border-4 border-slate-50 rounded-[4.5rem] p-12 shadow-mega hover:border-primary/10 transition-all duration-700 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
                  
                  <div className="space-y-10">
                    <div className="flex items-start justify-between">
                      <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-500 shadow-xl shadow-orange-500/5 group-hover:bg-orange-500 group-hover:text-white transition-all">
                        <ShieldQuestion className="w-8 h-8" />
                      </div>
                      <div className="flex flex-col items-end gap-2 text-right">
                         <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">PROPOSAL REF</span>
                         <span className="text-[10px] font-black text-slate-950 font-mono tracking-widest">{request._id?.substring(0,8).toUpperCase()}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                       <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-tight">{request.title}</h3>
                       <p className="text-[13px] text-slate-500 font-medium leading-relaxed italic opacity-80 border-l-4 border-orange-200 pl-6">
                         "{request.description}"
                       </p>
                    </div>

                    <div className="grid grid-cols-2 gap-10 pt-8 border-t border-slate-50">
                       <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Seat Target</p>
                          <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-orange-400" />
                            <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{request.seatCount || 0}</p>
                          </div>
                       </div>
                       <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Priority Segment</p>
                          <Badge className="bg-orange-50 text-orange-600 border-none rounded-xl text-[10px] font-black uppercase px-4 py-2">Urgent Need</Badge>
                       </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-12">
                     <Button className="flex-1 h-18 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[12px] tracking-[0.2em] uppercase rounded-[2rem] shadow-2xl shadow-emerald-600/30 active:scale-95 transition-all" onClick={() => handleApproveRequest(request._id)}>
                        Approve
                     </Button>
                     <Button variant="outline" className="flex-1 h-18 border-2 border-rose-100 text-rose-500 font-black text-[12px] tracking-[0.2em] uppercase rounded-[2rem] hover:bg-rose-50 active:scale-95 transition-all" onClick={() => handleRejectRequest(request)}>
                        Reject
                     </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Dialog */}
        <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
            <DialogContent className="sm:max-w-2xl p-0 bg-transparent border-none shadow-none overflow-hidden">
                <div className="bg-white rounded-[4rem] shadow-mega p-16 space-y-12 animate-in zoom-in-95 duration-500 relative ring-1 ring-slate-100">
                    <div className="space-y-4">
                    <Badge className="bg-rose-50 text-rose-600 border-none font-black uppercase text-[10px] tracking-[0.2em] px-6 py-2 rounded-xl mb-4 inline-flex items-center gap-2"><ShieldAlert className="w-3.5 h-3.5" />Rejection Reason</Badge>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Reject Activity</h2>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-60">Explain why you are rejecting this activity.</p>
                    </div>

                    <Textarea 
                        placeholder="TYPE THE REASON FOR REJECTION HERE..." 
                        value={reviewReason} 
                        onChange={(e) => setReviewReason(e.target.value)} 
                        className="min-h-[220px] rounded-[2.5rem] p-10 border-2 border-slate-50 bg-slate-50/50 text-sm font-bold placeholder:text-[10px] placeholder:font-black placeholder:tracking-[0.2em] focus:bg-white focus:border-rose-200 transition-all shadow-inner no-scrollbar" 
                    />

                    <div className="flex flex-col md:flex-row gap-6 pt-6">
                        <Button variant="outline" className="flex-1 h-16 rounded-2xl font-black text-[11px] uppercase tracking-widest border-2 border-slate-100 hover:bg-slate-50 transition-all" onClick={() => setReviewModalOpen(false)}>Cancel</Button>
                        <Button className="flex-1 h-16 rounded-2xl font-black text-[11px] uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-500/20 active:scale-95 transition-all" onClick={() => submitReview("REJECTED")}>Confirm Rejection</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}