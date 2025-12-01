'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import EmailLoginFlow from '@/components/login/EmailLoginFlow'

export default function Home() {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const hasRedirected = useRef(false)

  useEffect(() => {
    // Don't do anything if already on onboarding or build tracker pages
    if (pathname.includes('/onboarding/') || pathname.includes('/build-tracker')) {
      setIsLoading(false)
      return
    }
    
    // Prevent multiple redirects
    if (hasRedirected.current) {
      return
    }
    
    // Check if user is authenticated (localStorage)
    const authStatus = localStorage.getItem('isAuthenticated')
    const userData = localStorage.getItem('user')
    
    if (authStatus === 'true' && userData) {
      setIsAuthenticated(true)
      // Redirect authenticated users based on onboarding status
      // Only redirect if we're on the root path
      if (pathname === '/') {
        try {
          const user = JSON.parse(userData)
          // Get kit type - normalize to uppercase for consistency
          const kitTypeRaw = user.kitType || user.kit_type || 'LAUNCH'
          const kitType = kitTypeRaw.toUpperCase().trim() as 'LAUNCH' | 'GROWTH'
          
          // Ensure kit type is valid
          if (kitType !== 'LAUNCH' && kitType !== 'GROWTH') {
            console.error('Invalid kit type:', kitType)
            setIsLoading(false)
            return
          }
          
          // Check onboarding completion status from user data (set by login flow from database)
          // This value comes from the projects table via /api/users/lookup
          const isOnboardingComplete = user.onboarding_finished === true
          
          hasRedirected.current = true
          
          if (isOnboardingComplete) {
            // Redirect to dashboard/home if onboarding is complete
            router.push('/home')
          } else {
            // Redirect to onboarding if not complete
            // Growth Kit -> Growth Kit onboarding
            // Launch Kit -> Launch Kit onboarding
            const onboardingPath = kitType === 'GROWTH'
              ? '/growth-kit/onboarding/step-1'
              : '/launch-kit/onboarding/step-1'
            router.push(onboardingPath)
          }
        } catch (error) {
          // If parsing fails, still redirect to login
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }, [router, pathname])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  // Show login page for unauthenticated users
  return <EmailLoginFlow />
}
