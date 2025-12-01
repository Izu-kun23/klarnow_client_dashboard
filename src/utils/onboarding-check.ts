/**
 * Check if user has completed onboarding by checking if client exists in database
 * If client exists (has email/userId in clients table), onboarding is complete
 */
export async function checkOnboardingComplete(email: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/my-project?email=${encodeURIComponent(email)}`, {
      headers: {
        'X-User-Email': email
      },
      cache: 'no-store'
    })
    
    if (response.ok) {
      const data = await response.json()
      // If project has an ID, client exists in database = onboarding complete
      return !!data.project?.id
    }
    
    return false
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return false
  }
}

