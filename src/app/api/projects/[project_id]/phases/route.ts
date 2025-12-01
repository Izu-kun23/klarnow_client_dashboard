import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * GET /api/projects/[project_id]/phases
 * Fetches all phases for a specific project with checklist items and links.
 * 
 * Authentication: Admin only
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ project_id: string }> }
) {
  try {
    const { project_id } = await params
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

    // Fetch phases with checklist items and links
    const { data: phases, error: phasesError } = await supabaseAdmin
      .from('phases')
      .select(`
        *,
        checklist_items (*),
        phase_links (*)
      `)
      .eq('project_id', project_id)
      .order('phase_number', { ascending: true })

    if (phasesError) {
      console.error('Error fetching phases:', phasesError)
      return NextResponse.json(
        { error: 'Failed to fetch phases' },
        { status: 500 }
      )
    }

    // Sort checklist items and links by sort_order
    const phasesWithSortedData = phases?.map(phase => ({
      ...phase,
      checklist_items: phase.checklist_items
        ?.sort((a, b) => a.sort_order - b.sort_order) || [],
      phase_links: phase.phase_links
        ?.sort((a, b) => a.sort_order - b.sort_order) || []
    }))

    return NextResponse.json({
      phases: phasesWithSortedData || [],
      project_id
    })
  } catch (error: any) {
    console.error('Error fetching phases:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

