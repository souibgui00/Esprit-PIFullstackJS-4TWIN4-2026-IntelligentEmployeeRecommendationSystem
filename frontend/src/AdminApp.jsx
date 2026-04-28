import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { lazy, Suspense } from "react"
import { PortalLayout } from "@/components/PortalLayout"
import { EmployeeProfileRoutePage } from "@/components/employees/employee-profile-route-page"

const AdminEmployeesPage = lazy(() => import("../app/admin/employees/page"))
const AdminEmployeeAddPage = lazy(() => import("../app/admin/employees/add-page"))
const AdminEmployeeEditPage = lazy(() => import("../app/admin/employees/edit-page"))
const AdminRecommendationsPage = lazy(() => import("../app/admin/recommendations/page"))
const AdminActivitiesPage = lazy(() => import("../app/admin/activities/page"))
const AdminActivityAddPage = lazy(() => import("../app/admin/activities/add-page"))
const AdminActivityEditPage = lazy(() => import("../app/admin/activities/edit-page"))
const AdminSkillsPage = lazy(() => import("../app/admin/skills/page"))
const AdminSkillAddPage = lazy(() => import("../app/admin/skills/add-page"))
const AdminSkillEditPage = lazy(() => import("../app/admin/skills/edit-page"))
const AdminGlobalSkillsDashboard = lazy(() => import("../app/admin/skills/dashboard/page"))
const AdminSettingsPage = lazy(() => import("../app/admin/settings/page"))
const AdminAnalyticsPage = lazy(() => import("../app/admin/analytics/page"))
const AdminDashboardPage = lazy(() => import("../app/admin/page"))
const AdminProfilePage = lazy(() => import("../app/admin/profile/page"))
const AdminDepartmentsPage = lazy(() => import("../app/admin/departments/page"))
const AdminAuditLogsPage = lazy(() => import("../app/admin/audit/page"))
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

export default function AdminApp() {
  const { pathname } = useLocation()
  const role = pathname.startsWith("/hr") ? "hr" : "admin"
  return (
    <PortalLayout role={role}>
      <Routes>
        <Route index element={withSuspense(<AdminDashboardPage />)} />
        <Route path="employees" element={withSuspense(<AdminEmployeesPage />)} />
        <Route path="employees/:employeeId" element={<EmployeeProfileRoutePage rolePrefix="/admin" accentClass="text-primary" />} />
        <Route path="employees/add" element={withSuspense(<AdminEmployeeAddPage />)} />
        <Route path="employees/edit/:id" element={withSuspense(<AdminEmployeeEditPage />)} />
        <Route path="departments" element={withSuspense(<AdminDepartmentsPage />)} />
        <Route path="skills" element={withSuspense(<AdminSkillsPage />)} />
        <Route path="skills/new" element={withSuspense(<AdminSkillAddPage />)} />
        <Route path="skills/:id/edit" element={withSuspense(<AdminSkillEditPage />)} />
        <Route path="skills/dashboard" element={withSuspense(<AdminGlobalSkillsDashboard />)} />
        <Route path="activities" element={withSuspense(<AdminActivitiesPage />)} />
        <Route path="activities/new" element={withSuspense(<AdminActivityAddPage />)} />
        <Route path="activities/:id/edit" element={withSuspense(<AdminActivityEditPage />)} />
        <Route path="activities/details/:activityId" element={withSuspense(<ActivityDetailsView />)} />
        <Route 
          path="recommendations" 
          element={role === "hr" ? withSuspense(<AdminRecommendationsPage />) : <Navigate to="/admin" replace />} 
        />
        <Route path="profile" element={withSuspense(<AdminProfilePage />)} />
        <Route path="settings" element={withSuspense(<AdminSettingsPage />)} />
        <Route path="analytics" element={withSuspense(<AdminAnalyticsPage />)} />
        <Route path="audit" element={withSuspense(<AdminAuditLogsPage />)} />

        <Route path="*" element={<Navigate to={`/${role}`} replace />} />
      </Routes>
    </PortalLayout>
  )
}
