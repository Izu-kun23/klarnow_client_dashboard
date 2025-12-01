'use client'

import { ProjectWithMergedPhases } from '@/types/project'

interface ProjectOverviewProps {
  project: ProjectWithMergedPhases
}

export default function ProjectOverview({ project }: ProjectOverviewProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Overview</h2>
          <p className="text-sm text-gray-500 mt-1">
            {project.kit_type === 'LAUNCH' ? 'Launch Kit' : 'Growth Kit'}
          </p>
        </div>
        <div className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
          {project.kit_type}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Current Day */}
        {project.current_day_of_14 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Current Day</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              Day {project.current_day_of_14} of 14
            </p>
          </div>
        )}

        {/* Onboarding Progress */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Onboarding Progress</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${project.onboarding_percent}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900">
              {project.onboarding_percent}%
            </span>
          </div>
        </div>
      </div>

      {/* Next Actions */}
      <div className="mt-6 space-y-4">
        {project.next_from_us && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-1">Next from us</p>
            <p className="text-sm text-blue-700">{project.next_from_us}</p>
          </div>
        )}

        {project.next_from_you && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm font-medium text-amber-900 mb-1">Next from you</p>
            <p className="text-sm text-amber-700">{project.next_from_you}</p>
          </div>
        )}
      </div>
    </div>
  )
}

