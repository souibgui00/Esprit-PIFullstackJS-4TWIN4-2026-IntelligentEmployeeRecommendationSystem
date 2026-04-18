import { Routes, Route, Navigate } from "react-router-dom"
import { lazy, Suspense } from "react"
import { PortalLayout } from "../components/PortalLayout"

const HREmployeesPage = lazy(() => import("../app/hr/employees/page"))
const HRActivitiesPage = lazy(() => import("../app/hr/activities/page"))
const AdminRecommendationsPage = lazy(() => import("../app/admin/recommendations/page"))
const AdminProfilePage = lazy(() => import("../app/admin/profile/page"))
const AdminSettingsPage = lazy(() => import("../app/admin/settings/page"))
const AdminAnalyticsPage = lazy(() => import("../app/admin/analytics/page"))
const AdminDepartmentsPage = lazy(() => import("../app/admin/departments/page"))
const AdminSkillsPage = lazy(() => import("../app/admin/skills/page"))
const AdminSkillAddPage = lazy(() => import("../app/admin/skills/add-page"))
const AdminSkillEditPage = lazy(() => import("../app/admin/skills/edit-page"))
const AdminGlobalSkillsDashboard = lazy(() => import("../app/admin/skills/dashboard/page"))
const AdminDashboardPage = lazy(() => import("../app/hr/page"))
const HREvaluationsPage = lazy(() => import("../app/manager/evaluations/page"))
const AdminEmployeeAddPage = lazy(() => import("../app/admin/employees/add-page"))
const AdminEmployeeEditPage = lazy(() => import("../app/admin/employees/edit-page"))
const EmployeeProfileViewPage = lazy(() => import("../app/admin/employees/profile-page"))
const AdminActivityAddPage = lazy(() => import("../app/admin/activities/add-page"))
const AdminActivityEditPage = lazy(() => import("../app/admin/activities/edit-page"))
const ActivityDetailsView = lazy(() => import("../app/manager/activities/ActivityDetailsView"))

export default function HRApp() {
  return (
    <PortalLayout role="hr">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index element={<AdminDashboardPage />} />
          <Route path="employees" element={<HREmployeesPage />} />
          <Route path="employees/add" element={<AdminEmployeeAddPage />} />
          <Route path="employees/edit/:id" element={<AdminEmployeeEditPage />} />
          <Route path="employees/profile/:id" element={<EmployeeProfileViewPage />} />
          <Route path="activities" element={<HRActivitiesPage />} />
          <Route path="activities/new" element={<AdminActivityAddPage />} />
          <Route path="activities/:id/edit" element={<AdminActivityEditPage />} />
          <Route path="activities/details/:activityId" element={<ActivityDetailsView />} />
          <Route path="evaluations" element={<HREvaluationsPage />} />
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
