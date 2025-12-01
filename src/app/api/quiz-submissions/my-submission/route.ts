import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/quiz-submissions/my-submission
 * Fetches quiz submission by ID (preferred) or email (fallback)
 * This endpoint allows users to fetch their own quiz submission data
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const email = searchParams.get('email')

    // Prefer ID over email for accuracy
    if (id) {
      return await fetchById(id)
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Either id or email parameter is required' },
        { status: 400 }
      )
    }

    return await fetchByEmail(email)
  } catch (error: any) {
    console.error('Quiz submission fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function fetchById(id: string) {
  const submission = await prisma.quizSubmission.findUnique({
    where: { id }
  })

  if (!submission) {
    console.log(`No quiz submission found for ID: ${id}`)
    return NextResponse.json({ submission: null })
  }

  console.log(`Quiz submission fetched by ID: ${id} (Email: ${submission.email})`)
  return NextResponse.json({ 
    submission: {
      id: submission.id,
      full_name: submission.fullName,
      email: submission.email,
      phone_number: submission.phoneNumber,
      brand_name: submission.brandName,
      logo_status: submission.logoStatus,
      brand_goals: submission.brandGoals,
      online_presence: submission.onlinePresence,
      audience: submission.audience,
      brand_style: submission.brandStyle,
      timeline: submission.timeline,
      preferred_kit: submission.preferredKit,
      created_at: submission.createdAt.toISOString(),
      updated_at: submission.updatedAt.toISOString()
    }
  })
}

async function fetchByEmail(email: string) {
  // Normalize email to ensure exact match
  const normalizedEmail = email.toLowerCase().trim()
  
  // Get the latest quiz submission for this EXACT email
  const submission = await prisma.quizSubmission.findFirst({
    where: { email: normalizedEmail },
    orderBy: { createdAt: 'desc' }
  })

  if (!submission) {
    console.log(`No quiz submission found for email: ${normalizedEmail}`)
    return NextResponse.json({ submission: null })
  }

  console.log(`Quiz submission fetched for email: ${normalizedEmail} (ID: ${submission.id})`)
  return NextResponse.json({ 
    submission: {
      id: submission.id,
      full_name: submission.fullName,
      email: submission.email,
      phone_number: submission.phoneNumber,
      brand_name: submission.brandName,
      logo_status: submission.logoStatus,
      brand_goals: submission.brandGoals,
      online_presence: submission.onlinePresence,
      audience: submission.audience,
      brand_style: submission.brandStyle,
      timeline: submission.timeline,
      preferred_kit: submission.preferredKit,
      created_at: submission.createdAt.toISOString(),
      updated_at: submission.updatedAt.toISOString()
    }
  })
}

