'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMockAuth } from '@/hooks/useMockAuth'
import LaunchKitStep1Form from '@/components/launch-kit/onboarding/Step1Form'

export default function LaunchKitStep1Page() {
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

  // Get mock step data
  const getMockStep = () => {
    const onboardingData = localStorage.getItem('onboarding_LAUNCH')
    if (onboardingData) {
      const onboarding = JSON.parse(onboardingData)
      return onboarding.steps?.find((s: any) => s.step_number === 1)
    }
    return {
      id: 'step-1',
      step_number: 1,
      title: 'Tell us who you are',
      status: 'NOT_STARTED',
      required_fields_total: 7,
      required_fields_completed: 0,
      time_estimate: 'About 5 minutes',
      fields: null
    }
  }

  const step = getMockStep()

  return <LaunchKitStep1Form project={null} step={step} />
}

