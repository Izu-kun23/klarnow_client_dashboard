import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * PATCH /api/projects/[project_id]/phases/[phase_id]/checklist/[item_id]
 * Update checklist item status.
 * 
 * Authentication: Admin only
 * 
 * Request Body:
 * {
 *   is_done: boolean,
 *   label?: string (optional, to update label),
 *   sort_order?: number (optional, to update order)
 * }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ project_id: string; phase_id: string; item_id: string }> }
) {
  try {
    const { project_id, phase_id, item_id } = await params
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

    // Validate checklist item belongs to phase, and phase belongs to project
    const { data: checklistItem, error: itemError } = await supabaseAdmin
      .from('checklist_items')
      .select(`
        id,
        phase_id,
        phases!inner (
          id,
          project_id
        )
      `)
      .eq('id', item_id)
      .eq('phase_id', phase_id)
      .single()

    if (itemError || !checklistItem) {
      return NextResponse.json(
        { error: 'Checklist item not found or does not belong to this phase' },
        { status: 404 }
      )
    }

    // Verify phase belongs to project
    const phase = (checklistItem as any).phases
    if (phase.project_id !== project_id) {
      return NextResponse.json(
        { error: 'Phase does not belong to this project' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (body.is_done !== undefined) {
      updateData.is_done = body.is_done
    }
    if (body.label !== undefined) {
      updateData.label = body.label
    }
    if (body.sort_order !== undefined) {
      updateData.sort_order = body.sort_order
    }

    // Update checklist item
    const { data: updatedItem, error: updateError } = await supabaseAdmin
      .from('checklist_items')
      .update(updateData)
      .eq('id', item_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating checklist item:', updateError)
      return NextResponse.json(
        { error: 'Failed to update checklist item' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      checklist_item: updatedItem,
      message: 'Checklist item updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating checklist item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

