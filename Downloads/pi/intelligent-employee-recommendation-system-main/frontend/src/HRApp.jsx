import { Routes, Route, Navigate } from "react-router-dom"
import { lazy, Suspense } from "react"
import { PortalLayout } from "@/components/PortalLayout"
import { EmployeeProfileRoutePage } from "@/components/employees/employee-profile-route-page"

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
const AdminEmployeeAddPage = lazy(() => import("../app/admin/employees/add-page"))
const AdminEmployeeEditPage = lazy(() => import("../app/admin/employees/edit-page"))
const AdminActivityAddPage = lazy(() => import("../app/admin/activities/add-page"))
const AdminActivityEditPage = lazy(() => import("../app/admin/activities/edit-page"))
const ActivityDetailsView = lazy(() => import("../app/manager/activities/ActivityDetailsView"))

function RouteLoader() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function withSuspense(element) {
  return <Suspense fallback={<RouteLoader />}>{element}</Suspense>
}

export default function HRApp() {
  return (
    <PortalLayout role="hr">
      <Routes>
        <Route index element={withSuspense(<AdminDashboardPage />)} />
        <Route path="employees" element={withSuspense(<HREmployeesPage />)} />
        <Route path="employees/:employeeId" element={<EmployeeProfileRoutePage rolePrefix="/hr" accentClass="text-orange-500" />} />
        <Route path="employees/add" element={withSuspense(<AdminEmployeeAddPage />)} />
        <Route path="employees/edit/:id" element={withSuspense(<AdminEmployeeEditPage />)} />
        <Route path="activities" element={withSuspense(<HRActivitiesPage />)} />
        <Route path="activities/new" element={withSuspense(<AdminActivityAddPage />)} />
        <Route path="activities/:id/edit" element={withSuspense(<AdminActivityEditPage />)} />
        <Route path="activities/details/:activityId" element={withSuspense(<ActivityDetailsView />)} />
        <Route path="departments" element={withSuspense(<AdminDepartmentsPage />)} />
        <Route path="skills" element={withSuspense(<AdminSkillsPage />)} />
        <Route path="skills/new" element={withSuspense(<AdminSkillAddPage />)} />
        <Route path="skills/:id/edit" element={withSuspense(<AdminSkillEditPage />)} />
        <Route path="skills/dashboard" element={withSuspense(<AdminGlobalSkillsDashboard />)} />
        <Route path="recommendations" element={withSuspense(<AdminRecommendationsPage />)} />
        <Route path="analytics" element={withSuspense(<AdminAnalyticsPage />)} />
        <Route path="profile" element={withSuspense(<AdminProfilePage />)} />
        <Route path="settings" element={withSuspense(<AdminSettingsPage />)} />
        <Route path="*" element={<Navigate to="/hr" replace />} />
      </Routes>
    </PortalLayout>
  )
}
