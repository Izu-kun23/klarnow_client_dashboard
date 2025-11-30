import { QuizSubmission } from '@/types/quiz'

/**
 * Fetches the latest quiz submission for a given email
 */
export async function fetchQuizSubmissionByEmail(email: string): Promise<QuizSubmission | null> {
  try {
    const response = await fetch(`/api/quiz-submissions/my-submission?email=${encodeURIComponent(email)}`)
    
    if (!response.ok) {
      console.error('Failed to fetch quiz submission:', response.statusText)
      return null
    }

    const data = await response.json()
    
    // Return the submission if it exists
    if (data.submission) {
      return data.submission as QuizSubmission
    }

    return null
  } catch (error) {
    console.error('Error fetching quiz submission:', error)
    return null
  }
}

/**
 * Maps quiz submission data to onboarding form fields
 */
export function mapQuizToOnboardingFields(
  quizSubmission: QuizSubmission | null,
  kitType: 'LAUNCH' | 'GROWTH'
): Record<string, any> {
  if (!quizSubmission) {
    return {}
  }

  const mappedFields: Record<string, any> = {}

  // Common fields for both kits
  if (quizSubmission.brand_name) {
    mappedFields.business_name = quizSubmission.brand_name
  }

  if (quizSubmission.full_name) {
    // Try to extract name and role if possible, otherwise just use full_name
    mappedFields.name_and_role = quizSubmission.full_name
  }

  if (quizSubmission.email) {
    mappedFields.contact_email = quizSubmission.email
  }

  if (quizSubmission.phone_number) {
    mappedFields.phone_whatsapp = quizSubmission.phone_number
  }

  // Map audience to "who is this for" fields
  if (quizSubmission.audience && quizSubmission.audience.length > 0) {
    const audienceText = quizSubmission.audience.join(', ')
    if (kitType === 'LAUNCH') {
      mappedFields.who_is_this_for = audienceText
    } else {
      mappedFields.who_offer_for = audienceText
    }
  }

  // Map online_presence to current_website_url for Growth Kit
  if (kitType === 'GROWTH' && quizSubmission.online_presence) {
    // If they have a website, try to extract URL
    if (quizSubmission.online_presence !== 'No website' && 
        quizSubmission.online_presence !== 'No Website' &&
        quizSubmission.online_presence !== 'No Website Yet') {
      // Check if it looks like a URL
      if (quizSubmission.online_presence.startsWith('http://') || 
          quizSubmission.online_presence.startsWith('https://')) {
        mappedFields.current_website_url = quizSubmission.online_presence
      } else if (quizSubmission.online_presence.includes('.')) {
        // Might be a domain, add https://
        mappedFields.current_website_url = `https://${quizSubmission.online_presence}`
      }
    }
  }

  // Map brand_style to what_you_sell for Launch Kit
  if (kitType === 'LAUNCH' && quizSubmission.brand_style) {
    mappedFields.what_you_sell = quizSubmission.brand_style
  }

  // Map brand_goals to what_you_sell or other relevant fields if available
  if (quizSubmission.brand_goals && quizSubmission.brand_goals.length > 0) {
    const goalsText = quizSubmission.brand_goals.join(', ')
    // For Launch Kit, append to what_you_sell if it exists
    if (kitType === 'LAUNCH' && mappedFields.what_you_sell) {
      mappedFields.what_you_sell = `${mappedFields.what_you_sell}. Goals: ${goalsText}`
    }
  }

  return mappedFields
}

