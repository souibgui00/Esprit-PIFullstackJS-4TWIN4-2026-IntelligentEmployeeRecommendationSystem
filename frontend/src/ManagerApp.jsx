import { Routes, Route, Navigate } from "react-router-dom"
import { lazy, Suspense } from "react"
import { PortalLayout } from "@/components/PortalLayout"

const ManagerDashboardPage = lazy(() => import("../app/manager/page"))
const ManagerSkillsPage = lazy(() => import("../app/manager/skills/page"))
const ManagerTeamPage = lazy(() => import("../app/manager/team/page"))
const ManagerAssignmentsPage = lazy(() => import("../app/manager/assignments/page"))
const ManagerActivitiesPage = lazy(() => import("../app/manager/activities/page"))
const ActivityDetailsView = lazy(() => import("../app/manager/activities/ActivityDetailsView"))
const ActivityEnrollmentView = lazy(() => import("../app/manager/activities/ActivityEnrollmentView"))
const ManagerEvaluationsPage = lazy(() => import("../app/manager/evaluations/page"))
const ManagerProfilePage = lazy(() => import("../app/manager/profile/page"))
const ManagerValidationReportPage = lazy(() => import("../app/manager/validation/[participationId]/page"))

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

export default function ManagerApp() {
    return (
        <PortalLayout role="manager">
            <Routes>
                <Route index element={withSuspense(<ManagerDashboardPage />)} />
                <Route path="employees" element={withSuspense(<ManagerTeamPage />)} />
                <Route path="skills" element={withSuspense(<ManagerSkillsPage />)} />
                <Route path="assignments" element={withSuspense(<ManagerAssignmentsPage />)} />
                <Route path="activities" element={withSuspense(<ManagerActivitiesPage />)} />
                <Route path="validation/:participationId" element={withSuspense(<ManagerValidationReportPage />)} />

                <Route path="program-analysis/:activityId" element={withSuspense(<ActivityDetailsView />)} />
                <Route path="program-enroll/:activityId" element={withSuspense(<ActivityEnrollmentView />)} />
                <Route path="activities/program-analysis/:activityId" element={withSuspense(<ActivityDetailsView />)} />
                <Route path="activities/program-enroll/:activityId" element={withSuspense(<ActivityEnrollmentView />)} />
                <Route path="evaluations" element={withSuspense(<ManagerEvaluationsPage />)} />
                <Route path="performance" element={withSuspense(<ManagerDashboardPage />)} />
                <Route path="profile" element={withSuspense(<ManagerProfilePage />)} />
                <Route path="*" element={<Navigate to="/manager" replace />} />
            </Routes>
        </PortalLayout>
    )
}
