'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import EmailLoginFlow from '@/components/login/EmailLoginFlow'

export default function Home() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated (localStorage)
    const authStatus = localStorage.getItem('isAuthenticated')
    const userData = localStorage.getItem('user')
    
    if (authStatus === 'true' && userData) {
      setIsAuthenticated(true)
      // According to UI flow: authenticated users should go to /home
      // /home will handle showing initialization prompt or project status
      router.push('/home')
    } else {
      setIsLoading(false)
    }
  }, [router])

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
