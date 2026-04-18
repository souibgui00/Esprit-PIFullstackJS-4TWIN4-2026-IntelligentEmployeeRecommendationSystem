import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { lazy, Suspense } from "react"
import { PortalLayout } from "../components/PortalLayout"

const AdminEmployeesPage = lazy(() => import("../app/admin/employees/page"))
const AdminEmployeeAddPage = lazy(() => import("../app/admin/employees/add-page"))
const AdminEmployeeEditPage = lazy(() => import("../app/admin/employees/edit-page"))
const EmployeeProfileViewPage = lazy(() => import("../app/admin/employees/profile-page"))
const AdminRecommendationsPage = lazy(() => import("../app/admin/recommendations/page"))
const AdminActivitiesPage = lazy(() => import("../app/admin/activities/page"))
const AdminActivityAddPage = lazy(() => import("../app/admin/activities/add-page"))
const AdminActivityEditPage = lazy(() => import("../app/admin/activities/edit-page"))
const AdminSkillsPage = lazy(() => import("../app/admin/skills/page"))
const AdminSkillAddPage = lazy(() => import("../app/admin/skills/add-page"))
const AdminSkillEditPage = lazy(() => import("../app/admin/skills/edit-page"))
const AdminGlobalSkillsDashboard = lazy(() => import("../app/admin/skills/dashboard/page"))
const AdminEvaluationsPage = lazy(() => import("../app/manager/evaluations/page"))
const AdminSettingsPage = lazy(() => import("../app/admin/settings/page"))
const AdminAnalyticsPage = lazy(() => import("../app/admin/analytics/page"))
const AdminDashboardPage = lazy(() => import("../app/admin/page"))
const AdminProfilePage = lazy(() => import("../app/admin/profile/page"))
const AdminDepartmentsPage = lazy(() => import("../app/admin/departments/page"))
const AdminAuditLogsPage = lazy(() => import("../app/admin/audit/page"))
const ActivityDetailsView = lazy(() => import("../app/manager/activities/ActivityDetailsView"))

export default function AdminApp() {
  const { pathname } = useLocation()
  const role = pathname.startsWith("/hr") ? "hr" : "admin"
  return (
    <PortalLayout role={role}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index element={<AdminDashboardPage />} />
          <Route path="employees" element={<AdminEmployeesPage />} />
          <Route path="employees/add" element={<AdminEmployeeAddPage />} />
          <Route path="employees/edit/:id" element={<AdminEmployeeEditPage />} />
          <Route path="employees/profile/:id" element={<EmployeeProfileViewPage />} />
          <Route path="departments" element={<AdminDepartmentsPage />} />
          <Route path="skills" element={<AdminSkillsPage />} />
          <Route path="skills/new" element={<AdminSkillAddPage />} />
          <Route path="skills/:id/edit" element={<AdminSkillEditPage />} />
          <Route path="skills/dashboard" element={<AdminGlobalSkillsDashboard />} />
          <Route path="activities" element={<AdminActivitiesPage />} />
          <Route path="activities/new" element={<AdminActivityAddPage />} />
          <Route path="activities/:id/edit" element={<AdminActivityEditPage />} />
          <Route path="activities/details/:activityId" element={<ActivityDetailsView />} />
          <Route path="evaluations" element={<AdminEvaluationsPage />} />
          <Route 
            path="recommendations" 
            element={role === "hr" ? <AdminRecommendationsPage /> : <Navigate to="/admin" replace />} 
          />
          <Route path="profile" element={<AdminProfilePage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="audit" element={<AdminAuditLogsPage />} />

          <Route path="*" element={<Navigate to={`/${role}`} replace />} />
        </Routes>
      </Suspense>
    </PortalLayout>
  )
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
