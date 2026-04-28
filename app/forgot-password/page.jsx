"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Brain, Mail, ArrowRight, ArrowLeft, CheckCircle2, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await forgotPassword(email)
      setIsSent(true)
      toast.success("Recovery email sent", {
        description: "If an account exists with this email, you will receive a reset link."
      })
    } catch (error) {
      toast.error("Process failed", {
        description: error.message || "Unable to process request."
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSent) {
    return (
      <main id="main-content" className="min-h-screen flex items-center justify-center p-8 bg-[#F8FAFC]">
        <section className="w-full max-w-md space-y-8 text-center animate-in fade-in zoom-in duration-500" aria-labelledby="success-heading">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 mx-auto shadow-sm" aria-hidden="true">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <section aria-labelledby="email-sent-heading">
            <h2 id="email-sent-heading" className="text-3xl font-black text-slate-900 tracking-tight">Check your email</h2>
            <p className="text-slate-500 font-medium mt-2">
              We've sent a password recovery link to <br />
              <span className="text-slate-900 font-bold">{email}</span>
            </p>
          </section>
          <Button
            onClick={() => router.push("/login")}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white h-14 rounded-2xl font-bold text-[11px] tracking-widest uppercase shadow-xl focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
            aria-label="Return to login page"
          >
            Back to Login
          </Button>
          <p className="text-xs text-slate-400 font-medium pt-4">
            Didn't receive the email?{" "}
            <button
              onClick={() => setIsSent(false)}
              className="text-primary font-bold hover:underline focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded px-1"
              aria-label="Try sending recovery email again"
            >
              Try again
            </button>
          </p>
        </section>
      </main>
    )
  }

  return (
    <main id="main-content" className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <header className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden" role="banner">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-orange-500/20 via-slate-900 to-slate-900" />
        <div className="relative z-10 flex flex-col justify-between p-16 text-white w-full">
          <button
            onClick={() => router.push("/login")}
            className="flex items-center gap-4 cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded px-2 py-1"
            aria-label="Return to login page"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl" aria-hidden="true">
              <Brain className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter">SkillMatch</h1>
              <p className="text-[10px] font-black tracking-[0.3em] uppercase opacity-50">Enterprise Core</p>
            </div>
          </button>

          <section aria-labelledby="header-main-heading" className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black tracking-widest uppercase" aria-hidden="true">
              <Lock className="w-3 h-3" />
              Security Protocol
            </div>
            <h2 id="header-main-heading" className="text-6xl font-black leading-[0.95] tracking-tighter">
              Forgot your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Access Key?</span>
            </h2>
            <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-md">
              No problem. Enter your verified email address and we'll send you a secure link to reset your credentials.
            </p>
          </section>

          <div className="flex items-center gap-6 text-slate-500" aria-hidden="true">
            <div className="w-12 h-px bg-slate-800" />
            <p className="text-[10px] font-black tracking-widest uppercase">SkillMatch Recovery System</p>
          </div>
        </div>
      </header>

      {/* Right Panel - Recovery Form */}
      <section className="flex-1 flex items-center justify-center p-8 bg-[#F8FAFC]" aria-label="Account recovery form">
        <div className="w-full max-w-md space-y-10 animate-in slide-in-from-right-8 duration-700">
          <section aria-labelledby="form-heading">
            <button
              onClick={() => router.push("/login")}
              className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors mb-8 focus:outline-none focus:ring-2 focus:ring-slate-900 rounded px-2 py-1"
              aria-label="Return to login page"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
              <span className="text-[10px] font-black uppercase tracking-widest">Back to login</span>
            </button>
            <h2 id="form-heading" className="text-4xl font-black text-slate-900 tracking-tight leading-none">Recover Account</h2>
            <p className="text-slate-400 font-medium mt-2">Verify your email to continue the recovery process.</p>
          </section>

          <form onSubmit={handleSubmit} className="space-y-6" aria-label="Password recovery form">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Work Email</Label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-14 h-16 bg-white border-slate-200 rounded-2xl text-[13px] font-bold text-slate-900 placeholder:text-slate-300 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-sm shadow-slate-200/50 focus:ring-2"
                  required
                  aria-required="true"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-slate-900 hover:bg-primary text-white h-16 rounded-2xl font-black text-[11px] tracking-[0.2em] uppercase transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
              disabled={isLoading || !email}
              aria-busy={isLoading}
              aria-label={isLoading ? "Processing password recovery" : "Send password recovery link"}
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" aria-hidden="true" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span>Send Recovery Link</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </div>
              )}
            </Button>
          </form>

          <div className="pt-10 border-t border-slate-100 flex flex-col items-center gap-4 text-center">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Contact support if you lost access to your email</p>
          </div>
        </div>
      </section>
    </main>
  )
}
