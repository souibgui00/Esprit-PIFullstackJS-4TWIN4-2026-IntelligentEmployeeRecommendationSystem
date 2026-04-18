"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { employeeSchema } from "/lib/schemas"
import { Input } from "/components/ui/input"
import { Label } from "/components/ui/label"
import { Button } from "/components/ui/button"
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
import { 
  Loader2, 
  ArrowLeft, 
  Briefcase, 
  Database, 
  User, 
  UserPlus
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "/lib/auth-context"
import { cn, getInitials } from "/lib/utils"
import { api } from "/lib/api"
import { FileText } from "lucide-react"

export function EmployeeForm({ employee, mode = "create" }) {
  const { addEmployee, updateEmployee, departments, users } = useData()
  const { user } = useAuth()
  const navigate = useNavigate()
  const rolePrefix = user?.role?.toLowerCase() === "hr" ? "/hr" : "/admin"
  const [cvFile, setCvFile] = React.useState(null)
  const [isExtracting, setIsExtracting] = React.useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: employee?.name || "",
      email: employee?.email || "",
      telephone: employee?.telephone || "",
      department_id: employee?.department_id || (employee?.departement_id || ""),
      role: (employee?.role || "employee").toLowerCase(),
      position: employee?.position || "",
      date_embauche: employee?.date_embauche ? new Date(employee.date_embauche).toISOString().split("T")[0] : "",
      jobDescription: employee?.jobDescription || "",
      matricule: employee?.matricule || "",
      manager_id: employee?.manager_id || "",
      status: employee?.status || "active",
      avatar: employee?.avatar || "",
    },
  })

  const departmentId = watch("department_id")
  const status = watch("status")
  const role = watch("role")
  const managerId = watch("manager_id")
  const managers = users?.filter((u) => (u.role || "").toLowerCase() === "manager" || (u.role || "").toLowerCase() === "hq") || []

  // Auto-generate matricule based on role
  React.useEffect(() => {
    if (mode === "create" && !watch("matricule")) {
      const prefix = role === "admin" ? "ADM" :
        role === "hr" ? "HR" :
          role === "manager" ? "MGR" : "EMP";
      const random = Math.floor(1000 + Math.random() * 9000);
      setValue("matricule", `${prefix}-${random}`);
    }
  }, [role, mode, setValue, watch]);

  const onSubmit = async (data) => {
    try {
      if (!data.department_id || data.department_id === "none") {
        toast.error("Validation Error", { description: "An employee must be assigned to a department." })
        return
      }

      const targetId = employee?.id || employee?._id

      if (data.role?.toLowerCase() === "manager") {
        const existingManager = users?.find(u => {
          const uDeptId = u.department_id?._id || u.department_id || u.departement_id?._id || u.departement_id;
          const isSameDept = String(uDeptId || "") === String(data.department_id || "");
          const isManager = u.role?.toLowerCase() === "manager" || u.role?.toLowerCase() === "hq";
          const isNotCurrent = (u._id !== targetId && u.id !== targetId);
          return isSameDept && isManager && isNotCurrent;
        });

        if (existingManager) {
          toast.error("Manager Already Exists", { 
            description: `${existingManager.name} is already the manager of this department. You cannot assign two managers to the same department.` 
          });
          return;
        }
      }

      const payload = {
        ...data,
        role: data.role?.toLowerCase() || "employee",
        manager_id: (data.manager_id === "none" || !data.manager_id) ? undefined : data.manager_id,
        department_id: data.department_id,
        telephone: data.telephone || undefined,
        date_embauche: data.date_embauche || undefined,
        jobDescription: data.jobDescription || undefined,
        position: data.position || undefined,
        matricule: data.matricule || undefined,
      }

      if (mode === "create") {
        const newUser = await addEmployee(payload)
        const targetEmployeeId = newUser?.id || newUser?._id
        if (targetEmployeeId && cvFile) {
           await api.upload(`/users/${targetEmployeeId}/cv`, cvFile)
        }
        toast.success("Employee Added", { description: `${data.name} has been successfully registered.` })
      } else {
        await updateEmployee(targetId, payload)
        if (targetId && cvFile) {
           await api.upload(`/users/${targetId}/cv`, cvFile)
        }
        toast.success("Profile Updated", { description: `Data for ${data.name} has been updated.` })
      }
      navigate(`${rolePrefix}/employees`)
    } catch (error) {
      console.error(error)
      toast.error("Process Failed", { description: error.message || "Failed to save employee data." })
    }
  }

  return (
    <div className="max-w-4xl mx-auto w-full space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
      
      {/* Navigation */}
      <div className="flex items-center justify-between">
         <button
            type="button"
            onClick={() => navigate(-1)}
            className="group flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
         >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> 
            Back to List
         </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-[48px] shadow-mega overflow-hidden relative">
        {/* Decorative Header */}
        <div className="bg-slate-950 px-12 py-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -mr-48 -mt-48"></div>
            <div className="relative z-10 flex items-center gap-6">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-all">
                    {mode === "create" ? <UserPlus className="w-8 h-8 text-primary" /> : <User className="w-8 h-8 text-primary" />}
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tight leading-none uppercase">
                        {mode === "create" ? "Add Employee" : "Edit Profile"}
                    </h1>
                    <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest opacity-80">
                        {mode === "create" ? "Create a new employee profile" : `Updating record: ${employee?.name}`}
                    </p>
                </div>
            </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-12 space-y-12 relative z-10 bg-white">
          
          {/* Avatar Display (No Upload) */}
          <div className="flex flex-col md:flex-row items-center gap-10 p-8 bg-slate-50/50 rounded-[40px] border border-slate-100">
            <div className="w-28 h-28 rounded-[36px] border-4 border-white shadow-premium overflow-hidden bg-slate-200">
              {watch("avatar") ? (
                <img src={watch("avatar")} className="w-full h-full object-cover" alt="Avatar" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white font-black text-2xl">
                  {getInitials(watch("name")) || "U"}
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Profile Photo</h3>
                <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed max-w-xs">
                    Employees can update their profile picture from their personal dashboard.
                </p>
            </div>
          </div>

          {/* Section: Core Details */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Database className="w-4 h-4 text-primary" />
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">Core Details</h3>
                <div className="h-px flex-1 bg-slate-100"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Full Name</Label>
                  <Input {...register("name")} placeholder="John Doe" 
                    className={cn("h-14 bg-slate-50/50 border-slate-100 rounded-2xl text-[11px] font-black tracking-widest uppercase focus:bg-white focus:ring-primary/10 transition-all", errors.name && "border-rose-300")} 
                  />
                  {errors.name && <p className="text-[9px] font-bold text-rose-500 mt-1">{errors.name.message}</p>}
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Email Address</Label>
                  <Input {...register("email")} type="email" placeholder="email@company.com" 
                    className={cn("h-14 bg-slate-50/50 border-slate-100 rounded-2xl text-[11px] font-black tracking-widest uppercase focus:bg-white focus:ring-primary/10 transition-all", errors.email && "border-rose-300")} 
                  />
                  {errors.email && <p className="text-[9px] font-bold text-rose-500 mt-1">{errors.email.message}</p>}
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Phone Number</Label>
                  <Input {...register("telephone")} type="tel" placeholder="+1 234 567 890" 
                    className={cn("h-14 bg-slate-50/50 border-slate-100 rounded-2xl text-[11px] font-black tracking-widest uppercase focus:bg-white focus:ring-primary/10 transition-all", errors.telephone && "border-rose-300")} 
                  />
                  {errors.telephone && <p className="text-[9px] font-bold text-rose-500 mt-1">{errors.telephone.message}</p>}
                </div>

                {mode === "edit" && (
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Registration Number (Matricule)</Label>
                    <Input {...register("matricule")} placeholder="EMP-1024" 
                      readOnly={true}
                      className={cn("h-14 bg-slate-50/50 border-slate-100 rounded-2xl text-[11px] font-black tracking-widest uppercase focus:bg-white focus:ring-primary/10 transition-all opacity-50 cursor-not-allowed", 
                        errors.matricule && "border-rose-300"
                      )} 
                    />
                    {errors.matricule && <p className="text-[9px] font-bold text-rose-500 mt-1">{errors.matricule.message}</p>}
                  </div>
                )}
            </div>
          </div>

          {/* Section: Job Details */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Briefcase className="w-4 h-4 text-primary" />
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">Work Details</h3>
                <div className="h-px flex-1 bg-slate-100"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Department</Label>
                  <Select value={departmentId} onValueChange={(v) => setValue("department_id", v)}>
                    <SelectTrigger className={cn("h-14 bg-slate-50/50 border-slate-100 rounded-2xl text-[11px] font-black tracking-widest uppercase", errors.department_id && "border-rose-300")}>
                      <SelectValue placeholder="SELECT DEPARTMENT" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      {departments?.filter(d => {
                        const dId = d.id || d._id;
                        if (!dId) return false;
                        
                        // If current role is manager/hq, filter out departments that already have one
                        const isManagerRole = role?.toLowerCase() === "manager" || role?.toLowerCase() === "hq";
                        if (isManagerRole) {
                          const existingManager = users?.find(u => {
                            const uDeptId = u.department_id?._id || u.department_id || u.departement_id?._id || u.departement_id;
                            const isSameDept = String(uDeptId || "") === String(dId || "");
                            const isManager = u.role?.toLowerCase() === "manager" || u.role?.toLowerCase() === "hq";
                            const isNotCurrent = (u._id !== (employee?.id || employee?._id) && u.id !== (employee?.id || employee?._id));
                            return isSameDept && isManager && isNotCurrent;
                          });
                          if (existingManager) return false;
                        }
                        return true;
                      }).map((dept) => (
                        <SelectItem key={dept.id || dept._id} value={dept.id || dept._id} className="text-[10px] font-black uppercase tracking-widest py-3">
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.department_id && <p className="text-[9px] font-bold text-rose-500 mt-1">{errors.department_id.message}</p>}
                </div>



                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Position Title</Label>
                  <Input {...register("position")} placeholder="e.g. SOFTWARE ENGINEER" 
                    className="h-14 bg-slate-50/50 border-slate-100 rounded-2xl text-[11px] font-black tracking-widest uppercase focus:bg-white focus:ring-primary/10 transition-all" 
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Access Role</Label>
                  <Select value={role} onValueChange={(v) => setValue("role", v)}>
                    <SelectTrigger className={cn("h-14 bg-slate-50/50 border-slate-100 rounded-2xl text-[11px] font-black tracking-widest uppercase", errors.role && "border-rose-300")}>
                      <SelectValue placeholder="SELECT ROLE" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="hr" className="text-[10px] font-black uppercase tracking-widest py-3">HR Official</SelectItem>
                      <SelectItem value="manager" className="text-[10px] font-black uppercase tracking-widest py-3">Department Manager</SelectItem>
                      <SelectItem value="employee" className="text-[10px] font-black uppercase tracking-widest py-3">Staff Member</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && <p className="text-[9px] font-bold text-rose-500 mt-1">{errors.role.message}</p>}
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Hiring Date</Label>
                  <Input {...register("date_embauche")} type="date"
                    className="h-14 bg-slate-50/50 border-slate-100 rounded-2xl text-[11px] font-black tracking-widest uppercase focus:bg-white focus:ring-primary/10 transition-all" 
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Account Status</Label>
                  <Select value={status} onValueChange={(v) => setValue("status", v)}>
                    <SelectTrigger className={cn("h-14 bg-slate-50/50 border-slate-100 rounded-2xl text-[11px] font-black tracking-widest uppercase", errors.status && "border-rose-300")}>
                      <SelectValue placeholder="SELECT STATUS" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="active" className="text-[10px] font-black uppercase tracking-widest py-3 text-emerald-600">Active Account</SelectItem>
                      <SelectItem value="suspended" className="text-[10px] font-black uppercase tracking-widest py-3 text-rose-600">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Job Description</Label>
              <Textarea {...register("jobDescription")} placeholder="Describe roles and duties..." 
                rows={4} className="bg-slate-50/50 border-slate-100 rounded-3xl text-[11px] font-medium tracking-tight focus:bg-white focus:ring-primary/10 transition-all min-h-[140px] p-6" 
              />
            </div>
            
            <div className="space-y-3">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Upload CV / Skills File</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Input 
                        type="file" 
                        accept=".pdf,.doc,.docx"
                        disabled={isExtracting}
                        onChange={async (e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0];
                            setCvFile(file);
                            
                            if (mode === "create") {
                              setIsExtracting(true);
                              const toastId = toast.loading("Analyzing CV...", { description: "Extracting personal information..." });
                              try {
                                const extractedData = await api.upload('/users/extract-cv', file);
                                if (extractedData) {
                                  if (extractedData.name && !watch("name")) setValue("name", extractedData.name, { shouldValidate: true });
                                  if (extractedData.email && !watch("email")) setValue("email", extractedData.email, { shouldValidate: true });
                                  if (extractedData.telephone && !watch("telephone")) setValue("telephone", extractedData.telephone, { shouldValidate: true });
                                  toast.success("CV Data Extracted", { id: toastId, description: "Form has been auto-filled!" });
                                } else {
                                  toast.dismiss(toastId);
                                }
                              } catch (error) {
                                console.error("Extraction failed", error);
                                toast.error("Extraction Failed", { id: toastId, description: "Could not auto-fill fields." });
                              } finally {
                                setIsExtracting(false);
                              }
                            }
                          }
                        }}
                        className="sr-only"
                        id="cv-upload"
                      />
                      <label 
                        htmlFor="cv-upload"
                        className={cn(
                          "h-14 bg-[#F28C1B] border-[#F28C1B] rounded-2xl text-[11px] font-black tracking-widest uppercase text-white focus:bg-[#D97812] focus:border-[#D97812] transition-all cursor-pointer flex items-center justify-center gap-3 hover:bg-[#D97812] hover:border-[#D97812] shadow-lg shadow-[#F28C1B]/10",
                          isExtracting && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <FileText className="w-4 h-4" />
                        {cvFile ? cvFile.name : "Choose file"}
                      </label>
                    </div>
                  </div>
                  {isExtracting && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black tracking-widest uppercase border border-indigo-100">
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing
                    </div>
                  )}
                  {employee?.cvUrl && !cvFile && !isExtracting && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black tracking-widest uppercase border border-emerald-100">
                      <FileText className="w-4 h-4" /> CV Uploaded
                    </div>
                  )}
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1 mt-1">
                  Upload a PDF or Word document. We will extract skills automatically.
                </p>
            </div>
          </div>

          {/* Action Submission */}
          <div className="flex flex-col md:flex-row gap-6 pt-12 border-t border-slate-50">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-16 bg-slate-950 hover:bg-primary text-white font-black text-[12px] tracking-[0.2em] uppercase rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : (mode === "create" ? <UserPlus className="w-5 h-5 mr-3" /> : <User className="w-5 h-5 mr-3" />)}
              {mode === "create" ? "Add Employee" : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`${rolePrefix}/employees`)}
              className="flex-1 h-16 border-slate-100 bg-white hover:bg-slate-50 text-slate-400 font-black text-[12px] tracking-[0.2em] uppercase rounded-2xl transition-all"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
