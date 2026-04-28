"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Brain, Lock, Mail, Eye, EyeOff, ArrowRight, ScanFace } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { FaceIdScanner } from "@/components/auth/face-id-scanner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function LoginPage() {
  const router = useRouter()
  const { login, getFaceProfile, faceLogin } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [faceLoginOpen, setFaceLoginOpen] = useState(false)
  const [faceTarget, setFaceTarget] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const result = await login(email, password)

    if (result.success) {
      router.push("/")
    } else {
      setError(result.error || "Login failed")
    }

    setIsLoading(false)
  }

  const handleFaceLoginStart = async () => {
    if (!email) {
      setError("Please enter your email first to use Face ID")
      return
    }
    setIsLoading(true)
    const profile = await getFaceProfile(email)
    setIsLoading(false)

    if (profile && profile.isFaceIdEnabled) {
      setFaceTarget(profile)
      setFaceLoginOpen(true)
    } else {
      setError("Face ID is not enabled for this account or user not found")
    }
  }

  const onFaceVerificationSuccess = async () => {
    const result = await faceLogin(email)
    if (result.success) {
      router.push("/")
    } else {
      setError("Face verified but login failed on server")
      setFaceLoginOpen(false)
    }
  }


  return (
    <main id="main-content" className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <header className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden" role="banner">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-primary via-primary to-primary/80" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <section aria-label="Brand information">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/10 backdrop-blur-sm" aria-hidden="true">
                <Brain className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">SkillMatch</h1>
                <p className="text-sm text-primary-foreground/70">HR Platform</p>
              </div>
            </div>
          </section>

          <section aria-label="Platform features" className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight text-balance">
              AI-Powered Skills Management for Modern Teams
            </h2>
            <p className="text-lg text-primary-foreground/80 leading-relaxed max-w-md">
              Automate employee selection, track skill development, and make data-driven HR decisions with intelligent recommendations.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4" role="region" aria-label="Platform statistics">
              <article className="rounded-lg bg-primary-foreground/10 backdrop-blur-sm p-4">
                <div className="text-3xl font-bold" aria-label="500+ skills tracked">500+</div>
                <div className="text-sm text-primary-foreground/70">Skills Tracked</div>
              </article>
              <article className="rounded-lg bg-primary-foreground/10 backdrop-blur-sm p-4">
                <div className="text-3xl font-bold" aria-label="95% match accuracy">95%</div>
                <div className="text-sm text-primary-foreground/70">Match Accuracy</div>
              </article>
            </div>
          </section>

          <p className="text-sm text-primary-foreground/60">
            Trusted by leading enterprises worldwide
          </p>
        </div>
      </header>

      {/* Right Panel - Login Form */}
      <section className="flex-1 flex items-center justify-center p-8 bg-background" aria-label="Login form section">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <section className="flex items-center gap-3 lg:hidden" aria-label="Mobile brand">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary" aria-hidden="true">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">SkillMatch</h1>
              <p className="text-xs text-muted-foreground">HR Platform</p>
            </div>
          </section>

          {/* Form Header */}
          <section aria-labelledby="login-heading">
            <h2 id="login-heading" className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground text-sm mt-1">Sign in to your account to continue</p>
          </section>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4" aria-label="Email and password login form">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  aria-required="true"
                  aria-describedby={error ? "form-error" : undefined}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-medium">Password</Label>
                <button
                  type="button"
                  onClick={() => router.push("/forgot-password")}
                  className="text-xs font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-2 py-1"
                  aria-label="Navigate to forgot password page"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  aria-required="true"
                  aria-describedby={error ? "form-error" : undefined}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:ring-2 focus:ring-primary/50"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div 
                id="form-error"
                role="alert" 
                className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20"
                aria-live="polite"
              >
                <span className="font-semibold">Error: </span>{error}
              </div>
            )}

            {/* Sign In Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2" aria-hidden="true" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative" aria-hidden="true">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
                <span className="bg-background px-4 text-slate-400">Biometric Secure</span>
              </div>
            </div>

            {/* Face ID Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full border-slate-200 hover:bg-slate-50 text-slate-600 font-bold tracking-tight h-11 focus:ring-2 focus:ring-primary/50"
              onClick={handleFaceLoginStart}
              disabled={isLoading}
              aria-label="Sign in with Face ID biometric authentication"
            >
              <ScanFace className="mr-2 h-4 w-4 text-primary" aria-hidden="true" />
              Sign in with Face ID
            </Button>
          </form>

          {/* Face ID Dialog */}
          <Dialog open={faceLoginOpen} onOpenChange={setFaceLoginOpen}>
            <DialogContent 
              className="sm:max-w-md bg-white rounded-4xl border-none shadow-2xl p-0 overflow-hidden"
              role="dialog"
              aria-labelledby="face-dialog-title"
              aria-describedby="face-dialog-description"
            >
              <div className="p-8 space-y-6">
                <DialogHeader>
                  <DialogTitle id="face-dialog-title" className="text-2xl font-black tracking-tight text-center">
                    Face Verification
                  </DialogTitle>
                </DialogHeader>

                {faceTarget && (
                  <FaceIdScanner
                    targetImage={faceTarget.picture}
                    targetLabel={faceTarget.name.split(' ')[0]}
                    onMatchSuccess={onFaceVerificationSuccess}
                    mode="verify"
                    aria-label="Biometric face verification camera"
                  />
                )}

                <p id="face-dialog-description" className="text-center text-xs text-slate-400 font-medium">
                  Please look directly into the camera for authentication.
                  Biometric data is processed locally for your security.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>
    </main>
  )
}
