"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { managerActivityEnrollmentSchema } from "@/lib/schemas"
import { useData } from "@/lib/data-store"
import { useAuth } from "@/lib/auth-context"
import { DashboardHeader } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Users,
    Calendar,
    Clock,
    MapPin,
    BookOpen,
    Award,
    Briefcase,
    ArrowLeft,
    Target,
    AlertCircle,
    CheckCircle2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function ActivityEnrollmentView() {
    const { activityId } = useParams()
    const navigate = useNavigate()
    const { activities, employees, departments, enrollEmployee, unenrollEmployee, enrollments } = useData()
    const { user } = useAuth()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [currentEnrollments, setCurrentEnrollments] = useState([])
    const [recommendations, setRecommendations] = useState([])
    const [loadingRecommendations, setLoadingRecommendations] = useState(false)

    const toIdString = (value) => {
        if (value == null) return ""
        if (typeof value === "string") return value
        if (typeof value === "object") {
            return String(value._id || value.id || value.$oid || "")
        }
        return String(value)
    }

    const activity = activities.find(a => {
        const aid = toIdString(a.id || a._id)
        return aid && aid === String(activityId)
    })

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

    const currentUserId = toIdString(user?.id || user?._id)
    const managerDept = departments.find(d => {
        const mId = toIdString(d.manager_id)
        return mId && mId === currentUserId
    });

    const uDeptId = getDeptId(user?.department_id) || getDeptId(user?.department) || getDeptId(managerDept);
    const uDeptName = getDeptName(user?.department_id) || getDeptName(user?.department) || user?.department || managerDept?.name || "Unassigned";

    const deptName = uDeptName; // Keep for JSX

    const deptEmployees = employees.filter(e => {
        if (e.role?.toLowerCase() === "admin") return false;
        const isSelf = toIdString(e.id || e._id) === currentUserId;
        if (isSelf) return false;
        
        const eDeptId = getDeptId(e.department_id) || getDeptId(e.department);
        const eDeptName = e.department || getDeptName(e.department_id) || "Unassigned";

        if (uDeptId && eDeptId && uDeptId === eDeptId) return true;
        if (uDeptName !== "Unassigned" && String(uDeptName).toLowerCase().trim() === String(eDeptName).toLowerCase().trim()) return true;
        if (uDeptId && eDeptName.length === 24 && uDeptId === eDeptName) return true;
        return false;
    });

    const form = useForm({
        resolver: zodResolver(managerActivityEnrollmentSchema),
        defaultValues: {
            activityId: activityId || "",
            selectedEmployees: [],
            enrollmentNotes: "",
            priorityLevel: "standard"
        }
    })

    useEffect(() => {
        if (activity) {
            const activeId = toIdString(activity.id || activity._id)
            const rawEnrollments = enrollments[activeId] || []

            const deptEmployeeIds = new Set(
                deptEmployees
                    .map(e => toIdString(e.id || e._id))
                    .filter(Boolean)
            )

            const enrolled = rawEnrollments
                .map(id => toIdString(id))
                .filter(id => deptEmployeeIds.has(id))

            setCurrentEnrollments(enrolled)
            form.setValue("selectedEmployees", enrolled)

            // Fetch AI Recommendations
            const fetchRecs = async () => {
                setLoadingRecommendations(true)
                try {
                    // Send an empty POST payload to apply default server limits and logic
                    const data = await api.post(`/activities/${activeId}/recommendations`, { seatsToFill: 5 })
                    // data: array of { user: User, score: number, matchReason: string }
                    setRecommendations(data || [])
                } catch (err) {
                    console.error("Failed to fetch recommendations:", err)
                } finally {
                    setLoadingRecommendations(false)
                }
            }
            fetchRecs()
        }
    }, [activity, enrollments, deptEmployees, form])

    const getTypeIcon = (type) => {
        switch (type) {
            case "training": return <BookOpen className="h-5 w-5" />
            case "certification": return <Award className="h-5 w-5" />
            case "project": return <Briefcase className="h-5 w-5" />
            default: return <Calendar className="h-5 w-5" />
        }
    }

    const onSubmit = async (data) => {
        if (!activity) return

        setIsSubmitting(true)
        try {
            const selectedIds = (data.selectedEmployees || []).map(id => toIdString(id)).filter(Boolean)
            const currentIds = (currentEnrollments || []).map(id => toIdString(id)).filter(Boolean)

            const newlyEnrolled = selectedIds.filter(id => !currentIds.includes(id))
            const unenrolled = currentIds.filter(id => !selectedIds.includes(id))

            const activeId = toIdString(activity.id || activity._id)
            // Process enrollments
            for (const employeeId of newlyEnrolled) {
                await enrollEmployee(activeId, employeeId)
            }

            for (const employeeId of unenrolled) {
                await unenrollEmployee(activeId, employeeId)
            }

            toast.success("Enrollment Configuration Updated", {
                description: `${selectedIds.length} personnel assigned to "${activity.title}"`
            })

            navigate("/manager/activities")
        } catch (error) {
            toast.error("Enrollment Processing Failed", {
                description: "Unable to update personnel assignments. Please retry."
            })
        } finally {
            setIsSubmitting(false)
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
                            <Button onClick={() => navigate("/manager/activities")}>
                                Return to Activities
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    const selectedEmployees = form.watch("selectedEmployees") || []
    const normalizedSelectedIds = selectedEmployees.map(id => toIdString(id)).filter(Boolean)
    const normalizedCurrentIds = currentEnrollments.map(id => toIdString(id)).filter(Boolean)
    const activeId = toIdString(activity.id || activity._id)
    const activityDateRaw = activity.startDate || activity.date
    const activityDateObj = activityDateRaw ? new Date(activityDateRaw) : null
    const activityDateLabel = activityDateObj && !Number.isNaN(activityDateObj.getTime())
        ? activityDateObj.toLocaleDateString()
        : "TBD"
    const capacity = activity.availableSeats ?? activity.capacity ?? 0
    const enrolledCount = (enrollments[activeId] || []).length || activity.enrolledCount || 0
    const hasEnrollmentChanges =
        normalizedSelectedIds.length !== normalizedCurrentIds.length ||
        normalizedSelectedIds.some(id => !normalizedCurrentIds.includes(id)) ||
        normalizedCurrentIds.some(id => !normalizedSelectedIds.includes(id))

    return (
        <div className="flex flex-col bg-[#F8FAFC] min-h-screen">
            <DashboardHeader title="Enroll team" description="Add team members to this program" />

            <div className="flex-1 p-8 max-w-6xl mx-auto w-full space-y-8">
                {/* Activity Overview */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm">
                                    {getTypeIcon(activity.type)}
                                </div>
                                <div>
                                    <CardTitle className="text-xl text-slate-900">{activity.title}</CardTitle>
                                    <p className="text-sm text-slate-500 mt-1">Program Details & Team Assignment</p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={(e) => { e.preventDefault(); navigate("/manager/activities"); }}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Activities
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-sm text-slate-600 leading-relaxed">{activity.description}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                <span className="font-medium">{activityDateLabel}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-slate-400" />
                                <span className="font-medium">{activity.duration}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-slate-400" />
                                <span className="font-medium truncate">{activity.location || "On-site"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Users className="h-4 w-4 text-slate-400" />
                                <span className="font-medium">{enrolledCount}/{capacity || "-"} Enrolled</span>
                            </div>
                        </div>

                        {activity.requiredSkills && activity.requiredSkills.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-slate-700 mb-3">Required Competencies</h4>
                                <div className="flex flex-wrap gap-2">
                                    {activity.requiredSkills.map(rs => (
                                        <Badge key={rs.skillId} variant="secondary" className="text-xs">
                                            {rs.skill?.name} - {rs.requiredLevel}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* AI Enrollment Notice */}
                <Card className="border-slate-200 shadow-sm relative overflow-hidden bg-slate-950 text-white">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                    <CardHeader className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/10">
                                <Target className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl text-white">Intelligent Team Selection</CardTitle>
                                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">Automated Assignment Protocol</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 relative z-10">
                        <p className="text-slate-300 leading-relaxed max-w-2xl">
                            Manual enrollment configurations are disabled to ensure fairness and competency alignment across the organization. 
                            If you need to assign additional personnel (for example, if a team member withdrew), please reach out to the Human Resources department 
                            to execute a new AI-driven recommendation sweep for this activity.
                        </p>
                        <div className="mt-6">
                            <Button 
                                type="button" 
                                disabled={isSubmitting}
                                onClick={async (e) => {
                                    e.preventDefault()
                                    setIsSubmitting(true)
                                    try {
                                        const creatorId = activity.createdBy?.id || activity.createdBy?._id || activity.createdBy
                                        if (creatorId) {
                                            await import('@/lib/api').then(m => m.api.post('/notifications', {
                                                recipientId: creatorId,
                                                title: 'AI Sweep Requested',
                                                message: `The manager for your activity "${activity.title}" has requested a new AI recommendation sweep to identify additional personnel.`,
                                                type: 'system_alert'
                                            }))
                                            toast.success("Request sent to HR", { description: "HR has been notified to execute a new recommendation cycle." })
                                        } else {
                                            toast.error("Error", { description: "Could not identify the HR administrator who created this activity." })
                                        }
                                    } catch (err) {
                                        toast.error("Failed to send request", { description: "Please try again later." })
                                    } finally {
                                        setIsSubmitting(false)
                                    }
                                }}
                                className="bg-primary text-white hover:bg-primary/90 font-bold px-6 h-10"
                            >
                                <Target className="w-4 h-4 mr-2" />
                                {isSubmitting ? "Sending Request..." : "Request New AI Recommendation"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
