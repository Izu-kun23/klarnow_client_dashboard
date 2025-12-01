'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useMockAuth } from '@/hooks/useMockAuth'
import LaunchKitStep1Form from '@/components/launch-kit/onboarding/Step1Form'
import { checkOnboardingComplete } from '@/utils/onboarding-check'

export default function LaunchKitStep1Page() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading } = useMockAuth()
  const hasRedirected = useRef(false)

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) {
      return
    }
    
    if (!isLoading && isAuthenticated && user?.email) {
      // Check database to see if client exists (onboarding complete)
      const checkOnboardingStatus = async () => {
        const isComplete = await checkOnboardingComplete(user.email!)
        
        if (isComplete) {
          // Client exists in database = onboarding complete, redirect to home
          hasRedirected.current = true
          router.push('/home')
          return
        }
        
        // If no client found, check localStorage as fallback
        if (user?.onboarding_finished === true) {
          hasRedirected.current = true
          router.push('/home')
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
      
      checkOnboardingStatus()
    } else if (!isLoading && !isAuthenticated) {
      // Only redirect if not already on login page
      if (pathname !== '/') {
        hasRedirected.current = true
        router.push('/')
      }
    }
  }, [isAuthenticated, isLoading, user, router, pathname])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  // Wait for user to be loaded before checking kitType
  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  // Check kitType after user is loaded
  const userKitType = user?.kitType || user?.kit_type
  if (userKitType !== 'LAUNCH') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
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

