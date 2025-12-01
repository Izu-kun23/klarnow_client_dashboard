import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest, getUserIdFromEmail } from '@/utils/auth'

/**
 * GET /api/tasks/statistics
 * Returns aggregated statistics about tasks and responses
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const emailParam = searchParams.get('email')
    const clientId = searchParams.get('client_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

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
    if (clientId) {
      where.clientId = clientId
    }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo)
      }
    }

    // Fetch all tasks
    const tasks = await (prisma as any).task.findMany({
      where,
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

    // Calculate statistics
    const totalTasks = tasks.length
    const tasksByStatus: Record<string, number> = {
      PENDING: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0
    }
    const tasksByType: Record<string, number> = {}
    let totalResponses = 0
    let tasksWithResponses = 0
    let tasksWithoutResponses = 0
    let totalAttachments = 0
    const responseTimes: number[] = []

    tasks.forEach((task: any) => {
      // Count by status
      tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1

      // Count by type
      const type = task.type as string
      tasksByType[type] = (tasksByType[type] || 0) + 1

      // Count responses
      const metadata = (task.metadata as any) || {}
      const responses = metadata.responses || []
      const attachments = task.attachments || metadata.attachments || []

      totalResponses += responses.length
      totalAttachments += attachments.length

      if (responses.length > 0) {
        tasksWithResponses++
        
        // Calculate response time (time from task creation to first response)
        if (responses.length > 0 && responses[0].createdAt) {
          const taskCreated = task.createdAt.getTime()
          const firstResponse = new Date(responses[0].createdAt).getTime()
          const hoursDiff = (firstResponse - taskCreated) / (1000 * 60 * 60)
          responseTimes.push(hoursDiff)
        }
      } else {
        tasksWithoutResponses++
      }
    })

    // Calculate average response time
    const averageResponseTimeHours = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0

    return NextResponse.json({
      total_tasks: totalTasks,
      tasks_by_status: tasksByStatus,
      tasks_by_type: tasksByType,
      total_responses: totalResponses,
      tasks_with_responses: tasksWithResponses,
      tasks_without_responses: tasksWithoutResponses,
      average_response_time_hours: Math.round(averageResponseTimeHours * 10) / 10,
      total_attachments: totalAttachments
    })
  } catch (error: any) {
    console.error('[API GET /api/tasks/statistics] Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

