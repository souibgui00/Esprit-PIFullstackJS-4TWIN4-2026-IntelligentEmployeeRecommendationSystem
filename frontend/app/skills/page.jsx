"use client"

import { useState } from "react"
import { Sidebar } from "/components/dashboard/sidebar"
import { Header } from "/components/dashboard/header"
import { SkillsGrid } from "/components/skills/skills-grid"
import { SkillDetail } from "/components/skills/skill-detail"
import { Button } from "/components/ui/button"
import { Plus } from "lucide-react"


export default function SkillsPage() {
  const [selectedSkill, setSelectedSkill] = useState(null)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 transition-all duration-300 min-h-screen flex flex-col">
        <Header
          title="Skills"
          description="Define and manage organizational skills"
        />
        <div className="p-4 md:p-6 flex-1 min-h-0">
          <div className="mb-4 md:mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base md:text-lg font-semibold text-foreground">Skill Library</h2>
              <p className="text-xs md:text-sm text-muted-foreground">
                Knowledge, know-how, and soft skills across your organization
              </p>
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Skill
            </Button>
          </div>

          <div className="grid gap-4 md:gap-6 lg:grid-cols-3 min-h-0">
            <div className={selectedSkill ? "lg:col-span-2" : "lg:col-span-3"}>
              <SkillsGrid onSelectSkill={setSelectedSkill} />
            </div>
            
            {selectedSkill && (
              <div className="lg:col-span-1 min-h-0 lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto custom-scrollbar pr-1">
                <SkillDetail
                  skill={selectedSkill}
                  onClose={() => setSelectedSkill(null)}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}



