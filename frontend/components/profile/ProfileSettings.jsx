"use client"

import React, { useState } from "react"
import { useAuth } from "/lib/auth-context"
import { toast } from "sonner"
import { 
    User, Mail, Phone, Lock, Eye, EyeOff, Shield, 
    Camera, CheckCircle2, AlertCircle, ScanFace 
} from "lucide-react"
import { Input } from "/components/ui/input"
import { Label } from "/components/ui/label"
import { Button } from "/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "/components/ui/dialog"
import { FaceIdScanner } from "/components/auth/face-id-scanner"

export function ProfileSettings() {
    const { user, updateProfile, changePassword, registerFace } = useAuth()
    
    // Profile Identity State
    const [profileData, setProfileData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.telephone || user?.phone || "",
    })
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

    // Password State
    const [passwords, setPasswords] = useState({
        current: "",
        new: "",
        confirm: ""
    })
    const [showPasswords, setShowPasswords] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)

    // Face ID State
    const [faceDialogOpen, setFaceDialogOpen] = useState(false)

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        setIsUpdatingProfile(true)
        try {
            await updateProfile(profileData)
            toast.success("Changes saved", {
                description: "Your profile information has been successfully updated."
            })
        } catch (err) {
            toast.error("Update failed", {
                description: err.message || "Please check your connectivity."
            })
        } finally {
            setIsUpdatingProfile(false)
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()
        if (passwords.new !== passwords.confirm) {
            return toast.error("Passwords do not match", {
                description: "The new password and confirmation do not match."
            })
        }
        
        setIsChangingPassword(true)
        try {
            await changePassword(passwords.current, passwords.new)
            toast.success("Password updated", {
                description: "Your password has been changed successfully."
            })
            setPasswords({ current: "", new: "", confirm: "" })
        } catch (err) {
            toast.error("Update failed", {
                description: err.message || "The current password you entered is incorrect."
            })
        } finally {
            setIsChangingPassword(false)
        }
    }

    const onFaceRegisterSuccess = async ({ blob }) => {
        try {
            const toastId = toast.loading("Setting up Face ID...")
            await registerFace(blob)
            toast.success("Face ID Setup Complete", {
                id: toastId,
                description: "You can now use Face ID to sign in to your account."
            })
            setFaceDialogOpen(false)
        } catch (err) {
            toast.error("Setup failed", {
                description: "Could not scan your face. Please try again in better lighting."
            })
        }
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 1. Identity Matrix */}
            <Card className="card-premium border-none shadow-premium bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-display font-black text-slate-900 tracking-tight">Profile Information</CardTitle>
                            <CardDescription className="text-xs font-bold text-slate-400 tracking-widest uppercase mt-1">Manage your name, email, and contact details.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <Input 
                                        value={profileData.name} 
                                        onChange={e => setProfileData({...profileData, name: e.target.value})}
                                        className="pl-12 h-14 bg-slate-50 border-slate-100 rounded-xl font-bold text-slate-900" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <Input 
                                        type="email" 
                                        value={profileData.email} 
                                        onChange={e => setProfileData({...profileData, email: e.target.value})}
                                        className="pl-12 h-14 bg-slate-50 border-slate-100 rounded-xl font-bold text-slate-900" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Phone Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <Input 
                                        value={profileData.phone} 
                                        onChange={e => setProfileData({...profileData, phone: e.target.value})}
                                        className="pl-12 h-14 bg-slate-50 border-slate-100 rounded-xl font-bold text-slate-900" 
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="pt-4">
                            <Button 
                                type="submit" 
                                disabled={isUpdatingProfile}
                                className="h-14 px-10 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all flex items-center gap-3 shadow-xl active:scale-95"
                            >
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span className="tracking-widest uppercase text-xs">Save Changes</span>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* 2. Security Protocol */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <Card className="card-premium border-none shadow-premium bg-white">
                    <CardHeader className="p-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-display font-black text-slate-900 tracking-tight">Security</CardTitle>
                                <CardDescription className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-1">Manage your password and account security.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-8 pb-8 space-y-6">
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="relative">
                                <Label className="text-[9px] font-black text-slate-300 tracking-[0.2em] mb-2 block uppercase">Current Password</Label>
                                <Input 
                                    type={showPasswords ? "text" : "password"}
                                    value={passwords.current}
                                    onChange={e => setPasswords({...passwords, current: e.target.value})}
                                    className="h-12 bg-slate-50 border-slate-100 rounded-xl font-mono text-xs" 
                                />
                            </div>
                            <div className="relative">
                                <Label className="text-[9px] font-black text-slate-300 tracking-[0.2em] mb-2 block uppercase">New Password</Label>
                                <Input 
                                    type={showPasswords ? "text" : "password"}
                                    value={passwords.new}
                                    onChange={e => setPasswords({...passwords, new: e.target.value})}
                                    className="h-12 bg-slate-50 border-slate-100 rounded-xl font-mono text-xs" 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPasswords(!showPasswords)}
                                    className="absolute right-4 bottom-3 text-slate-300 hover:text-primary transition-colors"
                                >
                                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <div className="relative">
                                <Label className="text-[9px] font-black text-slate-300 tracking-[0.2em] mb-2 block uppercase">Confirm New Password</Label>
                                <Input 
                                    type={showPasswords ? "text" : "password"}
                                    value={passwords.confirm}
                                    onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                                    className="h-12 bg-slate-50 border-slate-100 rounded-xl font-mono text-xs" 
                                />
                            </div>
                            <Button 
                                type="submit" 
                                disabled={isChangingPassword}
                                className="w-full h-12 bg-primary text-white font-black rounded-xl hover:bg-orange-600 transition-all shadow-lg active:scale-95 text-[10px] tracking-widest uppercase mt-4"
                            >
                                Change Password
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="card-premium border-none shadow-premium bg-slate-900 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 opacity-5 blur-[40px]"></div>
                    <CardHeader className="p-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
                                <ScanFace className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-display font-black text-white tracking-tight">Face ID</CardTitle>
                                <CardDescription className="text-[9px] font-bold text-slate-500 tracking-widest uppercase mt-1">Manage biometric login options.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-8 pb-8 flex flex-col items-center text-center space-y-6">
                        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative">
                            {user?.faceIdDescriptor ? (
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            ) : (
                                <AlertCircle className="w-10 h-10 text-orange-500/50" />
                            )}
                            <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        </div>
                        
                        <div className="space-y-2">
                            <h4 className="text-xs font-black text-white tracking-[0.2em] uppercase">
                                {user?.faceIdDescriptor ? "FACE ID ENABLED" : "FACE ID DISABLED"}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-[200px] mx-auto">
                                Enable Face ID to sign in faster without typing your password.
                            </p>
                        </div>

                        <Button 
                            onClick={() => setFaceDialogOpen(true)}
                            className="w-full h-12 bg-white text-slate-900 font-black rounded-xl hover:bg-slate-100 transition-all shadow-xl active:scale-95 text-[10px] tracking-widest uppercase mt-2"
                        >
                            {user?.faceIdDescriptor ? "Update Face ID" : "Setup Face ID"}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Face ID Registration Dialog */}
            <Dialog open={faceDialogOpen} onOpenChange={setFaceDialogOpen}>
                <DialogContent className="sm:max-w-md bg-white rounded-[32px] border-none shadow-2xl p-0 overflow-hidden">
                    <div className="p-8 space-y-6">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black tracking-tight text-center">Face ID Setup</DialogTitle>
                        </DialogHeader>
                        
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-4">
                            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-4 text-center">Setup Guide</p>
                            <ul className="space-y-2">
                                {[
                                    "Center your face in the circular frame",
                                    "Ensure lighting is uniform and sufficient",
                                    "Maintain a neutral expression",
                                    "Stay stationary during capture"
                                ].map((step, i) => (
                                    <li key={i} className="flex items-center gap-3 text-[10px] font-bold text-slate-600">
                                        <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[8px] text-primary">{i+1}</div>
                                        {step}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <FaceIdScanner 
                            mode="register"
                            onMatchSuccess={onFaceRegisterSuccess}
                        />

                        <p className="text-center text-[9px] text-slate-400 font-bold tracking-widest uppercase px-4 leading-loose">
                            Your biometric data is securely stored and used only for authentication.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
