'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMockAuth } from '@/hooks/useMockAuth'
import GrowthKitStep1Form from '@/components/growth-kit/onboarding/Step1Form'

export default function GrowthKitStep1Page() {
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

  const getMockStep = () => {
    const onboardingData = localStorage.getItem('onboarding_GROWTH')
    if (onboardingData) {
      const onboarding = JSON.parse(onboardingData)
      return onboarding.steps?.find((s: any) => s.step_number === 1)
    }
    return {
      id: 'step-1',
      step_number: 1,
      title: 'Snapshot and main offer',
      status: 'NOT_STARTED',
      required_fields_total: 12,
      required_fields_completed: 0,
      time_estimate: 'About 8 minutes',
      fields: null
    }
  }

  const step = getMockStep()

  return <GrowthKitStep1Form project={null} step={step} />
}

