'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMockAuth } from '@/hooks/useMockAuth'
import LaunchKitBuildTracker from '@/components/launch-kit/BuildTracker'

export default function LaunchKitBuildTrackerPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useMockAuth()

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.kitType !== 'LAUNCH')) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, user, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-black font-medium">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated || user?.kitType !== 'LAUNCH') {
    return null
  }

  // Get mock phases data
  const getMockPhases = () => {
    return [
      {
        id: 'phase-1',
        phase_number: 1,
        phase_id: 'PHASE_1',
        title: 'Inputs & clarity',
        subtitle: 'Lock the message and plan.',
        day_range: 'Days 0-2',
        status: 'NOT_STARTED' as const,
        checklist: [
          { id: '1', label: 'Onboarding steps completed', is_done: false },
          { id: '2', label: 'Brand / strategy call completed', is_done: false },
          { id: '3', label: 'Simple 14 day plan agreed', is_done: false },
        ],
        links: []
      },
      {
        id: 'phase-2',
        phase_number: 2,
        phase_id: 'PHASE_2',
        title: 'Words that sell',
        subtitle: 'We write your 3 pages.',
        day_range: 'Days 3-5',
        status: 'NOT_STARTED' as const,
        checklist: [
          { id: '4', label: 'Draft homepage copy ready', is_done: false },
          { id: '5', label: 'Draft offer / services page ready', is_done: false },
          { id: '6', label: 'Draft contact / about copy ready', is_done: false },
          { id: '7', label: 'You reviewed and approved copy', is_done: false },
        ],
        links: []
      },
      {
        id: 'phase-3',
        phase_number: 3,
        phase_id: 'PHASE_3',
        title: 'Design & build',
        subtitle: 'We turn copy into a 3 page site.',
        day_range: 'Days 6-10',
        status: 'NOT_STARTED' as const,
        checklist: [
          { id: '8', label: 'Site layout built for all 3 pages', is_done: false },
          { id: '9', label: 'Mobile checks done', is_done: false },
          { id: '10', label: 'Testimonials and proof added', is_done: false },
          { id: '11', label: 'Staging link shared with you', is_done: false },
        ],
        links: []
      },
      {
        id: 'phase-4',
        phase_number: 4,
        phase_id: 'PHASE_4',
        title: 'Test & launch',
        subtitle: 'We connect domain, test and go live.',
        day_range: 'Days 11-14',
        status: 'NOT_STARTED' as const,
        checklist: [
          { id: '12', label: 'Forms tested', is_done: false },
          { id: '13', label: 'Domain connected', is_done: false },
          { id: '14', label: 'Final tweaks applied', is_done: false },
          { id: '15', label: 'Loom walkthrough recorded and shared', is_done: false },
        ],
        links: []
      },
    ]
  }

  const phases = getMockPhases()

  // Get project data for next_from_us and next_from_you
  const getMockProject = () => {
    return {
      next_from_us: null,
      next_from_you: null,
    }
  }

  const project = getMockProject()

  return <LaunchKitBuildTracker phases={phases} project={project} />
}
