import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest, getUserIdFromEmail } from '@/utils/auth'

/**
 * GET /api/tasks/[id]/responses
 * Fetches all responses and attachments for a specific task
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const emailParam = searchParams.get('email')

    // Get user from request (admin authentication)
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

    // Fetch task with client info
    const task = await (prisma as any).task.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Extract responses and attachments from metadata
    const metadata = (task.metadata as any) || {}
    const responses = metadata.responses || []
    const attachments = task.attachments || metadata.attachments || []

    return NextResponse.json({
      task: {
        id: task.id,
        client_id: task.clientId,
        client_name: task.client.name,
        client_email: task.client.email,
        title: task.title,
        description: task.description,
        type: task.type,
        status: task.status,
        due_date: task.dueDate?.toISOString() || null,
        completed_at: task.completedAt?.toISOString() || null,
        created_at: task.createdAt.toISOString(),
        updated_at: task.updatedAt.toISOString(),
        created_by: task.createdBy
      },
      responses: responses.map((r: any, idx: number) => ({
        id: `response-${task.id}-${idx}`,
        text: r.text,
        created_at: r.createdAt || r.created_at,
        created_by: r.createdBy || r.created_by,
        attachments: r.attachments || []
      })),
      total_responses: responses.length
    })
  } catch (error: any) {
    console.error('[API GET /api/tasks/[id]/responses] Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

