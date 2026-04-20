import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "../../lib/auth-context"
import { toast } from "sonner"
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ResetPasswordForm() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
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
            toast.error("Invalid Request")
            navigate("/login")
            return
        }
        setToken(t)
    }, [searchParams, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (password !== confirmPassword) { toast.error("Secrets do not match."); return }
        if (password.length < 8) { toast.error("Password too short."); return }
        setIsLoading(true)
        try {
            await resetPassword(token, password); setIsDone(true); toast.success("Password Updated")
        } catch (error) {
            toast.error(error.message || "Link expired.")
        } finally { setIsLoading(false) }
    }

    if (isDone) {
        return (
            <main id="main-content" className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 text-center" aria-live="polite">
                <div className="w-full max-w-md space-y-10 animate-in fade-in zoom-in duration-700">
                    <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl"><CheckCircle2 className="w-12 h-12 text-white" /></div>
                    <div className="space-y-3"><h2 className="text-4xl font-bold tracking-tight">Updated</h2><p className="text-slate-500 font-medium">You can now sign in.</p></div>
                    <Button type="button" onClick={() => navigate("/login")} className="w-full h-16 bg-slate-900 text-white rounded-2xl font-bold tracking-widest transition-all">Sign in now</Button>
                </div>
            </main>
        )
    }

    return (
        <main id="main-content" className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
            <div className="w-full max-w-112.5 bg-white rounded-3xl border border-slate-200 shadow-xl p-10 lg:p-14 animate-in slide-in-from-right-8 duration-700">
                <div className="mb-14 text-center lg:text-left"><h2 className="text-3xl font-bold text-slate-900 mb-3">Reset password</h2></div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="group space-y-2">
                        <label htmlFor="password-reset" className="text-[11px] font-bold text-slate-500 tracking-widest leading-none">New password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                            <input id="password-reset" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-12 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10 transition-all" required />
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setShowPassword(!showPassword)} 
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:bg-transparent"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </Button>
                        </div>
                    </div>
                    <div className="group space-y-2">
                        <label htmlFor="password-confirm" className="text-[11px] font-bold text-slate-500 tracking-widest leading-none">Confirm password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                            <input id="password-confirm" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-12 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10 transition-all" required />
                        </div>
                    </div>
                    <Button type="submit" className="w-full bg-slate-900 hover:bg-primary text-white h-16 rounded-xl font-bold tracking-widest transition-all mt-6" disabled={isLoading || !password || !confirmPassword}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : <div className="flex items-center justify-center gap-3"><span>Update</span> <ArrowRight className="h-4 w-4" /></div>}
                    </Button>
                </form>
            </div>
        </main>
    )
}
