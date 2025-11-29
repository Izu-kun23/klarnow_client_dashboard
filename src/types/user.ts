// User Profile interface
export interface UserProfile {
  id: string
  email: string
  name: string | null
  kit_type: 'LAUNCH' | 'GROWTH'
  onboarding_finished: boolean
  created_at: string
  updated_at: string
}

// User lookup response
export interface UserLookupResponse {
  exists: boolean
  name?: string
  kit_type?: 'LAUNCH' | 'GROWTH'
  available_kit_types?: ('LAUNCH' | 'GROWTH')[] // All plans associated with this email
  onboarding_finished?: boolean
  quiz_submission?: {
    id: string
    uuid: string
    full_name: string
    email: string
    phone_number: string | null
    brand_name: string
    preferred_kit: string | null
  }
}

// User Onboarding Tracking interface
export interface UserOnboarding {
  id: string
  email: string
  onboarding_finished: boolean
  onboarding_completed_at: string | null
  kit_type: 'LAUNCH' | 'GROWTH' | null
  created_at: string
  updated_at: string
}

