'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Phase } from '@/types/project'

interface BuildTrackerProps {
  phases: Phase[]
  project: { next_from_us: string | null; next_from_you: string | null }
}

export default function GrowthKitBuildTracker({ phases, project }: BuildTrackerProps) {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(() => {
    const activePhase = phases.find(p => p.status === 'IN_PROGRESS' || p.status === 'WAITING_ON_CLIENT')
    return activePhase ? activePhase.phase_number : null
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'IN_PROGRESS':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'WAITING_ON_CLIENT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DONE':
        return 'Done'
      case 'IN_PROGRESS':
        return 'In Progress'
      case 'WAITING_ON_CLIENT':
        return 'Waiting on You'
      default:
        return 'Not Started'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-black">Growth Kit – Build progress (14 days)</h1>
            </div>
            <Link
              href="/home"
              className="rounded-full border-2 border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-black hover:bg-gray-50 transition-all duration-200 hover:border-gray-400 hover:shadow-sm flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go to Dashboard
            </Link>
          </div>
        </div>

        {/* Phase Strip */}
        <div className="mb-8 flex flex-wrap gap-4">
          {phases.map((phase) => (
            <button
              key={phase.id}
              onClick={() => setExpandedPhase(expandedPhase === phase.phase_number ? null : phase.phase_number)}
              className={`flex-1 min-w-[200px] rounded-lg border-2 p-4 text-left transition-colors ${
                expandedPhase === phase.phase_number
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-black">Phase {phase.phase_number}</span>
                <span className={`rounded-full px-2 py-1 text-xs font-medium border ${getStatusColor(phase.status)}`}>
                  {getStatusLabel(phase.status)}
                </span>
              </div>
              <p className="text-base font-bold text-black mb-1">{phase.title}</p>
              <p className="text-sm text-black">{phase.day_range}</p>
            </button>
          ))}
        </div>

        {/* Expanded Phase Details */}
        {expandedPhase !== null && (
          <div className="rounded-lg bg-white p-8 shadow-md border border-gray-100">
            {(() => {
              const phase = phases.find(p => p.phase_number === expandedPhase)
              if (!phase) return null

              return (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-black mb-2">{phase.title}</h2>
                    <p className="text-lg text-black">{phase.subtitle}</p>
                    <p className="text-sm text-gray-600 mt-1">{phase.day_range}</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Checklist */}
                    <div className="lg:col-span-2">
                      <h3 className="text-lg font-bold text-black mb-4">Checklist</h3>
                      <div className="space-y-3">
                        {phase.checklist?.map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className={`flex h-6 w-6 items-center justify-center rounded border-2 ${
                              item.is_done 
                                ? 'bg-green-500 border-green-500' 
                                : 'border-gray-300 bg-white'
                            }`}>
                              {item.is_done && (
                                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-base ${item.is_done ? 'text-gray-500 line-through' : 'text-black'}`}>
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Links */}
                      {phase.links && phase.links.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-lg font-bold text-black mb-4">Links</h3>
                          <div className="space-y-2">
                            {phase.links.map((link) => (
                              <a
                                key={link.id}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-indigo-600 hover:text-indigo-700 font-medium"
                              >
                                {link.label} →
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Next From Us / You */}
                    <div className="space-y-6">
                      <div className="rounded-lg bg-blue-50 p-6 border-2 border-blue-100">
                        <h3 className="text-base font-bold text-black mb-3">Next from us</h3>
                        <p className="text-sm text-black leading-relaxed">
                          {project.next_from_us || 'No updates yet.'}
                        </p>
                      </div>

                      <div className="rounded-lg bg-green-50 p-6 border-2 border-green-100">
                        <h3 className="text-base font-bold text-black mb-3">Next from you</h3>
                        <p className="text-sm text-black leading-relaxed">
                          {project.next_from_you || 'Nothing for now.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

