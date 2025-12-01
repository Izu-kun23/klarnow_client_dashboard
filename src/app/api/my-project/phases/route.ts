import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ProjectWithMergedPhases } from '@/types/project'
import { getPhaseStructureForKitType, mergePhaseStructureWithState } from '@/lib/phase-structure'
import { validatePhaseId, validateChecklistLabel } from '@/utils/phase-state'
import { getUserFromRequest, getUserIdFromEmail } from '@/utils/auth'

/**
 * GET /api/my-project/phases
 * Fetches the authenticated user's project with phases from the phases table.
 * 
 * Authentication: Required (user must be logged in)
 * 
 * Response: Project with phases fetched from database (phases table)
 */
export async function GET(request: Request) {
  try {
    // Get user from request (mock auth)
    const { searchParams } = new URL(request.url)
    const emailParam = searchParams.get('email')
    
    let userEmail: string | null = null
    let userId: string | null = null

    const userFromHeaders = await getUserFromRequest()
    if (userFromHeaders) {
      userEmail = userFromHeaders.email
      userId = userFromHeaders.userId
    } else if (emailParam) {
      userEmail = emailParam.toLowerCase().trim()
      userId = getUserIdFromEmail(userEmail)
    }

    if (!userEmail || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized - email required' },
        { status: 401 }
      )
    }

    // Fetch client record
    let client = await prisma.client.findFirst({
      where: {
        OR: [
          { userId },
          { email: userEmail }
        ]
      }
    })

    if (!client) {
      // Return empty project with hardcoded phases
      const quizSubmission = await prisma.quizSubmission.findFirst({
        where: { email: userEmail },
        orderBy: { createdAt: 'desc' }
      })
      const kitType = quizSubmission?.preferredKit || 'LAUNCH'
      const structure = getPhaseStructureForKitType(kitType)
      const mergedPhases = mergePhaseStructureWithState(structure, null)
      
      return NextResponse.json({
        project: {
          id: null,
          user_id: userId,
          email: userEmail,
          kit_type: kitType,
          current_day_of_14: null,
          next_from_us: null,
          next_from_you: null,
          onboarding_finished: false,
          onboarding_percent: 0,
          phases_state: null,
          phases: mergedPhases
        }
      })
    }

    const onboardingFinished = !!client

    // Fetch phase state from client_phase_state table
    const phaseStates = await prisma.clientPhaseState.findMany({
      where: { clientId: client.id },
      orderBy: { phaseId: 'asc' }
    })

    // Convert phase states to the format expected by mergePhaseStructureWithState
    const phasesState: Record<string, any> = {}
    phaseStates.forEach(ps => {
      phasesState[ps.phaseId] = {
        status: ps.status,
        started_at: ps.startedAt?.toISOString() || null,
        completed_at: ps.completedAt?.toISOString() || null,
        checklist: ps.checklist || {}
      }
    })

    // Use hardcoded phase structure
    const structure = getPhaseStructureForKitType(client.plan as 'LAUNCH' | 'GROWTH')
    const mergedPhases = mergePhaseStructureWithState(
      structure,
      Object.keys(phasesState).length > 0 ? phasesState : null
    )

    // Build response with merged phases
    const projectWithPhases: ProjectWithMergedPhases = {
      id: client.id,
      user_id: client.userId,
      kit_type: client.plan as 'LAUNCH' | 'GROWTH',
      current_day_of_14: client.currentDayOf14,
      next_from_us: client.nextFromUs,
      next_from_you: client.nextFromYou,
      onboarding_finished: onboardingFinished,
      onboarding_percent: client.onboardingPercent,
      phases_state: Object.keys(phasesState).length > 0 ? phasesState : null,
      created_at: client.createdAt.toISOString(),
      updated_at: client.updatedAt.toISOString(),
      phases: mergedPhases
    }

    return NextResponse.json({
      project: projectWithPhases
    })
  } catch (error: any) {
    console.error('Error fetching phases state:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/my-project/phases
 * Updates a checklist item for the authenticated user's project.
 * 
 * Authentication: Required (user must be logged in)
 * 
 * Request Body:
 * {
 *   phase_id: string (e.g., "PHASE_1"),
 *   checklist_label: string (e.g., "Onboarding steps completed"),
 *   is_done: boolean
 * }
 * 
 * Updates the checklist_items table directly in the database.
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { phase_id, checklist_label, is_done } = body

    // Validate request body
    if (!phase_id || !checklist_label || typeof is_done !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: phase_id, checklist_label, and is_done are required' },
        { status: 400 }
      )
    }

    // Get user from request (mock auth)
    const userFromHeaders = await getUserFromRequest()
    if (!userFromHeaders) {
      return NextResponse.json(
        { error: 'Unauthorized - email required' },
        { status: 401 }
      )
    }

    const { email: userEmail, userId } = userFromHeaders

    // Fetch client record
    const client = await prisma.client.findFirst({
      where: {
        OR: [
          { userId },
          { email: userEmail }
        ]
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found. Please complete onboarding first.' },
        { status: 404 }
      )
    }

    // Validate phase_id and checklist_label
    const kitType = client.plan as 'LAUNCH' | 'GROWTH'
    if (!validatePhaseId(kitType, phase_id)) {
      return NextResponse.json(
        { error: `Invalid phase_id: ${phase_id}` },
        { status: 400 }
      )
    }

    if (!validateChecklistLabel(kitType, phase_id, checklist_label)) {
      return NextResponse.json(
        { error: `Invalid checklist_label: ${checklist_label} for phase ${phase_id}` },
        { status: 400 }
      )
    }

    // Fetch current phase state
    const currentPhaseState = await prisma.clientPhaseState.findUnique({
      where: {
        clientId_phaseId: {
          clientId: client.id,
          phaseId: phase_id
        }
      }
    })

    // Get or initialize checklist
    const currentChecklist = (currentPhaseState?.checklist as Record<string, boolean>) || {}
    const updatedChecklist = {
      ...currentChecklist,
      [checklist_label]: is_done
    }

    // Determine if we should update status to IN_PROGRESS
    // Only update if:
    // 1. A checklist item is being checked (is_done = true)
    // 2. Current status is NOT_STARTED
    const shouldUpdateToInProgress = is_done && 
      (!currentPhaseState || currentPhaseState.status === 'NOT_STARTED')

    // Prepare update data
    const updateData: any = {
      checklist: updatedChecklist
    }

    // Update status and startedAt if needed
    if (shouldUpdateToInProgress) {
      updateData.status = 'IN_PROGRESS'
      // Set startedAt if it's not already set
      if (!currentPhaseState?.startedAt) {
        updateData.startedAt = new Date()
      }
    }

    // Update or insert phase state
    if (currentPhaseState) {
      // Update existing phase state
      await prisma.clientPhaseState.update({
        where: { id: currentPhaseState.id },
        data: updateData
      })
    } else {
      // Create new phase state entry
      await prisma.clientPhaseState.create({
        data: {
          clientId: client.id,
          phaseId: phase_id,
          status: shouldUpdateToInProgress ? 'IN_PROGRESS' : 'NOT_STARTED',
          checklist: updatedChecklist,
          startedAt: shouldUpdateToInProgress ? new Date() : null
        }
      })
    }

    // Fetch all phase states for response
    const allPhaseStates = await prisma.clientPhaseState.findMany({
      where: { clientId: client.id },
      orderBy: { phaseId: 'asc' }
    })

    // Convert phase states to the format expected by mergePhaseStructureWithState
    const phasesState: Record<string, any> = {}
    allPhaseStates.forEach(ps => {
      phasesState[ps.phaseId] = {
        status: ps.status,
        started_at: ps.startedAt?.toISOString() || null,
        completed_at: ps.completedAt?.toISOString() || null,
        checklist: ps.checklist || {}
      }
    })

    // Merge updated state with structure for response
    const structure = getPhaseStructureForKitType(kitType)
    const mergedPhases = mergePhaseStructureWithState(
      structure,
      Object.keys(phasesState).length > 0 ? phasesState : null
    )

    const projectWithPhases: ProjectWithMergedPhases = {
      id: client.id,
      user_id: client.userId,
      kit_type: kitType,
      current_day_of_14: client.currentDayOf14,
      next_from_us: client.nextFromUs,
      next_from_you: client.nextFromYou,
      onboarding_finished: true,
      onboarding_percent: client.onboardingPercent,
      phases_state: Object.keys(phasesState).length > 0 ? phasesState : null,
      created_at: client.createdAt.toISOString(),
      updated_at: client.updatedAt.toISOString(),
      phases: mergedPhases
    }

    // Fetch updated phase state to get the new status
    const updatedPhaseState = await prisma.clientPhaseState.findUnique({
      where: {
        clientId_phaseId: {
          clientId: client.id,
          phaseId: phase_id
        }
      }
    })

    console.log('[API PATCH] Successfully updated checklist item in database:', {
      phase_id,
      checklist_label,
      is_done,
      clientId: client.id,
      updatedChecklist: updatedChecklist,
      newStatus: updatedPhaseState?.status,
      statusChanged: shouldUpdateToInProgress
    })

    return NextResponse.json({
      success: true,
      project: projectWithPhases
    })
  } catch (error: any) {
    console.error('[API PATCH] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}


