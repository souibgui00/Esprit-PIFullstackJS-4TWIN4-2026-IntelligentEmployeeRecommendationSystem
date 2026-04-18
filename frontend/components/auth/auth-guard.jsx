"use client"

import React from "react"

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "/lib/auth-context"

export function AuthGuard({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login")
      return
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on role
      const lowerRole = (user.role || "").toLowerCase()
      if (lowerRole === "employee") {
        navigate("/employee")
      } else if (lowerRole === "manager") {
         navigate("/manager")
      } else {
        navigate("/admin")
      }
    }
  }, [isAuthenticated, user, allowedRoles, navigate])


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
