import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const getSkillTypeLabel = (type) => {
  switch (type) {
    case "knowledge": return "Knowledge"
    case "knowHow": return "Know-how"
    case "softSkill": return "Soft Skill"
    default: return type
  }
}

export const getActivityTypeLabel = (type) => {
  switch (type) {
    case "training": return "Training"
    case "workshop": return "Workshop"
    case "mentoring": return "Mentoring"
    case "webinar": return "Webinar"
    default: return type
  }
}

export const getStatusColor = (status) => {
  switch (status) {
    case "upcoming": return "bg-amber-500/10 text-amber-500"
    case "ongoing": return "bg-emerald-500/10 text-emerald-500"
    case "completed": return "bg-gray-100 text-gray-500"
    default: return "bg-gray-100 text-gray-500"
  }
}

export const getSkillLevelColor = (level) => {
  switch (level) {
    case "beginner": return "bg-blue-100 text-blue-700"
    case "intermediate": return "bg-green-100 text-green-700"
    case "advanced": return "bg-orange-100 text-orange-700"
    case "expert": return "bg-purple-100 text-purple-700"
    default: return "bg-gray-100 text-gray-700"
  }
}

export function getInitials(name) {
  if (!name) return "U"
  const parts = name.split(" ").filter(p => p.length > 0)
  if (parts.length === 0) return "U"
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
