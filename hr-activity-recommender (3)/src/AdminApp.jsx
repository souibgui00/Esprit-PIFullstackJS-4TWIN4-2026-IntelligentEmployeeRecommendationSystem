import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import AdminEmployeesPage from "../app/admin/employees/page"
import AdminEmployeeAddPage from "../app/admin/employees/add-page"
import AdminEmployeeEditPage from "../app/admin/employees/edit-page"
import AdminRecommendationsPage from "../app/admin/recommendations/page"
import AdminActivitiesPage from "../app/admin/activities/page"
import AdminActivityAddPage from "../app/admin/activities/add-page"
import AdminActivityEditPage from "../app/admin/activities/edit-page"
import AdminSkillsPage from "../app/admin/skills/page"
import AdminSkillAddPage from "../app/admin/skills/add-page"
import AdminSkillEditPage from "../app/admin/skills/edit-page"
import AdminGlobalSkillsDashboard from "../app/admin/skills/dashboard/page"
import AdminSettingsPage from "../app/admin/settings/page"
import AdminAnalyticsPage from "../app/admin/analytics/page"
import AdminDashboardPage from "../app/admin/page"
import AdminProfilePage from "../app/admin/profile/page"
import AdminDepartmentsPage from "../app/admin/departments/page"
import AdminEvaluationsPage from "../app/admin/evaluations/page"
import AdminAuditLogsPage from "../app/admin/audit/page"
import ActivityDetailsView from "../app/manager/activities/ActivityDetailsView"
import { PortalLayout } from "@/components/PortalLayout"

export default function AdminApp() {
  const { pathname } = useLocation()
  const role = pathname.startsWith("/hr") ? "hr" : "admin"
  return (
    <PortalLayout role={role}>
      <Routes>
        <Route index element={<AdminDashboardPage />} />
        <Route path="employees" element={<AdminEmployeesPage />} />
        <Route path="employees/add" element={<AdminEmployeeAddPage />} />
        <Route path="employees/edit/:id" element={<AdminEmployeeEditPage />} />
        <Route path="departments" element={<AdminDepartmentsPage />} />
        <Route path="skills" element={<AdminSkillsPage />} />
        <Route path="skills/new" element={<AdminSkillAddPage />} />
        <Route path="skills/:id/edit" element={<AdminSkillEditPage />} />
        <Route path="skills/dashboard" element={<AdminGlobalSkillsDashboard />} />
        <Route path="activities" element={<AdminActivitiesPage />} />
        <Route path="activities/new" element={<AdminActivityAddPage />} />
        <Route path="activities/:id/edit" element={<AdminActivityEditPage />} />
        <Route path="activities/details/:activityId" element={<ActivityDetailsView />} />
        <Route 
          path="recommendations" 
          element={role === "hr" ? <AdminRecommendationsPage /> : <Navigate to="/admin" replace />} 
        />
        <Route path="profile" element={<AdminProfilePage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="evaluations" element={<AdminEvaluationsPage />} />
        <Route path="audit" element={<AdminAuditLogsPage />} />
        <Route path="*" element={<Navigate to={`/${role}`} replace />} />
      </Routes>
    </PortalLayout>
  )
}
