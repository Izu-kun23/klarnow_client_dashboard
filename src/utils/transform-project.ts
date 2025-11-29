import { ProjectWithRelations, Phase } from '@/types/project'

/**
 * Transform Supabase project data to match TypeScript interfaces
 * Supabase returns nested relations as snake_case (checklist_items, phase_links)
 * but our interfaces expect camelCase (checklist, links)
 */
export function transformProject(project: any): ProjectWithRelations | null {
  if (!project) return null

  // Transform phases: convert checklist_items -> checklist, phase_links -> links
  const transformedPhases: Phase[] = (project.phases || []).map((phase: any) => ({
    ...phase,
    checklist: phase.checklist_items || phase.checklist || [],
    links: phase.phase_links || phase.links || [],
    // Remove the snake_case versions
    checklist_items: undefined,
    phase_links: undefined,
  }))

  return {
    ...project,
    phases: transformedPhases,
  }
}

/**
 * Transform a single phase
 */
export function transformPhase(phase: any): Phase {
  return {
    ...phase,
    checklist: phase.checklist_items || phase.checklist || [],
    links: phase.phase_links || phase.links || [],
    checklist_items: undefined,
    phase_links: undefined,
  }
}

