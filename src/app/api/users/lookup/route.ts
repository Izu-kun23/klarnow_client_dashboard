import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { UserLookupResponse } from '@/types/user'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Use service role key to query auth.users
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const emailLower = email.toLowerCase().trim()

    // FIRST: Check quiz_submissions table for the email - get ALL submissions
    const { data: quizSubmissions, error: quizError } = await supabaseAdmin
      .from('quiz_submissions')
      .select('*')
      .eq('email', emailLower)
      .order('created_at', { ascending: false })

    // Get all unique preferred_kit values from quiz submissions
    const quizKits = quizSubmissions
      ?.map(q => q.preferred_kit?.toUpperCase())
      .filter((kit): kit is 'LAUNCH' | 'GROWTH' => kit === 'LAUNCH' || kit === 'GROWTH') || []

    // Get the latest quiz submission for display
    const latestQuizSubmission = quizSubmissions && quizSubmissions.length > 0 ? quizSubmissions[0] : null

    // Check if user also exists in auth.users
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = users?.find(u => u.email?.toLowerCase() === emailLower)

    // Get all kit types from projects if user exists
    let projectKits: ('LAUNCH' | 'GROWTH')[] = []
    let onboardingFinished = false
    
    if (authUser) {
      const { data: projects } = await supabaseAdmin
        .from('projects')
        .select('kit_type, onboarding_finished')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })

      if (projects && projects.length > 0) {
        projectKits = projects.map(p => p.kit_type as 'LAUNCH' | 'GROWTH')
        // Check if any project has onboarding finished
        onboardingFinished = projects.some(p => p.onboarding_finished) || false
      }

      // Also check user_onboarding
      if (!onboardingFinished) {
        const { data: onboardingData } = await supabaseAdmin
          .from('user_onboarding')
          .select('onboarding_finished')
          .eq('email', emailLower)
          .single()

        onboardingFinished = onboardingData?.onboarding_finished || false
      }
    }

    // Get kit types from user_profiles
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('kit_type')
      .eq('email', emailLower)
      .single()

    const profileKit = profile?.kit_type as 'LAUNCH' | 'GROWTH' | undefined

    // Combine all kit types (quiz submissions + projects + profile)
    const allKits = Array.from(new Set([
      ...quizKits,
      ...projectKits,
      ...(profileKit ? [profileKit] : [])
    ])) as ('LAUNCH' | 'GROWTH')[]

    // If found in quiz_submissions, use that data
    if (latestQuizSubmission) {
      return NextResponse.json<UserLookupResponse>({
        exists: true,
        name: latestQuizSubmission.full_name,
        kit_type: (latestQuizSubmission.preferred_kit?.toUpperCase() as 'LAUNCH' | 'GROWTH') || allKits[0],
        available_kit_types: allKits.length > 0 ? allKits : undefined,
        onboarding_finished: onboardingFinished,
        quiz_submission: {
          id: latestQuizSubmission.id,
          uuid: latestQuizSubmission.id,
          full_name: latestQuizSubmission.full_name,
          email: latestQuizSubmission.email,
          phone_number: latestQuizSubmission.phone_number,
          brand_name: latestQuizSubmission.brand_name,
          preferred_kit: latestQuizSubmission.preferred_kit
        }
      })
    }

    // If not found in quiz_submissions, check if user exists in auth.users
    if (!latestQuizSubmission) {
      if (!authUser) {
        return NextResponse.json<UserLookupResponse>({ exists: false })
      }

      // Get name from auth user metadata
      const name = authUser.user_metadata?.name || authUser.user_metadata?.full_name || null

      // Look up user profile (already fetched above)
      const { data: fullProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('email', emailLower)
        .single()

      let kitType: 'LAUNCH' | 'GROWTH' | undefined = undefined

      // First check user_onboarding table (dedicated onboarding tracking)
      const { data: onboardingData } = await supabaseAdmin
        .from('user_onboarding')
        .select('*')
        .eq('email', emailLower)
        .single()

      if (onboardingData) {
        kitType = onboardingData.kit_type as 'LAUNCH' | 'GROWTH' | undefined
        onboardingFinished = onboardingData.onboarding_finished || false
      }

      // If not found in user_onboarding, check user_profiles
      if (!onboardingData && fullProfile) {
        kitType = fullProfile.kit_type as 'LAUNCH' | 'GROWTH'
        onboardingFinished = fullProfile.onboarding_finished || onboardingFinished
      } else if (!onboardingData && projectKits.length > 0) {
        // Use first project's kit type if no profile
        kitType = projectKits[0]
      }

      // Combine kit types from all sources
      const allKitsFromAuth: ('LAUNCH' | 'GROWTH')[] = []
      if (kitType) {
        allKitsFromAuth.push(kitType)
      }
      if (projectKits.length > 0) {
        allKitsFromAuth.push(...projectKits)
      }
      if (profileKit) {
        allKitsFromAuth.push(profileKit)
      }
      const uniqueKits = Array.from(new Set(allKitsFromAuth)) as ('LAUNCH' | 'GROWTH')[]

      return NextResponse.json<UserLookupResponse>({
        exists: true,
        name: fullProfile?.name || name || null,
        kit_type: kitType || uniqueKits[0],
        available_kit_types: uniqueKits.length > 0 ? uniqueKits : undefined,
        onboarding_finished: onboardingFinished
      })
    }
  } catch (error: any) {
    console.error('User lookup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

