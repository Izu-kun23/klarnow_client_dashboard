'use client'

import { MergedPhase } from '@/types/project'

interface AllPhasesOverviewProps {
  phases: MergedPhase[]
  currentPhaseId?: string
  onPhaseClick?: (phase: MergedPhase) => void
}

export default function AllPhasesOverview({
  phases,
  currentPhaseId,
  onPhaseClick
}: AllPhasesOverviewProps) {
  const getStatusIcon = (status: MergedPhase['status']) => {
    switch (status) {
      case 'NOT_STARTED':
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
            <span className="text-gray-400 text-xs">○</span>
          </div>
        )
      case 'IN_PROGRESS':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-blue-400 flex items-center justify-center">
            <span className="text-blue-600 text-xs">⏱</span>
          </div>
        )
      case 'WAITING_ON_CLIENT':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center">
            <span className="text-amber-600 text-xs">⚠</span>
          </div>
        )
      case 'DONE':
        return (
          <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-green-400 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">All Phases</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {phases.map((phase) => {
          const completedCount = phase.checklist.filter(item => item.is_done).length
          const totalCount = phase.checklist.length
          const isCurrent = phase.phase_id === currentPhaseId

          return (
            <div
              key={phase.phase_id}
              onClick={() => onPhaseClick?.(phase)}
              className={`
                border rounded-lg p-4 cursor-pointer transition-all
                ${isCurrent 
                  ? 'border-[#8359ee] border-2 bg-indigo-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }
              `}
            >
              <div className="flex items-center justify-between mb-3">
                {getStatusIcon(phase.status)}
                <span className="text-xs font-medium text-gray-500">
                  Phase {phase.phase_number}
                </span>
              </div>
              
              <h4 className="font-semibold text-gray-900 mb-1 text-sm">
                {phase.title}
              </h4>
              
              <p className="text-xs text-gray-500 mb-3">
                {phase.day_range}
              </p>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  {completedCount}/{totalCount} tasks
                </span>
                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#8359ee] rounded-full transition-all"
                    style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

