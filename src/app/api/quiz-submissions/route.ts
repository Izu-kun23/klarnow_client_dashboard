import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// GET endpoint to fetch all quiz submissions (admin only)
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
    const status = searchParams.get('status')
    const kitType = searchParams.get('kit_type')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabaseAdmin
      .from('quiz_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (kitType) {
      query = query.eq('preferred_kit', kitType)
    }

    const { data: submissions, error } = await query

    if (error) {
      console.error('Error fetching quiz submissions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch quiz submissions' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('quiz_submissions')
      .select('*', { count: 'exact', head: true })

    if (kitType) {
      countQuery = countQuery.eq('preferred_kit', kitType)
    }

    const { count } = await countQuery

    return NextResponse.json({
      submissions: submissions || [],
      total: count || 0,
      limit,
      offset
    })
  } catch (error: any) {
    console.error('Quiz submissions fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST endpoint to create a new quiz submission (public)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      full_name, 
      email, 
      phone_number, 
      brand_name, 
      logo_status, 
      brand_goals, 
      online_presence, 
      audience, 
      brand_style, 
      timeline, 
      preferred_kit 
    } = body

    if (!email || !full_name || !brand_name || !logo_status || !online_presence || !brand_style || !timeline) {
      return NextResponse.json(
        { error: 'Missing required fields: email, full_name, brand_name, logo_status, online_presence, brand_style, timeline are required' },
        { status: 400 }
      )
    }

    // Use service role for public insert
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

    const { data: submission, error } = await supabaseAdmin
      .from('quiz_submissions')
      .insert({
        full_name,
        email: email.toLowerCase().trim(),
        phone_number: phone_number || null,
        brand_name,
        logo_status,
        brand_goals: brand_goals || [],
        online_presence,
        audience: audience || [],
        brand_style,
        timeline,
        preferred_kit: preferred_kit || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating quiz submission:', error)
      return NextResponse.json(
        { error: 'Failed to create quiz submission', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, submission }, { status: 201 })
  } catch (error: any) {
    console.error('Quiz submission creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

