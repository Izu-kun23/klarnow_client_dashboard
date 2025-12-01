'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMockAuth } from '@/hooks/useMockAuth'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface Task {
  id: string
  client_id: string
  title: string
  description: string | null
  type: 'UPLOAD_FILE' | 'SEND_INFO' | 'PROVIDE_DETAILS' | 'REVIEW' | 'OTHER'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  due_date: string | null
  completed_at: string | null
  attachments: Array<{ name: string; url: string }>
  metadata: {
    responses?: Array<{ text: string; createdAt: string; createdBy: string }>
    attachments?: Array<{ name: string; url: string }>
  }
  created_by: string | null
  created_at: string
  updated_at: string
}

interface TaskResponse {
  text: string
  createdAt: string
  createdBy: string
}

export default function TasksPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useMockAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [taskResponses, setTaskResponses] = useState<Record<string, string>>({})
  const [taskFiles, setTaskFiles] = useState<Record<string, File[]>>({})
  const [updatingTasks, setUpdatingTasks] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user?.email) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/tasks?email=${encodeURIComponent(user.email)}`, {
          headers: {
            'X-User-Email': user.email
          },
          credentials: 'include'
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `Failed to fetch tasks: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        setTasks(data.tasks || [])
      } catch (err: any) {
        console.error('Error fetching tasks:', err)
        setError(err.message || 'Failed to load tasks')
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated && user?.email) {
      fetchTasks()
    }
  }, [isAuthenticated, user?.email])

  if (isLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-black font-medium">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getTypeColor = (type: Task['type']) => {
    switch (type) {
      case 'UPLOAD_FILE':
        return 'bg-purple-100 text-purple-800'
      case 'SEND_INFO':
        return 'bg-blue-100 text-blue-800'
      case 'PROVIDE_DETAILS':
        return 'bg-orange-100 text-orange-800'
      case 'REVIEW':
        return 'bg-cyan-100 text-cyan-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    if (!user?.email) return

    setUpdatingTasks(prev => new Set(prev).add(taskId))

    try {
      const response = await fetch(`/api/tasks/${taskId}?email=${encodeURIComponent(user.email)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': user.email
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to update task status')
      }

      const data = await response.json()
      
      // Update the task in the local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? data.task : task
      ))
    } catch (err: any) {
      console.error('Error updating task status:', err)
      setError(err.message || 'Failed to update task status')
    } finally {
      setUpdatingTasks(prev => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
    }
  }

  const handleFileUpload = (taskId: string, files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    setTaskFiles(prev => ({
      ...prev,
      [taskId]: [...(prev[taskId] || []), ...fileArray]
    }))
  }

  const handleSubmitResponse = async (taskId: string) => {
    if (!user?.email) return

    const responseText = taskResponses[taskId]?.trim()
    const files = taskFiles[taskId] || []

    if (!responseText && files.length === 0) {
      return
    }

    setUpdatingTasks(prev => new Set(prev).add(taskId))

    try {
      // Upload files to Cloudinary first
      let attachments: Array<{ name: string; url: string; public_id?: string }> = []

      if (files.length > 0) {
        const uploadFormData = new FormData()
        files.forEach(file => {
          uploadFormData.append('files', file)
        })

        const uploadResponse = await fetch(`/api/upload/multiple?folder=${encodeURIComponent(`task-attachments/${taskId}`)}`, {
          method: 'PUT',
          body: uploadFormData
        })

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text()
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { error: errorText || 'Upload failed' }
          }
          console.error('[Upload Error]', errorData)
          throw new Error(errorData.error || errorData.message || 'Failed to upload files')
        }

        const uploadData = await uploadResponse.json()
        
        // Map uploaded files to attachment format
        attachments = uploadData.files.map((file: any, idx: number) => ({
          name: files[idx].name,
          url: file.url,
          public_id: file.public_id,
          bytes: file.bytes,
          format: file.format
        }))
      }

      // Submit response with uploaded file URLs
      const response = await fetch(`/api/tasks/${taskId}?email=${encodeURIComponent(user.email)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': user.email
        },
        body: JSON.stringify({
          response: responseText,
          attachments: attachments.length > 0 ? attachments : undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to submit response')
      }

      const data = await response.json()
      
      // Update the task in the local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? data.task : task
      ))

      // Clear the form
      setTaskResponses(prev => {
        const next = { ...prev }
        delete next[taskId]
        return next
      })
      setTaskFiles(prev => {
        const next = { ...prev }
        delete next[taskId]
        return next
      })

      // Refresh tasks to get latest data
      const refreshResponse = await fetch(`/api/tasks?email=${encodeURIComponent(user.email)}`, {
        headers: {
          'X-User-Email': user.email
        }
      })
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        setTasks(refreshData.tasks || [])
      }
    } catch (err: any) {
      console.error('Error submitting response:', err)
      setError(err.message || 'Failed to submit response')
    } finally {
      setUpdatingTasks(prev => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black">Tasks</h1>
            <p className="text-lg text-gray-600 mt-2">
              View and manage your project tasks and to-dos.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {tasks.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 border-2 border-gray-200/60">
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-[#8359ee]/10 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#8359ee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-black mb-2">No current tasks</h3>
                <p className="text-gray-600">
                  You don't have any tasks at the moment.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tasks.map((task) => {
                const isExpanded = expandedTask === task.id
                const isUpdating = updatingTasks.has(task.id)
                const responses = task.metadata?.responses || []
                const allAttachments = task.attachments || task.metadata?.attachments || []

                return (
                  <div
                    key={task.id}
                    className="rounded-xl bg-white border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    {/* Task Header */}
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-black">{task.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(task.type)}`}>
                              {task.type}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-gray-600 mb-3">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                            <span>Due: {formatDate(task.due_date)}</span>
                            {task.completed_at && (
                              <span>Completed: {formatDate(task.completed_at)}</span>
                            )}
                          </div>

                          {/* Expand/Collapse Button */}
                          <button
                            onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                            className="text-sm font-semibold text-[#8359ee] hover:text-[#8359ee]/80 transition-colors"
                          >
                            {isExpanded ? '▼ Hide response' : '▶ Respond to this task'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Response Section */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 p-6 bg-gray-50">
                        {/* Previous Responses */}
                        {responses.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-sm font-semibold text-black mb-3">Previous Responses</h4>
                            <div className="space-y-3">
                              {responses.map((response: TaskResponse, idx: number) => (
                                <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                                  <p className="text-gray-700 mb-2">{response.text}</p>
                                  <div className="text-xs text-gray-500">
                                    {new Date(response.createdAt).toLocaleString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Attachments Display */}
                        {allAttachments.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-sm font-semibold text-black mb-3">Attachments</h4>
                            <div className="space-y-2">
                              {allAttachments.map((attachment: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <a
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#8359ee] hover:text-[#8359ee]/80 hover:underline"
                                  >
                                    {attachment.name}
                                  </a>
                                  {attachment.bytes && (
                                    <span className="text-xs text-gray-500">
                                      ({(attachment.bytes / 1024).toFixed(1)} KB)
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Response Form */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-black mb-2">
                              Your Response
                            </label>
                            <textarea
                              value={taskResponses[task.id] || ''}
                              onChange={(e) => setTaskResponses(prev => ({
                                ...prev,
                                [task.id]: e.target.value
                              }))}
                              placeholder="Type your response here..."
                              rows={4}
                              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black bg-white focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none resize-none"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-black mb-2">
                              Upload Documents
                            </label>
                            <input
                              type="file"
                              multiple
                              onChange={(e) => handleFileUpload(task.id, e.target.files)}
                              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-black bg-white focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none"
                            />
                            {taskFiles[task.id] && taskFiles[task.id].length > 0 && (
                              <div className="mt-2 space-y-1">
                                {taskFiles[task.id].map((file, idx) => (
                                  <div key={idx} className="text-sm text-gray-600">
                                    📎 {file.name}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleSubmitResponse(task.id)}
                            disabled={isUpdating || (!taskResponses[task.id]?.trim() && (!taskFiles[task.id] || taskFiles[task.id].length === 0))}
                            className="w-full rounded-lg bg-[#8359ee] px-6 py-3 text-sm font-semibold text-white hover:bg-[#8359ee]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUpdating ? 'Submitting...' : 'Submit Response'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

