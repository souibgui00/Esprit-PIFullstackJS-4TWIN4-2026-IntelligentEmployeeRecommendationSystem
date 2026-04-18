import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../lib/auth-context"
import { toast } from "sonner"
import { 
    Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, ScanFace 
} from "lucide-react"
import { Button } from "/components/ui/button"
import { Badge } from "/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { Suspense, lazy } from "react"

const FaceIdScanner = lazy(() => import("./face-id-scanner").then(m => ({ default: m.FaceIdScanner })))

export default function LoginForm() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const { login, isAuthenticated, user } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (isAuthenticated && user) {
            const role = (user.role || "").toLowerCase().trim()
            navigate(`/${role}`, { replace: true })
        }
    }, [isAuthenticated, user, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const result = await login(email, password)
            if (!result.success) {
                toast.error("Authentication Failed", {
                    description: result.error || "Please verify your credentials.",
                })
            } else {
                toast.success("Welcome Back", {
                    description: "Initializing your professional workspace.",
                })
            }
        } finally {
            setIsLoading(false)
        }
    }

    const [faceLoginOpen, setFaceLoginOpen] = useState(false)
    const [faceTarget, setFaceTarget] = useState(null)
    const { getFaceProfile, faceLogin, API_URL } = useAuth()

    const handleFaceLoginStart = async () => {
        if (!email) {
            toast.error("Input Required", { description: "Please enter your email first." })
            return
        }
        setIsLoading(true)
        try {
            const profile = await getFaceProfile(email)
            if (profile && profile.isFaceIdEnabled) {
                setFaceTarget(profile)
                setFaceLoginOpen(true)
            } else {
                toast.error("Face ID Not Found", { description: "Biometric login is not enabled for this account." })
            }
        } catch (err) {
            toast.error("Discovery Failed", { description: "Could not find account details." })
        } finally {
            setIsLoading(false)
        }
    }

    const onFaceVerificationSuccess = async (matchInfo) => {
        setIsLoading(true)
        try {
            const result = await faceLogin(email)
            if (result.success && result.user) {
                const role = (result.user.role || "employee").toLowerCase()
                toast.success("Identity Verified", { description: "Welcome back." })
                setFaceLoginOpen(false)
                setTimeout(() => navigate(`/${role}`, { replace: true }), 100)
            } else {
                toast.error("Sync Failed", { description: result.error || "Verification succeeded but session failed." })
            }
        } catch (err) {
            toast.error("Biometric Error", { description: "Failed to process biometric login." })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-[#E5E5E5] p-4 lg:p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-[#F28C1B]/[0.1] rounded-full blur-[120px] animate-pulse"></div>
            </div>

            <div className="w-full max-w-[1100px] grid lg:grid-cols-2 bg-white rounded-3xl border border-slate-200/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-1000">
                <div className="hidden lg:flex flex-col justify-between p-16 bg-[#2C2C2C] relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-20">
                            <div className="w-12 h-12 bg-[#F28C1B] rounded-xl flex items-center justify-center shadow-xl shadow-orange-500/30">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-black font-display text-white tracking-widest leading-none">Maghrebia</span>
                                <span className="text-[10px] font-bold text-[#F28C1B] tracking-[0.3em] mt-1">Group enterprise</span>
                            </div>
                        </div>
                        <h1 className="text-6xl font-black font-display text-white leading-[1.1] mb-8 tracking-tight">
                            Professional <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F28C1B] to-[#FFB76B]">Talent Management.</span>
                        </h1>
                        <p className="text-lg text-slate-300 mb-14 max-w-md font-medium leading-relaxed">
                            Empowering Maghrebia's workforce through intelligent competency mapping and AI-driven growth paths.
                        </p>
                    </div>
                </div>

                <div className="p-10 lg:p-20 flex flex-col justify-center bg-white relative">
                    <div className="max-w-[400px] mx-auto w-full">
                        <div className="mb-14 text-center lg:text-left">
                            <Badge variant="outline" className="mb-4 border-[#D97706]/20 bg-[#D97706]/5 text-[#B45309] font-bold">Sign in securely</Badge>
                            <h2 className="text-4xl font-bold font-display text-slate-900 mb-3 tracking-tight">Sign in</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="group space-y-2">
                                <label id="label-email-login" htmlFor="input-email-login" className="text-[11px] font-bold text-slate-500 tracking-widest leading-none">Work email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                                    <input
                                        id="input-email-login"
                                        aria-labelledby="label-email-login"
                                        type="email"
                                        name="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@company.com"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-sm font-semibold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="group space-y-2">
                                <div className="flex items-center justify-between mb-1">
                                    <label id="label-password-login" htmlFor="input-password-login" className="text-[11px] font-bold text-slate-500 tracking-widest leading-none">Password</label>
                                    <button type="button" onClick={() => navigate("/forgot-password")} className="text-[11px] font-bold text-[#B45309] hover:underline">Forgot password?</button>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                                    <input
                                        id="input-password-login"
                                        aria-labelledby="label-password-login"
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-12 text-sm font-semibold transition-all outline-none"
                                        required
                                    />
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

                            <Button type="submit" disabled={isLoading} size="lg" className="w-full h-14 rounded-2xl bg-[#C2410C] hover:bg-[#9A3412] text-white font-black tracking-widest text-xs shadow-lg shadow-orange-900/10">
                                {isLoading ? <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> : "Authorize access"}
                            </Button>

                            <Button type="button" variant="outline" size="lg" className="w-full h-14 rounded-2xl font-black tracking-widest text-[10px]" onClick={handleFaceLoginStart} disabled={isLoading}>
                                <ScanFace className="mr-2 h-5 w-5 text-[#F28C1B]" /> Biometric passport sign
                            </Button>
                            
                            <Button asChild variant="outline" size="lg" className="w-full h-14 rounded-2xl font-black tracking-widest text-[10px]">
                                <a href={`${API_URL}/auth/google`} className="flex items-center justify-center gap-3">
                                    Connect with Gmail
                                </a>
                            </Button>
                        </form>

                        <Dialog open={faceLoginOpen} onOpenChange={setFaceLoginOpen}>
                            <DialogContent className="sm:max-w-md bg-white rounded-[48px] p-0 overflow-hidden">
                                <div className="p-12 space-y-8">
                                    <DialogHeader><DialogTitle className="text-3xl font-black text-center">Biometric authentication</DialogTitle></DialogHeader>
                                    {faceTarget && (
                                        <Suspense fallback={<div className="flex flex-col items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
                                            <FaceIdScanner targetImage={faceTarget.picture} targetLabel={faceTarget.name} onMatchSuccess={onFaceVerificationSuccess} mode="verify" />
                                        </Suspense>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>
        </main>
    )
}
