'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Phase, ProjectWithRelations } from '@/types/project'

interface BuildTrackerProps {
  phases: Phase[]
  project: { next_from_us: string | null; next_from_you: string | null }
}

export default function LaunchKitBuildTracker({ phases, project }: BuildTrackerProps) {
  const router = useRouter()
  const [expandedPhase, setExpandedPhase] = useState<number | null>(() => {
    // Expand first IN_PROGRESS or WAITING_ON_CLIENT phase
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

  // Check if there's an active phase waiting on client
  const waitingOnClientPhase = phases.find(p => p.status === 'WAITING_ON_CLIENT')
  const inProgressPhase = phases.find(p => p.status === 'IN_PROGRESS')

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-black tracking-tight">
                Launch Kit – Build progress (14 days)
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Track your project progress through 4 phases. Click on any phase to see details.
              </p>
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

        {/* Action Banner - if waiting on client */}
        {waitingOnClientPhase && (
          <div className="mb-6 rounded-2xl bg-yellow-50 border-2 border-yellow-200/60 p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-600 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-black mb-1">
                  Action Required: {waitingOnClientPhase.title}
                </h3>
                <p className="text-base text-gray-700">
                  {project.next_from_you || 'Please check the phase details below for what we need from you.'}
                </p>
                <button
                  onClick={() => setExpandedPhase(waitingOnClientPhase.phase_number)}
                  className="mt-3 rounded-full bg-yellow-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-yellow-700 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  View Details →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Phase Strip */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {phases.map((phase, index) => (
            <button
              key={phase.id}
              onClick={() => setExpandedPhase(expandedPhase === phase.phase_number ? null : phase.phase_number)}
              className={`
                group relative overflow-hidden
                rounded-2xl border-2 p-5 text-left
                transition-all duration-300 ease-out
                animate-in fade-in slide-in-from-bottom-4
                ${
                  expandedPhase === phase.phase_number
                    ? 'border-indigo-500 bg-indigo-50 shadow-lg scale-[1.02]'
                    : phase.status === 'WAITING_ON_CLIENT'
                    ? 'border-yellow-300 bg-yellow-50/80 hover:border-yellow-400 hover:shadow-md'
                    : phase.status === 'IN_PROGRESS'
                    ? 'border-indigo-300 bg-white hover:border-indigo-400 hover:shadow-md'
                    : phase.status === 'DONE'
                    ? 'border-green-200 bg-green-50/50 hover:border-green-300 hover:shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }
              `}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Decorative overlay */}
              <div className="absolute inset-0 bg-white/40 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Phase {phase.phase_number}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all duration-200 ${getStatusColor(phase.status)}`}>
                    {getStatusLabel(phase.status)}
                  </span>
                </div>
                <p className="text-lg font-bold text-black mb-1">{phase.title}</p>
                <p className="text-sm text-gray-600">{phase.day_range}</p>
                
                {/* Click hint */}
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span>Click to {expandedPhase === phase.phase_number ? 'collapse' : 'expand'}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expandedPhase === phase.phase_number ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Expanded Phase Details */}
        {expandedPhase !== null && (
          <div className="rounded-2xl bg-white p-8 shadow-lg border-2 border-gray-200/60 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {(() => {
              const phase = phases.find(p => p.phase_number === expandedPhase)
              if (!phase) return null

              const hasActionNeeded = phase.status === 'WAITING_ON_CLIENT' && project.next_from_you

              return (
                <div className="space-y-6">
                  {/* Phase Header */}
                  <div className="pb-6 border-b border-gray-200/60">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h2 className="text-3xl font-bold text-black mb-2">{phase.title}</h2>
                        <p className="text-lg text-gray-700 mb-1">{phase.subtitle}</p>
                        <p className="text-sm text-gray-600">{phase.day_range}</p>
                      </div>
                      <button
                        onClick={() => setExpandedPhase(null)}
                        className="rounded-full p-2 hover:bg-gray-100 transition-colors duration-200"
                        aria-label="Close phase details"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Checklist */}
                    <div className="lg:col-span-2 space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Checklist
                        </h3>
                        <div className="space-y-3">
                          {phase.checklist?.map((item, index) => (
                            <div 
                              key={item.id} 
                              className="flex items-center gap-4 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors duration-200 animate-in fade-in slide-in-from-left-4"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                                item.is_done 
                                  ? 'bg-green-500 border-green-500 shadow-sm' 
                                  : 'border-gray-300 bg-white'
                              }`}>
                                {item.is_done && (
                                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span className={`text-base flex-1 ${item.is_done ? 'text-gray-500 line-through' : 'text-black font-medium'}`}>
                                {item.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Links */}
                      {phase.links && phase.links.length > 0 && (
                        <div className="rounded-xl bg-indigo-50/50 p-5 border border-indigo-200/50">
                          <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            Links
                          </h3>
                          <div className="space-y-2">
                            {phase.links.map((link) => (
                              <a
                                key={link.id}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 transition-all duration-200 hover:shadow-sm group"
                              >
                                <span>{link.label}</span>
                                <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Next From Us / You */}
                    <div className="space-y-4">
                      <div className={`rounded-2xl p-6 border-2 transition-all duration-300 ${
                        hasActionNeeded 
                          ? 'bg-yellow-50 border-yellow-300 shadow-md' 
                          : 'bg-blue-50 border-blue-200/60'
                      }`}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            hasActionNeeded ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          </div>
                          <h3 className="text-base font-bold text-black">Next from us</h3>
                        </div>
                        <p className="text-sm text-gray-900 leading-relaxed">
                          {project.next_from_us || 'No updates yet. We\'ll keep you posted!'}
                        </p>
                      </div>

                      <div className={`rounded-2xl p-6 border-2 transition-all duration-300 ${
                        hasActionNeeded
                          ? 'bg-green-50 border-green-300 shadow-md ring-2 ring-green-200/50'
                          : 'bg-green-50/80 border-green-200/60'
                      }`}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            hasActionNeeded ? 'bg-green-100 text-green-700' : 'bg-green-100/70 text-green-700'
                          }`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="text-base font-bold text-black">Next from you</h3>
                          {hasActionNeeded && (
                            <span className="ml-auto rounded-full bg-yellow-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                              Action Required
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-900 leading-relaxed mb-3">
                          {project.next_from_you || 'Nothing for now. We\'ll let you know when we need something!'}
                        </p>
                        {hasActionNeeded && (
                          <div className="mt-4 pt-4 border-t border-green-200">
                            <p className="text-xs font-semibold text-gray-700 mb-2">What to do:</p>
                            <p className="text-sm text-gray-900 leading-relaxed">
                              Please review the checklist items above and complete any actions needed. If you have questions, reach out to us!
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* Empty State - No phase expanded */}
        {expandedPhase === null && (
          <div className="rounded-2xl bg-white border-2 border-indigo-200/50 p-8 text-center animate-in fade-in duration-500">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-2">Select a Phase</h3>
              <p className="text-gray-600 mb-4">
                Click on any phase above to view details, checklist items, and what's needed next.
              </p>
              {inProgressPhase && (
                <button
                  onClick={() => setExpandedPhase(inProgressPhase.phase_number)}
                  className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  View Current Phase →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

