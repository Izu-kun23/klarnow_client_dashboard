/**
 * Utility to ensure all onboarding fields are saved, including prefilled ones
 * This ensures that even if a user doesn't edit a prefilled field, it's still saved to the database
 */

/**
 * Merges quiz submission data with existing form data
 * Prefilled quiz data takes precedence over empty strings or missing fields
 * But preserves user-edited values
 */
export function mergeQuizDataWithFormData(
  formData: Record<string, any>,
  quizMappedFields: Record<string, any>,
  preserveUserEdits: boolean = true
): Record<string, any> {
  const merged = { ...formData }
  
  Object.keys(quizMappedFields).forEach(key => {
    const quizValue = quizMappedFields[key]
    const currentValue = merged[key]
    
    // Skip if quiz value is invalid
    if (quizValue === undefined || quizValue === null) {
      return
    }
    
    // Special handling for social_links - don't auto-fill
    if (key === 'social_links') {
      return
    }
    
    // If field is empty/missing, use quiz data
    if (currentValue === '' || currentValue === null || currentValue === undefined) {
      merged[key] = quizValue
      return
    }
    
    // If field is an empty array, use quiz data
    if (Array.isArray(currentValue) && currentValue.length === 0) {
      merged[key] = quizValue
      return
    }
    
    // If field is an array with only empty strings, use quiz data
    if (Array.isArray(currentValue) && currentValue.every((item: any) => item === '' || item === null || item === undefined)) {
      merged[key] = quizValue
      return
    }
    
    // If preserveUserEdits is false, always use quiz data
    if (!preserveUserEdits) {
      merged[key] = quizValue
      return
    }
    
    // Otherwise, keep current value (user might have edited it)
    // But log it for debugging
    if (currentValue !== quizValue) {
      console.log(`[mergeQuizDataWithFormData] Keeping user-edited value for ${key}:`, currentValue, 'vs quiz:', quizValue)
    }
  })
  
  return merged
}

/**
 * Ensures all fields from formData are included in the saved step data
 * This is important for prefilled fields that the user might not interact with
 */
export function ensureAllFieldsSaved(
  formData: Record<string, any>,
  stepNumber: number,
  kitType: 'LAUNCH' | 'GROWTH'
): Record<string, any> {
  // Get the complete formData - this should already include prefilled values
  // But we ensure all fields are present
  const allFields = { ...formData }
  
  // Log to verify all fields are included
  console.log(`[ensureAllFieldsSaved] Step ${stepNumber} - Saving ${Object.keys(allFields).length} fields:`, Object.keys(allFields))
  
  return allFields
}

/**
 * Validates that all steps have complete field data before sending to API
 */
export function validateOnboardingSteps(steps: any[]): boolean {
  if (!steps || steps.length !== 3) {
    console.warn('[validateOnboardingSteps] Expected 3 steps, got:', steps?.length)
    return false
  }
  
  for (const step of steps) {
    if (!step.fields || typeof step.fields !== 'object') {
      console.warn(`[validateOnboardingSteps] Step ${step.step_number} missing fields object`)
      return false
    }
    
    const fieldCount = Object.keys(step.fields).length
    console.log(`[validateOnboardingSteps] Step ${step.step_number} has ${fieldCount} fields`)
    
    if (fieldCount === 0) {
      console.warn(`[validateOnboardingSteps] Step ${step.step_number} has no fields`)
      return false
    }
  }
  
  return true
}

