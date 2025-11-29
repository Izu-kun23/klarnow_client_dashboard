import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * Simple POST endpoint for saving onboarding data
 * Creates project and step if needed - no complex initialization
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, kit_type, step_number, fields, required_fields_completed, required_fields_total, started_at } = body
    
    console.log('[Onboarding Save] Request received:', { 
      email: email?.substring(0, 5) + '...', 
      kit_type, 
      step_number,
      required_fields_completed,
      required_fields_total
    })
    
    if (!email || !kit_type || !step_number) {
      return NextResponse.json({ error: 'Email, kit_type, and step_number are required' }, { status: 400 })
    }

    // Validate environment variables
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
    console.log('[Onboarding Save] Checking for existing project...')
    const { data: existingProject, error: checkError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('email', emailLower)
      .eq('kit_type', kit_type)
      .maybeSingle()

    // If error is about table/column not existing, provide helpful message
    if (checkError) {
      console.error('[Onboarding Save] Error checking project:', checkError)
      const errorMsg = checkError.message || String(checkError)
      
      if (errorMsg.includes('column') || errorMsg.includes('relation') || errorMsg.includes('schema cache') || errorMsg.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Database schema not set up. The projects table does not exist.',
          details: errorMsg,
          hint: 'Please run the SQL migration in Supabase Dashboard > SQL Editor',
          migration_file: 'supabase/migrations/create_projects_and_onboarding_tables.sql'
        }, { status: 500 })
      }
      
      // Other errors, log and continue to try creating
      console.warn('[Onboarding Save] Project check error (will try to create):', checkError)
    }

    if (existingProject) {
      console.log('[Onboarding Save] Using existing project:', existingProject.id)
      project = existingProject
    } else {
      // Create minimal project (using email)
      console.log('[Onboarding Save] Creating new project...')
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
        console.error('[Onboarding Save] Error creating project:', projectError)
        const errorMsg = projectError.message || String(projectError)
        
        // Check if it's a schema issue
        if (errorMsg.includes('column') || errorMsg.includes('schema cache') || errorMsg.includes('relation') || errorMsg.includes('does not exist')) {
          return NextResponse.json({ 
            error: 'Database schema not set up. The projects table does not exist or is missing columns.',
            details: errorMsg,
            hint: 'Please run the SQL migration in Supabase Dashboard > SQL Editor',
            migration_file: 'supabase/migrations/create_projects_and_onboarding_tables.sql'
          }, { status: 500 })
        }
        return NextResponse.json({ 
          error: `Failed to create project: ${errorMsg}`,
          details: projectError
        }, { status: 500 })
      }

      if (!newProject) {
        return NextResponse.json({ 
          error: 'Failed to create project: No data returned' 
        }, { status: 500 })
      }
      console.log('[Onboarding Save] Project created:', newProject.id)
      project = newProject
    }

    // Step titles based on kit type and step number
    const stepTitles = {
      LAUNCH: {
        1: 'Tell us who you are',
        2: 'Show us your brand',
        3: 'Switch on the site'
      },
      GROWTH: {
        1: 'Snapshot and main offer',
        2: 'Clients, proof and content fuel',
        3: 'Systems and launch'
      }
    }

    const timeEstimates = {
      LAUNCH: {
        1: 'About 5 minutes',
        2: 'About 8 minutes',
        3: 'About 5 minutes'
      },
      GROWTH: {
        1: 'About 8 minutes',
        2: 'About 10 minutes',
        3: 'About 7 minutes'
      }
    }

    // Save to onboarding_steps table
    console.log('[Onboarding Save] Checking for existing step in onboarding_steps table...')
    let step
    const { data: existingStep, error: stepCheckError } = await supabaseAdmin
      .from('onboarding_steps')
      .select('*')
      .eq('project_id', project.id)
      .eq('step_number', step_number)
      .maybeSingle()

    // If error is about table not existing, provide helpful message
    if (stepCheckError) {
      const errorMsg = stepCheckError.message || String(stepCheckError)
      console.error('[Onboarding Save] Error checking onboarding_steps:', errorMsg)
      
      if (errorMsg.includes('relation') || errorMsg.includes('schema cache') || errorMsg.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Database schema not set up. The onboarding_steps table does not exist.',
          details: errorMsg,
          hint: 'Please run the SQL migration in Supabase Dashboard > SQL Editor',
          migration_file: 'supabase/migrations/create_projects_and_onboarding_tables.sql'
        }, { status: 500 })
      }
    }

    const isComplete = required_fields_completed === required_fields_total
    const status = isComplete ? 'DONE' : (existingStep?.status === 'NOT_STARTED' ? 'IN_PROGRESS' : existingStep?.status || 'IN_PROGRESS')

    if (existingStep) {
      // Update existing step in onboarding_steps table
      console.log('[Onboarding Save] Updating existing step in onboarding_steps table:', existingStep.id)
      const { data: updatedStep, error: updateError } = await supabaseAdmin
        .from('onboarding_steps')
        .update({
          fields,
          required_fields_completed,
          required_fields_total: required_fields_total || existingStep.required_fields_total,
          status,
          updated_at: new Date().toISOString(),
          completed_at: isComplete ? new Date().toISOString() : existingStep.completed_at,
          started_at: started_at || existingStep.started_at
        })
        .eq('id', existingStep.id)
        .select()
        .single()

      if (updateError) {
        console.error('[Onboarding Save] Error updating onboarding_steps:', updateError)
        return NextResponse.json({ 
          error: `Failed to update onboarding_steps: ${updateError.message}`,
          details: updateError
        }, { status: 500 })
      }
      console.log('[Onboarding Save] Successfully updated onboarding_steps table')
      step = updatedStep
    } else {
      // Create new step in onboarding_steps table
      console.log('[Onboarding Save] Creating new step in onboarding_steps table...')
      const { data: newStep, error: stepError } = await supabaseAdmin
        .from('onboarding_steps')
        .insert({
          project_id: project.id,
          step_number: step_number,
          step_id: `STEP_${step_number}`,
          title: stepTitles[kit_type as 'LAUNCH' | 'GROWTH'][step_number as 1 | 2 | 3],
          time_estimate: timeEstimates[kit_type as 'LAUNCH' | 'GROWTH'][step_number as 1 | 2 | 3],
          fields,
          required_fields_completed,
          required_fields_total: required_fields_total,
          status,
          started_at: started_at || new Date().toISOString(),
          completed_at: isComplete ? new Date().toISOString() : null
        })
        .select()
        .single()

      if (stepError) {
        console.error('[Onboarding Save] Error creating step in onboarding_steps:', stepError)
        const errorMsg = stepError.message || String(stepError)
        
        // Check if it's a schema issue
        if (errorMsg.includes('relation') || errorMsg.includes('schema cache') || errorMsg.includes('does not exist')) {
          return NextResponse.json({ 
            error: 'Database schema not set up. The onboarding_steps table does not exist.',
            details: errorMsg,
            hint: 'Please run the SQL migration in Supabase Dashboard > SQL Editor',
            migration_file: 'supabase/migrations/create_projects_and_onboarding_tables.sql'
          }, { status: 500 })
        }
        return NextResponse.json({ 
          error: `Failed to create step in onboarding_steps: ${errorMsg}`,
          details: stepError
        }, { status: 500 })
      }

      if (!newStep) {
        return NextResponse.json({ 
          error: 'Failed to create step: No data returned from onboarding_steps insert' 
        }, { status: 500 })
      }
      console.log('[Onboarding Save] Successfully created step in onboarding_steps table:', newStep.id)
      step = newStep
    }

    console.log('[Onboarding Save] Successfully saved to onboarding_steps table. Step ID:', step.id)
    
    return NextResponse.json({ 
      success: true, 
      step,
      project_id: project.id,
      message: 'Onboarding data saved to onboarding_steps table'
    })
  } catch (error: any) {
    console.error('[Onboarding Save] Error:', error)
    console.error('[Onboarding Save] Error stack:', error.stack)
    console.error('[Onboarding Save] Request body:', await request.clone().json().catch(() => 'Could not parse'))
    
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

