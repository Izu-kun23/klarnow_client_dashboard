import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string, stepId: string }> }
) {
  const { projectId, stepId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Verify project ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()
  
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }
  
  const body = await request.json()
  const { fields, required_fields_completed } = body
  
  // Get the step to check required_fields_total
  const { data: stepData } = await supabase
    .from('onboarding_steps')
    .select('required_fields_total')
    .eq('id', stepId)
    .single()
  
  if (!stepData) {
    return NextResponse.json({ error: 'Step not found' }, { status: 404 })
  }
  
  const isComplete = required_fields_completed === stepData.required_fields_total
  
  // Update step
  const { data: step, error } = await supabase
    .from('onboarding_steps')
    .update({
      fields,
      required_fields_completed,
      status: isComplete ? 'DONE' : 'IN_PROGRESS',
      updated_at: new Date().toISOString(),
      completed_at: isComplete ? new Date().toISOString() : null,
      started_at: body.started_at || undefined
    })
    .eq('id', stepId)
    .eq('project_id', projectId)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true, step })
}

