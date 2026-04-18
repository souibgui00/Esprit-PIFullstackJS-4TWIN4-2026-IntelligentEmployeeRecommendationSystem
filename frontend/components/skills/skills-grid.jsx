"use client"

import React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "/components/ui/card"
import { Badge } from "/components/ui/badge"
import { Button } from "/components/ui/button"
import { Input } from "/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "/components/ui/dropdown-menu"
import { useData } from "/lib/data-store"
import { getSkillTypeLabel, cn } from "/lib/utils"
import { Search, BookOpen, Brain, Heart, Users, TrendingUp, Filter, Plus, MoreVertical, Edit, Trash2 } from "lucide-react"

import { SkillDialog } from "/components/dialogs/skill-dialog"
import { ConfirmDialog } from "/components/dialogs/confirm-dialog"
import { toast } from "sonner"



export function SkillsGrid({ onSelectSkill }) {
  const { skills, employees, deleteSkill } = useData()
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  // Dialog states
  const [skillDialogOpen, setSkillDialogOpen] = useState(false)
  const [skillDialogMode, setSkillDialogMode] = useState("create")
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [skillToDelete, setSkillToDelete] = useState(null)

  const categories = [...new Set(skills.map((s) => s.category))]

  const filteredSkills = skills.filter((skill) => {
    const matchesSearch =
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = typeFilter === "all" || skill.type === typeFilter
    const matchesCategory = categoryFilter === "all" || skill.category === categoryFilter

    return matchesSearch && matchesType && matchesCategory
  })

  const getSkillStats = (skillId) => {
    let totalEmployees = 0
    let totalScore = 0
    let totalProgression = 0

    employees.forEach((emp) => {
      const empSkill = emp.skills.find((s) => s.skillId === skillId)
      if (empSkill) {
        totalEmployees++
        totalScore += empSkill.score
        totalProgression += empSkill.progression
      }
    })

    return {
      employeeCount: totalEmployees,
      avgScore: totalEmployees > 0 ? Math.round(totalScore / totalEmployees) : 0,
      avgProgression: totalEmployees > 0 ? Math.round(totalProgression / totalEmployees) : 0,
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case "knowledge": return BookOpen
      case "knowHow": return Brain
      case "softSkill": return Heart
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case "knowledge": return "bg-chart-1/10 text-chart-1 border-chart-1/20"
      case "knowHow": return "bg-chart-2/10 text-chart-2 border-chart-2/20"
      case "softSkill": return "bg-chart-3/10 text-chart-3 border-chart-3/20"
    }
  }

  const handleAddSkill = () => {
    setSelectedSkill(null)
    setSkillDialogMode("create")
    setSkillDialogOpen(true)
  }

  const handleEditSkill = (skill, e) => {
    e.stopPropagation()
    setSelectedSkill(skill)
    setSkillDialogMode("edit")
    setSkillDialogOpen(true)
  }

  const handleDeleteClick = (skill, e) => {
    e.stopPropagation()
    setSkillToDelete(skill)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (skillToDelete) {
      deleteSkill(skillToDelete.id)
      toast.success(`${skillToDelete.name} has been deleted`)
      setSkillToDelete(null)
    }
    setDeleteDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Skill Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="knowledge">Knowledge</SelectItem>
              <SelectItem value="knowHow">Know-how</SelectItem>
              <SelectItem value="softSkill">Soft Skills</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddSkill}>
            <Plus className="mr-2 h-4 w-4" />
            Add Skill
          </Button>
        </div>
      </div>

      {/* Skills Type Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        {(["knowledge", "knowHow", "softSkill"]).map((type) => {
          const typeSkills = skills.filter((s) => s.type === type)
          const Icon = getTypeIcon(type)

          return (
            <Card key={type} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("rounded-lg p-2", getTypeColor(type))}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{getSkillTypeLabel(type)}</p>
                      <p className="text-xs text-muted-foreground">{typeSkills.length} skills defined</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Skills Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSkills.map((skill) => {
          const stats = getSkillStats(skill.id)
          const Icon = getTypeIcon(skill.type)

          return (
            <Card
              key={skill.id}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
              onClick={() => onSelectSkill?.(skill)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("rounded-lg p-1.5", getTypeColor(skill.type))}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-foreground">{skill.name}</CardTitle>
                      <CardDescription className="text-xs">{skill.category}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => handleEditSkill(skill, e)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Skill
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => handleDeleteClick(skill, e)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {skill.description}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{stats.employeeCount} employees</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      Avg: <span className="font-medium text-foreground">{stats.avgScore}%</span>
                    </span>
                    {stats.avgProgression > 0 && (
                      <span className="flex items-center gap-0.5 text-success">
                        <TrendingUp className="h-3 w-3" />
                        +{stats.avgProgression}%
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredSkills.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No skills found
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredSkills.length} of {skills.length} skills
      </p>

      {/* Dialogs */}
      <SkillDialog
        open={skillDialogOpen}
        onOpenChange={setSkillDialogOpen}
        skill={selectedSkill}
        mode={skillDialogMode}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Skill"
        description={`Are you sure you want to delete "${skillToDelete?.name}"? This will also remove it from all employee profiles.`}
        confirmText="Delete"
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </div>
  )
}
