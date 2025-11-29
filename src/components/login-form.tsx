'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
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

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
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
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-black">
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </h1>
            <FieldDescription className="text-black">
              Klarnow Client Dashboard
            </FieldDescription>
          </div>

          {error && (
            <FieldError>
              <div className={`rounded-md p-4 ${
                error.includes('Check your email') ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <p className={`text-sm ${
                  error.includes('Check your email') ? 'text-green-800' : 'text-red-800'
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

          {isSignUp && (
            <Field>
              <FieldLabel htmlFor="kitType" className="text-black">
                Select your kit <span className="text-red-500">*</span>
              </FieldLabel>
              <Select
                value={kitType}
                onValueChange={(value) => setKitType(value as KitType)}
                required={isSignUp}
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
                Choose the kit you purchased to get started
              </FieldDescription>
            </Field>
          )}

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
  )
}
