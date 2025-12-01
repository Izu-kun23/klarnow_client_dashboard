import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPhaseStructureForKitType } from '@/lib/phase-structure'
import { createHash } from 'crypto'

interface OnboardingStep {
  step_number: number
  title: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE'
  required_fields_total: number
  required_fields_completed: number
  time_estimate: string
  fields: Record<string, any>
  started_at: string | null
  completed_at: string | null
}

interface CompleteOnboardingRequest {
  email: string
  kit_type: 'LAUNCH' | 'GROWTH'
  steps: OnboardingStep[]
}

/**
 * POST /api/onboarding/complete
 * Database flow using Prisma:
 * 1. Generates userId from email (mock auth)
 * 2. Saves onboarding answers to onboarding_answers table
 * 3. Creates client record in clients table
 * 4. Initializes client_phase_state entries for all phases
 */
export async function POST(request: Request) {
  try {
    const body: CompleteOnboardingRequest = await request.json()
    const { email, kit_type, steps } = body

    // Validate input
    if (!email || !kit_type || !steps) {
      return NextResponse.json(
        { error: 'Email, kit_type, and steps are required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(steps) || steps.length !== 3) {
      return NextResponse.json(
        { error: 'Exactly 3 steps are required' },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase().trim()

    // Step 1: Generate userId from email (mock auth - consistent hash)
    console.log('[Onboarding Complete] Generating userId from email...')
    const userId = createHash('sha256').update(emailLower).digest('hex').substring(0, 32)
    console.log('[Onboarding Complete] Using userId:', userId)

    // Step 2: Save onboarding answers to onboarding_answers table
    console.log('[Onboarding Complete] Saving onboarding answers...')
    
    // Ensure all fields are included (including prefilled ones)
    const stepsWithAllFields = steps.map(step => {
      // Ensure fields object includes ALL fields
      const completeFields = { ...(step.fields || {}) }
      const fieldCount = Object.keys(completeFields).length
      console.log(`[Onboarding Complete] Step ${step.step_number} has ${fieldCount} fields:`, Object.keys(completeFields))
      
      return {
        step_number: step.step_number,
        title: step.title,
        status: step.status,
        required_fields_total: step.required_fields_total,
        required_fields_completed: step.required_fields_completed,
        time_estimate: step.time_estimate,
        fields: completeFields, // ALL fields including prefilled ones
        started_at: step.started_at,
        completed_at: step.completed_at
      }
    })
    
    // Combine all steps into a single answers object
    const answers = {
      steps: stepsWithAllFields,
      kit_type,
      completed_at: new Date().toISOString()
    }
    
    console.log('[Onboarding Complete] Total fields across all steps:', 
      stepsWithAllFields.reduce((sum, s) => sum + Object.keys(s.fields || {}).length, 0))

    // Check if onboarding_answers already exists for this user
    const existingAnswers = await prisma.onboardingAnswer.findFirst({
      where: { userId }
    })

    let onboardingAnswersId: string

    if (existingAnswers) {
      // Update existing onboarding answers
      console.log('[Onboarding Complete] Updating existing onboarding answers...')
      const updatedAnswers = await prisma.onboardingAnswer.update({
        where: { id: existingAnswers.id },
        data: {
          answers,
          completedAt: new Date()
        }
      })

      onboardingAnswersId = updatedAnswers.id
      console.log('[Onboarding Complete] Updated onboarding answers:', onboardingAnswersId)
        } else {
      // Create new onboarding answers
      console.log('[Onboarding Complete] Creating new onboarding answers...')
      const newAnswers = await prisma.onboardingAnswer.create({
        data: {
          userId,
          answers,
          completedAt: new Date()
        }
      })

      onboardingAnswersId = newAnswers.id
      console.log('[Onboarding Complete] Created onboarding answers:', onboardingAnswersId)
    }

    // Step 3: Create or update client record
    console.log('[Onboarding Complete] Creating/updating client record...')
    
    // Extract name from "Your name and role" field in Step 1
    // This is the primary source for the client name
    const step1Fields = steps[0]?.fields || {}
    const name = step1Fields.name_and_role || null
    
    console.log('[Onboarding Complete] Extracted name from "Your name and role" field:', {
      name_and_role: step1Fields.name_and_role,
      extracted: name
    })

    // Check if client already exists
    const existingClient = await prisma.client.findFirst({
      where: {
        userId,
        plan: kit_type
      }
    })

    let clientId: string

    if (existingClient) {
      // Update existing client
      console.log('[Onboarding Complete] Updating existing client...')
      
      // Use name_and_role from Step 1, or keep existing name if not provided
      // Fallback to email username if neither is available
      const clientName = name || existingClient.name || emailLower.split('@')[0] || 'Client'
      
      console.log('[Onboarding Complete] Client name to save:', clientName)
      
      const updatedClient = await prisma.client.update({
        where: { id: existingClient.id },
        data: {
          name: clientName,
          email: emailLower,
          onboardingAnswersId
        }
      })

      clientId = updatedClient.id
      console.log('[Onboarding Complete] Updated client:', clientId)
    } else {
      // Create new client
      console.log('[Onboarding Complete] Creating new client...')
      
      // Use name_and_role from Step 1, or fallback to email username if not provided
      const clientName = name || emailLower.split('@')[0] || 'Client'
      
      console.log('[Onboarding Complete] Client name to save:', clientName)
      
      const newClient = await prisma.client.create({
        data: {
          userId,
          name: clientName,
          email: emailLower,
          plan: kit_type,
          onboardingAnswersId
        }
      })

      clientId = newClient.id
      console.log('[Onboarding Complete] Created client:', clientId)
    }

    // Step 4: Initialize client_phase_state entries
    console.log('[Onboarding Complete] Initializing phase state entries...')
    
    // Get phase structure from frontend code
    const phaseStructure = getPhaseStructureForKitType(kit_type)
    
    // Check if phase state already exists
    const existingPhaseState = await prisma.clientPhaseState.findFirst({
      where: { clientId }
    })

    if (!existingPhaseState) {
      // Initialize phase state for all phases
      for (const phase of phaseStructure) {
        // Initialize checklist with all items set to false
        const checklist: Record<string, boolean> = {}
        phase.checklist.forEach(label => {
          checklist[label] = false
        })

        try {
          await prisma.clientPhaseState.create({
            data: {
              clientId,
              phaseId: phase.phase_id,
              status: 'NOT_STARTED',
              checklist
            }
          })
          console.log(`[Onboarding Complete] Created phase state for ${phase.phase_id}`)
        } catch (error) {
          console.error(`[Onboarding Complete] Error creating phase state for ${phase.phase_id}:`, error)
          // Continue with other phases even if one fails
        }
      }

      console.log('[Onboarding Complete] Phase state initialized for all phases')
    } else {
      console.log('[Onboarding Complete] Phase state already exists, skipping initialization')
    }

    console.log('[Onboarding Complete] Onboarding saved successfully!')
    return NextResponse.json({
      success: true,
      client: {
        id: clientId,
        user_id: userId,
        plan: kit_type,
        email: emailLower
      },
      onboarding_answers_id: onboardingAnswersId,
      user_id: userId
    })
  } catch (error: any) {
    console.error('[Onboarding Complete] Unexpected error:', error)
    console.error('[Onboarding Complete] Error stack:', error.stack)
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

