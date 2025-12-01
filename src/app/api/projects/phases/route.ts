import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * GET /api/projects/phases
 * Fetches phases for all projects (admin overview).
 * 
 * Authentication: Admin only
 * 
 * Query Parameters:
 * - kit_type (optional): Filter by 'LAUNCH' or 'GROWTH'
 * - status (optional): Filter by phase status
 * - limit (optional): Number of results (default: 100)
 * - offset (optional): Pagination offset (default: 0)
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
    const kitType = searchParams.get('kit_type')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query for projects with phases
    let projectsQuery = supabaseAdmin
      .from('projects')
      .select(`
        id,
        user_id,
        kit_type,
        current_day_of_14,
        next_from_us,
        next_from_you,
        onboarding_finished,
        onboarding_percent,
        created_at,
        updated_at,
        phases (
          id,
          phase_number,
          phase_id,
          title,
          subtitle,
          day_range,
          status,
          started_at,
          completed_at,
          checklist_items (
            id,
            label,
            is_done,
            sort_order
          ),
          phase_links (
            id,
            label,
            url,
            sort_order
          )
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (kitType) {
      projectsQuery = projectsQuery.eq('kit_type', kitType.toUpperCase())
    }

    const { data: projects, error: projectsError } = await projectsQuery

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      )
    }

    // Get auth users for email mapping
    const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers()
    const userIdToEmail = new Map<string, string>()
    if (authUsers) {
      authUsers.forEach(authUser => {
        if (authUser.email) {
          userIdToEmail.set(authUser.id, authUser.email)
        }
      })
    }

    // Process projects and filter by status if needed
    const processedProjects = (projects || []).map(project => {
      // Filter phases by status if provided
      let phases = project.phases || []
      if (status) {
        phases = phases.filter((phase: any) => phase.status === status.toUpperCase())
      }

      // Sort phases by phase_number
      phases = phases.sort((a: any, b: any) => a.phase_number - b.phase_number)

      // Sort checklist items and links
      phases = phases.map((phase: any) => ({
        ...phase,
        checklist_items: (phase.checklist_items || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
        phase_links: (phase.phase_links || []).sort((a: any, b: any) => a.sort_order - b.sort_order)
      }))

      return {
        ...project,
        email: userIdToEmail.get(project.user_id) || null,
        phases
      }
    }).filter(project => {
      // If status filter is applied, only include projects with matching phases
      if (status && (!project.phases || project.phases.length === 0)) {
        return false
      }
      return true
    })

    // Apply pagination
    const paginatedProjects = processedProjects.slice(offset, offset + limit)

    return NextResponse.json({
      projects: paginatedProjects,
      total: processedProjects.length,
      limit,
      offset,
      has_more: offset + limit < processedProjects.length
    })
  } catch (error: any) {
    console.error('Error fetching projects with phases:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

