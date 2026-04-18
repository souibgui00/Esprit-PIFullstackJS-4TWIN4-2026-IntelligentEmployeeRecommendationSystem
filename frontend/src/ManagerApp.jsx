import { Routes, Route, Navigate } from "react-router-dom"
import { lazy, Suspense } from "react"
import { PortalLayout } from "../components/PortalLayout"

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

export default function ManagerApp() {
    return (
        <PortalLayout role="manager">
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route index element={<ManagerDashboardPage />} />
                    <Route path="employees" element={<ManagerTeamPage />} />
                    <Route path="skills" element={<ManagerSkillsPage />} />
                    <Route path="assignments" element={<ManagerAssignmentsPage />} />
                    <Route path="activities" element={<ManagerActivitiesPage />} />
                    <Route path="validation/:participationId" element={<ManagerValidationReportPage />} />

                    <Route path="program-analysis/:activityId" element={<ActivityDetailsView />} />
                    <Route path="program-enroll/:activityId" element={<ActivityEnrollmentView />} />
                    <Route path="activities/program-analysis/:activityId" element={<ActivityDetailsView />} />
                    <Route path="activities/program-enroll/:activityId" element={<ActivityEnrollmentView />} />
                    <Route path="evaluations" element={<ManagerEvaluationsPage />} />
                    <Route path="performance" element={<ManagerDashboardPage />} />
                    <Route path="profile" element={<ManagerProfilePage />} />
                    <Route path="*" element={<Navigate to="/manager" replace />} />
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
