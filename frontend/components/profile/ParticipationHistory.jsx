"use client"

import React from 'react'
import { Card } from "/components/ui/card"
import { Badge } from "/components/ui/badge"
import { Clock, CheckCircle2, XCircle, TrendingUp, Target, Calendar } from "lucide-react"
import { cn } from "/lib/utils"

export function ParticipationHistory({ user, participations, activities }) {
    // participations look like { activityId, progress, status, lastUpdated }
    const mappedHistory = participations?.map(p => {
        const activity = typeof p.activityId === 'object' ? p.activityId : activities.find(a => (a.id === p.activityId || a._id === p.activityId));
        return {
            ...p,
            activityName: activity?.title || "Unknown Program",
            activityType: activity?.type || "Training",
        }
    }).sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)) || [];

    if (mappedHistory.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center w-full min-h-[400px]">
                <Target className="w-16 h-16 text-slate-200 mb-6" />
                <h3 className="text-xl font-black text-slate-900 tracking-tight">No History Found</h3>
                <p className="text-sm text-slate-500 mt-2 font-medium">There are no training participations recorded yet.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 px-4">
                <div className="w-12 h-12 rounded-2xl bg-[#1E5FA8]/10 flex items-center justify-center border border-[#1E5FA8]/20">
                    <TrendingUp className="w-6 h-6 text-[#1E5FA8]" />
                </div>
                <div>
                    <h3 className="text-2xl font-display font-black text-slate-900 tracking-tight">Participation History</h3>
                    <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Your Learning Journey</p>
                </div>
            </div>

            <div className="grid gap-4">
                {mappedHistory.map((item, idx) => (
                    <Card key={idx} className="bg-white border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/[0.02] rounded-full -mr-16 -mt-16 group-hover:bg-primary/[0.05] transition-all"></div>
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            
                            <div className="flex items-start gap-4 flex-1">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mt-1 shrink-0", 
                                    item.status === 'completed' ? "bg-emerald-50 text-emerald-500" :
                                    item.status === 'started' ? "bg-blue-50 text-blue-500" : "bg-red-50 text-red-500"
                                )}>
                                    {item.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> :
                                     item.status === 'started' ? <Clock className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-lg font-black text-slate-900 tracking-tight">{item.activityName}</h4>
                                        <Badge variant="outline" className="text-[9px] uppercase tracking-widest font-black text-slate-500 border-slate-200">
                                            {item.activityType}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(item.lastUpdated).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col md:items-end gap-2 shrink-0 md:w-48">
                                <div className="flex items-center justify-between w-full mb-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                                    <span className={cn("text-sm font-black tracking-tighter", 
                                        item.progress === 100 ? "text-emerald-500" : "text-primary"
                                    )}>{item.progress || 0}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className={cn("h-full rounded-full transition-all duration-1000",
                                            item.progress === 100 ? "bg-emerald-500" : "bg-primary"
                                        )} 
                                        style={{ width: `${item.progress || 0}%` }}
                                    ></div>
                                </div>
                            </div>

                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}
