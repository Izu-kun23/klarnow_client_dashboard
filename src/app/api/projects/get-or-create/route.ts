import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * Simple endpoint to get or create a project
 * Minimal - just creates the project record, no complex initialization
 */
export async function POST(request: Request) {
  try {
    const { email, kit_type } = await request.json()
    
    if (!email || !kit_type) {
      return NextResponse.json({ error: 'Email and kit_type are required' }, { status: 400 })
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        error: 'Server configuration error: Missing Supabase credentials' 
      }, { status: 500 })
    }

    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const emailLower = email.toLowerCase().trim()

    // Get or create project (using email directly - no user_id needed)
    let project
    const { data: existingProject, error: checkError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('email', emailLower)
      .eq('kit_type', kit_type)
      .maybeSingle()

    // If error is about table/column not existing, provide helpful message
    if (checkError && (checkError.message?.includes('column') || checkError.message?.includes('relation') || checkError.message?.includes('schema cache'))) {
      return NextResponse.json({ 
        error: 'Database schema not set up. Please run the migrations to create the projects table.',
        details: checkError.message,
        hint: 'Run the SQL in supabase/migrations/create_projects_and_onboarding_tables.sql in your Supabase SQL editor'
      }, { status: 500 })
    }

    if (existingProject) {
      project = existingProject
    } else {
      // Create minimal project - no RPC functions, just the basics
      const { data: newProject, error: projectError } = await supabaseAdmin
        .from('projects')
        .insert({
          email: emailLower,
          kit_type,
          onboarding_percent: 0,
          onboarding_finished: false
        })
        .select('id')
        .single()

      if (projectError) {
        // Check if it's a schema issue
        if (projectError.message?.includes('column') || projectError.message?.includes('schema cache')) {
          return NextResponse.json({ 
            error: 'Database schema not set up. The projects table is missing the kit_type column.',
            details: projectError.message,
            hint: 'Run the SQL in supabase/migrations/create_projects_and_onboarding_tables.sql in your Supabase SQL editor'
          }, { status: 500 })
        }
        return NextResponse.json({ 
          error: `Failed to create project: ${projectError.message}`,
          details: projectError
        }, { status: 500 })
      }

      if (!newProject) {
        return NextResponse.json({ 
          error: 'Failed to create project: No data returned' 
        }, { status: 500 })
      }
      project = newProject
    }

    return NextResponse.json({ 
      success: true, 
      project_id: project.id
    })
  } catch (error: any) {
    console.error('Error in get-or-create project:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

