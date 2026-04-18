import { Routes, Route, Navigate } from "react-router-dom"
import { useMemo, useEffect, useState, lazy, Suspense } from "react"
import { Trophy, TrendingUp, CheckCircle2, Loader2, Star } from "lucide-react"

const EmployeeHome = lazy(() => import("../app/employee/page"))
const EmployeeActivitiesPage = lazy(() => import("../app/employee/activities/page"))
const EmployeeRecommendationsPage = lazy(() => import("../app/employee/recommendations/page"))
const EmployeeProfilePage = lazy(() => import("../app/employee/profile/page"))
const EmployeeHubPage = lazy(() => import("../app/employee/hub/page"))

import { PortalLayout } from "../components/PortalLayout"
import { Badge } from "../components/ui/badge"
import { useData } from "../lib/data-store"
import { useAuth } from "../lib/auth-context"

export default function EmployeeApp() {
  return (
    <PortalLayout role="employee">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index element={<EmployeeHome />} />
          <Route path="hub" element={<EmployeeHubPage />} />
          <Route path="activities" element={<EmployeeActivitiesPage />} />
          <Route path="recommendations" element={<EmployeeRecommendationsPage />} />
          <Route path="profile" element={<EmployeeProfilePage />} />
          <Route path="progress" element={<EmployeeProgress />} />
          <Route path="*" element={<Navigate to="/employee" replace />} />
        </Routes>
      </Suspense>
    </PortalLayout>
  )
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
    </div>
  )
}

function EmployeeProgress() {
  const { user } = useAuth()
  const { participations = [], loading, fetchCombinedScore } = useData()
  const [scoreData, setScoreData] = useState(null)

  useEffect(() => {
    if (user?.userId || user?.id) {
       fetchCombinedScore(user?.userId || user?.id).then(data => {
          if (data) setScoreData(data)
       })
    }
  }, [user, fetchCombinedScore])

  // Business logic: 1 badge per completed activity
  const stats = useMemo(() => {
    const list = Array.isArray(participations) ? participations : []
    const completed = list.filter(p => p.status === 'completed' || p.progress === 100)
    
    return {
      badges: completed.length,
      points: scoreData ? Math.round(scoreData.combinedScore) : completed.length * 400,
      completed
    }
  }, [participations, scoreData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-transparent min-h-screen pb-24 font-sans">
      {/* Immersive Achievement Hero */}
      <div className="mesh-gradient-premium pt-32 pb-48 px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#F28C1B]/10 rounded-full blur-[140px] -mr-96 -mt-96 animate-float"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#1E5FA8]/5 rounded-full blur-[100px] -ml-24 -mb-24 animate-float"></div>

        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark border-white/10 text-orange-400 text-[10px] font-black tracking-[0.3em] mb-4 shimmer-sweep">
              <Trophy className="w-4 h-4" />
              Achievements
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight tracking-tight">
              Your <span className="text-[#F28C1B]">Progress.</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium max-w-xl">
              Track your growth through the platform and celebrate your professional contributions.
            </p>
          </div>
          
          <div className="flex gap-6">
            <div className="glass-dark px-10 py-6 rounded-3xl border-white/5 text-center">
              <p className="text-[#F28C1B] text-3xl font-black tracking-tighter">{stats.badges}</p>
              <p className="text-[10px] text-white/30 font-bold tracking-widest mt-1">Badges</p>
            </div>
            <div className="glass-dark px-10 py-6 rounded-3xl border-white/5 text-center">
              <p className="text-white text-3xl font-black tracking-tighter">{stats.points}</p>
              <p className="text-[10px] text-white/30 font-bold tracking-widest mt-1">Combined score</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-8 -mt-24 pb-24 relative z-20 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <div className="card-premium p-12 bg-white border-none shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
                <Trophy className="w-32 h-32" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Learning History</h2>
              <p className="text-slate-500 mb-12">Verified records of your professional development</p>
              
              {stats.completed.length === 0 ? (
                <div className="py-24 text-center space-y-6">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                  <p className="text-slate-400 font-bold tracking-widest text-xs">No completed activities yet.</p>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto font-medium">Enroll in a program and finish your first module to initialize your activity log.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {stats.completed.map(participation => (
                    <div key={participation._id || participation.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{participation.activityId?.title || ""}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(participation.lastUpdated || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500 text-white">Completed</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="card-premium p-8 bg-white border-none shadow-sm">
                <h3 className="text-sm font-black text-slate-400 tracking-widest mb-6 border-b border-slate-50 pb-4">Recent awards</h3>
                {stats.badges > 0 ? (
                   <div className="grid grid-cols-2 gap-4">
                      {stats.completed.slice(0, 4).map((_, i) => (
                        <div key={i} className="aspect-square bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100">
                           <Trophy className="w-8 h-8 text-orange-500" />
                        </div>
                      ))}
                   </div>
                ) : (
                  <div className="py-12 text-center italic text-slate-300 text-xs font-medium">
                    Awards appear as you complete certifications.
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

