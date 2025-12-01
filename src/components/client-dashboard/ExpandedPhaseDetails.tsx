'use client'

import { MergedPhase, ProjectWithRelations, Project } from '@/types/project'
import ChecklistItem from './ChecklistItem'

interface ExpandedPhaseDetailsProps {
  phase: MergedPhase
  project: ProjectWithRelations | Project
  onClose: () => void
  onChecklistUpdate: (phaseId: string, label: string, isDone: boolean) => Promise<void>
  updatingItems: Set<string>
}

export default function ExpandedPhaseDetails({
  phase,
  project,
  onClose,
  onChecklistUpdate,
  updatingItems
}: ExpandedPhaseDetailsProps) {
  const completedItems = phase.checklist.filter(item => item.is_done).length
  const totalItems = phase.checklist.length
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  const handleChecklistToggle = async (phaseId: string, label: string, isDone: boolean) => {
    await onChecklistUpdate(phaseId, label, isDone)
  }

  return (
    <div className="border-t-2 border-gray-200 pt-12 pb-8 mt-12">
      <div className="space-y-10">
        {/* Phase Header */}
        <div className="pb-8 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Phase {phase.phase_number}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-400">{phase.day_range}</span>
              </div>
              <h2 className="text-3xl font-bold text-black mb-2">{phase.title}</h2>
              {phase.subtitle && (
                <p className="text-base text-gray-500 font-light">{phase.subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              aria-label="Close phase details"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Checklist */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-bold text-black mb-6">Checklist</h3>
            <div className="space-y-3">
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
            
            {/* Progress Bar */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  {completedItems} of {totalItems} tasks complete
                </span>
                <span className="text-sm font-semibold text-gray-900">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#8359ee] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Next Steps */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h4 className="text-sm font-bold text-black mb-4">Next Steps</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Next from Us</p>
                  <p className="text-sm text-gray-800">
                    {project.next_from_us || 'No updates from us yet.'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Next from You</p>
                  <p className="text-sm text-gray-800">
                    {project.next_from_you || 'Nothing for you to do right now.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Links */}
            {phase.links && phase.links.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h4 className="text-sm font-bold text-black mb-4">Links</h4>
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
        </div>
      </div>
    </div>
  )
}

