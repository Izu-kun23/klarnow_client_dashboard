// Status enum
export type Status = 
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'WAITING_ON_CLIENT'
  | 'DONE'

// Kit type
export type KitType = 'LAUNCH' | 'GROWTH'

// Project interface
export interface Project {
  id: string
  user_id: string
  kit_type: KitType
  onboarding_percent: number
  onboarding_finished: boolean
  current_day_of_14: number | null
  next_from_us: string | null
  next_from_you: string | null
  created_at: string
  updated_at: string
}

// Onboarding step
export interface OnboardingStep {
  id: string
  project_id: string
  step_number: number
  step_id: string
  title: string
  status: Status
  required_fields_total: number
  required_fields_completed: number
  time_estimate: string
  fields: Record<string, any> | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

// Phase
export interface Phase {
  id: string
  project_id: string
  phase_number: number
  phase_id: string
  title: string
  subtitle: string | null
  day_range: string
  status: Status
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  checklist?: ChecklistItem[]
  links?: PhaseLink[]
}

// Checklist item
export interface ChecklistItem {
  id: string
  phase_id: string
  label: string
  is_done: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// Phase link
export interface PhaseLink {
  id: string
  phase_id: string
  label: string
  url: string
  sort_order: number
  created_at: string
}

// Project with relations (for API responses)
export interface ProjectWithRelations extends Project {
  onboarding_steps: OnboardingStep[]
  phases: Phase[]
}

// Home widget data
export interface HomeWidgetData {
  currentPhase: Phase | null
  nextFromUs: string | null
  nextFromYou: string | null
  onboardingPercent: number
  currentDay: number | null
}

