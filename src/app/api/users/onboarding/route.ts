import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { UserOnboarding } from '@/types/user'

// GET endpoint to fetch onboarding status by email
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

    // Use service role key
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

    const { data: onboarding, error } = await supabaseAdmin
      .from('user_onboarding')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching onboarding status:', error)
      return NextResponse.json(
        { error: 'Failed to fetch onboarding status' },
        { status: 500 }
      )
    }

    return NextResponse.json<UserOnboarding | null>(onboarding || null)
  } catch (error: any) {
    console.error('Onboarding lookup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET all onboarding records (admin only)
export async function POST(request: Request) {
  try {
    const { email, onboarding_finished, kit_type } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Use service role key
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

    const { data: onboarding, error } = await supabaseAdmin
      .from('user_onboarding')
      .upsert({
        email: email.toLowerCase().trim(),
        onboarding_finished: onboarding_finished ?? false,
        kit_type: kit_type || null,
        onboarding_completed_at: onboarding_finished ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting onboarding status:', error)
      return NextResponse.json(
        { error: 'Failed to save onboarding status' },
        { status: 500 }
      )
    }

    return NextResponse.json<UserOnboarding>(onboarding)
  } catch (error: any) {
    console.error('Onboarding save error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

