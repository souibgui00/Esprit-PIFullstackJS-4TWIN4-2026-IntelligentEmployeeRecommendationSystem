"use client"

import { useState } from "react"
import { useData } from "/lib/data-store"
import { DashboardHeader } from "/components/dashboard/header"
import { Button } from "/components/ui/button"
import { Input } from "/components/ui/input"
import { Badge } from "/components/ui/badge"
import {
    Building2,
    Plus,
    Search,
    Users,
    Edit,
    Trash2,
    Loader2,
    ShieldCheck,
    Activity,
    Eye,
    Mail,
    Phone,
    Briefcase,
    ArrowUpDown,
    Filter,
    ArrowDownAZ,
    ArrowUpAZ
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "/components/ui/avatar"
import { cn } from "/lib/utils"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "/components/ui/alert-dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "/components/ui/dropdown-menu"
import { Check } from "lucide-react"

export default function DepartmentsPage() {
    const { departments, employees, loading, addDepartment, updateDepartment, deleteDepartment } = useData()
    const [searchQuery, setSearchQuery] = useState("")
    const [isAdding, setIsAdding] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editingDept, setEditingDept] = useState(null)
    const [newDeptName, setNewDeptName] = useState("")
    const [newDeptCode, setNewDeptCode] = useState("")
    const [newDeptDescription, setNewDeptDescription] = useState("")
    const [newDeptManagerId, setNewDeptManagerId] = useState("")
    const [viewingDept, setViewingDept] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [deptToDelete, setDeptToDelete] = useState(null)
    const [sortBy, setSortBy] = useState("name-asc") // name-asc, name-desc, members-desc

    const filteredDepts = (departments || [])
        .filter(d =>
            (d.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (d.code?.toLowerCase() || "").includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === "name-asc") return a.name.localeCompare(b.name)
            if (sortBy === "name-desc") return b.name.localeCompare(a.name)
            if (sortBy === "members-desc") {
                const countA = (employees || []).filter(e => (typeof e.department_id === 'string' ? e.department_id : e.department_id?.id || e.department_id?._id) === (a.id || a._id)).length
                const countB = (employees || []).filter(e => (typeof e.department_id === 'string' ? e.department_id : e.department_id?.id || e.department_id?._id) === (b.id || b._id)).length
                return countB - countA
            }
            return 0
        })

    const managers = (employees || []).filter(e => {
        const isManager = e.role?.toLowerCase() === "manager" || e.role?.toLowerCase() === "hr"
        if (!isManager) return false
        
        const targetId = e.id || e._id
        const isHeadElsewhere = (departments || []).some(d => {
            const hId = typeof d.manager_id === 'string' ? d.manager_id : d.manager_id?._id || d.manager_id?.id
            if (isEditing && editingDept && (d.id === editingDept.id || d._id === editingDept._id)) return false
            return hId === targetId
        })
        return !isHeadElsewhere
    })

    const handleNameChange = (val) => {
        setNewDeptName(val)
        const initials = val
            .split(/[\s-]+/)
            .filter(Boolean)
            .map(word => word[0])
            .join('')
            .toUpperCase()

        if (initials) {
            const randomPart = Math.floor(10 + Math.random() * 90)
            setNewDeptCode(`${initials}-${randomPart}`)
        } else {
            setNewDeptCode("")
        }
    }

    const handleAdd = async (e) => {
        e.preventDefault()
        if (!newDeptName.trim()) {
            toast.error("Validation Error", { description: "Department name is required." })
            return
        }

        setIsProcessing(true)
        try {
            await addDepartment({
                name: newDeptName.trim(),
                code: newDeptCode.trim().toUpperCase() || undefined,
                description: newDeptDescription.trim(),
                manager_id: newDeptManagerId || null
            })
            toast.success("Department Created", { description: `${newDeptName} has been added to the system.` })
            resetForm()
            setIsAdding(false)
        } catch (error) {
            toast.error("Creation Failed", {
                description: error.message || "Could not create department."
            })
        } finally {
            setIsProcessing(false)
        }
    }

    const handleEdit = (dept) => {
        setEditingDept(dept)
        setNewDeptName(dept.name)
        setNewDeptCode(dept.code || "")
        setNewDeptDescription(dept.description || "")
        setNewDeptManagerId(typeof dept.manager_id === 'string' ? dept.manager_id : dept.manager_id?._id || dept.manager_id?.id || "")
        setIsEditing(true)
        setIsAdding(false)
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const handleUpdate = async (e) => {
        e.preventDefault()
        if (!newDeptName.trim()) {
            toast.error("Validation Error", { description: "Department name is required." })
            return
        }

        setIsProcessing(true)
        try {
            await updateDepartment(editingDept.id || editingDept._id, {
                name: newDeptName.trim(),
                code: newDeptCode.trim().toUpperCase(),
                description: newDeptDescription.trim(),
                manager_id: newDeptManagerId || null
            })
            toast.success("Department Updated", { description: "Changes saved successfully." })
            resetForm()
            setIsEditing(false)
        } catch (error) {
            toast.error("Update Failed", {
                description: error.message || "Could not update department."
            })
        } finally {
            setIsProcessing(false)
        }
    }

    const handleDelete = async () => {
        if (!deptToDelete) return

        setIsProcessing(true)
        setIsDeleteDialogOpen(false)
        try {
            await deleteDepartment(deptToDelete.id || deptToDelete._id)
            toast.success("Department Removed", {
                description: `${deptToDelete.name} has been deleted.`
            })
            setDeptToDelete(null)
        } catch (error) {
            toast.error("Operation Failed", { description: error.message || "Deletion failed." })
        } finally {
            setIsProcessing(false)
        }
    }

    const resetForm = () => {
        setEditingDept(null)
        setNewDeptName("")
        setNewDeptCode("")
        setNewDeptDescription("")
        setNewDeptManagerId("")
        setViewingDept(null)
    }

    return (
        <div className="flex flex-col bg-[#F8FAFC] min-h-screen text-slate-600">
            <DashboardHeader title="Departments" description="Organize and manage organizational divisions and personnel structure." />

            <div className="flex-1 p-6 md:p-10 max-w-[1400px] mx-auto w-full animate-in fade-in duration-700 space-y-12">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-4">
                    <div className="flex flex-wrap items-center gap-6 w-full lg:w-auto">
                        <div className="relative group w-full md:w-[500px]">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="SEARCH DEPARTMENTS..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-16 pr-6 h-16 bg-white border-2 border-slate-50 rounded-[2rem] text-[10px] font-black tracking-[0.2em] text-slate-950 placeholder:text-slate-300 focus:outline-none focus:border-primary/20 shadow-premium transition-all uppercase"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-16 px-8 rounded-[2rem] bg-white border-2 border-slate-50 shadow-premium hover:bg-slate-50 transition-all gap-4 min-w-[220px] justify-between group"
                                >
                                    <div className="flex items-center gap-3">
                                        <ArrowUpDown className="w-5 h-5 text-primary transition-colors" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                                            {sortBy === "name-asc" ? "A → Z Name" :
                                             sortBy === "name-desc" ? "Z → A Name" :
                                             "Most Members"}
                                        </span>
                                    </div>
                                    <Filter className="w-3 h-3 text-slate-300" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[300px] p-4 bg-white border-none rounded-[2rem] shadow-2xl animate-in fade-in slide-in-from-top-4 mt-4">
                                <DropdownMenuLabel className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-4 py-3">Order By</DropdownMenuLabel>
                                <DropdownMenuItem 
                                    onClick={() => setSortBy("name-asc")}
                                    className={cn(
                                        "flex items-center justify-between px-5 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl mb-1 transition-all",
                                        sortBy === "name-asc" ? "bg-slate-950 text-white shadow-lg" : "text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    Alphabetical (A-Z)
                                    {sortBy === "name-asc" && <Check className="w-4 h-4" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    onClick={() => setSortBy("name-desc")}
                                    className={cn(
                                        "flex items-center justify-between px-5 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl mb-1 transition-all",
                                        sortBy === "name-desc" ? "bg-slate-950 text-white shadow-lg" : "text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    Alphabetical (Z-A)
                                    {sortBy === "name-desc" && <Check className="w-4 h-4" />}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-100 my-2 opacity-50" />
                                <DropdownMenuItem 
                                    onClick={() => setSortBy("members-desc")}
                                    className={cn(
                                        "flex items-center justify-between px-5 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                        sortBy === "members-desc" ? "bg-slate-950 text-white shadow-lg" : "text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    Staff Count (Highest)
                                    {sortBy === "members-desc" && <Check className="w-4 h-4" />}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            onClick={() => {
                                setIsAdding(true)
                                setViewingDept(null)
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="bg-slate-950 hover:bg-primary text-white h-16 px-10 rounded-[2rem] font-black text-[11px] tracking-widest uppercase transition-all shadow-xl active:scale-95 flex items-center gap-4"
                        >
                            <Plus className="h-5 w-5" />
                            Add Department
                        </Button>
                    </div>
                </div>

                {viewingDept && (
                    <div className="bg-white border-2 border-slate-50 rounded-[3rem] p-10 md:p-16 shadow-premium animate-in zoom-in-95 duration-500 mb-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full -mr-40 -mt-40 blur-3xl"></div>
                        
                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12 pb-10 border-b border-slate-50">
                                <div className="flex items-center gap-8">
                                    <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary border-2 border-primary/5 shadow-lg shadow-primary/5">
                                        <Building2 className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <Badge className="bg-primary/10 text-primary border-none px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest mb-3 animate-in fade-in duration-1000">Department Overview</Badge>
                                        <h3 className="text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">
                                            {viewingDept.name}
                                        </h3>
                                    </div>
                                </div>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setViewingDept(null)}
                                    className="h-14 px-8 rounded-2xl font-black border-2 border-slate-100 text-slate-400 hover:bg-slate-50 uppercase tracking-[0.2em] text-[10px] transition-all"
                                >
                                    Close Area
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div className="lg:col-span-2 space-y-10">
                                    <div className="p-12 rounded-[2.5rem] bg-slate-900 shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -mr-48 -mt-48 transition-all duration-1000 group-hover:scale-110 opacity-40"></div>
                                        <div className="relative z-10 space-y-6">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono">Mission Statement</p>
                                            <p className="text-slate-100 font-medium text-xl leading-relaxed italic opacity-90">
                                                "{viewingDept.description || "The mission objective for this department has not been documented. Contact administration to provide divisional context and strategic goals."}"
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-4">
                                            <div className="h-[1px] w-8 bg-primary"></div>
                                            Active Personnel Roster
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {(() => {
                                                const deptEmps = (employees || []).filter(e => {
                                                    const isSameDept = (typeof e.department_id === 'string' ? e.department_id : e.department_id?.id || e.department_id?._id) === (viewingDept.id || viewingDept._id);
                                                    const role = e.role?.toLowerCase() || e.position?.toLowerCase();
                                                    const isStaff = !["manager", "hr", "admin"].includes(role);
                                                    return isSameDept && isStaff;
                                                })
                                                if (deptEmps.length === 0) return <p className="text-xs text-slate-400 italic font-bold uppercase tracking-widest pl-12 pt-4 opacity-50">No staff members identified</p>
                                                return deptEmps.map(emp => (
                                                    <div key={emp.id} className="flex items-center gap-5 bg-slate-50/50 border-2 border-transparent p-5 rounded-3xl hover:bg-white hover:border-slate-50 hover:shadow-premium transition-all group cursor-pointer">
                                                        <Avatar className="h-12 w-12 rounded-2xl ring-4 ring-white shadow-sm transition-transform group-hover:scale-110">
                                                            <AvatarImage src={emp.avatar} />
                                                            <AvatarFallback className="bg-white text-slate-500 font-black text-[10px] uppercase">{emp.name?.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="overflow-hidden">
                                                            <p className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tight mb-1">{emp.name}</p>
                                                            <p className="text-[9px] text-slate-400 font-black truncate uppercase tracking-widest">{emp.position || emp.role}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="p-8 rounded-[2.5rem] bg-white border-2 border-slate-50 shadow-premium space-y-8">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-6 flex items-center gap-3">
                                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                            Leadership
                                        </h4>
                                        {(() => {
                                            const mgrId = typeof viewingDept.manager_id === 'string' ? viewingDept.manager_id : viewingDept.manager_id?._id || viewingDept.manager_id?.id
                                            const mgr = employees?.find(e => e.id === mgrId || e._id === mgrId)
                                            if (mgr) {
                                                return (
                                                    <div className="space-y-6">
                                                        <Avatar className="h-24 w-24 rounded-[2rem] border-4 border-white shadow-xl ring-1 ring-slate-100">
                                                            <AvatarImage src={mgr.avatar} />
                                                            <AvatarFallback className="bg-primary/5 text-primary text-2xl font-black">
                                                                {mgr.name?.substring(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="space-y-2">
                                                            <p className="text-lg font-black text-slate-900 uppercase tracking-tight">{mgr.name}</p>
                                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest px-3 py-1 bg-primary/5 rounded-lg inline-block">Department Head</p>
                                                            <div className="pt-4 space-y-3">
                                                                <div className="flex items-center gap-3 text-slate-400">
                                                                    <Mail className="w-4 h-4" />
                                                                    <span className="text-[10px] font-bold tracking-wide uppercase">{mgr.email}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                            return <p className="text-xs text-slate-300 font-black uppercase tracking-widest italic pt-4">No head assigned</p>
                                        })()}
                                    </div>

                                    <div className="p-8 rounded-[2.5rem] bg-white border-2 border-slate-50 shadow-premium">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-6 flex items-center gap-3 mb-8">
                                            <Users className="w-5 h-5 text-primary" />
                                            Growth Target
                                        </h4>
                                        <div className="flex items-end gap-6 mb-4">
                                            <p className="text-6xl font-black text-slate-900 tracking-tighter leading-none">
                                                {employees?.filter(e => (typeof e.department_id === 'string' ? e.department_id : e.department_id?.id || e.department_id?._id) === (viewingDept.id || viewingDept._id)).length}
                                            </p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-2">Staff Members</p>
                                        </div>
                                        <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                                           <div className="h-full bg-primary rounded-full" style={{ width: '45%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {(isAdding || isEditing) && (
                    <div className="bg-white border-2 border-slate-50 rounded-[4rem] shadow-premium overflow-hidden mb-12 animate-in slide-in-from-bottom-10 duration-700">
                        <div className="bg-slate-950 px-16 py-16 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -mr-64 -mt-64"></div>
                            <div className="relative z-10 flex items-center gap-10">
                                <div className="w-20 h-20 bg-white/5 backdrop-blur-3xl rounded-[2rem] flex items-center justify-center border-2 border-white/10 shadow-2xl">
                                    {isEditing ? <Building2 className="w-8 h-8 text-primary" /> : <Plus className="w-8 h-8 text-primary" />}
                                </div>
                                <div className="space-y-4">
                                    <h1 className="text-4xl font-black tracking-tight leading-none uppercase">
                                        {isEditing ? "Modify" : "Initialize"} <span className="text-primary">.</span> Sector
                                    </h1>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] opacity-60">
                                        {isEditing ? `Updating ${editingDept?.name} record` : "Establish a new organizational division"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={isEditing ? handleUpdate : handleAdd} className="p-16 space-y-16 bg-white relative z-10">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                                <div className="space-y-12">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Division Name</label>
                                        <Input
                                            value={newDeptName}
                                            onChange={(e) => handleNameChange(e.target.value)}
                                            placeholder="E.G. OPERATIONS & LOGISTICS"
                                            className="h-16 bg-slate-50/50 border-2 border-slate-50 rounded-[1.5rem] text-[11px] font-black tracking-[0.2em] uppercase focus:bg-white focus:border-primary/20 shadow-inner transition-all px-8"
                                            disabled={isProcessing}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Lead </label>
                                        <select
                                            value={newDeptManagerId}
                                            onChange={(e) => setNewDeptManagerId(e.target.value)}
                                            className="w-full h-16 bg-slate-50/50 border-2 border-slate-50 rounded-[1.5rem] text-[11px] font-black tracking-[0.2em] uppercase px-8 focus:outline-none focus:border-primary/20 transition-all appearance-none shadow-inner"
                                            disabled={isProcessing}
                                        >
                                            <option value="">SELECT DEPARTMENT MANAGER...</option>
                                            {managers.map(m => (
                                                <option key={m.id || m._id} value={m.id || m._id}>
                                                    {m.name} // {m.role}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-12">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institutional Code (AUTO)</label>
                                        <Input
                                            value={newDeptCode}
                                            readOnly
                                            className="h-16 bg-slate-50/50 border-2 border-slate-50 rounded-[1.5rem] text-[11px] font-black tracking-[0.2em] uppercase opacity-40 cursor-not-allowed shadow-inner px-8"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Purpose & Vision</label>
                                        <textarea
                                            value={newDeptDescription}
                                            onChange={(e) => setNewDeptDescription(e.target.value)}
                                            placeholder="DEFINE THE CORE OBJECTIVES FOR THIS DIVISION..."
                                            className="w-full bg-slate-50/50 border-2 border-slate-50 rounded-[2rem] text-[11px] font-bold tracking-wide focus:bg-white focus:border-primary/20 transition-all min-h-[160px] p-8 shadow-inner no-scrollbar"
                                            disabled={isProcessing}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-8 pt-16 border-t border-slate-50">
                                <Button type="submit" disabled={isProcessing} className="flex-1 h-18 py-8 bg-slate-950 hover:bg-primary text-white font-black text-[12px] tracking-[0.3em] uppercase rounded-[2rem] shadow-2xl transition-all active:scale-95 disabled:opacity-50">
                                    {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : (isEditing ? "Update division" : "Initialize division")}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsAdding(false)
                                        setIsEditing(false)
                                        resetForm()
                                    }}
                                    className="flex-1 h-18 py-8 border-2 border-slate-100 bg-white hover:bg-slate-50 text-slate-400 font-black text-[12px] tracking-[0.3em] uppercase rounded-[2rem] transition-all"
                                    disabled={isProcessing}
                                >
                                    Abort Operation
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
                    {filteredDepts.map((dept) => {
                        const deptEmployees = employees?.filter(e =>
                            (typeof e.department_id === 'string' ? e.department_id : e.department_id?.id || e.department_id?._id) === (dept.id || dept._id)
                        ) || []

                        const targetManagerId = typeof dept.manager_id === 'string' ? dept.manager_id : dept.manager_id?._id || dept.manager_id?.id
                        const managerObj = employees?.find(e =>
                            (e.id === targetManagerId) ||
                            (e._id === targetManagerId)
                        )
                        const managerName = managerObj?.name || dept.manager_id?.name || "Unassigned"

                        return (
                            <div key={dept.id || dept._id} className="group bg-white border-2 border-slate-50 rounded-[4rem] p-12 shadow-premium hover:shadow-2xl hover:-translate-y-4 transition-all duration-700 relative overflow-hidden flex flex-col justify-between">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 transition-transform duration-1000 group-hover:scale-150"></div>

                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-12">
                                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white group-hover:shadow-xl group-hover:shadow-primary/20 transition-all duration-500">
                                            <Building2 className="w-8 h-8" />
                                        </div>
                                        <Badge variant="outline" className="border-slate-100 text-slate-300 font-black uppercase text-[8px] tracking-[0.2em] px-3 py-1.5 rounded-lg">Sector {dept.code || 'GL'}</Badge>
                                    </div>

                                    <div className="space-y-4 mb-10">
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight group-hover:text-primary transition-colors uppercase leading-tight">
                                            {dept.name}
                                        </h3>
                                        <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed italic opacity-80 group-hover:opacity-100 transition-opacity">
                                            {dept.description || "Mission objective not established."}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 py-10 border-y border-slate-50">
                                        <div className="space-y-2 border-r border-slate-50">
                                            <p className="text-[9px] font-black text-slate-300 tracking-widest uppercase">Team</p>
                                            <div className="flex items-center gap-3">
                                                <Users className="w-5 h-5 text-primary shadow-sm" />
                                                <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{deptEmployees.length}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2 pl-4">
                                            <p className="text-[9px] font-black text-slate-300 tracking-widest uppercase">Dept. Lead</p>
                                            <div className="flex items-center gap-3">
                                                {managerObj ? (
                                                    <Avatar className="h-7 w-7 rounded-lg shrink-0 border-2 border-white shadow-md ring-1 ring-slate-100">
                                                        <AvatarImage src={managerObj.avatar} />
                                                        <AvatarFallback className="bg-primary/5 text-primary text-[8px] font-black">
                                                            {managerObj.name?.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                ) : (
                                                    <ShieldCheck className="w-5 h-5 text-rose-300" />
                                                )}
                                                <span className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tight">{managerName.split(' ')[0]}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mt-10 pt-4">
                                    <Button
                                        variant="ghost"
                                        className="flex-1 h-16 bg-slate-50/50 hover:bg-primary hover:text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all"
                                        onClick={() => {
                                            setViewingDept(dept);
                                            setIsAdding(false);
                                            setIsEditing(false);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                    >
                                        Inspect
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-16 w-16 bg-slate-50/50 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-[1.5rem] transition-all"
                                            onClick={() => handleEdit(dept)}
                                        >
                                            <Edit className="w-5 h-5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-16 w-16 bg-slate-50/50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-[1.5rem] transition-all"
                                            onClick={() => {
                                                setDeptToDelete(dept)
                                                setIsDeleteDialogOpen(true)
                                            }}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {!loading && filteredDepts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-48 bg-white rounded-[4rem] border-2 border-dashed border-slate-50 animate-in fade-in duration-500">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8">
                            <Building2 className="w-10 h-10 opacity-20" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Zero Sectors Identified</h3>
                        <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-4 opacity-60">Try refined search or initialize a new division</p>
                    </div>
                )}

                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent className="rounded-[4rem] border-none p-16 shadow-mega max-w-xl animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500 mb-10 shadow-lg shadow-rose-500/10">
                                <Trash2 className="w-10 h-10" />
                            </div>

                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-4xl font-black text-slate-900 tracking-tight uppercase leading-none mb-6">
                                    Severe <span className="text-rose-600">Action</span>
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-500 font-bold text-lg leading-relaxed uppercase tracking-tight">
                                    Discard organizational division <br/>
                                    <span className="text-slate-950 font-black underline decoration-rose-200 decoration-8 underline-offset-8 px-2">{deptToDelete?.name}</span>?
                                </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter className="flex flex-col sm:flex-row gap-6 w-full mt-16">
                                <AlertDialogCancel
                                    className="flex-1 h-18 rounded-[1.5rem] border-2 border-slate-50 bg-white text-slate-400 font-black uppercase tracking-widest text-[12px] hover:bg-slate-50 transition-all"
                                    disabled={isProcessing}
                                >
                                    Abort
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handleDelete()
                                    }}
                                    className="flex-1 h-18 rounded-[1.5rem] bg-slate-950 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[12px] transition-all shadow-xl active:scale-95 border-none"
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : "Confirm Removal"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </div>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    )
}
