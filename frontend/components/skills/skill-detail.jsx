"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { useData } from "@/lib/data-store"
import { getSkillTypeLabel, getSkillLevelColor, cn } from "@/lib/utils"
import {
  X,
  BookOpen,
  Brain,
  Heart,
  Users,
  TrendingUp,
  BarChart3,
  Edit,
  UserPlus
} from "lucide-react"

import { SkillDialog } from "@/components/dialogs/skill-dialog"
import { EmployeeSkillDialog } from "@/components/dialogs/employee-skill-dialog"



export function SkillDetail({ skill: initialSkill, onClose }) {
  const { skills, employees } = useData()

  // Get latest skill data from store
  const skill = skills.find(s => s.id === initialSkill.id) || initialSkill

  const [skillDialogOpen, setSkillDialogOpen] = useState(false)
  const [employeeSkillDialogOpen, setEmployeeSkillDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedEmployeeSkill, setSelectedEmployeeSkill] = useState(null)

  const getTypeIcon = () => {
    switch (skill.type) {
      case "knowledge": return BookOpen
      case "knowHow": return Brain
      case "softSkill": return Heart
    }
  }

  const getTypeColor = () => {
    switch (skill.type) {
      case "knowledge": return "bg-chart-1/10 text-chart-1"
      case "knowHow": return "bg-chart-2/10 text-chart-2"
      case "softSkill": return "bg-chart-3/10 text-chart-3"
    }
  }

  // Get employees with this skill
  const employeesWithSkill = employees
    .map((emp) => {
      const empSkill = emp.skills.find((s) => s.skillId === skill.id)
      if (!empSkill) return null
      return { employee: emp, skill: empSkill }
    })
    .filter(Boolean)

  // Calculate level distribution
  const levelDistribution = {
    low: 0,
    medium: 0,
    high: 0,
    expert: 0,
  }

  employeesWithSkill.forEach(({ skill }) => {
    levelDistribution[skill.level]++
  })

  const totalWithSkill = employeesWithSkill.length
  const avgScore = totalWithSkill > 0
    ? Math.round(employeesWithSkill.reduce((sum, { skill }) => sum + skill.score, 0) / totalWithSkill)
    : 0

  const handleEditEmployeeSkill = (employee, empSkill) => {
    setSelectedEmployee(employee)
    setSelectedEmployeeSkill(empSkill)
    setEmployeeSkillDialogOpen(true)
  }

  const Icon = getTypeIcon()

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="relative pb-4">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 h-8 w-8"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="flex items-start gap-4">
          <div className={cn("rounded-xl p-3", getTypeColor())}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl text-foreground">{skill.name}</CardTitle>
            <CardDescription className="text-sm mt-1">
              {getSkillTypeLabel(skill.type)} - {skill.category}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick Actions */}
        <Button variant="outline" size="sm" onClick={() => setSkillDialogOpen(true)} className="bg-transparent">
          <Edit className="mr-1 h-3 w-3" />
          Edit Skill
        </Button>

        {/* Description */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-2">Description</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {skill.description}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-secondary/50 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold text-foreground">{totalWithSkill}</span>
            </div>
            <p className="text-xs text-muted-foreground">Employees</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/50 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold text-foreground">{avgScore}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Avg. Score</p>
          </div>
        </div>

        {/* Level Distribution */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Level Distribution</h4>
          <div className="space-y-2">
            {(["expert", "high", "medium", "low"]).map((level) => {
              const count = levelDistribution[level]
              const percentage = totalWithSkill > 0 ? Math.round((count / totalWithSkill) * 100) : 0

              return (
                <div key={level} className="flex items-center gap-3">
                  <Badge className={cn("w-16 justify-center text-xs capitalize", getSkillLevelColor(level))}>
                    {level}
                  </Badge>
                  <div className="flex-1">
                    <Progress value={percentage} className="h-2" />
                  </div>
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    {count} ({percentage}%)
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Performers */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Employees with this Skill</h4>
          <div className="space-y-2">
            {employeesWithSkill
              .sort((a, b) => b.skill.score - a.skill.score)
              .slice(0, 8)
              .map(({ employee, skill: empSkill }) => (
                <div
                  key={employee.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group"
                  onClick={() => handleEditEmployeeSkill(employee, empSkill)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={employee.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {employee.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{employee.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{employee.position}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {empSkill.progression > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-success">
                        <TrendingUp className="h-3 w-3" />
                        +{empSkill.progression}%
                      </span>
                    )}
                    <Badge className={cn("text-xs capitalize", getSkillLevelColor(empSkill.level))}>
                      {empSkill.score}%
                    </Badge>
                    <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            {employeesWithSkill.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No employees have this skill yet</p>
            )}
          </div>
        </div>
      </CardContent>

      {/* Dialogs */}
      <SkillDialog
        open={skillDialogOpen}
        onOpenChange={setSkillDialogOpen}
        skill={skill}
        mode="edit"
      />

      {selectedEmployee && (
        <EmployeeSkillDialog
          open={employeeSkillDialogOpen}
          onOpenChange={setEmployeeSkillDialogOpen}
          employee={selectedEmployee}
          employeeSkill={selectedEmployeeSkill}
          mode="edit"
        />
      )}
    </Card>
  )
}
