"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { sessionSchema } from "/lib/schemas"
import { Input } from "/components/ui/input"
import { Label } from "/components/ui/label"
import { Textarea } from "/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "/components/ui/select"
import { useData } from "/lib/data-store"
import { toast } from "sonner"
import { Sparkles, Loader2, ArrowLeft, Clock, MapPin, User, Users, Calendar } from "lucide-react"
import { Button } from "/components/ui/button"
import { useNavigate } from "react-router-dom"
import { useAuth } from "/lib/auth-context"
import { cn } from "/lib/utils"

export function SessionForm({ session, mode = "create", initialActivityId }) {
    const { activities, addSession, updateSession } = useData()
    const { user } = useAuth()
    const navigate = useNavigate()
    const rolePrefix = user?.role?.toLowerCase() === "hr" ? "/hr" : "/admin"

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(sessionSchema),
        defaultValues: {
            activityId: session?.activityId || initialActivityId || "",
            title: session?.title || "",
            date: session?.date ? new Date(session.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            startTime: session?.startTime || "09:00",
            endTime: session?.endTime || "17:00",
            location: session?.location || "",
            instructor: session?.instructor || "",
            maxParticipants: session?.maxParticipants || 20,
            notes: session?.notes || "",
            status: session?.status || "scheduled",
        },
    })

    const activityId = watch("activityId")

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                date: new Date(data.date),
                enrolledParticipants: session?.enrolledParticipants || [],
            }

            if (mode === "create") {
                await addSession(payload)
                toast.success("Session Scheduled Successfully", { description: "The new training session has been registered." })
            } else {
                await updateSession(session.id || session._id, payload)
                toast.success("Session Updated Successfully", { description: "Session parameters have been synchronized." })
            }
            navigate(`${rolePrefix}/sessions`)
        } catch (error) {
            toast.error("Protocol Failure", { description: error.message })
        }
    }

    return (
        <div className="max-w-4xl mx-auto w-full space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-400 p-3 hover:text-primary transition-colors bg-white border border-slate-100 rounded-lg group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> BACK TO SESSIONS
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8">
                    <div className="card-premium p-10 bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)]">
                        <div className="mb-10 flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">
                                    {mode === "create" ? "Schedule New Session" : "Modify Session Parameters"}
                                </h2>
                                <p className="text-[10px] text-slate-400 font-bold tracking-widest leading-loose uppercase">SESSION DETAILS AND LOGISTICS</p>
                            </div>
                        </div>

                        <form id="session-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Linked Activity Node *</Label>
                                <Select value={activityId} onValueChange={(val) => setValue("activityId", val, { shouldValidate: true })}>
                                    <SelectTrigger className={cn("bg-slate-50 border-slate-100 rounded-xl h-14 font-bold text-slate-800", errors.activityId && "border-rose-300")}>
                                        <SelectValue placeholder="Select Parent Activity" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {activities.map((a) => (
                                            <SelectItem key={a.id || a._id} value={a.id || a._id}>{a.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.activityId && <p className="text-[9px] font-bold text-rose-500">{errors.activityId.message}</p>}
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Session Designation (Title) *</Label>
                                <Input
                                    {...register("title")}
                                    placeholder="EX: ALPHA-CORE DRILL"
                                    className={cn("bg-slate-50 border-slate-100 rounded-xl h-14 font-bold text-slate-800", errors.title && "border-rose-300")}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Target Date *</Label>
                                    <Input {...register("date")} type="date" className="bg-slate-50 border-slate-100 rounded-xl h-14 font-bold" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Venue / Location *</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                        <Input {...register("location")} placeholder="ROOM 101 / REMOTE" className="bg-slate-50 border-slate-100 rounded-xl h-14 pl-12 font-bold" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Start Time</Label>
                                    <Input {...register("startTime")} type="time" className="bg-slate-50 border-slate-100 rounded-xl h-14 font-bold font-mono" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-400 tracking-widest uppercase">End Time</Label>
                                    <Input {...register("endTime")} type="time" className="bg-slate-50 border-slate-100 rounded-xl h-14 font-bold font-mono" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Lead Instructor</Label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                        <Input {...register("instructor")} placeholder="NAME" className="bg-slate-50 border-slate-100 rounded-xl h-14 pl-12 font-bold" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Participant Capacity</Label>
                                    <div className="relative">
                                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                        <Input {...register("maxParticipants")} type="number" className="bg-slate-50 border-slate-100 rounded-xl h-14 pl-12 font-bold font-mono" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Operational Notes</Label>
                                <Textarea
                                    {...register("notes")}
                                    placeholder="Operational intelligence and constraints..."
                                    className="bg-slate-50 border-slate-100 rounded-xl py-6 font-bold text-slate-800 min-h-[120px]"
                                />
                            </div>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-10">
                    <div className="card-premium p-10 bg-[#0F172A] border-none">
                        <h3 className="text-lg font-black text-white tracking-tight mb-8">Confirm Schedule</h3>
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4 mb-10">
                            <div className="flex items-center gap-3 text-slate-400">
                                <Calendar className="w-4 h-4" />
                                <span className="text-[10px] font-bold tracking-widest uppercase">Sync Status: Active</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-400">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-bold tracking-widest uppercase">Real-time Collision Check</span>
                            </div>
                        </div>
                        <Button
                            type="submit"
                            form="session-form"
                            disabled={isSubmitting}
                            className="w-full h-16 bg-primary text-white font-black rounded-xl shadow-2xl hover:bg-orange-600 transition-all group active:scale-[0.98]"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" />
                            ) : (
                                <span className="tracking-[0.2em] uppercase">{mode === "create" ? "Confirm Schedule" : "Update Session"}</span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
