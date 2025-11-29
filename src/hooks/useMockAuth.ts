'use client'

import { useEffect, useState } from 'react'

export interface MockUser {
  email: string
  kitType: 'LAUNCH' | 'GROWTH'
  createdAt: string
}

export function useMockAuth() {
  const [user, setUser] = useState<MockUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated')
    const userData = localStorage.getItem('user')
    
    if (authStatus === 'true' && userData) {
      setUser(JSON.parse(userData))
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const signOut = () => {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('user')
    setUser(null)
    setIsAuthenticated(false)
  }

  return { user, isAuthenticated, isLoading, signOut }
}

