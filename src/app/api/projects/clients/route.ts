import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * GET /api/projects/clients
 * Fetches all clients who have access (exist in projects table) with their name and email.
 * 
 * Authentication: Admin only (check admins table)
 * 
 * Query Parameters:
 * - kit_type (optional): Filter by 'LAUNCH' or 'GROWTH'
 * - onboarding_finished (optional): Filter by boolean (true/false)
 * - limit (optional): Number of results (default: 100)
 * - offset (optional): Pagination offset (default: 0)
 * 
 * Response:
 * {
 *   clients: [...],
 *   total: number,
 *   count: number,
 *   limit: number,
 *   offset: number,
 *   has_more: boolean
 * }
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
    const kitType = searchParams.get('kit_type') // Filter by 'LAUNCH' or 'GROWTH'
    const onboardingFinished = searchParams.get('onboarding_finished') // Filter by boolean
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query for projects
    let projectsQuery = supabaseAdmin
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (kitType) {
      projectsQuery = projectsQuery.eq('kit_type', kitType.toUpperCase())
    }
    if (onboardingFinished !== null) {
      const isFinished = onboardingFinished === 'true'
      projectsQuery = projectsQuery.eq('onboarding_finished', isFinished)
    }

    const { data: projects, error: projectsError } = await projectsQuery

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      )
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({
        clients: [],
        total: 0,
        count: 0,
        limit,
        offset,
        has_more: false
      })
    }

    // Get unique user_ids from projects
    const uniqueUserIds = [...new Set(projects.map(p => p.user_id))]

    // Fetch auth.users to get emails
    const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers()
    
    // Create a map of user_id to email
    const userIdToEmail = new Map<string, string>()
    if (authUsers) {
      authUsers.forEach(authUser => {
        if (authUser.email) {
          userIdToEmail.set(authUser.id, authUser.email)
        }
      })
    }

    // Fetch user profiles for names
    const { data: userProfiles } = await supabaseAdmin
      .from('user_profiles')
      .select('email, name')
      .in('email', Array.from(userIdToEmail.values()))

    // Create a map of email to name from user_profiles
    const emailToNameFromProfile = new Map<string, string>()
    if (userProfiles) {
      userProfiles.forEach(profile => {
        if (profile.name) {
          emailToNameFromProfile.set(profile.email.toLowerCase(), profile.name)
        }
      })
    }

    // Fetch quiz submissions for names (fallback if not in user_profiles)
    const emails = Array.from(userIdToEmail.values())
    const { data: quizSubmissions } = await supabaseAdmin
      .from('quiz_submissions')
      .select('email, full_name')
      .in('email', emails)
      .order('created_at', { ascending: false })

    // Create a map of email to name from quiz_submissions (use latest submission)
    const emailToNameFromQuiz = new Map<string, string>()
    if (quizSubmissions) {
      // Group by email and take the latest submission
      const emailMap = new Map<string, any>()
      quizSubmissions.forEach(submission => {
        const email = submission.email.toLowerCase()
        if (!emailMap.has(email) || new Date(submission.created_at) > new Date(emailMap.get(email).created_at)) {
          emailMap.set(email, submission)
        }
      })
      
      emailMap.forEach((submission, email) => {
        if (submission.full_name) {
          emailToNameFromQuiz.set(email, submission.full_name)
        }
      })
    }

    // Combine projects with user data
    const clients = projects.map(project => {
      const email = userIdToEmail.get(project.user_id) || null
      // Try user_profiles first, then quiz_submissions
      const name = email 
        ? (emailToNameFromProfile.get(email.toLowerCase()) || emailToNameFromQuiz.get(email.toLowerCase()) || null)
        : null

      return {
        project_id: project.id,
        user_id: project.user_id,
        email: email,
        name: name,
        kit_type: project.kit_type,
        onboarding_finished: project.onboarding_finished,
        onboarding_percent: project.onboarding_percent,
        current_day_of_14: project.current_day_of_14,
        next_from_us: project.next_from_us,
        next_from_you: project.next_from_you,
        created_at: project.created_at,
        updated_at: project.updated_at
      }
    })

    // Get total count (unique user_ids)
    const totalUniqueUsers = uniqueUserIds.length

    // Apply pagination
    const paginatedClients = clients.slice(offset, offset + limit)

    return NextResponse.json({
      clients: paginatedClients,
      total: totalUniqueUsers,
      count: clients.length,
      limit,
      offset,
      has_more: offset + limit < clients.length
    })
  } catch (error: any) {
    console.error('Error fetching clients from projects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

