import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * GET /api/quiz-submissions/my-submission
 * Fetches the latest quiz submission for the authenticated user's email
 * This endpoint allows users to fetch their own quiz submission data
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    // Use service role for querying
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

    // Get the latest quiz submission for this email
    const { data: submissions, error } = await supabaseAdmin
      .from('quiz_submissions')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error fetching quiz submission:', error)
      return NextResponse.json(
        { error: 'Failed to fetch quiz submission' },
        { status: 500 }
      )
    }

    if (!submissions || submissions.length === 0) {
      return NextResponse.json({ submission: null })
    }

    return NextResponse.json({ submission: submissions[0] })
  } catch (error: any) {
    console.error('Quiz submission fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

