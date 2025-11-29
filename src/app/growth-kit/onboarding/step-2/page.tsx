'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMockAuth } from '@/hooks/useMockAuth'
import GrowthKitStep2Form from '@/components/growth-kit/onboarding/Step2Form'

export default function GrowthKitStep2Page() {
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

  // Get mock step data and check step locking
  const getMockStep = () => {
    const onboardingData = localStorage.getItem('onboarding_GROWTH')
    if (onboardingData) {
      const onboarding = JSON.parse(onboardingData)
      const steps = onboarding.steps || []
      const step1 = steps.find((s: any) => s.step_number === 1)
      const step2 = steps.find((s: any) => s.step_number === 2)
      
      // Step locking: Step 2 requires Step 1 to be DONE
      if (step1 && step1.status !== 'DONE') {
        return null // Signal that step is locked
      }
      
      return step2 || {
        id: 'step-2',
        step_number: 2,
        title: 'Clients, proof and content fuel',
        status: 'NOT_STARTED',
        required_fields_total: 9,
        required_fields_completed: 0,
        time_estimate: 'About 10 minutes',
        fields: null
      }
    }
    return null // No onboarding data means step is locked
  }

  const step = getMockStep()

  // If step is locked, show locked message
  if (!step) {
    return (
      <div className="min-h-screen bg-white py-8 transition-all duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl bg-white p-8 shadow-sm border border-red-200">
            <h2 className="text-xl font-semibold text-red-900 mb-4">
              Step 2 Locked
            </h2>
            <p className="text-base text-black mb-6">
              Please complete Step 1 first before accessing Step 2.
            </p>
            <button
              onClick={() => router.push('/growth-kit/onboarding/step-1')}
              className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition-all duration-200 hover:shadow-lg"
            >
              Go to Step 1
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <GrowthKitStep2Form project={null} step={step} />
  )
}

