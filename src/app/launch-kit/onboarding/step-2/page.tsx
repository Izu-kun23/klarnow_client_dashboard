'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useMockAuth } from '@/hooks/useMockAuth'
import LaunchKitStep2Form from '@/components/launch-kit/onboarding/Step2Form'
import { checkOnboardingComplete } from '@/utils/onboarding-check'

export default function LaunchKitStep2Page() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading } = useMockAuth()
  const hasRedirected = useRef(false)

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) {
      return
    }
    
    if (!isLoading) {
      if (!isAuthenticated) {
        // Only redirect if not already on login page
        if (pathname !== '/') {
          hasRedirected.current = true
          router.push('/')
        }
        return
      }
      // Check database to see if client exists (onboarding complete)
      if (user?.email) {
        checkOnboardingComplete(user.email).then(isComplete => {
          if (isComplete || user?.onboarding_finished === true) {
            hasRedirected.current = true
            router.push('/home')
          }
        })
        return
      }
      
      // Check both kitType and kit_type for compatibility
      const userKitType = user?.kitType || user?.kit_type
      if (userKitType && userKitType !== 'LAUNCH') {
        // Redirect to correct kit's onboarding only if not already there
        const correctPath = userKitType === 'GROWTH'
          ? '/growth-kit/onboarding/step-1'
          : '/'
        if (pathname !== correctPath) {
          hasRedirected.current = true
          router.push(correctPath)
        }
      }
    }
  }, [isAuthenticated, isLoading, user, router, pathname])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-black font-medium">Loading...</div>
      </div>
    )
  }

  // Wait for user to be loaded before checking kitType
  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-black font-medium">Loading...</div>
      </div>
    )
  }

  // Check kitType after user is loaded
  const userKitType = user?.kitType || user?.kit_type
  if (userKitType !== 'LAUNCH') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-black font-medium">Loading...</div>
      </div>
    )
  }

  // Get mock step data and check step locking
  const getMockStep = () => {
    const onboardingData = localStorage.getItem('onboarding_LAUNCH')
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
        title: 'Show us your brand',
        status: 'NOT_STARTED',
        required_fields_total: 7,
        required_fields_completed: 0,
        time_estimate: 'About 8 minutes',
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
              onClick={() => router.push('/launch-kit/onboarding/step-1')}
              className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition-all duration-200 hover:shadow-lg"
            >
              Go to Step 1
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <LaunchKitStep2Form project={null} step={step} />
}
