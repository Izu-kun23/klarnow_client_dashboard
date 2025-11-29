import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * GET /api/quiz-submissions/[uuid]
 * Fetches a specific quiz submission by UUID and all related user details
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params
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

    // Fetch quiz submission by UUID
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('quiz_submissions')
      .select('*')
      .eq('id', uuid)
      .single()

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: 'Quiz submission not found' },
        { status: 404 }
      )
    }

    // Fetch user details by email
    const email = submission.email.toLowerCase().trim()
    
    // Check if user exists in auth.users
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = users?.find(u => u.email?.toLowerCase() === email)

    // Fetch user profile
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single()

    // Fetch project if user exists
    let project = null
    let projectDetails = null
    
    if (authUser) {
      const { data: projectData } = await supabaseAdmin
        .from('projects')
        .select(`
          *,
          onboarding_steps (*),
          phases (
            *,
            checklist_items (*),
            phase_links (*)
          )
        `)
        .eq('user_id', authUser.id)
        .single()
      
      project = projectData
    }

    // Fetch all quiz submissions for this email (to see submission history)
    const { data: allSubmissions } = await supabaseAdmin
      .from('quiz_submissions')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      submission: {
        ...submission,
        uuid: submission.id
      },
      user: authUser ? {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        metadata: authUser.user_metadata
      } : null,
      profile: profile || null,
      project: project || null,
      submission_history: allSubmissions || [],
      summary: {
        has_account: !!authUser,
        has_profile: !!profile,
        has_project: !!project,
        total_submissions: allSubmissions?.length || 0
      }
    })
  } catch (error: any) {
    console.error('Error fetching quiz submission details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

