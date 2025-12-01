import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest, getUserIdFromEmail } from '@/utils/auth'

/**
 * PATCH /api/tasks/[id]
 * Updates a task - status, responses, and attachments
 * 
 * Request body:
 * - status?: TaskStatus (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
 * - response?: string (text response from client)
 * - attachments?: Array<{name: string, url: string}> (document attachments)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, response, attachments } = body

    // Get user from request
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

    // Verify the task belongs to the user's client
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
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Fetch the task to verify ownership
    const existingTask = await (prisma as any).task.findFirst({
      where: {
        id,
        clientId: client.id
      }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: any = {}
    
    // Update status if provided
    if (status && ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
      updateData.status = status
      
      // Set completedAt if status is COMPLETED
      if (status === 'COMPLETED' && !existingTask.completedAt) {
        updateData.completedAt = new Date()
      } else if (status !== 'COMPLETED') {
        updateData.completedAt = null
      }
    }

    // Handle metadata updates (responses and attachments)
    const currentMetadata = (existingTask.metadata as any) || {}
    const updatedMetadata = { ...currentMetadata }

    // Add response if provided
    if (response && typeof response === 'string' && response.trim()) {
      const responses = updatedMetadata.responses || []
      responses.push({
        text: response.trim(),
        createdAt: new Date().toISOString(),
        createdBy: userEmail
      })
      updatedMetadata.responses = responses
    }

    // Update attachments if provided
    if (attachments && Array.isArray(attachments)) {
      const existingAttachments = (existingTask.attachments as any) || []
      // Merge new attachments with existing ones
      const allAttachments = [...existingAttachments, ...attachments]
      updateData.attachments = allAttachments
      // Also store in metadata for easier access
      updatedMetadata.attachments = allAttachments
    }

    // Update metadata if it changed
    if (response || attachments) {
      updateData.metadata = updatedMetadata
    }

    // Update the task
    const updatedTask = await (prisma as any).task.update({
      where: { id },
      data: updateData
    })

    console.log(`[API PATCH /api/tasks/${id}] Task updated successfully`)

    return NextResponse.json({
      task: {
        id: updatedTask.id,
        client_id: updatedTask.clientId,
        title: updatedTask.title,
        description: updatedTask.description,
        type: updatedTask.type,
        status: updatedTask.status,
        due_date: updatedTask.dueDate?.toISOString() || null,
        completed_at: updatedTask.completedAt?.toISOString() || null,
        attachments: updatedTask.attachments || [],
        metadata: updatedTask.metadata || {},
        created_by: updatedTask.createdBy,
        created_at: updatedTask.createdAt.toISOString(),
        updated_at: updatedTask.updatedAt.toISOString()
      }
    })
  } catch (error: any) {
    console.error('[API PATCH /api/tasks/[id]] Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

