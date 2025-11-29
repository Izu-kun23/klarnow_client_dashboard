/**
 * Utility function to save onboarding step data to Supabase
 * Simplified - just POST the data, create project/step if needed
 */

export interface SaveOnboardingStepParams {
  projectId?: string // Optional - will be created if not provided
  stepId?: string // Optional - will be created if not provided
  stepNumber: number // Required: 1, 2, or 3
  kitType: 'LAUNCH' | 'GROWTH'
  fields: Record<string, any>
  requiredFieldsTotal: number
  requiredFieldsCompleted: number
  startedAt?: string | null
}

export async function saveOnboardingStepToSupabase(params: SaveOnboardingStepParams): Promise<{ success: boolean; error?: string; step?: any }> {
  try {
    const { stepNumber, kitType, fields, requiredFieldsCompleted, startedAt } = params

    // Get email from localStorage
    const userData = localStorage.getItem('user')
    if (!userData) {
      return { success: false, error: 'User not found. Please log in again.' }
    }

    const user = JSON.parse(userData)
    const email = user.email || user.email_address
    
    if (!email) {
      return { success: false, error: 'Email not found. Please log in again.' }
    }

    // Direct POST to save endpoint - it will handle creating project/step if needed
    const response = await fetch('/api/onboarding/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        kit_type: kitType,
        step_number: stepNumber,
        fields,
        required_fields_completed: requiredFieldsCompleted,
        required_fields_total: params.requiredFieldsTotal,
        started_at: startedAt || new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to save onboarding step' }))
      return { success: false, error: errorData.error || 'Failed to save onboarding step' }
    }

    const data = await response.json()
    return { success: true, step: data.step, projectId: data.project_id }
  } catch (error: any) {
    console.error('Error saving onboarding step to Supabase:', error)
    return { success: false, error: error.message || 'Failed to save onboarding step' }
  }
}

/**
 * Simple function to get or create project ID
 * No complex initialization - just the basics
 */
export async function ensureProjectExists(kitType: 'LAUNCH' | 'GROWTH'): Promise<{ success: boolean; projectId?: string; error?: string }> {
  try {
    // Get email from localStorage
    const userData = localStorage.getItem('user')
    if (!userData) {
      return { success: false, error: 'User not found. Please log in again.' }
    }

    const user = JSON.parse(userData)
    const email = user.email || user.email_address
    
    if (!email) {
      return { success: false, error: 'Email not found. Please log in again.' }
    }

    // Simple POST to get/create project
    const response = await fetch('/api/projects/get-or-create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        kit_type: kitType,
        email: email 
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to get or create project' }))
      return { success: false, error: errorData.error || 'Failed to get or create project' }
    }

    const data = await response.json()
    return { success: true, projectId: data.project_id }
  } catch (error: any) {
    console.error('Error ensuring project exists:', error)
    return { success: false, error: error.message || 'Failed to ensure project exists' }
  }
}
