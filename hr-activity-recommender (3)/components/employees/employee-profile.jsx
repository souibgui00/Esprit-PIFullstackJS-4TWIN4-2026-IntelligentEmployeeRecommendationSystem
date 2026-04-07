"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Mail,
  Building2,
  Briefcase,
  Calendar,
  X,
  Edit,
  Trash2,
  Phone,
  Brain,
  TrendingUp,
  User,
  Activity,
  CheckCircle,
  Fingerprint
} from "lucide-react"
import { useData } from "@/lib/data-store"
import { useAuth } from "@/lib/auth-context"
import { cn, getInitials } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useNavigate } from "react-router-dom"

export function EmployeeProfile({ employee: initialEmployee, onClose }) {
  const { employees } = useData()
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  
  const employee = useMemo(() => {
    if (!initialEmployee) return null;
    return (employees || []).find(e => {
        const eId = e.id || e._id;
        const initialId = initialEmployee.id || initialEmployee._id;
        return String(eId) === String(initialId);
    }) || initialEmployee;
  }, [employees, initialEmployee]);

  const rolePrefix = currentUser?.role?.toLowerCase() === 'admin' ? '/admin' : '/manager'

  if (!employee) return null;

  const handleEdit = () => {
    navigate(`${rolePrefix}/employees/edit/${employee.id || employee._id}`)
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Contact & Professional Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
             <div className="flex items-center gap-4 border-b border-primary/5 pb-4">
                <Activity className="w-4 h-4 text-primary" />
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Contact Info</h4>
             </div>
             <div className="space-y-6">
                <div className="flex items-center gap-5 group">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all border border-transparent group-hover:border-primary/10">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Email</p>
                    <p className="text-sm font-bold text-slate-900 break-all">{employee.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 group">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all border border-transparent group-hover:border-primary/10">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Phone Number</p>
                    <p className="text-sm font-bold text-slate-900">{employee.telephone || employee.phone || "Not Set"}</p>
                  </div>
                </div>
             </div>
          </div>

          <div className="space-y-6">
             <div className="flex items-center gap-4 border-b border-primary/5 pb-4">
                <Calendar className="w-4 h-4 text-primary" />
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Company Info</h4>
             </div>
             <div className="space-y-6">
                <div className="flex items-center gap-5 group">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all border border-transparent group-hover:border-primary/10">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Joining Date</p>
                    <p className="text-sm font-bold text-slate-900">{employee.date_embauche ? new Date(employee.date_embauche).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "New Joiner"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-5 group">
                   <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all border border-transparent group-hover:border-primary/10">
                    <Badge variant="outline" className="border-none p-0 text-[10px] font-black">ID</Badge>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Registration ID</p>
                    <p className="text-sm font-bold text-slate-900">{employee.matricule || "UNASSIGNED"}</p>
                  </div>
                </div>
             </div>
          </div>
      </div>

      {/* Professional Skills */}
      <div className="space-y-12">
          <div className="flex items-center gap-4">
              <Brain className="w-5 h-5 text-primary" />
              <h4 className="text-[12px] font-black text-slate-950 uppercase tracking-[0.4em]">Professional Skills</h4>
              <div className="h-px flex-1 bg-slate-100"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {['opérationnelle', 'comportementale', 'technique'].map(cat => {
              const catSkills = employee.skills?.filter(s => {
                const skillObj = (s.skillId && typeof s.skillId === 'object') ? s.skillId : s.skill;
                const type = (skillObj?.type || 'technique').toLowerCase();
                return type === cat.toLowerCase();
              }) || [];

              if (catSkills.length === 0) return null;

              return (
                <div key={cat} className="space-y-6 p-8 bg-slate-50/30 rounded-[2.5rem] border border-slate-50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      "w-3 h-3 rounded-full shadow-sm",
                      cat === 'opérationnelle' ? "bg-slate-950" : cat === 'comportementale' ? "bg-emerald-500" : "bg-[#F28C1B]"
                    )}></div>
                    <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                      {cat === 'opérationnelle' ? "Operational" : cat === 'comportementale' ? "Behavioral" : "Technical"}
                    </h5>
                  </div>

                  <div className="space-y-6">
                    {catSkills.map((skill, i) => {
                      const skillObj = (skill.skillId && typeof skill.skillId === 'object') ? skill.skillId : skill.skill;
                      const skillName = skillObj?.name || "Specialized Skill";
                      const score = (skill.score || 0);
                      const displayScore = Math.min(((score / 120) * 100), 100);

                      return (
                        <div key={i} className="space-y-3">
                          <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{skillName}</span>
                            <span className="text-[10px] font-black text-slate-950">{Math.round(score)}<span className="text-slate-300 ml-1">/ 120</span></span>
                          </div>
                          <div className="h-2.5 bg-white rounded-full overflow-hidden p-0.5 border border-slate-100 shadow-inner">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all duration-1000",
                                cat === 'knowHow' ? "bg-slate-950 text-white shadow-lg" : cat === 'softSkill' ? "bg-emerald-500 shadow-lg shadow-emerald-500/20" : "bg-[#F28C1B] shadow-lg shadow-orange-500/20"
                              )}
                              style={{ width: `${displayScore}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {(!employee.skills || employee.skills.length === 0) && (
            <div className="py-20 text-center border-4 border-dashed border-slate-50 rounded-[4rem] bg-slate-50/20">
              <Activity className="w-10 h-10 text-slate-200 mx-auto mb-6" />
              <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">Profiles requires competency verification</p>
            </div>
          )}
       </div>

      {/* Action Decision Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-12 border-t-2 border-slate-50">
            <Button
                onClick={() => navigate(`${rolePrefix}/evaluations?employeeId=${employee.id || employee._id}`)}
                className="h-18 bg-primary hover:bg-[#D97706] text-white font-black text-[12px] tracking-[0.2em] uppercase rounded-[2.5rem] shadow-2xl shadow-orange-500/30 transition-all active:scale-95 flex items-center justify-center gap-4"
            >
                <TrendingUp className="w-6 h-6" />
                Evaluation
            </Button>
            <Button
                onClick={handleEdit}
                className="h-18 bg-slate-950 hover:bg-slate-800 text-white font-black text-[12px] tracking-[0.2em] uppercase rounded-[2.5rem] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4"
            >
                <Edit className="w-5 h-5" />
                Edit
            </Button>
      </div>
    </div>
  )
}
