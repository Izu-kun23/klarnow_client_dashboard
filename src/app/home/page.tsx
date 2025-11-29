'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMockAuth } from '@/hooks/useMockAuth'
import HomePageContent from '@/components/home/HomePageContent'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function HomePage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useMockAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-black font-medium">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  // Get mock project data from localStorage
  const getMockProject = () => {
    const onboardingData = localStorage.getItem(`onboarding_${user.kitType}`)
    if (onboardingData) {
      const onboarding = JSON.parse(onboardingData)
      return {
        id: 'mock-project',
        user_id: 'mock-user',
        kit_type: user.kitType,
        onboarding_percent: onboarding.onboarding_percent || 0,
        current_day_of_14: null,
        next_from_us: null,
        next_from_you: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        onboarding_steps: onboarding.steps || [],
        phases: []
      }
    }
    return null
  }

  const project = getMockProject()

  return (
    <DashboardLayout>
      <HomePageContent project={project} />
    </DashboardLayout>
  )
}

