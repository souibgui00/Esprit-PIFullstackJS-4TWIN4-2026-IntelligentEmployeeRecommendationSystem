"use client"

import React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "/components/ui/dialog"
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
import { Loader2, X } from "lucide-react"

export function EmployeeDialog({ open, onOpenChange, employee, mode }) {
  const { addEmployee, updateEmployee, departments, users } = useData()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    telephone: "",
    department_id: "",
    role: "employee",
    position: "",
    date_embauche: "",
    jobDescription: "",
    yearsOfExperience: 0,
    matricule: "",
    manager_id: "",
    status: "active",
  })

  const managers = users?.filter((u) => (u.role || "").toLowerCase() === "manager") || []

  useEffect(() => {
    if (employee && mode === "edit") {
      setFormData({
        name: employee.name || "",
        email: employee.email || "",
        telephone: employee.telephone || "",
        department_id: employee.department_id || employee.departement_id || "",
        role: (employee.role || "employee").toLowerCase(),
        position: employee.position || "",
        date_embauche: employee.date_embauche ? new Date(employee.date_embauche).toISOString().split("T")[0] : "",
        jobDescription: employee.jobDescription || "",
        yearsOfExperience: employee.yearsOfExperience ?? 0,
        matricule: employee.matricule || "",
        manager_id: employee.manager_id || "",
        status: employee.status || "active",
      })
    } else {
      setFormData({
        name: "",
        email: "",
        telephone: "",
        department_id: "",
        role: "employee",
        position: "",
        date_embauche: "",
        jobDescription: "",
        yearsOfExperience: 0,
        matricule: "",
        manager_id: "",
        status: "active",
      })
    }
  }, [employee, mode, open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.department_id || !formData.role) {
      toast.error("Missing required fields", { description: "Name, email, department, and role are required." })
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        telephone: formData.telephone || undefined,
        department_id: formData.department_id,
        role: formData.role.toUpperCase(),
        position: formData.position || undefined,
        date_embauche: formData.date_embauche || undefined,
        jobDescription: formData.jobDescription || undefined,
        yearsOfExperience: formData.yearsOfExperience,
        matricule: formData.matricule || undefined,
        manager_id: (formData.manager_id === "none" || !formData.manager_id) ? undefined : formData.manager_id,
        status: formData.status,
      }

      if (mode === "create") {
        await addEmployee(payload)
        toast.success("Employee added", { description: `${formData.name} has been added.` })
      } else if (employee) {
        await updateEmployee(employee.id || employee._id, payload)
        toast.success("Employee updated", { description: `${formData.name} has been updated.` })
      }
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error("Operation failed", { description: error.message || "Please try again." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] bg-white border border-slate-200 rounded-xl p-0 overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-slate-100 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {mode === "create" ? "Add employee" : "Edit employee"}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              {mode === "create" ? "Add a new employee to the system." : "Update employee information."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form id="employee-dialog-form" onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="form-label">Full name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="John Doe"
                  className="form-input h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="form-label">Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  placeholder="john@company.com"
                  className="form-input h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="form-label">Phone</Label>
                <Input
                  value={formData.telephone}
                  onChange={(e) => setFormData((p) => ({ ...p, telephone: e.target.value }))}
                  placeholder="+1 555 123 4567"
                  className="form-input h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="form-label">Department *</Label>
                <Select value={formData.department_id} onValueChange={(v) => setFormData((p) => ({ ...p, department_id: v }))}>
                  <SelectTrigger className="form-input h-12">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.filter(d => (d.id || d._id)).map((dept) => (
                      <SelectItem key={dept.id || dept._id} value={dept.id || dept._id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="form-label">Role *</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData((p) => ({ ...p, role: v }))}>
                  <SelectTrigger className="form-input h-12">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="form-label">Job title</Label>
                <Input
                  value={formData.position}
                  onChange={(e) => setFormData((p) => ({ ...p, position: e.target.value }))}
                  placeholder="e.g. Software Engineer"
                  className="form-input h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="form-label">Hire date</Label>
                <Input
                  type="date"
                  value={formData.date_embauche}
                  onChange={(e) => setFormData((p) => ({ ...p, date_embauche: e.target.value }))}
                  className="form-input h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="form-label">Manager</Label>
                <Select value={formData.manager_id} onValueChange={(v) => setFormData((p) => ({ ...p, manager_id: v }))}>
                  <SelectTrigger className="form-input h-12">
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {managers.filter(m => (m.id || m._id)).map((m) => (
                      <SelectItem key={m.id || m._id} value={m.id || m._id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="form-label">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData((p) => ({ ...p, status: v }))}>
                  <SelectTrigger className="form-input h-12">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="form-label">Years of experience</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.yearsOfExperience}
                  onChange={(e) => setFormData((p) => ({ ...p, yearsOfExperience: parseInt(e.target.value) || 0 }))}
                  className="form-input h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="form-label">Job description</Label>
              <Textarea
                value={formData.jobDescription}
                onChange={(e) => setFormData((p) => ({ ...p, jobDescription: e.target.value }))}
                placeholder="Brief description of role and responsibilities"
                rows={4}
                className="form-input min-h-[100px]"
              />
            </div>
          </form>
        </div>

        <DialogFooter className="flex flex-col gap-3 p-6 border-t border-slate-100 shrink-0">
          <button
            form="employee-dialog-form"
            type="submit"
            disabled={saving}
            className="w-full py-3 px-6 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {mode === "create" ? "Add employee" : "Update"}
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full py-3 px-6 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
