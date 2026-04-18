"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "/components/dashboard/sidebar"
import { Header } from "/components/dashboard/header"
import { ActivityList } from "/components/activities/activity-list"
import { ActivityDetail } from "/components/activities/activity-detail"
import { Button } from "/components/ui/button"
import { Plus } from "lucide-react"


export default function ActivitiesPage() {
  const [selectedActivity, setSelectedActivity] = useState(null)
  const router = useRouter()

  const handleGetRecommendations = () => {
    if (selectedActivity) {
      router.push(`/recommendations?activityId=${selectedActivity.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 transition-all duration-300 min-h-screen flex flex-col">
        <Header
          title="Activities"
          description="Manage trainings, certifications, projects, and missions"
        />
        <div className="p-4 md:p-6 flex-1 min-h-0">
          <div className="mb-4 md:mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base md:text-lg font-semibold text-foreground">Activity Catalog</h2>
              <p className="text-xs md:text-sm text-muted-foreground">
                Create and manage organizational activities
              </p>
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Create Activity
            </Button>
          </div>

          <div className="grid gap-4 md:gap-6 lg:grid-cols-3 min-h-0">
            <div className={selectedActivity ? "lg:col-span-2" : "lg:col-span-3"}>
              <ActivityList onSelectActivity={setSelectedActivity} />
            </div>
            
            {selectedActivity && (
              <div className="lg:col-span-1 min-h-0 lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto custom-scrollbar pr-1">
                <ActivityDetail
                  activity={selectedActivity}
                  onClose={() => setSelectedActivity(null)}
                  onGetRecommendations={handleGetRecommendations}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}



