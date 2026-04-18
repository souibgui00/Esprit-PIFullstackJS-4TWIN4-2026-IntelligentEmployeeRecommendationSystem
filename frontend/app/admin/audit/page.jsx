"use client"
import { useState, useEffect } from "react"
import { DashboardHeader } from "/components/dashboard/header"
import { api } from "/lib/api"
import { toast } from "sonner"
import { Loader2, Shield, Calendar, Activity, FileJson, CheckCircle, Database, Search, Filter, X, ArrowRight } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "/components/ui/dialog"

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  // Filter States
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("ALL")
  const [entityFilter, setEntityFilter] = useState("ALL")
  const [dateFilter, setDateFilter] = useState("ALL")
  
  // JSON Viewer State
  const [selectedLog, setSelectedLog] = useState(null)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const data = await api.get('/api/audit')
      setLogs(data)
    } catch (e) {
      toast.error("Failed to load audit logs", { description: e.message })
    } finally {
      setLoading(false)
    }
  }

  const formatActivityName = (action) => {
    return action?.split('_').join(' ') || "UNKNOWN"
  }

  const renderStateComparison = (oldVal, newVal) => {
    if (!oldVal && !newVal) return <div className="text-slate-500 italic text-xs">No specific state changes recorded for this action.</div>;
    
    // Primitive diffs (e.g. simple strings or numbers)
    if (typeof oldVal !== 'object' && typeof newVal !== 'object') {
        return (
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono font-bold">
                <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg">{String(oldVal || 'None')}</span>
                <ArrowRight className="w-5 h-5 text-slate-500" />
                <span className="text-white bg-white/10 border border-white/20 px-3 py-1.5 rounded-lg">{String(newVal || 'None')}</span>
            </div>
        )
    }

    // Object Diffs (Comparing old object vs new object)
    const oldObj = typeof oldVal === 'object' ? oldVal || {} : {};
    const newObj = typeof newVal === 'object' ? newVal || {} : {};
    const allKeys = [...new Set([...Object.keys(oldObj), ...Object.keys(newObj)])];
    
    // If there is absolutely no previous state (e.g., a CREATE action), simply list the new properties
    const isCreationOrNoHistory = Object.keys(oldObj).length === 0;

    if (isCreationOrNoHistory) {
      return (
        <div className="w-full space-y-1">
            <div className="grid grid-cols-12 gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500 pb-3 border-b border-white/5 mb-3">
                <div className="col-span-4">Property</div>
                <div className="col-span-8">Assigned Value</div>
            </div>
            {allKeys.map(key => {
                const newPropStr = typeof newObj[key] === 'object' ? JSON.stringify(newObj[key]) : String(newObj[key]);
                return (
                    <div key={key} className="grid grid-cols-12 gap-4 text-xs font-mono py-2 border-b border-white/5 items-center hover:bg-white/5 transition-colors rounded px-2 -mx-2">
                        <div className="col-span-4 text-slate-300 font-bold truncate" title={key}>{key}</div>
                        <div className="col-span-8 px-2 py-1 rounded truncate text-white bg-white/5 border border-white/10" title={newObj[key] !== undefined ? newPropStr : 'null'}>
                            {newObj[key] !== undefined && newObj[key] !== null ? newPropStr : <span className="opacity-30">-</span>}
                        </div>
                    </div>
                )
            })}
        </div>
      )
    }

    // Default 3-column diff for updates where previous state DOES exist
    return (
        <div className="w-full space-y-1">
            <div className="grid grid-cols-12 gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500 pb-3 border-b border-white/5 mb-3">
                <div className="col-span-3">Property</div>
                <div className="col-span-4">Previous State</div>
                <div className="col-span-5">New State</div>
            </div>
            {allKeys.map(key => {
                const oldPropStr = typeof oldObj[key] === 'object' ? JSON.stringify(oldObj[key]) : String(oldObj[key]);
                const newPropStr = typeof newObj[key] === 'object' ? JSON.stringify(newObj[key]) : String(newObj[key]);
                const isChanged = oldPropStr !== newPropStr;

                // Don't clutter the UI; only show changes unless it's a critical identifier
                if (!isChanged && key !== '_id' && key !== 'name' && key !== 'status' && key !== 'auto_eval' && key !== 'etat' && key !== 'type') return null;

                return (
                    <div key={key} className="grid grid-cols-12 gap-4 text-xs font-mono py-2 border-b border-white/5 items-center hover:bg-white/5 transition-colors rounded px-2 -mx-2">
                        <div className="col-span-3 text-slate-300 font-bold truncate" title={key}>{key}</div>
                        <div className={`col-span-4 px-2 py-1 rounded truncate ${isChanged && oldObj[key] !== null && oldObj[key] !== undefined ? 'text-rose-300 bg-rose-500/10 border border-rose-500/20' : 'text-slate-500'}`} title={oldObj[key] !== undefined && oldObj[key] !== null ? oldPropStr : 'No Previous Record'}>
                            {oldObj[key] !== undefined && oldObj[key] !== null ? oldPropStr : <span className="text-white font-bold uppercase tracking-widest text-[9px] border-b border-white/30 pb-0.5">Newly Attached</span>}
                        </div>
                        <div className={`col-span-5 px-2 py-1 rounded truncate ${isChanged ? 'text-white bg-white/5 border border-white/10' : 'text-slate-500'}`} title={newObj[key] !== undefined && newObj[key] !== null ? newPropStr : 'Removed'}>
                            {newObj[key] !== undefined && newObj[key] !== null ? newPropStr : <span className="text-rose-500 font-bold uppercase tracking-widest text-[9px] border-b border-rose-500/30 pb-0.5">State Cleared</span>}
                        </div>
                    </div>
                )
            })}
        </div>
    )
  }

  // Pre-defined exhaustive system footprint for comprehensive dropdowns
  const SYSTEM_ACTIONS = [
    "CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", 
    "ENROLL", "APPROVE", "REJECT", "EVALUATE", "TRIGGER_DECAY",
    "PROMOTE", "DEMOTE", "PASSWORD_RESET", "EXPORT_DATA"
  ];

  const SYSTEM_ENTITIES = [
    "USER", "EMPLOYEE", "SKILL", "ACTIVITY", "DEPARTMENT", 
    "EVALUATION", "RECOMMENDATION", "SYSTEM", "AUTH"
  ];

  // Extract unique values for dropdowns (Merge dynamic logs with predefined system capabilities)
  const uniqueActions = [...new Set([...SYSTEM_ACTIONS, ...logs.map(l => l.action)])].filter(Boolean).sort();
  const uniqueEntities = [...new Set([...SYSTEM_ENTITIES, ...logs.map(l => l.entityType)])].filter(Boolean).sort();

  // Dynamic Filtering Logic
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.action || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.entityType || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.actorId?.name || "System").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.actorId?.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === "ALL" || log.action === actionFilter;
    const matchesEntity = entityFilter === "ALL" || log.entityType === entityFilter;

    let matchesDate = true;
    if (dateFilter !== "ALL") {
      const logDate = new Date(log.createdAt);
      const now = new Date();
      if (dateFilter === "TODAY") {
         matchesDate = logDate.toDateString() === now.toDateString();
      } else if (dateFilter === "7DAYS") {
         matchesDate = (now - logDate) / (1000 * 60 * 60 * 24) <= 7;
      } else if (dateFilter === "30DAYS") {
         matchesDate = (now - logDate) / (1000 * 60 * 60 * 24) <= 30;
      }
    }

    return matchesSearch && matchesAction && matchesEntity && matchesDate;
  });

  return (
    <div className="flex flex-col bg-[#F8FAFC] min-h-screen">
      <DashboardHeader title="Audit & Traceability" description="System mutation logs enforcing US24 traceability compliance" />
      
      <div className="flex-1 p-8 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-primary" />
                    <div>
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Mutation Log</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Top 200 Recent Actions</p>
                    </div>
                </div>
                <button 
                  onClick={() => { setLoading(true); fetchLogs(); }}
                  disabled={loading}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:text-primary transition-colors flex items-center gap-2 shadow-sm active:scale-95"
                >
                  {loading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Activity className="w-3 h-3 text-primary" />}
                  Refresh
                </button>
            </div>

            {/* Filter Navigation Bar */}
            <div className="p-4 bg-white border-b border-slate-100 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-50">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Search by actor, action, or entity..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-600"
                    />
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                    <Calendar className="w-4 h-4 text-slate-400 ml-2" />
                    <select 
                        value={dateFilter} 
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="bg-transparent text-xs font-black uppercase tracking-widest text-slate-600 border-none focus:ring-0 cursor-pointer min-w-30"
                    >
                        <option value="ALL">All Time</option>
                        <option value="TODAY">Today</option>
                        <option value="7DAYS">Last 7 Days</option>
                        <option value="30DAYS">Last 30 Days</option>
                    </select>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                    <Filter className="w-4 h-4 text-slate-400 ml-2" />
                    <select 
                        value={actionFilter} 
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="bg-transparent text-xs font-black uppercase tracking-widest text-slate-600 border-none focus:ring-0 cursor-pointer min-w-30"
                    >
                        <option value="ALL">All Actions</option>
                        {uniqueActions.map(action => (
                            <option key={action} value={action}>{formatActivityName(action)}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                    <Database className="w-4 h-4 text-slate-400 ml-2" />
                    <select 
                        value={entityFilter} 
                        onChange={(e) => setEntityFilter(e.target.value)}
                        className="bg-transparent text-xs font-black uppercase tracking-widest text-slate-600 border-none focus:ring-0 cursor-pointer min-w-30"
                    >
                        <option value="ALL">All Entities</option>
                        {uniqueEntities.map(entity => (
                            <option key={entity} value={entity}>{entity}</option>
                        ))}
                    </select>
                </div>

                {(searchTerm || actionFilter !== "ALL" || entityFilter !== "ALL" || dateFilter !== "ALL") && (
                    <button 
                        onClick={() => { setSearchTerm(""); setActionFilter("ALL"); setEntityFilter("ALL"); setDateFilter("ALL"); }}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Clear Filters"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="overflow-x-auto">
                {loading && logs.length === 0 ? (
                    <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                        <Database className="w-8 h-8 opacity-20 mx-auto mb-3" />
                        No Audit Logs Recorded yet
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-black tracking-widest text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Actor</th>
                                <th className="px-6 py-4">Entity</th>
                                <th className="px-6 py-4 text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {filteredLogs.map((log) => (
                                <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(log.createdAt).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase border border-slate-200 bg-white tracking-widest text-slate-700">
                                            {formatActivityName(log.action)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-black text-slate-900 text-xs uppercase tracking-widest">
                                          {log.actorId?.name || "System Automation"}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400">
                                          {log.actorId?.email || log.actorId?.toString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-black text-primary text-xs uppercase tracking-widest">{log.entityType}</div>
                                        <div className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter">ID: {log.entityId?.slice(-6) || "N/A"}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div 
                                            className="inline-flex items-center gap-2 text-slate-600 text-[10px] font-black uppercase bg-white px-3 py-1.5 rounded-lg border border-slate-200 hover:border-primary hover:text-primary hover:bg-primary/5 cursor-pointer shadow-sm transition-all active:scale-95"
                                            onClick={() => setSelectedLog(log)}
                                        >
                                            <FileJson className="w-3.5 h-3.5" />
                                            Inspect
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                                        No logs match your current filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing {filteredLogs.length} Records</span>
            </div>
        </div>
      </div>

      {/* Human-Readable Inspector Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-4xl bg-slate-950 p-0 border border-slate-800 shadow-2xl overflow-hidden rounded-4xl">
                        <DialogTitle className="sr-only">
                            Audit log inspector for {selectedLog?.action || "selected action"}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Inspect the state changes, metadata, and actor details for the selected audit log entry.
                        </DialogDescription>
            <div className="p-8 border-b border-white/10 flex items-center justify-between bg-slate-900/80">
                <div className="space-y-2">
                   <div className="flex items-center gap-3">
                       <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary uppercase text-[10px] font-black tracking-widest rounded-lg">
                           {selectedLog?.action}
                       </span>
                       <span className="text-slate-400 text-xs font-bold">•</span>
                       <span className="text-white text-lg font-black uppercase tracking-widest">
                           {selectedLog?.entityType} Mutation
                       </span>
                   </div>
                   <div className="text-xs text-slate-400 font-mono tracking-tighter">
                      Entity Reference ID: <span className="text-slate-300 font-bold">{selectedLog?.entityId}</span>
                   </div>
                </div>
                <div className="text-right">
                   <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Triggered By</div>
                   <div className="text-sm font-black text-emerald-400">{selectedLog?.actorId?.name || "System Authorization"}</div>
                   <div className="text-xs text-slate-400 font-mono">{selectedLog?.actorId?.email || "N/A"}</div>
                </div>
            </div>
            
            <div className="p-8 overflow-y-auto max-h-[60vh] custom-scrollbar bg-[#0f111a]">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-4">
                    <span>State Comparison</span>
                    <div className="h-px flex-1 bg-white/5"></div>
                </h4>
                
                {renderStateComparison(selectedLog?.oldValue, selectedLog?.newValue)}

                {selectedLog?.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                    <div className="mt-8 pt-8 border-t border-white/5">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Metadata / Context</h4>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-mono text-slate-300">
                            {JSON.stringify(selectedLog.metadata, null, 2)}
                        </div>
                    </div>
                )}
            </div>
            
            <div className="p-5 border-t border-white/10 bg-slate-900 flex justify-between items-center">
                <div className="text-xs text-slate-500 font-bold flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {selectedLog?.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : 'N/A'}
                </div>
                <button 
                   onClick={() => setSelectedLog(null)}
                   className="px-6 py-2.5 bg-white text-slate-900 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors shadow-lg active:scale-95"
                >
                   Close Inspector
                </button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
