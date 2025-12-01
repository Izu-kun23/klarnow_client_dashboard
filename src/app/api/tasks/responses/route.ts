import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest, getUserIdFromEmail } from '@/utils/auth'

/**
 * GET /api/tasks/responses
 * Fetches all tasks with their responses, attachments, and metadata
 * Designed for admin/external systems to fetch task responses
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const emailParam = searchParams.get('email')
    const clientId = searchParams.get('client_id')
    const clientEmail = searchParams.get('client_email')
    const statusFilter = searchParams.get('status') as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | null
    const typeFilter = searchParams.get('type') as 'UPLOAD_FILE' | 'SEND_INFO' | 'PROVIDE_DETAILS' | 'REVIEW' | 'OTHER' | null
    const hasResponses = searchParams.get('has_responses')
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

    // Build where clause
    const where: any = {}

    // Filter by client
    if (clientId) {
      where.clientId = clientId
    } else if (clientEmail) {
      const client = await prisma.client.findFirst({
        where: { email: clientEmail.toLowerCase().trim() }
      })
      if (client) {
        where.clientId = client.id
      } else {
        // Client not found, return empty results
        return NextResponse.json({
          tasks: [],
          pagination: {
            total: 0,
            limit,
            offset: 0,
            has_more: false
          }
        })
      }
    }

    // Filter by status
    if (statusFilter) {
      where.status = statusFilter
    }

    // Filter by type
    if (typeFilter) {
      where.type = typeFilter
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo)
      }
    }

    // Fetch tasks
    const [tasks, total] = await Promise.all([
      (prisma as any).task.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      (prisma as any).task.count({ where })
    ])

    // Process tasks and filter by has_responses if needed
    let processedTasks = tasks.map((task: any) => {
      const metadata = (task.metadata as any) || {}
      const responses = metadata.responses || []
      const attachments = task.attachments || metadata.attachments || []

      return {
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
        created_by: task.createdBy,
        responses: responses.map((r: any, idx: number) => ({
          id: `response-${task.id}-${idx}`,
          text: r.text,
          created_at: r.createdAt || r.created_at,
          created_by: r.createdBy || r.created_by
        })),
        attachments: attachments.map((a: any) => ({
          name: a.name,
          url: a.url,
          uploaded_at: a.uploaded_at || a.uploadedAt
        })),
        metadata: {
          responses: responses,
          attachments: attachments
        }
      }
    })

    // Filter by has_responses if specified
    if (hasResponses === 'true') {
      processedTasks = processedTasks.filter((task: any) => task.responses.length > 0)
    } else if (hasResponses === 'false') {
      processedTasks = processedTasks.filter((task: any) => task.responses.length === 0)
    }

    return NextResponse.json({
      tasks: processedTasks,
      pagination: {
        total: processedTasks.length,
        limit,
        offset,
        has_more: offset + limit < total
      }
    })
  } catch (error: any) {
    console.error('[API GET /api/tasks/responses] Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

