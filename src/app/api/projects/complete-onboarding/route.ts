import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { email, kit_type } = await request.json()

    if (!email || !kit_type) {
      return NextResponse.json(
        { error: 'Email and kit_type are required' },
        { status: 400 }
      )
    }

    // Use service role for updates
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

    const emailLower = email.toLowerCase().trim()
    const now = new Date().toISOString()

    // Update user_profiles table
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update({ onboarding_finished: true, updated_at: now })
      .eq('email', emailLower)

    if (profileError) {
      console.error('Error updating user profile:', profileError)
      // Continue even if profile update fails
    }

    // Insert or update user_onboarding table
    const { error: onboardingError } = await supabaseAdmin
      .from('user_onboarding')
      .upsert({
        email: emailLower,
        onboarding_finished: true,
        onboarding_completed_at: now,
        kit_type: kit_type,
        updated_at: now
      }, {
        onConflict: 'email'
      })

    if (onboardingError) {
      console.error('Error updating user_onboarding:', onboardingError)
      // Continue even if onboarding update fails
    }

    // Find user_id from email
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = users?.find(u => u.email === email.toLowerCase().trim())

    if (authUser) {
      // Update projects table
      const { error: projectError } = await supabaseAdmin
        .from('projects')
        .update({ 
          onboarding_finished: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', authUser.id)
        .eq('kit_type', kit_type)

      if (projectError) {
        console.error('Error updating project:', projectError)
        // Continue even if project update fails
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Complete onboarding error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

