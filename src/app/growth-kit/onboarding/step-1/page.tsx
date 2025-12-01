'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useMockAuth } from '@/hooks/useMockAuth'
import GrowthKitStep1Form from '@/components/growth-kit/onboarding/Step1Form'
import { checkOnboardingComplete } from '@/utils/onboarding-check'

export default function GrowthKitStep1Page() {
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
      if (userKitType && userKitType !== 'GROWTH') {
        // Redirect to correct kit's onboarding only if not already there
        const correctPath = userKitType === 'LAUNCH'
          ? '/launch-kit/onboarding/step-1'
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
  if (userKitType !== 'GROWTH') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-black font-medium">Loading...</div>
      </div>
    )
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

