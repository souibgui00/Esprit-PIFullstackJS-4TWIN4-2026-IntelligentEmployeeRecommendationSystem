"use client"

import { EmployeeProfileRoutePage } from "@/components/employees/employee-profile-route-page"

export default function AdminEmployeeProfilePage() {
  return <EmployeeProfileRoutePage rolePrefix="/admin" accentClass="text-primary" />
}
