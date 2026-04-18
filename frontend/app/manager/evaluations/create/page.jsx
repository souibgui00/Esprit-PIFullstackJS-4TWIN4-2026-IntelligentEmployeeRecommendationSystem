"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { managerSkillAssessmentSchema } from "/lib/schemas"
import { useData } from "/lib/data-store"
import { useAuth } from "/lib/auth-context"
import { DashboardHeader } from "/components/dashboard/header"
import { Button } from "/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "/components/ui/card"
import { Badge } from "/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "/components/ui/avatar"
import { Checkbox } from "/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "/components/ui/form"
import { Textarea } from "/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "/components/ui/select"
import { Input } from "/components/ui/input"
import { 
  Users, 
  Target, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ClipboardCheck,
  Plus,
  X
} from "lucide-react"
import { cn } from "/lib/utils"
import { toast } from "sonner"

export default function ManagerEvaluationCreatePage() {
  const navigate = useNavigate()
  const { employees, skills, addEvaluation, departments, activities } = useData()
  const { user } = useAuth()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedSkills, setSelectedSkills] = useState([])
  const [activityId, setActivityId] = useState("")

  const managerDept = departments.find(d => d.manager_id === user?.id)
  const deptName = managerDept?.name
  const deptEmployees = employees.filter(e => deptName && e.department === deptName)

  const form = useForm({
    resolver: zodResolver(managerSkillAssessmentSchema),
    defaultValues: {
      skillCategory: "",
      assessmentType: "team",
      targetProficiency: "intermediate",
      assessmentScope: "",
      evaluationCriteria: []
    }
  })

  const handleSkillToggle = (skillId, checked) => {
    if (checked) {
      setSelectedSkills([...selectedSkills, skillId])
    } else {
      setSelectedSkills(selectedSkills.filter(id => id !== skillId))
    }
  }

  const addCriterion = () => {
    const currentCriteria = form.getValues("evaluationCriteria")
    form.setValue("evaluationCriteria", [...currentCriteria, ""])
  }

  const removeCriterion = (index) => {
    const currentCriteria = form.getValues("evaluationCriteria")
    form.setValue("evaluationCriteria", currentCriteria.filter((_, i) => i !== index))
  }

  const updateCriterion = (index, value) => {
    const currentCriteria = form.getValues("evaluationCriteria")
    form.setValue("evaluationCriteria", 
      currentCriteria.map((criterion, i) => i === index ? value : criterion)
    )
  }

  const onSubmit = async (data) => {
    if (selectedSkills.length === 0) {
      toast.error("Selection Required", {
        description: "Please select at least one skill for assessment."
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Create evaluations for each selected skill and employee
      for (const skillId of selectedSkills) {
        for (const employee of deptEmployees) {
          await addEvaluation({
            employeeId: employee.id,
            skillId: skillId,
            managerId: user?.id,
            status: "pending",
            date: new Date().toISOString(),
            assessmentType: data.assessmentType,
            targetProficiency: data.targetProficiency,
            assessmentScope: data.assessmentScope,
            evaluationCriteria: data.evaluationCriteria,
            activityId: activityId || undefined
          })
        }
      }

      toast.success("Assessments Created", {
        description: `${selectedSkills.length} skill assessments created for ${deptEmployees.length} team members.`
      })

      navigate("/manager/evaluations")
    } catch (error) {
      toast.error("Assessment Creation Failed", {
        description: "Unable to create assessment. Please retry."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col bg-[#F8FAFC] min-h-screen">
      <DashboardHeader title="Create evaluation" description="Set up a new skill assessment" />

      <div className="flex-1 p-8 max-w-4xl mx-auto w-full space-y-8">
        {/* Header */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl text-slate-900">Assessment Configuration</CardTitle>
                <p className="text-sm text-slate-500 mt-1">Define parameters for team skill evaluations.</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate("/manager/evaluations")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Return to Evaluations
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Assessment Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Configuration */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900">Assessment Parameters</CardTitle>
                <p className="text-sm text-slate-500">Configure the assessment framework.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Assessment Type */}
                <FormField
                  control={form.control}
                  name="assessmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Evaluation Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select assessment type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="individual">Individual Assessment</SelectItem>
                          <SelectItem value="team">Team-Based Evaluation</SelectItem>
                          <SelectItem value="departmental">Departmental Analysis</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Target Proficiency */}
                <FormField
                  control={form.control}
                  name="targetProficiency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Proficiency Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select target proficiency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="basic">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Assessment Scope */}
                <FormField
                  control={form.control}
                  name="assessmentScope"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assessment Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Clearly define the scope, objectives, and context for this assessment..."
                          className="resize-none"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2 pt-2">
                    <FormLabel>Related Activity (Optional)</FormLabel>
                    <Select value={activityId} onValueChange={setActivityId}>
                        <SelectTrigger className="w-full bg-white">
                            <SelectValue placeholder="Select an activity..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            <SelectItem value="none">None (General Assessment)</SelectItem>
                            {activities?.map(a => (
                                <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
              </CardContent>
            </Card>

            {/* Skill Selection */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900">Competency Selection</CardTitle>
                <p className="text-sm text-slate-500">Choose specific skills for evaluation across the team.</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {skills.map((skill) => (
                    <div key={skill.id} className="flex items-center space-x-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50">
                      <Checkbox
                        id={`skill-${skill.id}`}
                        checked={selectedSkills.includes(skill.id)}
                        onCheckedChange={(checked) => handleSkillToggle(skill.id, checked)}
                      />
                      <div className="flex-1">
                        <label 
                          htmlFor={`skill-${skill.id}`}
                          className="text-sm font-medium text-slate-900 cursor-pointer"
                        >
                          {skill.name}
                        </label>
                        <p className="text-xs text-slate-500">{skill.category} • {skill.type}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {skill.type}
                      </Badge>
                    </div>
                  ))}
                </div>
                {selectedSkills.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">
                    Select at least one skill to proceed with assessment configuration.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Evaluation Criteria */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-slate-900">Evaluation Criteria</CardTitle>
                    <p className="text-sm text-slate-500">Define specific metrics for assessment evaluation.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCriterion}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Criterion
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="evaluationCriteria"
                  render={() => (
                    <FormItem>
                      <div className="space-y-3">
                        {form.watch("evaluationCriteria").map((criterion, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="flex-1">
                              <FormControl>
                                <Input
                                  placeholder="Enter evaluation criterion..."
                                  value={criterion}
                                  onChange={(e) => updateCriterion(index, e.target.value)}
                                />
                              </FormControl>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeCriterion(index)}
                              className="p-2"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="border-slate-200 shadow-sm bg-slate-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Assessment Summary</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {selectedSkills.length} skills selected for evaluation across {deptEmployees.length} team members
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={cn(
                      "h-5 w-5",
                      selectedSkills.length > 0 ? "text-emerald-500" : "text-slate-400"
                    )} />
                    <span className="text-sm font-medium text-slate-700">
                      {selectedSkills.length} Skills Configured
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/manager/evaluations")}
                className="flex-1"
              >
                Cancel Configuration
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || selectedSkills.length === 0}
                className="flex-1"
              >
                {isSubmitting ? "Creating..." : "Create Assessments"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
