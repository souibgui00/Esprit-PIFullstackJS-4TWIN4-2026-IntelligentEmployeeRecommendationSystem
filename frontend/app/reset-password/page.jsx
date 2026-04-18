"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Brain, Lock, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function ResetPasswordPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { resetPassword } = useAuth()

    const [token, setToken] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isDone, setIsDone] = useState(false)

    useEffect(() => {
        const t = searchParams.get("token")
        if (!t) {
            toast.error("Invalid link", { description: "Reset token missing from URL." })
            router.push("/login")
            return
        }
        setToken(t)
    }, [searchParams, router])

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            toast.error("Mismatch", { description: "Passwords do not match." })
            return
        }

        if (password.length < 8) {
            toast.error("Security risk", { description: "Password must be at least 8 characters." })
            return
        }

        setIsLoading(true)

        try {
            await resetPassword(token, password)
            setIsDone(true)
            toast.success("Security updated", {
                description: "Your password has been reset successfully."
            })
        } catch (error) {
            toast.error("Reset failed", {
                description: error.message || "The link may be invalid or expired."
            })
            if (error.message.includes("expired") || error.message.includes("invalid")) {
                // Keep on page but show error
            }
        } finally {
            setIsLoading(false)
        }
    }

    if (isDone) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 bg-[#F8FAFC]">
                <div className="w-full max-w-md space-y-10 text-center animate-in fade-in zoom-in duration-700">
                    <div className="relative mx-auto w-24 h-24">
                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 text-white shadow-2xl shadow-emerald-500/20">
                            <CheckCircle2 className="h-12 w-12" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Password Updated</h2>
                        <p className="text-slate-500 font-medium">Your credentials have been successfully updated.</p>
                    </div>
                    <Button
                        onClick={() => router.push("/login")}
                        className="w-full bg-slate-900 hover:bg-emerald-600 text-white h-16 rounded-2xl font-black text-[11px] tracking-[0.2em] uppercase shadow-2xl transition-all"
                    >
                        Sign In Now
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex">
            {/* Visual Side */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,_var(--tw-gradient-stops))] from-blue-500/10 via-slate-900 to-slate-900" />
                <div className="relative z-10 flex flex-col justify-between p-16 text-white w-full">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
                            <Brain className="h-8 w-8 text-blue-500 shadow-glow-blue" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">Maghrebia</h1>
                            <p className="text-[10px] font-black tracking-[0.4em] uppercase text-slate-500">Secure Access</p>
                        </div>
                    </div>

                    <div className="space-y-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark border-white/5 text-blue-400 text-[10px] font-black tracking-widest uppercase mb-4 shimmer-sweep">
                            <Lock className="w-3 h-3" />
                            SECURE CONNECTION ACTIVE
                        </div>
                        <h2 className="text-7xl font-black leading-[0.9] tracking-tighter">
                            Reset your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500">Password.</span>
                        </h2>
                        <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-lg">
                            Create a new secure password for your account. Make sure it's strong and unique to you.
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="h-px flex-1 bg-slate-800" />
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Secure Environment</p>
                    </div>
                </div>
            </div>

            {/* Form Side */}
            <div className="flex-1 flex items-center justify-center p-8 bg-[#F8FAFC]">
                <div className="w-full max-w-md space-y-10 animate-in slide-in-from-right-8 duration-700">
                    <div className="space-y-3">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Complete Reset</h2>
                        <p className="text-slate-400 font-medium">Please enter your new password below.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password text-[10px]" className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Password</Label>
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter new password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-14 pr-14 h-16 bg-white border-slate-200 rounded-2xl text-[14px] font-bold text-slate-950 placeholder:text-slate-300 focus:border-blue-500 transition-all shadow-sm"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-950 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirm Password</Label>
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                    <Input
                                        id="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-14 h-16 bg-white border-slate-200 rounded-2xl text-[14px] font-bold text-slate-950 placeholder:text-slate-300 focus:border-blue-500 transition-all shadow-sm"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-blue-600 text-white h-16 rounded-2xl font-black text-[11px] tracking-[0.3em] uppercase transition-all shadow-xl active:scale-[0.98]"
                            disabled={isLoading || !password || !confirmPassword}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-3">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Updating...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <span>Update Password</span>
                                    <ArrowRight className="h-4 w-4" />
                                </div>
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-[10px] font-bold text-slate-300 tracking-widest leading-relaxed uppercase">
                        All passwords are encrypted using industry-standard <br /> algorithms before storage.
                    </p>
                </div>
            </div>
        </div>
    )
}
