"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { EmployeeTable } from "@/components/employees/employee-table"
import { EmployeeProfile } from "@/components/employees/employee-profile"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"


export default function EmployeesPage() {
  const [selectedEmployee, setSelectedEmployee] = useState(null)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 transition-all duration-300">
        <Header
          title="Employees"
          description="Manage employee profiles and skills"
        />
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Employee Directory</h2>
              <p className="text-sm text-muted-foreground">
                View and manage all employees in your organization
              </p>
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className={selectedEmployee ? "lg:col-span-2" : "lg:col-span-3"}>
              <EmployeeTable onSelectEmployee={setSelectedEmployee} />
            </div>
            
            {selectedEmployee && (
              <div className="lg:col-span-1">
                <EmployeeProfile
                  employee={selectedEmployee}
                  onClose={() => setSelectedEmployee(null)}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}



