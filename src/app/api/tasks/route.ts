import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest, getUserIdFromEmail } from '@/utils/auth'

/**
 * GET /api/tasks
 * Fetches tasks for the authenticated client
 * 
 * Authentication: Required (user must be logged in)
 * 
 * Query params:
 * - status: Filter by task status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
 * - type: Filter by task type (UPLOAD_FILE, SEND_INFO, PROVIDE_DETAILS, REVIEW, OTHER)
 * 
 * Response: Array of tasks for the client
 */
export async function GET(request: Request) {
  try {
    // Get user from request (mock auth - email from header or query param)
    const { searchParams } = new URL(request.url)
    const emailParam = searchParams.get('email')
    const statusFilter = searchParams.get('status') as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | null
    const typeFilter = searchParams.get('type') as 'UPLOAD_FILE' | 'SEND_INFO' | 'PROVIDE_DETAILS' | 'REVIEW' | 'OTHER' | null
    
    let userEmail: string | null = null
    let userId: string | null = null

    // Try to get from request headers first
    const userFromHeaders = await getUserFromRequest()
    if (userFromHeaders) {
      userEmail = userFromHeaders.email
      userId = userFromHeaders.userId
    } else if (emailParam) {
      // Fallback to query parameter
      userEmail = emailParam.toLowerCase().trim()
      userId = getUserIdFromEmail(userEmail)
    }

    if (!userEmail || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized - email required' },
        { status: 401 }
      )
    }

    console.log('[API GET /api/tasks] Looking for client with userId:', userId, 'email:', userEmail)

    // Fetch client record by userId or email
    const client = await prisma.client.findFirst({
      where: {
        OR: [
          { userId },
          { email: userEmail }
        ]
      }
    })

    if (!client) {
      console.log('[API GET /api/tasks] No client found, returning empty tasks array')
      return NextResponse.json({
        tasks: [],
        total: 0
      })
    }

    console.log('[API GET /api/tasks] Found client:', client.id)

    // Build where clause for tasks
    const where: any = {
      clientId: client.id
    }

    if (statusFilter) {
      where.status = statusFilter
    }

    if (typeFilter) {
      where.type = typeFilter
    }

    // Fetch tasks for this client
    // Wrap in try-catch to handle case where Task model might not exist yet
    let tasks: any[] = []
    let total = 0
    
    try {
      [tasks, total] = await Promise.all([
        (prisma as any).task.findMany({
          where,
          orderBy: [
            { status: 'asc' }, // PENDING first, then IN_PROGRESS, then COMPLETED
            { dueDate: 'asc' }, // Then by due date
            { createdAt: 'desc' } // Then by creation date
          ]
        }),
        (prisma as any).task.count({ where })
      ])
    } catch (dbError: any) {
      // If Task model doesn't exist or table doesn't exist, return empty array
      if (dbError.message?.includes('Unknown model') || dbError.message?.includes('does not exist')) {
        console.log('[API GET /api/tasks] Task model/table does not exist yet, returning empty array')
        return NextResponse.json({
          tasks: [],
          total: 0
        })
      }
      // Re-throw other database errors
      throw dbError
    }

    console.log(`[API GET /api/tasks] Found ${tasks.length} tasks for client ${client.id}`)

    return NextResponse.json({
      tasks: tasks.map(task => ({
        id: task.id,
        client_id: task.clientId,
        title: task.title,
        description: task.description,
        type: task.type,
        status: task.status,
        due_date: task.dueDate?.toISOString() || null,
        completed_at: task.completedAt?.toISOString() || null,
        attachments: task.attachments || [],
        metadata: task.metadata || {},
        created_by: task.createdBy,
        created_at: task.createdAt.toISOString(),
        updated_at: task.updatedAt.toISOString()
      })),
      total
    })
  } catch (error: any) {
    console.error('[API GET /api/tasks] Error:', error)
    console.error('[API GET /api/tasks] Error stack:', error.stack)
    
    // If it's a Prisma error about missing model/table, return empty array instead of error
    if (error.message?.includes('Unknown model') || 
        error.message?.includes('does not exist') ||
        error.message?.includes('Table') ||
        error.code === 'P2001') {
      console.log('[API GET /api/tasks] Task table/model issue, returning empty array')
      return NextResponse.json({
        tasks: [],
        total: 0
      })
    }
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

