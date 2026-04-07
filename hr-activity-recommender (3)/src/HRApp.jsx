import { Routes, Route, Navigate } from "react-router-dom"
import HREmployeesPage from "../app/hr/employees/page"
import HRActivitiesPage from "../app/hr/activities/page"
import AdminRecommendationsPage from "../app/admin/recommendations/page"
import AdminProfilePage from "../app/admin/profile/page"
import AdminSettingsPage from "../app/admin/settings/page"
import AdminAnalyticsPage from "../app/admin/analytics/page"
import AdminDepartmentsPage from "../app/admin/departments/page"
import AdminSkillsPage from "../app/admin/skills/page"
import AdminSkillAddPage from "../app/admin/skills/add-page"
import AdminSkillEditPage from "../app/admin/skills/edit-page"
import AdminGlobalSkillsDashboard from "../app/admin/skills/dashboard/page"
import AdminDashboardPage from "../app/hr/page"
import AdminEmployeeAddPage from "../app/admin/employees/add-page"
import AdminEmployeeEditPage from "../app/admin/employees/edit-page"
import AdminActivityAddPage from "../app/admin/activities/add-page"
import AdminActivityEditPage from "../app/admin/activities/edit-page"
import ActivityDetailsView from "../app/manager/activities/ActivityDetailsView"
import { PortalLayout } from "@/components/PortalLayout"

export default function HRApp() {
  return (
    <PortalLayout role="hr">
      <Routes>
        <Route index element={<AdminDashboardPage />} />
        <Route path="employees" element={<HREmployeesPage />} />
        <Route path="employees/add" element={<AdminEmployeeAddPage />} />
        <Route path="employees/edit/:id" element={<AdminEmployeeEditPage />} />
        <Route path="activities" element={<HRActivitiesPage />} />
        <Route path="activities/new" element={<AdminActivityAddPage />} />
        <Route path="activities/:id/edit" element={<AdminActivityEditPage />} />
        <Route path="activities/details/:activityId" element={<ActivityDetailsView />} />
        <Route path="departments" element={<AdminDepartmentsPage />} />
        <Route path="skills" element={<AdminSkillsPage />} />
        <Route path="skills/new" element={<AdminSkillAddPage />} />
        <Route path="skills/:id/edit" element={<AdminSkillEditPage />} />
        <Route path="skills/dashboard" element={<AdminGlobalSkillsDashboard />} />
        <Route path="recommendations" element={<AdminRecommendationsPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="*" element={<Navigate to="/hr" replace />} />
      </Routes>
    </PortalLayout>
  )
}
