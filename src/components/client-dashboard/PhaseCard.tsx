'use client'

import { MergedPhase } from '@/types/project'

interface PhaseCardProps {
  phase: MergedPhase
  isExpanded: boolean
  isLocked: boolean
  onClick: () => void
}

export default function PhaseCard({ phase, isExpanded, isLocked, onClick }: PhaseCardProps) {
  const completedItems = phase.checklist.filter(item => item.is_done).length
  const totalItems = phase.checklist.length
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  const getStatusColor = (status: MergedPhase['status']) => {
    switch (status) {
      case 'NOT_STARTED':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'WAITING_ON_CLIENT':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'DONE':
        return 'bg-green-100 text-green-700 border-green-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusLabel = (status: MergedPhase['status']) => {
    switch (status) {
      case 'NOT_STARTED':
        return 'Not Started'
      case 'IN_PROGRESS':
        return 'In Progress'
      case 'WAITING_ON_CLIENT':
        return 'Waiting on You'
      case 'DONE':
        return 'Done'
      default:
        return 'Not Started'
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={`
        group relative
        border border-[#8359ee]/20 border-b-2 border-b-[#8359ee] rounded-lg p-6 text-left
        transition-all duration-200 ease-out
        ${
          isLocked
            ? 'opacity-50 cursor-not-allowed bg-gray-50'
            : isExpanded
            ? 'bg-gray-50'
            : phase.status === 'WAITING_ON_CLIENT'
            ? 'bg-white hover:bg-yellow-50/20'
            : phase.status === 'IN_PROGRESS'
            ? 'bg-white hover:bg-[#8359ee]/5'
            : phase.status === 'DONE'
            ? 'bg-white hover:bg-green-50/20'
            : 'bg-white hover:bg-gray-50/50'
        }
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Phase {phase.phase_number}
        </span>
        {isLocked ? (
          <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-500 border border-gray-200">
            Locked
          </span>
        ) : (
          <span className={`text-xs font-medium px-2 py-1 rounded border ${getStatusColor(phase.status)}`}>
            {getStatusLabel(phase.status)}
          </span>
        )}
      </div>
      
      <h3 className="text-xl font-medium text-black mb-2 leading-tight">{phase.title}</h3>
      {phase.subtitle && (
        <p className="text-sm text-gray-500 mb-3 font-light">{phase.subtitle}</p>
      )}
      <p className="text-xs text-gray-400 mb-4">{phase.day_range}</p>
      
      {/* Progress indicator */}
      {totalItems > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-500">{completedItems}/{totalItems} tasks</span>
          </div>
          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#8359ee] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </button>
  )
}

