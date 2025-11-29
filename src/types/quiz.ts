// Quiz Submission interface
export interface QuizSubmission {
  id: string
  full_name: string
  email: string
  phone_number: string | null
  brand_name: string
  logo_status: string
  brand_goals: string[]
  online_presence: string
  audience: string[]
  brand_style: string
  timeline: string
  preferred_kit: string | null
  created_at: string
  updated_at: string
}

// User from quiz submissions (enriched with account info)
export interface QuizUser {
  // Quiz submission data
  id: string
  email: string
  full_name: string
  phone_number: string | null
  brand_name: string
  logo_status: string
  brand_goals: string[]
  online_presence: string
  audience: string[]
  brand_style: string
  timeline: string
  preferred_kit: string | null
  submission_date: string
  
  // Account status
  has_account: boolean
  has_profile: boolean
  has_project: boolean
  
  // Auth user details
  user_id: string | null
  user_uuid: string | null // UUID from quiz_submissions table
  
  // Project details if exists
  project: {
    id: string
    kit_type: 'LAUNCH' | 'GROWTH'
    onboarding_finished: boolean
    onboarding_percent: number
  } | null
  
  // User profile details if exists
  profile: {
    id: string
    name: string | null
    kit_type: 'LAUNCH' | 'GROWTH'
    onboarding_finished: boolean
  } | null
}

// API Response types
export interface QuizSubmissionsResponse {
  submissions: QuizSubmission[]
  total: number
  limit: number
  offset: number
}

export interface QuizUsersResponse {
  users: QuizUser[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}

