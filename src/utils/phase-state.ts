/**
 * Phase State Utility Functions
 * 
 * Functions for managing the phases_state JSONB column in the projects table.
 * These utilities handle updating checklist items and phase status.
 */

import { PhaseState } from '@/types/project'
import { getPhaseStructureForKitType } from '@/lib/phase-structure'
import { KitType } from '@/types/project'

/**
 * Update a checklist item in phases_state JSONB
 * Only updates the checklist item, does not modify phase status
 */
export function updateChecklistItem(
  phasesState: Record<string, PhaseState> | null,
  phaseId: string,
  checklistLabel: string,
  isDone: boolean
): Record<string, PhaseState> {
  // Initialize state if null
  const state = phasesState || {}

  // Get or create phase state
  const phaseState: PhaseState = state[phaseId] || {
    status: 'NOT_STARTED',
    checklist: {}
  }

  // Update checklist item
  const updatedChecklist = {
    ...phaseState.checklist,
    [checklistLabel]: isDone
  }

  // Return updated state
  return {
    ...state,
    [phaseId]: {
      ...phaseState,
      checklist: updatedChecklist
    }
  }
}

/**
 * Get phase state for a specific phase
 */
export function getPhaseState(
  phasesState: Record<string, PhaseState> | null,
  phaseId: string
): PhaseState | null {
  if (!phasesState) return null
  return phasesState[phaseId] || null
}

/**
 * Update phase status (admin only - clients cannot use this)
 * This is kept here for reference but should only be called from admin API
 */
export function updatePhaseStatus(
  phasesState: Record<string, PhaseState> | null,
  phaseId: string,
  status: PhaseState['status'],
  startedAt?: string | null,
  completedAt?: string | null
): Record<string, PhaseState> {
  const state = phasesState || {}
  const phaseState: PhaseState = state[phaseId] || {
    status: 'NOT_STARTED',
    checklist: {}
  }

  return {
    ...state,
    [phaseId]: {
      ...phaseState,
      status,
      started_at: startedAt !== undefined ? startedAt : phaseState.started_at,
      completed_at: completedAt !== undefined ? completedAt : phaseState.completed_at
    }
  }
}

/**
 * Validate that a phase_id exists in the structure for the given kit type
 */
export function validatePhaseId(kitType: KitType, phaseId: string): boolean {
  const structure = getPhaseStructureForKitType(kitType)
  return structure.some(phase => phase.phase_id === phaseId)
}

/**
 * Validate that a checklist label exists for a phase in the structure
 */
export function validateChecklistLabel(
  kitType: KitType,
  phaseId: string,
  checklistLabel: string
): boolean {
  const structure = getPhaseStructureForKitType(kitType)
  const phase = structure.find(p => p.phase_id === phaseId)
  if (!phase) return false
  return phase.checklist.includes(checklistLabel)
}

/**
 * Initialize phases_state from structure (for new projects)
 */
export function initializePhasesState(kitType: KitType): Record<string, PhaseState> {
  const structure = getPhaseStructureForKitType(kitType)
  const state: Record<string, PhaseState> = {}

  structure.forEach(phase => {
    const checklistState: Record<string, boolean> = {}
    phase.checklist.forEach(label => {
      checklistState[label] = false
    })

    state[phase.phase_id] = {
      status: 'NOT_STARTED',
      checklist: checklistState
    }
  })

  return state
}

