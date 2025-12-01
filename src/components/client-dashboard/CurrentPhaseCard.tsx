'use client'

import { useState } from 'react'
import { MergedPhase, ProjectWithMergedPhases } from '@/types/project'
import ChecklistItem from './ChecklistItem'

interface CurrentPhaseCardProps {
  phase: MergedPhase
  project: ProjectWithMergedPhases
  onChecklistUpdate: (phaseId: string, label: string, isDone: boolean) => Promise<void>
}

export default function CurrentPhaseCard({
  phase,
  project,
  onChecklistUpdate
}: CurrentPhaseCardProps) {
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())

  const handleChecklistToggle = async (phaseId: string, label: string, isDone: boolean) => {
    const key = `${phaseId}-${label}`
    setUpdatingItems(prev => new Set(prev).add(key))
    
    try {
      // Optimistic update - the real-time subscription will handle the actual update
      await onChecklistUpdate(phaseId, label, isDone)
    } catch (error) {
      console.error('Error updating checklist item:', error)
      // Real-time subscription will revert on error
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  const getStatusBadge = () => {
    const statusConfig = {
      NOT_STARTED: { label: 'Not Started', color: 'bg-gray-100 text-gray-700', icon: '○' },
      IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: '⏱' },
      WAITING_ON_CLIENT: { label: 'Waiting on You', color: 'bg-amber-100 text-amber-700', icon: '⚠' },
      DONE: { label: 'Done', color: 'bg-green-100 text-green-700', icon: '✓' }
    }
    
    const config = statusConfig[phase.status]
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon} {config.label}
      </span>
    )
  }

  const completedCount = phase.checklist.filter(item => item.is_done).length
  const totalCount = phase.checklist.length

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      {/* Phase Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Phase {phase.phase_number}: {phase.title}
            </h3>
            {phase.subtitle && (
              <p className="text-sm text-gray-600">{phase.subtitle}</p>
            )}
          </div>
          {getStatusBadge()}
        </div>
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
          <span>{phase.day_range}</span>
          <span>•</span>
          <span>{completedCount} / {totalCount} tasks complete</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#8359ee] rounded-full transition-all duration-300"
            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-2 mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Checklist</h4>
        {phase.checklist.map((item) => (
          <ChecklistItem
            key={item.label}
            label={item.label}
            isDone={item.is_done}
            phaseId={phase.phase_id}
            onToggle={handleChecklistToggle}
            updating={updatingItems.has(`${phase.phase_id}-${item.label}`)}
          />
        ))}
      </div>

      {/* Phase Links */}
      {phase.links && phase.links.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Links</h4>
          <div className="space-y-2">
            {phase.links.map((link, index) => (
              <a
                key={index}
                href={link.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

