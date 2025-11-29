'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMockAuth } from '@/hooks/useMockAuth'
import LaunchKitContent from '@/components/launch-kit/LaunchKitContent'

export default function LaunchKitPage() {
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
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated || user?.kitType !== 'LAUNCH') {
    return null
  }

  // Get mock project data from localStorage
  const getMockProject = () => {
    const onboardingData = localStorage.getItem('onboarding_LAUNCH')
    if (onboardingData) {
      const onboarding = JSON.parse(onboardingData)
      return {
        id: 'mock-project',
        user_id: 'mock-user',
        kit_type: 'LAUNCH' as const,
        onboarding_percent: onboarding.onboarding_percent || 0,
        current_day_of_14: null,
        next_from_us: null,
        next_from_you: null,
        onboarding_steps: onboarding.steps || [],
        phases: []
      }
    }
    return {
      id: 'mock-project',
      user_id: 'mock-user',
      kit_type: 'LAUNCH' as const,
      onboarding_percent: 0,
      current_day_of_14: null,
      next_from_us: null,
      next_from_you: null,
      onboarding_steps: [],
      phases: []
    }
  }

  const project = getMockProject()

  return <LaunchKitContent project={project} />
}

