'use client'

import { useEffect, useState, useRef } from 'react'

export interface MockUser {
  email: string
  kitType?: 'LAUNCH' | 'GROWTH'
  kit_type?: 'LAUNCH' | 'GROWTH'
  onboarding_finished?: boolean
  createdAt?: string
}

export function useMockAuth() {
  const [user, setUser] = useState<MockUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const initialized = useRef(false)

  useEffect(() => {
    // Prevent multiple initializations
    if (initialized.current) return
    initialized.current = true

    // Check authentication first (non-blocking)
    const authStatus = localStorage.getItem('isAuthenticated')
    const userData = localStorage.getItem('user')
    
    if (authStatus === 'true' && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Error parsing user data:', error)
        setIsAuthenticated(false)
        setUser(null)
      }
    }
    
    // Set loading to false immediately to prevent delays
    setIsLoading(false)

    // Check server session asynchronously (non-blocking)
    const checkServerSession = async () => {
      const storedSessionId = localStorage.getItem('serverSessionId')
      
      try {
        const response = await fetch('/api/session/check')
        const { sessionId } = await response.json()
        
        // If server session changed, clear auth (server restarted)
        if (storedSessionId && storedSessionId !== sessionId) {
          console.log('Server restarted - clearing authentication')
          localStorage.removeItem('isAuthenticated')
          localStorage.removeItem('user')
          localStorage.removeItem('serverSessionId')
          setIsAuthenticated(false)
          setUser(null)
          return
        }
        
        // Store current server session ID
        if (sessionId) {
          localStorage.setItem('serverSessionId', sessionId)
        }
      } catch (error) {
        console.error('Error checking server session:', error)
        // On error, don't block - auth state is already set
      }
    }

    // Run server session check in background (non-blocking)
    checkServerSession()
  }, [])

  const signOut = () => {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('user')
    localStorage.removeItem('serverSessionId')
    setUser(null)
    setIsAuthenticated(false)
  }

  return { user, isAuthenticated, isLoading, signOut }
}

