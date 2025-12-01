import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * PATCH /api/my-project/checklist/[item_id]
 * Updates a single checklist item's completion status.
 * 
 * Authentication: Required (user must be logged in)
 * 
 * Request Body:
 * {
 *   "is_done": true
 * }
 * 
 * Response:
 * {
 *   "checklist_item": { ... },
 *   "message": "Checklist item updated successfully"
 * }
 * 
 * Key Features:
 * - Simple single-item update
 * - Automatic ownership verification
 * - Real-time sync triggers automatically via Supabase Realtime
 */
export async function PATCH(
  request: Request,
  { params }: { params: { item_id: string } }
) {
  try {
    const body = await request.json()
    const { is_done } = body
    const { item_id } = params

    // Validate request body
    if (typeof is_done !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing or invalid field: is_done must be a boolean' },
        { status: 400 }
      )
    }

    if (!item_id) {
      return NextResponse.json(
        { error: 'Missing checklist item ID' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use admin client to bypass RLS for verification
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

    // First, verify that the checklist item exists and belongs to the user's project
    const { data: checklistItem, error: itemError } = await supabaseAdmin
      .from('checklist_items')
      .select(`
        id,
        phase_id,
        label,
        is_done,
        sort_order,
        created_at,
        updated_at,
        phases!inner (
          id,
          project_id,
          projects!inner (
            id,
            user_id,
            email
          )
        )
      `)
      .eq('id', item_id)
      .single()

    if (itemError || !checklistItem) {
      console.error('[API PATCH /api/my-project/checklist] Checklist item not found:', itemError)
      return NextResponse.json(
        { error: 'Checklist item not found' },
        { status: 404 }
      )
    }

    // Verify ownership: check if the project belongs to the user
    const project = (checklistItem.phases as any)?.projects
    if (!project) {
      console.error('[API PATCH /api/my-project/checklist] Project not found for checklist item')
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check ownership by user_id or email
    const isOwner = 
      (project.user_id && project.user_id === user.id) ||
      (project.email && project.email.toLowerCase().trim() === user.email?.toLowerCase().trim())

    if (!isOwner) {
      console.error('[API PATCH /api/my-project/checklist] User does not own this project:', {
        project_user_id: project.user_id,
        user_id: user.id,
        project_email: project.email,
        user_email: user.email
      })
      return NextResponse.json(
        { error: 'Forbidden: This checklist item does not belong to your project' },
        { status: 403 }
      )
    }

    // Update the checklist item
    const { data: updatedItem, error: updateError } = await supabaseAdmin
      .from('checklist_items')
      .update({
        is_done: is_done,
        updated_at: new Date().toISOString()
      })
      .eq('id', item_id)
      .select()
      .single()

    if (updateError || !updatedItem) {
      console.error('[API PATCH /api/my-project/checklist] Error updating checklist item:', updateError)
      return NextResponse.json(
        { error: 'Failed to update checklist item' },
        { status: 500 }
      )
    }

    console.log('[API PATCH /api/my-project/checklist] Successfully updated checklist item:', {
      item_id,
      is_done,
      label: updatedItem.label
    })

    return NextResponse.json({
      checklist_item: {
        id: updatedItem.id,
        phase_id: updatedItem.phase_id,
        label: updatedItem.label,
        sort_order: updatedItem.sort_order,
        is_done: updatedItem.is_done
      },
      message: 'Checklist item updated successfully'
    })
  } catch (error: any) {
    console.error('[API PATCH /api/my-project/checklist] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

