'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMockAuth } from '@/hooks/useMockAuth'
import GrowthKitBuildTracker from '@/components/growth-kit/BuildTracker'

export default function GrowthKitBuildTrackerPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useMockAuth()

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.kitType !== 'GROWTH')) {
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

  if (!isAuthenticated || user?.kitType !== 'GROWTH') {
    return null
  }

  // Get mock phases data
  const getMockPhases = () => {
    return [
      {
        id: 'phase-1',
        phase_number: 1,
        phase_id: 'PHASE_1',
        title: 'Strategy locked in',
        subtitle: 'Offer, goal and funnel map agreed.',
        day_range: 'Days 0-2',
        status: 'NOT_STARTED' as const,
        checklist: [
          { id: '1', label: 'Onboarding complete', is_done: false },
          { id: '2', label: 'Strategy / funnel call done', is_done: false },
          { id: '3', label: 'Main offer + 90 day goal confirmed', is_done: false },
          { id: '4', label: 'Simple funnel map agreed', is_done: false },
        ],
        links: []
      },
      {
        id: 'phase-2',
        phase_number: 2,
        phase_id: 'PHASE_2',
        title: 'Copy & email engine',
        subtitle: 'We write your site copy and 5 emails.',
        day_range: 'Days 3-5',
        status: 'NOT_STARTED' as const,
        checklist: [
          { id: '5', label: 'Draft website copy ready', is_done: false },
          { id: '6', label: 'Draft 5-email nurture sequence ready', is_done: false },
          { id: '7', label: 'You reviewed and approved copy', is_done: false },
          { id: '8', label: 'Any changes locked in', is_done: false },
        ],
        links: []
      },
      {
        id: 'phase-3',
        phase_number: 3,
        phase_id: 'PHASE_3',
        title: 'Build the funnel',
        subtitle: 'Pages, lead magnet and blog hub built.',
        day_range: 'Days 6-10',
        status: 'NOT_STARTED' as const,
        checklist: [
          { id: '9', label: '4-6 page site built on staging', is_done: false },
          { id: '10', label: 'Lead magnet page + thank you page built', is_done: false },
          { id: '11', label: 'Opt-in forms wired to email platform', is_done: false },
          { id: '12', label: 'Blog hub and 1-2 starter posts set up', is_done: false },
          { id: '13', label: 'Staging link shared', is_done: false },
        ],
        links: []
      },
      {
        id: 'phase-4',
        phase_number: 4,
        phase_id: 'PHASE_4',
        title: 'Test, launch & handover',
        subtitle: 'We test the full journey and go live.',
        day_range: 'Days 11-14',
        status: 'NOT_STARTED' as const,
        checklist: [
          { id: '14', label: 'Funnel tested from first visit to booked call', is_done: false },
          { id: '15', label: 'Domain connected', is_done: false },
          { id: '16', label: 'Tracking checked (Analytics / pixels)', is_done: false },
          { id: '17', label: '5-email sequence switched on', is_done: false },
          { id: '18', label: 'Loom walkthrough recorded and shared', is_done: false },
        ],
        links: []
      },
    ]
  }

  const phases = getMockPhases()

  const getMockProject = () => {
    return {
      next_from_us: null,
      next_from_you: null,
    }
  }

  const project = getMockProject()

  return <GrowthKitBuildTracker phases={phases} project={project} />
}

