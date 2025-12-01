import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * GET /api/my-project/progress
 * Get calculated progress metrics for easy display.
 * 
 * Authentication: Required
 * 
 * Response: Pre-calculated progress metrics including:
 * - Overall phase progress
 * - Checklist item progress
 * - Current phase information
 * - Next actions
 * - Timeline information
 * 
 * Note: This is optional - progress can also be computed client-side from /api/my-project response
 */
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use admin client to bypass RLS
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Find user's project
    let project = null
    
    if (user.id) {
      const { data: projectByUserId } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (projectByUserId) {
        project = projectByUserId
      }
    }

    if (!project && user.email) {
      const emailLower = user.email.toLowerCase().trim()
      const { data: projectByEmail } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('email', emailLower)
        .maybeSingle()
      
      if (projectByEmail) {
        project = projectByEmail
      }
    }

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Fetch phases with checklist items
    const { data: phasesData } = await supabaseAdmin
      .from('phases')
      .select(`
        id,
        phase_id,
        phase_number,
        title,
        status,
        checklist_items (
          id,
          is_done
        )
      `)
      .eq('project_id', project.id)
      .order('phase_number', { ascending: true })

    const phases = phasesData || []

    // Calculate overall phase progress
    const totalPhases = phases.length
    const completedPhases = phases.filter(p => p.status === 'DONE').length
    const inProgressPhases = phases.filter(p => p.status === 'IN_PROGRESS').length
    const notStartedPhases = phases.filter(p => p.status === 'NOT_STARTED').length
    const phaseCompletionPercent = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0

    // Calculate checklist progress
    let totalItems = 0
    let completedItems = 0

    phases.forEach((phase: any) => {
      if (phase.checklist_items) {
        phase.checklist_items.forEach((item: any) => {
          totalItems++
          if (item.is_done) completedItems++
        })
      }
    })

    const checklistCompletionPercent = totalItems > 0 
      ? Math.round((completedItems / totalItems) * 100 * 10) / 10 
      : 0

    // Find current phase
    const inProgressPhase = phases.find((p: any) => p.status === 'IN_PROGRESS')
    const waitingPhase = phases.find((p: any) => p.status === 'WAITING_ON_CLIENT')
    const donePhases = phases.filter((p: any) => p.status === 'DONE')
      .sort((a: any, b: any) => b.phase_number - a.phase_number)
    
    let currentPhase = inProgressPhase || waitingPhase || (donePhases.length > 0 ? donePhases[0] : phases[0]) || null

    // Calculate current phase checklist completion
    let currentPhaseChecklistCompletion = null
    if (currentPhase && currentPhase.checklist_items) {
      const phaseItems = currentPhase.checklist_items
      const phaseCompleted = phaseItems.filter((item: any) => item.is_done).length
      const phaseTotal = phaseItems.length
      const phasePercent = phaseTotal > 0 
        ? Math.round((phaseCompleted / phaseTotal) * 100 * 10) / 10 
        : 0

      currentPhaseChecklistCompletion = {
        completed: phaseCompleted,
        total: phaseTotal,
        percent: phasePercent
      }
    }

    // Timeline information
    const currentDay = project.current_day_of_14 || 0
    const totalDays = 14
    const daysRemaining = Math.max(0, totalDays - currentDay)
    const timelinePercent = Math.round((currentDay / totalDays) * 100 * 10) / 10

    return NextResponse.json({
      overall_progress: {
        total_phases: totalPhases,
        completed_phases: completedPhases,
        in_progress_phases: inProgressPhases,
        not_started_phases: notStartedPhases,
        phase_completion_percent: phaseCompletionPercent
      },
      checklist_progress: {
        total_items: totalItems,
        completed_items: completedItems,
        remaining_items: totalItems - completedItems,
        completion_percent: checklistCompletionPercent
      },
      current_phase: currentPhase ? {
        phase_id: currentPhase.phase_id,
        phase_number: currentPhase.phase_number,
        title: currentPhase.title,
        status: currentPhase.status,
        checklist_completion: currentPhaseChecklistCompletion
      } : null,
      next_actions: {
        from_us: project.next_from_us,
        from_you: project.next_from_you
      },
      timeline: {
        current_day: currentDay,
        total_days: totalDays,
        days_remaining: daysRemaining,
        percent_complete: timelinePercent
      }
    })
  } catch (error: any) {
    console.error('[API GET /api/my-project/progress] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

