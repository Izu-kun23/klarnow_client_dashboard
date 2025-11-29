import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * GET /api/quiz-submissions/users
 * Fetches unique users from quiz submissions
 * Returns list of users with their submission details
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Use service role for full access
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') // Optional: filter by specific email
    const kitType = searchParams.get('kit_type') // Filter by preferred_kit
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query - get all submissions
    let query = supabaseAdmin
      .from('quiz_submissions')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (email) {
      query = query.eq('email', email.toLowerCase().trim())
    }
    if (kitType) {
      query = query.eq('preferred_kit', kitType)
    }

    const { data: allSubmissions, error } = await query

    if (error) {
      console.error('Error fetching quiz submissions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch quiz submissions' },
        { status: 500 }
      )
    }

    // Group by email to get unique users (keep latest submission)
    const userMap = new Map<string, any>()
    
    if (allSubmissions) {
      for (const submission of allSubmissions) {
        const email = submission.email.toLowerCase().trim()
        if (!userMap.has(email)) {
          userMap.set(email, submission)
        }
      }
    }

    // Convert map to array and apply pagination
    const uniqueUsers = Array.from(userMap.values())
      .slice(offset, offset + limit)

    // Enrich users with account information
    const enrichedUsers = await Promise.all(
      uniqueUsers.map(async (submission) => {
        // Check if user exists in auth.users by email
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
        const authUser = users?.find(u => u.email?.toLowerCase() === submission.email.toLowerCase())

        // Check if user profile exists
        const { data: profile } = await supabaseAdmin
          .from('user_profiles')
          .select('*')
          .eq('email', submission.email.toLowerCase())
          .single()

        // Check if project exists
        let project = null
        if (authUser) {
          const { data: projectData } = await supabaseAdmin
            .from('projects')
            .select('id, kit_type, onboarding_finished, onboarding_percent')
            .eq('user_id', authUser.id)
            .single()
          
          project = projectData
        }

        return {
          // Quiz submission data (using UUID from quiz_submissions)
          id: submission.id,
          user_uuid: submission.id, // UUID from quiz_submissions table
          email: submission.email,
          full_name: submission.full_name,
          phone_number: submission.phone_number,
          brand_name: submission.brand_name,
          logo_status: submission.logo_status,
          brand_goals: submission.brand_goals || [],
          online_presence: submission.online_presence,
          audience: submission.audience || [],
          brand_style: submission.brand_style,
          timeline: submission.timeline,
          preferred_kit: submission.preferred_kit,
          submission_date: submission.created_at,
          
          // Account status
          has_account: !!authUser,
          has_profile: !!profile,
          has_project: !!project,
          
          // Auth user ID if exists
          user_id: authUser?.id || null,
          
          // Project details if exists
          project: project ? {
            id: project.id,
            kit_type: project.kit_type,
            onboarding_finished: project.onboarding_finished,
            onboarding_percent: project.onboarding_percent
          } : null,
          
          // User profile details if exists
          profile: profile ? {
            id: profile.id,
            name: profile.name,
            kit_type: profile.kit_type,
            onboarding_finished: profile.onboarding_finished
          } : null
        }
      })
    )

    return NextResponse.json({
      users: enrichedUsers,
      total: userMap.size,
      limit,
      offset,
      has_more: offset + limit < userMap.size
    })
  } catch (error: any) {
    console.error('Error fetching users from quiz submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

