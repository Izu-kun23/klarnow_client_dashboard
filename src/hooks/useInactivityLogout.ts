import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useMockAuth } from './useMockAuth'

/**
 * Hook to handle user inactivity logout
 * Logs out user after 10 minutes of inactivity
 * Tracks: mouse, keyboard, scroll, touch, and API calls
 */
export function useInactivityLogout() {
  const { signOut, isAuthenticated } = useMockAuth()
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const INACTIVITY_TIMEOUT = 10 * 60 * 1000 // 10 minutes in milliseconds

  const resetInactivityTimer = () => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      if (isAuthenticated) {
        console.log('[useInactivityLogout] User inactive for 10 minutes, logging out...')
        signOut()
        router.push('/')
        router.refresh()
      }
    }, INACTIVITY_TIMEOUT)
  }

  useEffect(() => {
    if (!isAuthenticated) {
      // Clear timeout if user is not authenticated
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    // Reset timer on user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'keydown']
    
    const handleActivity = () => {
      resetInactivityTimer()
    }

    // Intercept fetch calls to reset timer on API activity
    // Only intercept if not already intercepted
    if (!(window.fetch as any).__inactivityIntercepted) {
      const originalFetch = window.fetch
      const interceptedFetch = async (...args: Parameters<typeof fetch>) => {
        resetInactivityTimer()
        return originalFetch(...args)
      }
      interceptedFetch.__inactivityIntercepted = true
      window.fetch = interceptedFetch as typeof fetch
    } else {
      // If already intercepted, just reset timer
      resetInactivityTimer()
    }

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Initialize timer
    resetInactivityTimer()

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      // Note: We don't restore fetch here because other components might be using it
      // The fetch interception is safe to leave in place
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isAuthenticated, signOut, router])
}

