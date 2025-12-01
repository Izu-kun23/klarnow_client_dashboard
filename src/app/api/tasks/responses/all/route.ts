import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest, getUserIdFromEmail } from '@/utils/auth'

/**
 * GET /api/tasks/responses/all
 * Fetches all responses across all tasks (activity feed style)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const emailParam = searchParams.get('email')
    const clientId = searchParams.get('client_id')
    const clientEmail = searchParams.get('client_email')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

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

    // Build where clause for tasks
    const taskWhere: any = {}
    if (clientId) {
      taskWhere.clientId = clientId
    } else if (clientEmail) {
      const client = await prisma.client.findFirst({
        where: { email: clientEmail.toLowerCase().trim() }
      })
      if (client) {
        taskWhere.clientId = client.id
      } else {
        return NextResponse.json({
          responses: [],
          pagination: {
            total: 0,
            limit,
            offset: 0,
            has_more: false
          }
        })
      }
    }

    // Fetch all tasks that match criteria
    const tasks = await (prisma as any).task.findMany({
      where: taskWhere,
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

    // Extract all responses from tasks
    const allResponses: any[] = []

    tasks.forEach((task: any) => {
      const metadata = (task.metadata as any) || {}
      const responses = metadata.responses || []

      responses.forEach((response: any, idx: number) => {
        const responseDate = new Date(response.createdAt || response.created_at)
        
        // Filter by date range if specified
        if (dateFrom && responseDate < new Date(dateFrom)) {
          return
        }
        if (dateTo && responseDate > new Date(dateTo)) {
          return
        }

        allResponses.push({
          id: `response-${task.id}-${idx}`,
          task_id: task.id,
          task_title: task.title,
          client_id: task.clientId,
          client_name: task.client.name,
          client_email: task.client.email,
          text: response.text,
          created_at: response.createdAt || response.created_at,
          created_by: response.createdBy || response.created_by,
          attachments: response.attachments || []
        })
      })
    })

    // Sort by created_at descending (newest first)
    allResponses.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    // Apply pagination
    const total = allResponses.length
    const paginatedResponses = allResponses.slice(offset, offset + limit)

    return NextResponse.json({
      responses: paginatedResponses,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total
      }
    })
  } catch (error: any) {
    console.error('[API GET /api/tasks/responses/all] Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

