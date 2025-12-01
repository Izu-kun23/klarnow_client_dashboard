import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * PATCH /api/projects/[project_id]
 * Update project fields (current_day_of_14, next_from_us, next_from_you).
 * 
 * Authentication: Admin only
 * 
 * Request Body:
 * {
 *   current_day_of_14?: number (1-14),
 *   next_from_us?: string,
 *   next_from_you?: string
 * }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ project_id: string }> }
) {
  try {
    const { project_id } = await params
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

    // Validate project exists
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Validate current_day_of_14 if provided
    if (body.current_day_of_14 !== undefined) {
      const day = parseInt(String(body.current_day_of_14))
      if (isNaN(day) || day < 1 || day > 14) {
        return NextResponse.json(
          { error: 'current_day_of_14 must be a number between 1 and 14' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (body.current_day_of_14 !== undefined) {
      updateData.current_day_of_14 = body.current_day_of_14
    }
    if (body.next_from_us !== undefined) {
      updateData.next_from_us = body.next_from_us
    }
    if (body.next_from_you !== undefined) {
      updateData.next_from_you = body.next_from_you
    }

    // Update project
    const { data: updatedProject, error: updateError } = await supabaseAdmin
      .from('projects')
      .update(updateData)
      .eq('id', project_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating project:', updateError)
      return NextResponse.json(
        { error: 'Failed to update project' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      project: updatedProject,
      message: 'Project updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

