import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { useState, useEffect, lazy, Suspense } from "react"
import { useAuth } from "../lib/auth-context"
import { API_URL } from "../lib/api"
import {
    BarChart3,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Shield,
    Briefcase,
    Users,
    Brain,
    ChevronRight,
    Sparkles,
    ArrowRight,
    CheckCircle2,
    ArrowLeft,
    Loader2,
    ScanFace
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "../lib/utils"
import { Toaster } from "@/components/ui/sonner"

const EmployeeApp = lazy(() => import("./EmployeeApp"))
const ManagerApp = lazy(() => import("./ManagerApp"))
const AdminApp = lazy(() => import("./AdminApp"))
const HRApp = lazy(() => import("./HRApp"))
const AccessibilityWidget = lazy(() => import("../components/accessibility/AccessibilityWidget").then((m) => ({ default: m.AccessibilityWidget })))
const FaceIdScanner = lazy(() => import("../components/auth/face-id-scanner").then((m) => ({ default: m.FaceIdScanner })))

function RouteLoader() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    )
}

// Login Component
function LoginForm() {
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
                    description: result.error || "Please verify your credentials and network connection.",
                    className: "font-sans font-medium"
                })
            } else {
                toast.success("Welcome Back", {
                    description: "Initializing your professional workspace.",
                    className: "font-sans font-medium"
                })
            }
        } finally {
            setIsLoading(false)
        }
    }

    const [faceLoginOpen, setFaceLoginOpen] = useState(false)
    const [faceTarget, setFaceTarget] = useState(null)
    const { getFaceProfile, faceLogin } = useAuth()

    const handleFaceLoginStart = async () => {
        if (!email) {
            toast.error("Input Required", { description: "Please enter your email first to verify your biometric profile." })
            return
        }
        setIsLoading(true)
        try {
            const profile = await getFaceProfile(email)
            if (profile && profile.isFaceIdEnabled) {
                setFaceTarget(profile)
                setFaceLoginOpen(true)
            } else {
                toast.error("Face ID Not Found", { description: "Face ID is not enabled for this account. Please login with password first." })
            }
        } catch (err) {
            toast.error("User Discovery Failed", { description: "Could not find account details for this email." })
        } finally {
            setIsLoading(false)
        }
    }

    const onFaceVerificationSuccess = async (matchInfo) => {
        console.log("Biometric match confirmed:", matchInfo)
        setIsLoading(true)
        try {
            const result = await faceLogin(email)
            if (result.success && result.user) {
                const role = (result.user.role || "employee").toLowerCase()
                toast.success("Identity Verified", { description: "Biometric handshake successful. Welcome back." })
                setFaceLoginOpen(false)
                // Use a small timeout to ensure state settles before navigate
                setTimeout(() => navigate(`/${role}`, { replace: true }), 100)
            } else {
                toast.error("Auth Synchronized Failed", { description: result.error || "Verification succeeded but session failed." })
            }
        } catch (err) {
            console.error("Login expansion error:", err)
            toast.error("Biometric Error", { description: "Failed to process biometric login." })
        } finally {
            setIsLoading(false)
        }
    }


    return (
        <main id="main-content" className="min-h-screen flex items-center justify-center bg-[#E5E5E5] p-4 lg:p-6 relative overflow-hidden">
            {/* Maghrebia Background Accents */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-[#F28C1B]/[0.1] rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#1E5FA8]/[0.05] rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-[1100px] grid lg:grid-cols-2 bg-white rounded-3xl border border-slate-200/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-1000">
                {/* Left Side: Maghrebia Branding */}
                <div className="hidden lg:flex flex-col justify-between p-16 bg-[#2C2C2C] relative overflow-hidden group">
                    {/* Abstract Decorative Elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#F28C1B]/20 rounded-full -mr-48 -mt-48 blur-[100px] transition-transform duration-1000 group-hover:scale-110"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#1E5FA8]/10 rounded-full -ml-32 -mb-32 blur-[80px]"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-20 animate-in slide-in-from-left-8 duration-700">
                            <div className="w-12 h-12 bg-[#F28C1B] rounded-xl flex items-center justify-center shadow-xl shadow-orange-500/30">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-black font-display text-white tracking-widest leading-none">Maghrebia</span>
                                <span className="text-[10px] font-bold text-[#F28C1B] tracking-[0.3em] mt-1">Group enterprise</span>
                            </div>
                        </div>

                        <h1 className="text-6xl font-black font-display text-white leading-[1.1] mb-8 tracking-tight animate-in slide-in-from-left-12 duration-1000">
                            Professional <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F28C1B] to-[#FFB76B]">Talent Management.</span>
                        </h1>
                        <p className="text-lg text-slate-400 mb-14 max-w-md font-medium leading-relaxed opacity-90 animate-in slide-in-from-left-16 duration-1000">
                            Empowering Maghrebia's workforce through intelligent competency mapping and AI-driven growth paths.
                        </p>
                    </div>
                </div>

                {/* Right Side: Elegant Form */}
                <div className="p-10 lg:p-20 flex flex-col justify-center bg-white relative">
                    <div className="max-w-[400px] mx-auto w-full">
                        <div className="mb-14 text-center lg:text-left">
                            <Badge variant="outline" className="mb-4 border-primary/20 bg-primary/5 text-primary px-3 py-1 font-bold text-[10px] tracking-widest rounded-full">Sign in securely</Badge>
                            <h2 className="text-4xl font-bold font-display text-slate-900 mb-3 tracking-tight">Sign in</h2>
                            <p className="text-slate-500 font-medium text-base">Enter your work email and password to access the platform.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="group space-y-2">
                                <label htmlFor="login-email" className="text-[11px] font-bold text-slate-400 tracking-widest ml-1 transition-colors group-focus-within:text-primary">Work email</label>
                                <div className="relative">
                                    <input
                                        id="login-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@company.com"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="group space-y-2">
                                <div className="flex items-center justify-between mb-1 px-1">
                                    <label htmlFor="login-password" className="text-[11px] font-bold text-slate-400 tracking-widest transition-colors group-focus-within:text-primary">Password</label>
                                    <button
                                        type="button"
                                        onClick={() => navigate("/forgot-password")}
                                        className="text-[11px] font-bold text-primary hover:underline transition-all"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                    <input
                                        id="login-password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••••••"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-12 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors p-2"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </Button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                size="lg"
                                className="w-full mt-4 flex items-center justify-center gap-3 group/btn shadow-[0_20px_40px_-10px_rgba(242,140,27,0.3)] bg-[#F28C1B] hover:bg-[#D97706] text-white h-14 rounded-2xl font-black tracking-widest text-xs"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Authorize access
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>

                            <div className="flex items-center gap-4 my-6">
                                <div className="flex-1 h-px bg-slate-100" />
                                <span className="text-[10px] font-black text-slate-300 tracking-widest">Biometric access</span>
                                <div className="flex-1 h-px bg-slate-100" />
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                className="w-full border-slate-100 hover:bg-slate-50 text-[#2C2C2C] font-black tracking-widest text-[10px] h-14 rounded-2xl group/face transition-all"
                                onClick={handleFaceLoginStart}
                                disabled={isLoading}
                            >
                                <ScanFace className="mr-2 h-5 w-5 text-[#F28C1B] group-hover/face:scale-110 transition-transform" />
                                Biometric passport sign
                            </Button>

                            <div className="flex items-center gap-4 my-6">
                                <div className="flex-1 h-px bg-slate-200" />
                                <span className="text-xs font-bold text-slate-400 tracking-widest">Other accounts</span>
                                <div className="flex-1 h-px bg-slate-200" />
                            </div>
                            <Button
                                asChild
                                variant="outline"
                                size="lg"
                                className="w-full border-slate-100 hover:bg-slate-50 text-[#2C2C2C] font-black tracking-widest text-[10px] h-14 rounded-2xl"
                                aria-label="Sign in with Google"
                            >
                                <a href={`${API_URL}/auth/google`} className="flex items-center justify-center gap-3">
                                    <svg viewBox="0 0 24 24" width="18" height="18">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Connect with Gmail
                                </a>
                            </Button>
                        </form>

                        {/* Face ID Dialog */}
                        <Dialog open={faceLoginOpen} onOpenChange={setFaceLoginOpen}>
                            <DialogContent className="sm:max-w-md bg-white rounded-[48px] border-none shadow-premium p-0 overflow-hidden">
                                <div className="p-12 space-y-8">
                                    <DialogHeader>
                                        <DialogTitle className="text-3xl font-black tracking-tighter text-center">Biometric authentication</DialogTitle>
                                    </DialogHeader>

                                    {faceTarget && (
                                        <Suspense fallback={<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />}>
                                            <FaceIdScanner
                                                targetImage={faceTarget.picture}
                                                targetLabel={faceTarget.name?.split(' ')[0] || "User"}
                                                onMatchSuccess={onFaceVerificationSuccess}
                                                mode="verify"
                                            />
                                        </Suspense>
                                    )}

                                    <p className="text-center text-xs text-slate-400 font-bold tracking-widest leading-relaxed">
                                        Position your face within the frame. <br />
                                        Your security is our priority.
                                    </p>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <div className="mt-auto pt-12 text-center lg:text-left lg:opacity-60">
                            <p className="text-[11px] font-semibold text-slate-400 tracking-[0.2em]">
                                © 2026 Maghrebia group · Intelligence beyond boundaries
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

function ForgotPasswordForm() {
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
            toast.success("Recovery Email Sent", {
                description: "Check your inbox for the reset link.",
                className: "font-sans font-medium"
            })
        } catch (error) {
            toast.error("Process Failed", {
                description: error.message || "Unable to send recovery email.",
                className: "font-sans font-medium"
            })
        } finally {
            setIsLoading(false)
        }
    }

    if (isSent) {
        return (
            <main id="main-content" className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 relative overflow-hidden">
                <div className="w-full max-w-md text-center space-y-8 animate-in fade-in zoom-in duration-500 relative z-10">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-emerald-100">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Check your email</h2>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            A secure recovery link has been dispatched to <br />
                            <span className="text-slate-900 font-bold">{email}</span>
                        </p>
                    </div>
                    <Button
                        onClick={() => navigate("/login")}
                        className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold tracking-widest shadow-xl"
                    >
                        Return to login
                    </Button>
                    <p className="text-xs text-slate-400 font-medium">
                        Missing the email? <button type="button" onClick={() => setIsSent(false)} className="text-primary font-bold hover:underline">Try again</button>
                    </p>
                </div>
            </main>
        )
    }

    return (
        <main id="main-content" className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-50">
                <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-[#F28C1B]/[0.05] rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-[450px] bg-white rounded-3xl border border-slate-200/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-10 lg:p-14 relative z-10 animate-in slide-in-from-bottom-8 duration-700">
                <button
                    onClick={() => navigate("/login")}
                    className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors mb-10"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-bold tracking-widest">Back to login</span>
                </button>

                <div className="mb-10 text-center lg:text-left">
                    <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Recover access</h2>
                    <p className="text-slate-500 font-medium">Verify your email to reset your security credentials.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="group space-y-2">
                        <label htmlFor="forgot-email" className="text-[11px] font-bold text-slate-400 tracking-widest ml-1 transition-colors group-focus-within:text-primary">Work email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                                id="forgot-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                                required
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-primary text-white h-14 rounded-xl font-bold tracking-widest transition-all shadow-xl active:scale-[0.98]"
                        disabled={isLoading || !email}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-3">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Verifying...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <span>Send security link</span>
                                <ArrowRight className="h-4 w-4" />
                            </div>
                        )}
                    </Button>
                </form>
            </div>
        </main>
    )
}


function ResetPasswordForm() {
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
            toast.error("Invalid Request", { description: "Security token is missing from the URL." })
            navigate("/login")
            return
        }
        setToken(t)
    }, [searchParams, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            toast.error("Integrity Error", { description: "Secrets do not match." })
            return
        }
        if (password.length < 8) {
            toast.error("Security Policy", { description: "Password must be at least 8 characters long." })
            return
        }

        setIsLoading(true)
        try {
            await resetPassword(token, password)
            setIsDone(true)
            toast.success("Security Update Successful", {
                description: "Your new credentials are now active.",
                className: "font-sans font-medium"
            })
        } catch (error) {
            toast.error("Update Failed", {
                description: error.message || "The security link has expired or is invalid.",
                className: "font-sans font-medium"
            })
        } finally {
            setIsLoading(false)
        }
    }

    if (isDone) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 relative overflow-hidden">
                <div className="w-full max-w-md text-center space-y-10 animate-in fade-in zoom-in duration-700 relative z-10">
                    <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
                        <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Password reset complete</h2>
                        <p className="text-slate-500 font-medium">Your password has been successfully updated. You can now sign in with your new credentials.</p>
                    </div>
                    <Button
                        onClick={() => navigate("/login")}
                        className="w-full h-16 bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl font-bold tracking-widest shadow-2xl transition-all"
                    >
                        Sign in now
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <main id="main-content" className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 relative overflow-hidden text-slate-900">
            <div className="w-full max-w-[450px] bg-white rounded-3xl border border-slate-200/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-10 lg:p-14 relative z-10 animate-in slide-in-from-right-8 duration-700">
                <div className="mb-14 text-center lg:text-left">
                    <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Reset password</h2>
                    <p className="text-slate-500 font-medium">Create a new password for your account.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="group space-y-2">
                        <label htmlFor="reset-password" className="text-[11px] font-bold text-slate-400 tracking-widest ml-1 transition-colors group-focus-within:text-primary">New password</label>
                        <div className="relative text-slate-900">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                                id="reset-password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••••••"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-12 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 p-2"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </Button>
                        </div>
                    </div>

                    <div className="group space-y-2">
                        <label htmlFor="reset-password-confirm" className="text-[11px] font-bold text-slate-400 tracking-widest ml-1 transition-colors group-focus-within:text-primary">Confirm password</label>
                        <div className="relative text-slate-900">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                                id="reset-password-confirm"
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••••••"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-12 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                                required
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-primary text-white h-16 rounded-xl font-bold tracking-widest transition-all shadow-xl active:scale-[0.98] mt-6"
                        disabled={isLoading || !password || !confirmPassword}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-3">
                                <span className="animate-spin">●</span>
                                <span>Updating...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <span>Update password</span>
                                <ArrowRight className="h-4 w-4" />
                            </div>
                        )}
                    </Button>
                </form>
            </div>
        </main>
    )
}

function ProtectedRoute({ children, requiredRole }) {
    const { user, isAuthenticated, isLoading } = useAuth()
    const location = useLocation()

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    const userRole = (user?.role || "").toLowerCase()

    // Admins and HR can access anything admin-related, otherwise check for requiredRole
    if (requiredRole && userRole !== "admin" && userRole !== "hr" && userRole !== requiredRole) {
        return <Navigate to={`/${userRole}`} replace />
    }

    return children
}

function AppContent() {
    const { isAuthenticated, user, isLoading } = useAuth()
    const location = useLocation()
    const normalizedUserRole = (user?.role || 'employee').toString().toLowerCase().trim()
    const isPublicAuthRoute = ["/login", "/forgot-password", "/reset-password"].includes(location.pathname)

    // Detect OAuth callback before rendering routes (so we don't get redirected to /login and lose the hash)
    // MOVED TO TOP: Must call all hooks unconditionally, before any early returns
    const [pendingOAuth, setPendingOAuth] = useState(() => {
        const h = window.location.hash || ""
        return h.includes("access_token=")
    })

    // Handle OAuth callback: store token/user then redirect to app and reload
    useEffect(() => {
        if (!pendingOAuth) return
        const hash = window.location.hash?.slice(1)
        if (!hash) return
        const params = new URLSearchParams(hash)
        const accessToken = params.get("access_token")
        const refreshToken = params.get("refresh_token")
        const userStr = params.get("user")

        if (accessToken) {
            try {
                sessionStorage.setItem("skillmatch_token", accessToken)
                if (refreshToken) {
                    sessionStorage.setItem("skillmatch_refresh_token", refreshToken)
                }
                let targetPath = "/employee"
                if (userStr) {
                    const decoded = decodeURIComponent(userStr)
                    const userPayload = JSON.parse(decoded)
                    const r = (userPayload.role || "").toString().toLowerCase().trim()

                    // Normalize Role - Admin, Manager, HR, Employee only
                    const normalizedRole = r === "admin" ? "admin" : r === "manager" ? "manager" : r === "hr" ? "hr" : "employee"
                    userPayload.role = normalizedRole
                    userPayload.id = userPayload.id || userPayload._id

                    sessionStorage.setItem("skillmatch_user", JSON.stringify(userPayload))
                    targetPath = `/${normalizedRole}`
                }
                window.location.href = targetPath
            } catch (e) {
                console.error("OAuth callback error", e)
                setPendingOAuth(false)
            }
        } else {
            setPendingOAuth(false)
        }
    }, [pendingOAuth])

    if (isLoading && !isPublicAuthRoute) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (pendingOAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Signing you in...</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <a href="#main-content" className="skip-link">Aller au contenu principal</a>
            <Suspense fallback={null}>
                <AccessibilityWidget />
            </Suspense>
            <Toaster richColors position="top-right" />
            <Routes>
                <Route path="/login" element={<LoginForm />} />
                <Route path="/forgot-password" element={<ForgotPasswordForm />} />
                <Route path="/reset-password" element={<ResetPasswordForm />} />
                <Route
                    path="/employee/*"
                    element={
                        <ProtectedRoute requiredRole="employee">
                            <Suspense fallback={<RouteLoader />}>
                                <EmployeeApp />
                            </Suspense>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/manager/*"
                    element={
                        <ProtectedRoute requiredRole="manager">
                            <Suspense fallback={<RouteLoader />}>
                                <ManagerApp />
                            </Suspense>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/*"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <Suspense fallback={<RouteLoader />}>
                                <AdminApp />
                            </Suspense>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/hr/*"
                    element={
                        <ProtectedRoute requiredRole="hr">
                            <Suspense fallback={<RouteLoader />}>
                                <HRApp />
                            </Suspense>
                        </ProtectedRoute>
                    }
                />
                <Route path="/" element={
                    isAuthenticated && user
                        ? <Navigate to={`/${normalizedUserRole}`} replace />
                        : <Navigate to="/login" replace />
                } />
                <Route
                    path="*"
                    element={
                        isAuthenticated && user
                            ? <Navigate to={`/${normalizedUserRole}`} replace />
                            : <Navigate to="/login" replace />
                    }
                />
            </Routes>
        </>
    )
}

function App() {
    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppContent />
        </BrowserRouter>
    )
}

export default App

