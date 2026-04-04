"use client"

import { useState } from "react"
import { useData } from "@/lib/data-store"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Calendar, MapPin, Users, Clock, BookOpen, Award, Briefcase, Eye, UserPlus, Sparkles, Filter, CheckCircle, XCircle, X } from "lucide-react"
import { getActivityTypeLabel, cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function ManagerActivitiesPage() {
  const { activities, employees, enrollments, departments, approveActivity, rejectActivity, skills } = useData()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [rejectionModalOpen, setRejectionModalOpen] = useState(false)
  const [rejectingActivity, setRejectingActivity] = useState(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false)

  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [requestForm, setRequestForm] = useState({
    title: "",
    description: "",
    requiredSkills: [],
    seatCount: 1,
  })
  const [skillSearchValue, setSkillSearchValue] = useState("")
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)

  // Robust department/team resolution
  const getDeptId = (d) => {
    if (!d) return null;
    if (typeof d === "string") return d;
    return (d.$oid || d._id || d.id || d)?.toString();
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

  const deptEmployees = employees.filter(e => {
    if (e.role?.toLowerCase() === "admin") return false;
    const isSelf = (e.id || e._id) === (user?.id || user?._id);
    if (isSelf) return false;
    
    const eDeptId = getDeptId(e.department_id) || getDeptId(e.department);
    const eDeptName = e.department || getDeptName(e.department_id) || "Unassigned";

    if (uDeptId && eDeptId && uDeptId === eDeptId) return true;
    if (uDeptName !== "Unassigned" && String(uDeptName).toLowerCase().trim() === String(eDeptName).toLowerCase().trim()) return true;
    if (uDeptId && eDeptName.length === 24 && uDeptId === eDeptName) return true;
    return false;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case "training": return <BookOpen className="h-5 w-5" />
      case "certification": return <Award className="h-5 w-5" />
      case "project": return <Briefcase className="h-5 w-5" />
      default: return <Calendar className="h-5 w-5" />
    }
  }

  const pendingActivities = activities.filter(a => {
    if (a.workflowStatus !== "pending_approval") return false
    // Only show if this manager's department is in the targetDepartments list
    if (!a.targetDepartments || a.targetDepartments.length === 0) return true // fallback: show all if no target set
    const managerDeptId = uDeptId
    return a.targetDepartments.some(d => {
      const dId = d?._id || d?.id || d
      return String(dId) === String(managerDeptId)
    })
  })
  const upcomingActivities = activities.filter(a => a.status === "open" && a.workflowStatus === "approved")
  const ongoingActivities = activities.filter(a => a.status === "closed" && a.workflowStatus === "approved")
  const completedActivities = activities.filter(a => a.status === "completed")

  const activityKey = (a) => a.id || a._id

  const formatActivityDay = (activity) => {
    const raw = activity.startDate ?? activity.date
    if (raw == null || raw === "") return "TBD"
    const d = new Date(raw)
    return Number.isNaN(d.getTime())
      ? "TBD"
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const ActivityCard = ({ activity }) => {
    const aKey = String(activityKey(activity) ?? "")
    const enrollmentList = enrollments[aKey] || enrollments[activity.id] || enrollments[activity._id] || []
    const capacity = activity.availableSeats ?? activity.capacity ?? 0

    const enrolled = enrollmentList.filter(id =>
      deptEmployees.some(e => String(e.id) === String(id) || String(e._id) === String(id))
    )

    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all group overflow-hidden flex flex-col h-full">
        <div className="p-6 border-b border-slate-100 relative bg-slate-50/30">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                {getTypeIcon(activity.type)}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors leading-tight">{activity.title}</h3>
                <p className="text-[10px] font-bold text-slate-400 tracking-wider mt-1">{getActivityTypeLabel(activity.type)}</p>
              </div>
            </div>
            <Badge variant="outline" className={cn(
              "text-[10px] font-bold border-none rounded-md px-2 py-0.5",
              activity.status === "open" ? "bg-emerald-50 text-emerald-600" :
                activity.status === "closed" ? "bg-orange-50 text-orange-600" :
                  "bg-slate-50 text-slate-500"
            )}>
              {activity.status === "open" ? "ENROLLMENT OPEN" : activity.status.toUpperCase()}
            </Badge>
          </div>
        </div>

        <div className="p-6 flex-1 flex flex-col gap-5">
          <p className="text-sm text-slate-500 leading-relaxed font-medium line-clamp-2">
            {activity.description}
          </p>

          <div className="grid grid-cols-2 gap-y-3 gap-x-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <Calendar className="h-4 w-4 text-slate-400" />
              {formatActivityDay(activity)}
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <Clock className="h-4 w-4 text-slate-400" />
              {activity.duration}
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span className="truncate">{activity.location}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <Users className="h-4 w-4 text-slate-400" />
              {enrolled.length}/{capacity || "—"} Enrolled
            </div>
          </div>

          {enrolled.length > 0 && (
            <div className="pt-4 border-t border-slate-100 mt-2">
              <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-3">Team Participation ({enrolled.length} members)</p>
              <div className="flex -space-x-2">
                {enrolled.slice(0, 5).map(empId => {
                  const emp = deptEmployees.find(e => e.id === empId)
                  return (
                    <Avatar key={empId} className="h-8 w-8 border-2 border-white rounded-lg shadow-sm">
                      <AvatarImage src={emp?.avatar} />
                      <AvatarFallback className="bg-slate-100 text-slate-500 font-bold text-[10px]">{emp?.name[0]}</AvatarFallback>
                    </Avatar>
                  )
                })}
                {enrolled.length > 5 && (
                  <div className="h-8 w-8 rounded-lg bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm">
                    +{enrolled.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2 mt-auto">
            {activity.workflowStatus === "pending_approval" ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    try {
                      await approveActivity(activity.id)
                      toast.success("Activity Approved", { description: "Program is now available for enrollment." })
                    } catch (e) {
                      toast.error("Process Failed")
                    }
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRejectingActivity(activity)
                    setRejectionModalOpen(true)
                  }}
                  className="flex-1 text-rose-600 border-rose-100 hover:bg-rose-50"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/manager/program-analysis/${activity.id || activity._id}`)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4" />
                  Analysis
                </Button>
                {activity.status !== "completed" && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/manager/program-enroll/${activity.id || activity._id}`)}
                    className="flex-1"
                  >
                    <UserPlus className="h-4 w-4" />
                    Configure
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-[#F8FAFC] min-h-screen">
      <DashboardHeader title="Programs" description="Training and development activities" />

      <div className="flex-1 p-8 space-y-8 animate-in fade-in duration-500">
        <Tabs defaultValue="upcoming" className="w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-200 pb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-200">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Program Portfolio</h1>
                <p className="text-sm text-slate-500">Coordinate team development initiatives and enrollment.</p>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <Button variant="primary" size="lg" onClick={() => setRequestDialogOpen(true)}>
                + Request Activity
              </Button>
            </div>
          </div>

          <TabsList className="bg-slate-100 p-1 rounded-xl h-12 mb-8">
            <TabsTrigger value="requests" className="px-6 h-10 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Requests ({pendingActivities.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="px-6 h-10 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Open for Enrollment ({upcomingActivities.length})
            </TabsTrigger>
            <TabsTrigger value="ongoing" className="px-6 h-10 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
              In Progress ({ongoingActivities.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="px-6 h-10 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Completed ({completedActivities.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="mt-0 outline-none">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pendingActivities.map(activity => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
              {pendingActivities.length === 0 && (
                <div className="col-span-full text-center py-20 bg-white border border-slate-200 rounded-xl">
                  <Sparkles className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No pending requests</h3>
                  <p className="text-sm text-slate-500">Your request list is empty.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="mt-0 outline-none">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingActivities.map(activity => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
              {upcomingActivities.length === 0 && (
                <div className="col-span-full text-center py-20 bg-white border border-slate-200 rounded-xl">
                  <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Scheduled Programs</h3>
                  <p className="text-sm text-slate-500">No upcoming development programs are currently scheduled.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ongoing" className="mt-0 outline-none">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {ongoingActivities.map(activity => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
              {ongoingActivities.length === 0 && (
                <div className="col-span-full text-center py-20 bg-white border border-slate-200 rounded-xl">
                  <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No In-Progress Programs</h3>
                  <p className="text-sm text-slate-500">No programs are currently in progress.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-0 outline-none">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {completedActivities.map(activity => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
              {completedActivities.length === 0 && (
                <div className="col-span-full text-center py-20 bg-white border border-slate-200 rounded-xl">
                  <CheckCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Completed Programs</h3>
                  <p className="text-sm text-slate-500">Your completed activities will appear here.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Request Activity Dialog */}
        <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
          <DialogContent className="bg-white rounded-2xl">
            <DialogHeader>
              <DialogTitle>Request New Activity</DialogTitle>
              <DialogDescription>Fill in the details to request a new training or development activity for your team.</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setIsSubmittingRequest(true)
                try {
                  await api.post("/activity-requests", {
                    title: requestForm.title,
                    description: requestForm.description,
                    requiredSkills: requestForm.requiredSkills,
                    seatCount: Number(requestForm.seatCount),
                  })
                  toast.success("Request submitted!", { description: "Your activity request has been sent to HR for approval." })
                  setRequestDialogOpen(false)
                  setRequestForm({ title: "", description: "", requiredSkills: [], seatCount: 1 })
                  setSkillSearchValue("")
                } catch (err) {
                  toast.error("Failed to submit request", { description: err.message || "Please try again later." })
                } finally {
                  setIsSubmittingRequest(false)
                }
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="title">Activity Title</Label>
                <Input id="title" placeholder="e.g., Advanced TypeScript Training" value={requestForm.title} onChange={e => setRequestForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Describe the activity..." value={requestForm.description} onChange={e => setRequestForm(f => ({ ...f, description: e.target.value }))} required className="min-h-24" />
              </div>
              <div>
                <Label htmlFor="requiredSkills">Required Skills</Label>
                <div className="space-y-3">
                  <Select value={skillSearchValue} onValueChange={(skillId) => {
                    const skill = skills.find(s => (s.id || s._id) === skillId)
                    if (skill && !requestForm.requiredSkills.includes(skill.name)) {
                      setRequestForm(f => ({ ...f, requiredSkills: [...f.requiredSkills, skill.name] }))
                      setSkillSearchValue("")
                    }
                  }}>
                    <SelectTrigger className="bg-white border border-slate-200 rounded-lg">
                      <SelectValue placeholder="Search and select skills..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 rounded-lg shadow-lg">
                      {skills
                        .filter(s => !requestForm.requiredSkills.includes(s.name) && 
                                    (s.name.toLowerCase().includes(skillSearchValue.toLowerCase()) || skillSearchValue === ""))
                        .map((skill) => (
                          <SelectItem key={skill.id || skill._id} value={skill.id || skill._id} className="py-2">
                            {skill.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  
                  {requestForm.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                      {requestForm.requiredSkills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="flex items-center gap-2 bg-blue-100 text-blue-700 border-blue-200">
                          {skill}
                          <button
                            type="button"
                            onClick={() => setRequestForm(f => ({ ...f, requiredSkills: f.requiredSkills.filter(s => s !== skill) }))}
                            className="ml-1 hover:bg-blue-200 rounded p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="seatCount">Available Seats</Label>
                <Input id="seatCount" type="number" min="1" value={requestForm.seatCount} onChange={e => setRequestForm(f => ({ ...f, seatCount: e.target.value }))} required />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRequestDialogOpen(false)} disabled={isSubmittingRequest}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={isSubmittingRequest}>{isSubmittingRequest ? 'Submitting...' : 'Submit Request'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rejection Modal */}
      <Dialog open={rejectionModalOpen} onOpenChange={setRejectionModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Provide Rejection Reason</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Explain why this program is being rejected. This feedback will be sent to the activity coordinator.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="e.g., Budget constraints for this quarter, or needs more focus on technical skills..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[120px] bg-slate-50 border-slate-100 focus:ring-primary h-32 rounded-2xl p-4 text-sm resize-none"
            />
          </div>
          <DialogFooter className="flex gap-3 sm:justify-start">
            <Button
              variant="outline"
              onClick={() => {
                setRejectionModalOpen(false)
                setRejectionReason("")
              }}
              className="flex-1 rounded-xl h-12 font-bold uppercase tracking-widest text-[10px]"
            >
              Cancel
            </Button>
            <Button
              disabled={!rejectionReason.trim() || isSubmittingRejection}
              onClick={async () => {
                setIsSubmittingRejection(true)
                try {
                  await rejectActivity(rejectingActivity.id || rejectingActivity._id, rejectionReason)
                  toast.success("Program Rejected", { description: "The coordinator has been notified." })
                  setRejectionModalOpen(false)
                  setRejectionReason("")
                } catch (e) {
                  toast.error("Failed to process rejection")
                } finally {
                  setIsSubmittingRejection(false)
                }
              }}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-12 font-bold uppercase tracking-widest text-[10px]"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}






