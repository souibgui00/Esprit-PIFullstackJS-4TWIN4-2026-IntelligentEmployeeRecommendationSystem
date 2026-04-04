"use client"

import React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"




export function AuthGuard({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on role
      if (user.role === "employee") {
        router.push("/employee")
      } else {
        router.push("/admin")
      }
    }
  }, [isAuthenticated, user, allowedRoles, router])

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return <>{children}</>
}
