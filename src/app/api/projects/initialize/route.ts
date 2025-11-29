import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { kit_type, email } = await request.json()
    
    console.log('[Project Initialize] Request received:', { kit_type, email: email?.substring(0, 5) + '...' })
    
    if (!kit_type || !['LAUNCH', 'GROWTH'].includes(kit_type)) {
      return NextResponse.json({ error: 'Invalid kit type' }, { status: 400 })
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json({ 
        error: 'Server configuration error: Missing Supabase credentials' 
      }, { status: 500 })
    }

    // Use service role for initialization (bypasses RLS)
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
    console.log('[Project Initialize] Looking up user:', emailLower)

    // Find or create auth user by email
    let authUser
    try {
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (listError) {
        console.error('[Project Initialize] Error listing users:', listError)
        return NextResponse.json({ 
          error: `Failed to lookup user: ${listError.message}` 
        }, { status: 500 })
      }
      
      authUser = users?.find(u => u.email?.toLowerCase() === emailLower)
      console.log('[Project Initialize] User found:', !!authUser)
    } catch (listErr: any) {
      console.error('[Project Initialize] Exception listing users:', listErr)
      return NextResponse.json({ 
        error: `Failed to lookup user: ${listErr.message}` 
      }, { status: 500 })
    }

    if (!authUser) {
      console.log('[Project Initialize] Creating new auth user')
      // Create auth user if it doesn't exist (passwordless, email confirmed)
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: emailLower,
        email_confirm: true, // Auto-confirm email
        // No password - user will use magic link or other auth method later
      })

      if (createError || !newUser?.user) {
        console.error('[Project Initialize] Error creating auth user:', createError)
        return NextResponse.json({ 
          error: `Failed to create user account: ${createError?.message || 'Unknown error'}` 
        }, { status: 500 })
      }

      authUser = newUser.user
      console.log('[Project Initialize] Auth user created:', authUser.id)
    }

    // Check if project already exists for this user and kit type
    const { data: existing } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('kit_type', kit_type)
      .single()
    
    if (existing) {
      // Return existing project instead of error
      const { data: existingProject } = await supabaseAdmin
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
        .eq('id', existing.id)
        .single()

      if (existingProject) {
        const { transformProject } = await import('@/utils/transform-project')
        const transformedProject = transformProject(existingProject)
        return NextResponse.json({ success: true, project: transformedProject })
      }
    }

    // Get user name from quiz submission or user profile
    let userName: string | null = null
    
    // Check quiz_submissions first
    const { data: quizSubmissions } = await supabaseAdmin
      .from('quiz_submissions')
      .select('full_name')
      .eq('email', emailLower)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (quizSubmissions && quizSubmissions.length > 0 && quizSubmissions[0]?.full_name) {
      userName = quizSubmissions[0].full_name
    }

    // Create or update user profile using upsert
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        email: emailLower,
        name: userName || authUser.user_metadata?.name || authUser.user_metadata?.full_name || null,
        kit_type,
        onboarding_finished: false,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })

    if (profileError) {
      console.error('Error upserting user profile:', profileError)
      // Continue anyway, not critical
    }

    // Create or update user_onboarding entry
    const { error: onboardingError } = await supabaseAdmin
      .from('user_onboarding')
      .upsert({
        email: emailLower,
        onboarding_finished: false,
        kit_type: kit_type,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })

    if (onboardingError) {
      console.error('Error upserting user_onboarding:', onboardingError)
      // Continue anyway, not critical
    }

    // Create project
    console.log('[Project Initialize] Creating project for user:', authUser.id, 'kit_type:', kit_type)
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        user_id: authUser.id,
        kit_type,
        onboarding_percent: 0,
        onboarding_finished: false
      })
      .select()
      .single()
    
    if (projectError) {
      console.error('[Project Initialize] Error creating project:', projectError)
      console.error('[Project Initialize] Project error details:', JSON.stringify(projectError, null, 2))
      return NextResponse.json({ 
        error: projectError.message,
        details: projectError 
      }, { status: 500 })
    }
    
    console.log('[Project Initialize] Project created:', project.id)
  
    // Initialize steps and phases based on kit type
    // According to LOGIN_AND_ONBOARDING_FLOWS.md: Projects must have 3 onboarding steps and 4 phases
    const rpcFunctionName = kit_type === 'LAUNCH' 
      ? 'initialize_launch_kit_project' 
      : 'initialize_growth_kit_project'
    
    console.log(`[Project Initialize] Calling RPC function: ${rpcFunctionName}`)
    
    const { data: rpcResult, error: initError } = await supabaseAdmin.rpc(rpcFunctionName, {
      p_project_id: project.id
    })
    
    if (initError) {
      console.error(`[Project Initialize] ${kit_type} Kit initialization error:`, initError)
      console.error('[Project Initialize] RPC error details:', JSON.stringify(initError, null, 2))
      
      // If RPC function doesn't exist, provide helpful error message
      if (initError.message?.includes('function') && initError.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: `Database function '${rpcFunctionName}' not found. Please run the database migrations.`,
          details: {
            message: initError.message,
            hint: 'Make sure you have run the migration that creates the initialize_launch_kit_project and initialize_growth_kit_project functions.'
          }
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        error: `Failed to initialize ${kit_type} Kit: ${initError.message}`,
        details: initError,
        rpc_function: rpcFunctionName
      }, { status: 500 })
    }
    
    console.log(`[Project Initialize] RPC function ${rpcFunctionName} completed successfully`)
    
    // Fetch the complete project with relations
    const { data: completeProject, error: fetchError } = await supabaseAdmin
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
      .eq('id', project.id)
      .single()
    
    if (fetchError) {
      console.error('[Project Initialize] Error fetching complete project:', fetchError)
      return NextResponse.json({ 
        error: `Project created but failed to fetch complete data: ${fetchError.message}`,
        details: fetchError
      }, { status: 500 })
    }
    
    // Validate project structure according to spec (LOGIN_AND_ONBOARDING_FLOWS.md)
    // Projects should have: onboarding_steps (3 steps) and phases (4 phases)
    if (!completeProject.onboarding_steps || completeProject.onboarding_steps.length === 0) {
      console.error('[Project Initialize] Project missing onboarding_steps')
      return NextResponse.json({ 
        error: 'Project initialized but onboarding steps were not created. Please check database migrations.',
        project_id: project.id
      }, { status: 500 })
    }
    
    if (!completeProject.phases || completeProject.phases.length === 0) {
      console.error('[Project Initialize] Project missing phases')
      return NextResponse.json({ 
        error: 'Project initialized but phases were not created. Please check database migrations.',
        project_id: project.id
      }, { status: 500 })
    }
    
    console.log(`[Project Initialize] Project initialized successfully with ${completeProject.onboarding_steps.length} steps and ${completeProject.phases.length} phases`)
    
    // Transform project data to match TypeScript interfaces
    const { transformProject } = await import('@/utils/transform-project')
    const transformedProject = transformProject(completeProject)
    
    return NextResponse.json({ success: true, project: transformedProject })
  } catch (error: any) {
    console.error('Error in project initialization:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
