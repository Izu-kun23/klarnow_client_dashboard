'use client'

import { ProjectWithMergedPhases } from '@/types/project'
import InitializeProjectPrompt from './InitializeProjectPrompt'
import DashboardOverview from '@/components/dashboard/DashboardOverview'

interface HomePageContentProps {
  project: ProjectWithMergedPhases | null
}

export default function HomePageContent({ project }: HomePageContentProps) {
  return (
    <div className="min-h-full">
      {!project ? (
        <div className="p-6">
          <InitializeProjectPrompt />
        </div>
      ) : (
        <DashboardOverview project={project} />
      )}
    </div>
  )
}
