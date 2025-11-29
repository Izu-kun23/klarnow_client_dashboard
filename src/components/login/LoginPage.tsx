'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type KitType = 'LAUNCH' | 'GROWTH' | ''

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [kitType, setKitType] = useState<KitType>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate kit selection for sign up
    if (isSignUp && !kitType) {
      setError('Please select a kit type')
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    try {
      if (isSignUp) {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/home`,
          },
        })

        if (signUpError) {
          setError(signUpError.message)
          setIsLoading(false)
          return
        }

        // If user is created, initialize their project
        if (authData.user && kitType) {
          try {
            const initResponse = await fetch('/api/projects/initialize', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ kit_type: kitType }),
            })

            if (!initResponse.ok) {
              const initData = await initResponse.json()
              console.error('Project initialization error:', initData)
              // Show a warning but don't fail signup
              setError(
                'Account created, but project initialization failed. ' +
                'Please make sure the database schema is set up. ' +
                'You can initialize your project from the home page.'
              )
              setIsLoading(false)
              return
            }
          } catch (initErr: any) {
            console.error('Failed to initialize project:', initErr)
            setError(
              'Account created, but project initialization failed. ' +
              'You can initialize your project from the home page after logging in.'
            )
            setIsLoading(false)
            return
          }
        }

        // Show success message for sign up
        setError('Check your email to confirm your account!')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          setError(signInError.message)
          setIsLoading(false)
          return
        }

        // After login, check if user has a project, if not redirect to home
        // The home page will handle showing the appropriate kit
        router.push('/home')
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Klarnow Client Dashboard
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full rounded-full border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full rounded-full border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="Password"
              />
            </div>
            {isSignUp && (
              <div>
                <label htmlFor="kitType" className="block text-sm font-medium text-gray-700 mb-2">
                  Select your kit <span className="text-red-500">*</span>
                </label>
                <select
                  id="kitType"
                  name="kitType"
                  required={isSignUp}
                  value={kitType}
                  onChange={(e) => setKitType(e.target.value as KitType)}
                  className="relative block w-full rounded-full border border-gray-300 px-3 py-2 text-gray-900 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select a kit...</option>
                  <option value="LAUNCH">Launch Kit - 3 page high trust site in 14 days</option>
                  <option value="GROWTH">Growth Kit - 4 to 6 page funnel and emails in 14 days</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Choose the kit you purchased to get started
                </p>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-full border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : isSignUp ? 'Sign up' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
              }}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

