import { z } from "zod";

export const employeeSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  telephone: z.string().optional(),
  department_id: z.string().min(1, "Please select a department"),
  role: z.enum(["admin", "hr", "manager", "employee"]),
  position: z.string().optional(),
  date_embauche: z.string().optional(),
  jobDescription: z.string().optional(),
  yearsOfExperience: z.coerce.number().optional().default(0),
  matricule: z.string().optional(),
  manager_id: z.string().optional().nullable(),
  status: z.enum(["active", "inactive", "suspended", "onboarding"]).default("active"),
  avatar: z.string().optional(),
});

export const activitySchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().min(10, "Description is required"),
  type: z.enum(["training", "workshop", "mentoring", "webinar"], { message: "Please select a type" }),
  date: z.string().min(1, "Date is required"),
  duration: z.string().min(1, "Duration is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1").default(20),
  status: z.enum(["open", "closed", "completed"]).default("open"),
  skillsCovered: z.array(z.string()).optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  location: z.string().optional(),
});

export const sessionSchema = z.object({
  activityId: z.string().min(1, "Please select an activity"),
  date: z.string().min(1, "Session date is required"),
  location: z.string().min(1, "Location is required"),
  maxParticipants: z.coerce.number().min(1, "Maximum participants must be at least 1"),
  status: z.string().default("scheduled"),
});

export const skillSchema = z.object({
  name: z.string().min(2, "Name is required"),
  category: z.string().optional(),
  type: z.enum(["technique", "comportementale", "transverse", "opérationnelle"], "Please select a classification"),
  etat: z.enum(["draft", "submitted", "validated"]).default("draft"),
  description: z.string().optional(),
  auto_eval: z.number().min(0).max(5).optional(),
  hierarchie_eval: z.number().min(0).max(5).optional(),
});

export const enhancedSkillSchema = skillSchema;

// Manager-specific schemas
export const managerActivityEnrollmentSchema = z.object({
  activityId: z.string().min(1, "Activity selection is required"),
  selectedEmployees: z.array(z.string()).min(1, "At least one employee must be selected"),
  enrollmentNotes: z.string().optional(),
  priorityLevel: z.enum(["standard", "high", "critical"]).default("standard"),
});

export const managerAssignmentConfirmationSchema = z.object({
  activityId: z.string().min(1, "Activity identifier is required"),
  confirmedAssignments: z.array(z.object({
    employeeId: z.string(),
    assignmentId: z.string(),
    confirmationNotes: z.string().optional(),
  })).min(1, "At least one assignment must be confirmed"),
  deploymentStrategy: z.enum(["immediate", "scheduled", "conditional"]).default("immediate"),
  notificationMethod: z.enum(["automated", "manual", "batch"]).default("automated"),
});

export const managerSkillAssessmentSchema = z.object({
  skillCategory: z.string().min(1, "Skill category is required"),
  assessmentType: z.enum(["individual", "team", "departmental"]).default("team"),
  targetProficiency: z.enum(["basic", "intermediate", "advanced", "expert"]).default("intermediate"),
  assessmentScope: z.string().min(10, "Assessment scope must be clearly defined"),
  evaluationCriteria: z.array(z.string()).min(1, "At least one evaluation criterion is required"),
});

export const managerPerformanceReviewSchema = z.object({
  reviewPeriod: z.string().min(1, "Review period is required"),
  reviewType: z.enum(["quarterly", "semiannual", "annual", "project"]).default("quarterly"),
  evaluationMetrics: z.array(z.string()).min(1, "At least one metric must be selected"),
  performanceThresholds: z.object({
    exceptional: z.number().min(80, "Exceptional threshold must be at least 80%"),
    satisfactory: z.number().min(60, "Satisfactory threshold must be at least 60%"),
    improvement: z.number().max(59, "Improvement threshold must be below 60%"),
  }),
  actionPlan: z.string().optional(),
});
