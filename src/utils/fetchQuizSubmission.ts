import { QuizSubmission } from '@/types/quiz'

/**
 * Fetches quiz submission by ID (preferred) or email (fallback)
 * Prefers ID for accuracy and security
 */
export async function fetchQuizSubmission(id?: string, email?: string): Promise<QuizSubmission | null> {
  try {
    // Prefer ID over email
    if (id) {
      const normalizedId = id.trim()
      if (!normalizedId) {
        console.error('Invalid ID provided to fetchQuizSubmission')
        return null
      }

      const response = await fetch(`/api/quiz-submissions/my-submission?id=${encodeURIComponent(normalizedId)}`)
      
      if (!response.ok) {
        console.error('Failed to fetch quiz submission by ID:', response.statusText, response.status)
        return null
      }

      const data = await response.json()
      
      if (data.submission) {
        // Verify the ID matches (security check)
        if (data.submission.id !== normalizedId) {
          console.error('ID mismatch in quiz submission response:', {
            requested: normalizedId,
            received: data.submission.id
          })
          return null
        }
        
        console.log('Quiz submission fetched by ID:', normalizedId)
        return data.submission as QuizSubmission
      }

      return null
    }

    // Fallback to email if no ID provided
    if (email) {
      const normalizedEmail = email.toLowerCase().trim()
      
      if (!normalizedEmail) {
        console.error('Invalid email provided to fetchQuizSubmission')
        return null
      }

      const response = await fetch(`/api/quiz-submissions/my-submission?email=${encodeURIComponent(normalizedEmail)}`)
      
      if (!response.ok) {
        console.error('Failed to fetch quiz submission by email:', response.statusText, response.status)
        return null
      }

      const data = await response.json()
      
      if (data.submission) {
        // Verify the email matches (security check)
        const submissionEmail = data.submission.email?.toLowerCase().trim()
        if (submissionEmail !== normalizedEmail) {
          console.error('Email mismatch in quiz submission response:', {
            requested: normalizedEmail,
            received: submissionEmail
          })
          return null
        }
        
        console.log('Quiz submission fetched by email:', normalizedEmail)
        return data.submission as QuizSubmission
      }
    }

    return null
  } catch (error) {
    console.error('Error fetching quiz submission:', error)
    return null
  }
}

/**
 * @deprecated Use fetchQuizSubmission(id, email) instead
 * Fetches the latest quiz submission for a given email
 */
export async function fetchQuizSubmissionByEmail(email: string): Promise<QuizSubmission | null> {
  return fetchQuizSubmission(undefined, email)
}

/**
 * Maps quiz submission data to onboarding form fields
 * Maps all relevant fields from quiz_submissions table to onboarding form fields
 */
export function mapQuizToOnboardingFields(
  quizSubmission: QuizSubmission | null,
  kitType: 'LAUNCH' | 'GROWTH'
): Record<string, any> {
  if (!quizSubmission) {
    return {}
  }

  const mappedFields: Record<string, any> = {}

  // Direct mappings - Common fields for both kits
  // brand_name → business_name
  if (quizSubmission.brand_name) {
    mappedFields.business_name = quizSubmission.brand_name
  }

  // full_name → name_and_role
  if (quizSubmission.full_name) {
    mappedFields.name_and_role = quizSubmission.full_name
  }

  // email → contact_email
  if (quizSubmission.email) {
    mappedFields.contact_email = quizSubmission.email
  }

  // phone_number → phone_whatsapp
  if (quizSubmission.phone_number) {
    mappedFields.phone_whatsapp = quizSubmission.phone_number
  }

  // audience (array) → who_is_this_for (Launch) or who_offer_for (Growth)
  if (quizSubmission.audience && quizSubmission.audience.length > 0) {
    const audienceText = quizSubmission.audience.join(', ')
    if (kitType === 'LAUNCH') {
      mappedFields.who_is_this_for = audienceText
    } else {
      mappedFields.who_offer_for = audienceText
    }
  }

  // Launch Kit specific mappings
  if (kitType === 'LAUNCH') {
    // brand_style → what_you_sell
    if (quizSubmission.brand_style) {
      let whatYouSell = quizSubmission.brand_style
      
      // Append brand_goals if available
      if (quizSubmission.brand_goals && quizSubmission.brand_goals.length > 0) {
        const goalsText = quizSubmission.brand_goals.join(', ')
        whatYouSell = `${whatYouSell}. Goals: ${goalsText}`
      }
      
      mappedFields.what_you_sell = whatYouSell
    } else if (quizSubmission.brand_goals && quizSubmission.brand_goals.length > 0) {
      // If no brand_style but we have goals, use goals
      mappedFields.what_you_sell = quizSubmission.brand_goals.join(', ')
    }
  }

  // Growth Kit specific mappings
  if (kitType === 'GROWTH') {
    // online_presence → current_website_url
    if (quizSubmission.online_presence) {
      const onlinePresence = quizSubmission.online_presence.trim()
      const noWebsiteVariants = [
        'No website',
        'No Website',
        'No Website Yet',
        'no website',
        'none',
        'N/A',
        'n/a'
      ]
      
      if (!noWebsiteVariants.includes(onlinePresence)) {
        // Check if it looks like a URL
        if (onlinePresence.startsWith('http://') || onlinePresence.startsWith('https://')) {
          mappedFields.current_website_url = onlinePresence
        } else if (onlinePresence.includes('.') && !onlinePresence.includes(' ')) {
          // Might be a domain, add https://
          mappedFields.current_website_url = `https://${onlinePresence}`
        }
      }
    }

    // timeline → typical_timeline (if it makes sense)
    if (quizSubmission.timeline) {
      // Only map if it's a descriptive timeline, not just a selection
      const timeline = quizSubmission.timeline.trim()
      if (timeline.length > 10) {
        // Likely a descriptive answer
        mappedFields.typical_timeline = timeline
      }
    }

    // brand_style could inform offer_name or what_included
    if (quizSubmission.brand_style) {
      // Could be used as offer context, but not directly mapped
      // as it might not match the offer name field exactly
    }
  }

  return mappedFields
}

/**
 * Maps quiz submission data to Step 2 onboarding form fields
 * Focuses on brand, voice, and client-related fields
 */
export function mapQuizToStep2Fields(
  quizSubmission: QuizSubmission | null,
  kitType: 'LAUNCH' | 'GROWTH'
): Record<string, any> {
  if (!quizSubmission) {
    return {}
  }

  const mappedFields: Record<string, any> = {}

  // Common mappings for both kits
  // audience → ideal_client_description
  if (quizSubmission.audience && quizSubmission.audience.length > 0) {
    mappedFields.ideal_client_description = quizSubmission.audience.join(', ')
  }

  // brand_style → voice_words (extract keywords)
  if (quizSubmission.brand_style) {
    const brandStyle = quizSubmission.brand_style.toLowerCase()
    const voiceWords: string[] = []
    
    // Extract common voice descriptors
    if (brandStyle.includes('professional') || brandStyle.includes('professional')) {
      voiceWords.push('Professional')
    }
    if (brandStyle.includes('modern') || brandStyle.includes('contemporary')) {
      voiceWords.push('Modern')
    }
    if (brandStyle.includes('friendly') || brandStyle.includes('warm')) {
      voiceWords.push('Friendly')
    }
    if (brandStyle.includes('bold') || brandStyle.includes('confident')) {
      voiceWords.push('Bold')
    }
    if (brandStyle.includes('simple') || brandStyle.includes('clean')) {
      voiceWords.push('Simple')
    }
    if (brandStyle.includes('creative') || brandStyle.includes('innovative')) {
      voiceWords.push('Creative')
    }
    
    // If we found voice words, use them (up to 3)
    if (voiceWords.length > 0) {
      mappedFields.voice_words = voiceWords.slice(0, 3)
    }
  }

  // brand_goals → problems/outcomes (for Launch Kit)
  if (kitType === 'LAUNCH' && quizSubmission.brand_goals && quizSubmission.brand_goals.length > 0) {
    // Map goals to results/outcomes
    const goals = quizSubmission.brand_goals
    if (goals.length > 0) {
      mappedFields.top_3_results = goals.slice(0, 3)
    }
  }

  // Growth Kit specific mappings
  if (kitType === 'GROWTH') {
    // brand_goals could inform outcomes
    if (quizSubmission.brand_goals && quizSubmission.brand_goals.length > 0) {
      const goals = quizSubmission.brand_goals
      if (goals.length > 0) {
        mappedFields.top_5_outcomes = goals.slice(0, 5)
      }
    }
  }

  return mappedFields
}

/**
 * Maps quiz submission data to Step 3 onboarding form fields
 * Focuses on technical/platform fields
 */
export function mapQuizToStep3Fields(
  quizSubmission: QuizSubmission | null,
  kitType: 'LAUNCH' | 'GROWTH'
): Record<string, any> {
  if (!quizSubmission) {
    return {}
  }

  const mappedFields: Record<string, any> = {}

  // Common mappings for both kits
  // email → contact_form_email (Launch) or email platform context
  if (quizSubmission.email) {
    if (kitType === 'LAUNCH') {
      mappedFields.contact_form_email = quizSubmission.email
    }
    // For Growth Kit, email could be used in email_platform context
  }

  // online_presence → current_website_url and platform detection
  if (quizSubmission.online_presence) {
    const onlinePresence = quizSubmission.online_presence.trim()
    const noWebsiteVariants = [
      'No website',
      'No Website',
      'No Website Yet',
      'no website',
      'none',
      'N/A',
      'n/a'
    ]
    
    if (!noWebsiteVariants.includes(onlinePresence)) {
      // Check if it looks like a URL
      if (onlinePresence.startsWith('http://') || onlinePresence.startsWith('https://')) {
        if (kitType === 'GROWTH') {
          mappedFields.current_website_url = onlinePresence
        }
        
        // Try to detect platform from URL
        const url = onlinePresence.toLowerCase()
        if (url.includes('wordpress') || url.includes('wp.')) {
          mappedFields.current_site_platform = 'WordPress'
        } else if (url.includes('wix')) {
          mappedFields.current_site_platform = 'Wix'
        } else if (url.includes('squarespace')) {
          mappedFields.current_site_platform = 'Squarespace'
        } else if (url.includes('shopify')) {
          mappedFields.current_site_platform = 'Shopify'
        } else if (url.includes('webflow')) {
          mappedFields.current_site_platform = 'Webflow'
        }
      } else if (onlinePresence.includes('.') && !onlinePresence.includes(' ')) {
        // Might be a domain
        if (kitType === 'GROWTH') {
          mappedFields.current_website_url = `https://${onlinePresence}`
        }
      }
    }
  }

  // Note: main_channels is not currently in QuizSubmission type
  // If added to quiz_submissions table in future, can map to main_traffic_focus here

  return mappedFields
}

