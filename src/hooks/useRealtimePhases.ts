import { useEffect, useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Phase } from '@/types/project'

interface UseRealtimePhasesResult {
  phases: Phase[]
  loading: boolean
  error: Error | null
  refreshPhases: () => Promise<void>
}

/**
 * Hook to fetch and subscribe to realtime updates for phases
 * 
 * @param projectId - The project ID to fetch phases for
 * @returns Phases array, loading state, error state, and manual refresh function
 */
export function useRealtimePhases(projectId: string | null): UseRealtimePhasesResult {
  const [phases, setPhases] = useState<Phase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const channelsRef = useRef<any[]>([])

  const refreshPhases = async () => {
    if (!projectId) return

    try {
      const response = await fetch(`/api/projects/${projectId}/phases`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch phases: ${response.statusText}`)
      }

      const data = await response.json()
      setPhases(data.phases || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching phases:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!projectId) {
      setPhases([])
      setLoading(false)
      return
    }

    // Setup Supabase client with service role for admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      setError(new Error('Missing Supabase configuration'))
      setLoading(false)
      return
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })

    // Initial fetch
    refreshPhases()

    // Subscribe to phases table changes
    const phasesChannel = supabase
      .channel(`phases_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'phases',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Phase change detected:', payload.eventType, payload.new || payload.old)
          // Refresh phases when any phase changes
          refreshPhases()
        }
      )
      .subscribe()

    channelsRef.current.push(phasesChannel)

    // Cleanup function
    return () => {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel)
      })
      channelsRef.current = []
    }
  }, [projectId])

  // Subscribe to checklist_items when phases are loaded
  useEffect(() => {
    if (phases.length === 0 || !projectId) return

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) return

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })

    // Subscribe to each phase's checklist items individually
    // (Supabase Realtime doesn't support IN filters directly)
    const checklistChannels = phases.map(phase => {
      return supabase
        .channel(`checklist_phase_${phase.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'checklist_items',
            filter: `phase_id=eq.${phase.id}`
          },
          (payload) => {
            console.log(`Checklist item changed for phase ${phase.phase_number}:`, payload.eventType)
            // Refresh phases when checklist items change (this will trigger phase status update)
            refreshPhases()
          }
        )
        .subscribe()
    })

    channelsRef.current.push(...checklistChannels)

    // Cleanup checklist subscriptions
    return () => {
      checklistChannels.forEach(channel => {
        supabase.removeChannel(channel)
      })
    }
  }, [phases.map(p => p.id).join(',')]) // Re-subscribe when phase IDs change

  return { phases, loading, error, refreshPhases }
}

