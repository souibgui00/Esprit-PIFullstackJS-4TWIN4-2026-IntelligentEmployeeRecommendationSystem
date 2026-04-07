import { Routes, Route, Navigate } from "react-router-dom"
import { PortalLayout } from "@/components/PortalLayout"
import ManagerDashboardPage from "../app/manager/page"
import ManagerSkillsPage from "../app/manager/skills/page"
import ManagerTeamPage from "../app/manager/team/page"
import ManagerAssignmentsPage from "../app/manager/assignments/page"
import ManagerActivitiesPage from "../app/manager/activities/page"
import ActivityDetailsView from "../app/manager/activities/ActivityDetailsView"
import ActivityEnrollmentView from "../app/manager/activities/ActivityEnrollmentView"
import ManagerEvaluationsPage from "../app/manager/evaluations/page"
import ManagerProfilePage from "../app/manager/profile/page"
import ManagerValidationReportPage from "../app/manager/validation/[participationId]/page"

export default function ManagerApp() {
    return (
        <PortalLayout role="manager">
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
        </PortalLayout>
    )
}
