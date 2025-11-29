import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { transformProject } from '@/utils/transform-project'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Fetch user's project
  const { data: project, error } = await supabase
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
    .eq('user_id', user.id)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Transform project data to match TypeScript interfaces
  const transformedProject = transformProject(project)
  
  // If no project exists, return null (client will initialize)
  return NextResponse.json({ project: transformedProject })
}

