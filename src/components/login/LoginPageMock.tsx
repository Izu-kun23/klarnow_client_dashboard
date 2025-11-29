'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { initializeMockOnboardingData } from '@/utils/mockData'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type KitType = 'LAUNCH' | 'GROWTH' | ''

export default function LoginPageMock() {
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

    // Validate kit selection for both sign up and sign in
    if (!kitType) {
      setError('Please select a kit type')
      setIsLoading(false)
      return
    }

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))

      // Store user info in localStorage
      const userData = {
        email,
        kitType,
        createdAt: new Date().toISOString()
      }
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('isAuthenticated', 'true')

      let redirectPath: string
      
      if (isSignUp) {
        // Sign Up Flow: Initialize onboarding and redirect to Step 1
        const storageKey = `onboarding_${kitType}`
        const existingData = localStorage.getItem(storageKey)
        
        if (!existingData) {
          // No existing data, initialize mock onboarding data
          initializeMockOnboardingData(kitType as 'LAUNCH' | 'GROWTH')
        }
        
        // Redirect to first onboarding step
        redirectPath = kitType === 'LAUNCH' 
          ? '/launch-kit/onboarding/step-1' 
          : '/growth-kit/onboarding/step-1'
        
        setError('Account created successfully! Redirecting...')
      } else {
        // Sign In Flow: Always redirect to /home
        redirectPath = '/home'
        setError('Signing in... Redirecting...')
      }

      // Redirect to appropriate page
      setTimeout(() => {
        router.push(redirectPath)
      }, 1000)
    } catch (err) {
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn('flex flex-col gap-6')}>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-black">
                  {isSignUp ? 'Create your account' : 'Sign in to your account'}
                </h1>
                <FieldDescription className="text-black">
                  Klarnow Client Dashboard (Mock Mode - No Backend)
                </FieldDescription>
              </div>

              {error && (
                <FieldError>
                  <div className={`rounded-md p-4 ${
                    error.includes('successfully') || error.includes('Redirecting') ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <p className={`text-sm ${
                      error.includes('successfully') || error.includes('Redirecting') ? 'text-green-800' : 'text-red-800'
                    }`}>{error}</p>
                  </div>
                </FieldError>
              )}

              <Field>
                <FieldLabel htmlFor="email" className="text-black">Email address</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full text-black"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password" className="text-black">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full text-black"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="kitType" className="text-black">
                  Select your kit <span className="text-red-500">*</span>
                </FieldLabel>
                <Select
                  value={kitType}
                  onValueChange={(value) => setKitType(value as KitType)}
                  required
                >
                  <SelectTrigger id="kitType" className="w-full text-black">
                    <SelectValue placeholder="Select a kit..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LAUNCH">
                      Launch Kit - 3 page high trust site in 14 days
                    </SelectItem>
                    <SelectItem value="GROWTH">
                      Growth Kit - 4 to 6 page funnel and emails in 14 days
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FieldDescription className="text-black">
                  {isSignUp 
                    ? 'Choose the kit you purchased to get started'
                    : 'Select the kit you have access to'}
                </FieldDescription>
              </Field>

              <Field>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Loading...' : isSignUp ? 'Sign up' : 'Sign in'}
                </Button>
              </Field>

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
            </FieldGroup>
          </form>
        </div>
      </div>
    </div>
  )
}
