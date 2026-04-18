"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "/lib/auth-context"
import { Brain } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    // Redirect based on role
    if (user?.role === "employee") {
      router.push("/employee")
    } else if (user?.role === "manager") {
      router.push("/manager")
    } else if (user?.role === "hr") {
      router.push("/hr")
    } else {
      router.push("/admin")
    }
  }, [isAuthenticated, user, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary">
          <Brain className="h-8 w-8 text-primary-foreground" />
        </div>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Loading SkillMatch...</p>
      </div>
    </div>
  )
}



