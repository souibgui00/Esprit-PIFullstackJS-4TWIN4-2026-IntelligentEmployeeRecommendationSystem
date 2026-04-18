import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../lib/auth-context"
import { toast } from "sonner"
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ForgotPasswordForm() {
    const navigate = useNavigate()
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
            toast.success("Recovery Email Sent")
        } catch (error) {
            toast.error(error.message || "Unable to send recovery email.")
        } finally {
            setIsLoading(false)
        }
    }

    if (isSent) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4" aria-live="polite">
                <div className="w-full max-w-md text-center space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto border border-emerald-100">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Check your email</h2>
                        <p className="text-slate-500 font-medium">Reset link sent to <span className="text-slate-900 font-bold">{email}</span></p>
                    </div>
                    <Button onClick={() => navigate("/login")} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold tracking-widest">Return to login</Button>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
            <div className="w-full max-w-[450px] bg-white rounded-3xl border border-slate-200/60 shadow-xl p-10 lg:p-14 animate-in slide-in-from-bottom-8 duration-700">
                <button onClick={() => navigate("/login")} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-10 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> <span className="text-[10px] font-bold tracking-widest">Back to login</span>
                </button>
                <div className="mb-10"><h2 className="text-3xl font-bold text-slate-900 mb-3">Recover access</h2></div>
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="group space-y-2">
                        <label htmlFor="email-forgot" className="text-[11px] font-bold text-slate-500 tracking-widest leading-none">Work email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 font-medium" />
                            <input id="email-forgot" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10 transition-all" required />
                        </div>
                    </div>
                    <Button type="submit" className="w-full bg-slate-900 hover:bg-primary text-white h-14 rounded-xl font-bold tracking-widest disabled:opacity-50" disabled={isLoading || !email}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : <div className="flex items-center justify-center gap-3"><span>Send link</span> <ArrowRight className="h-4 w-4" /></div>}
                    </Button>
                </form>
            </div>
        </main>
    )
}
