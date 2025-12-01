import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * PATCH /api/projects/[project_id]/phases/[phase_id]
 * Update phase status and timestamps.
 * 
 * Authentication: Admin only
 * 
 * Request Body:
 * {
 *   status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'WAITING_ON_CLIENT' | 'DONE',
 *   started_at?: string (ISO timestamp),
 *   completed_at?: string (ISO timestamp)
 * }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ project_id: string; phase_id: string }> }
) {
  try {
    const { project_id, phase_id } = await params
    const body = await request.json()
    
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

    // Validate phase belongs to project
    const { data: phase, error: phaseError } = await supabaseAdmin
      .from('phases')
      .select('id, project_id')
      .eq('id', phase_id)
      .eq('project_id', project_id)
      .single()

    if (phaseError || !phase) {
      return NextResponse.json(
        { error: 'Phase not found or does not belong to this project' },
        { status: 404 }
      )
    }

    // Validate status if provided
    if (body.status) {
      const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'DONE']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (body.status !== undefined) {
      updateData.status = body.status
      
      // Auto-update timestamps based on status
      if (body.status === 'IN_PROGRESS' && !body.started_at) {
        // Check if phase hasn't been started yet
        const { data: currentPhase } = await supabaseAdmin
          .from('phases')
          .select('started_at')
          .eq('id', phase_id)
          .single()
        
        if (!currentPhase?.started_at) {
          updateData.started_at = new Date().toISOString()
        }
      } else if (body.status === 'DONE' && !body.completed_at) {
        updateData.completed_at = new Date().toISOString()
      } else if (body.status === 'NOT_STARTED') {
        updateData.started_at = null
        updateData.completed_at = null
      }
    }

    // Allow manual override of timestamps
    if (body.started_at !== undefined) {
      updateData.started_at = body.started_at
    }
    if (body.completed_at !== undefined) {
      updateData.completed_at = body.completed_at
    }

    // Update phase
    const { data: updatedPhase, error: updateError } = await supabaseAdmin
      .from('phases')
      .update(updateData)
      .eq('id', phase_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating phase:', updateError)
      return NextResponse.json(
        { error: 'Failed to update phase' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      phase: updatedPhase,
      message: 'Phase updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating phase:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

