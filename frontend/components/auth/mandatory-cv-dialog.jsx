"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "/components/ui/dialog"
import { Input } from "/components/ui/input"
import { Button } from "/components/ui/button"
import { api } from "/lib/api"
import { toast } from "sonner"
import { useAuth } from "/lib/auth-context"
import { UploadCloud, FileText, Loader2 } from "lucide-react"

export function MandatoryCvDialog() {
  const { user, getEmployeeProfile, refreshProfile } = useAuth()
  const employee = getEmployeeProfile()
  const [cvFile, setCvFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  // Show only if employee is logged in, has no CV, and is NOT an HR/Admin/Manager
  // (Assuming only regular employees are forced to upload)
  const cvIsEmpty = !user?.cvUrl || user.cvUrl === 'null' || String(user.cvUrl).trim() === '';
  const shouldShow = user && 
                    user.role?.toLowerCase() === 'employee' && 
                    cvIsEmpty;

  if (!shouldShow) return null;

  const handleCvUpload = async () => {
    if (!cvFile) return
    setIsUploading(true)
    try {
      await api.upload('/users/me/cv', cvFile)
      toast.success("CV Uploaded Successfully", { 
        description: "Your skills are being extracted! Personalized path initialized." 
      })
      
      // Refresh the user profile to hide the dialog
      await refreshProfile()
      
      // Forces a fresh state for all components
      window.location.reload()
    } catch (error) {
      console.error(error)
      toast.error("Upload Failed", { description: error.message || "Failed to upload CV." })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md border-none shadow-mega rounded-[32px] overflow-hidden p-0 bg-white z-[9999]">
        <div className="bg-slate-950 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F28C1B]/20 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10 border border-white/10">
            <UploadCloud className="w-8 h-8 text-[#F28C1B]" />
          </div>
          <DialogTitle className="text-2xl font-black text-white tracking-tight relative z-10 uppercase">
            Initialize Your Journey
          </DialogTitle>
          <DialogDescription className="text-slate-400 font-medium mt-2 relative z-10">
            Please upload your professional CV. Our AI will analyze your skills to build your personalized career growth path.
          </DialogDescription>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 rounded-[24px] p-8 text-center hover:bg-slate-50 transition-colors">
              <Input 
                type="file" 
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setCvFile(e.target.files[0])
                  }
                }}
                className="hidden" 
                id="mandatory-cv-upload"
              />
              <label htmlFor="mandatory-cv-upload" className="cursor-pointer flex flex-col items-center">
                <div className="w-12 h-12 bg-[#F28C1B]/10 rounded-full flex items-center justify-center mb-4 text-[#F28C1B]">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-slate-700">
                  {cvFile ? cvFile.name : "Select your Resume (PDF/DOCX)"}
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                  Max size: 10MB
                </span>
              </label>
            </div>
          </div>
          
          <Button 
            onClick={handleCvUpload}
            disabled={!cvFile || isUploading}
            className="w-full h-14 bg-slate-950 hover:bg-[#F28C1B] text-white mt-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95"
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Upload & Generate Skill Profile"
            )}
          </Button>
          
          <div className="text-center pt-2">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60">
              Personalized for MAGHREBIA Group
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
