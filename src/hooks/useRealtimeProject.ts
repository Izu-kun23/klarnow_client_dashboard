import { useEffect, useState, useRef } from 'react'
import { ProjectWithMergedPhases } from '@/types/project'
import { getPhaseStructureForKitType, mergePhaseStructureWithState } from '@/lib/phase-structure'
import { useMockAuth } from './useMockAuth'

interface UseRealtimeProjectResult {
  project: ProjectWithMergedPhases | null
  loading: boolean
  error: Error | null
  refreshProject: () => Promise<void>
}

/**
 * Hook to fetch and subscribe to realtime updates for a user's project
 * Subscribes to the projects table to get updates when phases_state changes
 * 
 * @returns Project with merged phases, loading state, error state, and manual refresh function
 */
export function useRealtimeProject(): UseRealtimeProjectResult {
  const [project, setProject] = useState<ProjectWithMergedPhases | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useMockAuth()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false) // Prevent concurrent refreshes
  const isInitialLoadRef = useRef(true) // Track if this is the first load

  const refreshProject = async (isBackgroundRefresh?: boolean) => {
    const isBgRefresh = isBackgroundRefresh ?? false
    if (!user?.email) {
      setLoading(false)
      return
    }

    // Prevent concurrent refreshes
    if (isRefreshingRef.current) {
      console.log('[useRealtimeProject] Refresh already in progress, skipping...')
      return
    }

    try {
      isRefreshingRef.current = true
      
      // Only show loading state on initial load, not on background refreshes
      if (!isBgRefresh) {
        setLoading(true)
      }
      
      const response = await fetch(`/api/my-project?email=${encodeURIComponent(user.email)}`, {
        credentials: 'include',
        headers: {
          'X-User-Email': user.email
        },
        cache: 'no-store' // Ensure we always get fresh data
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - user needs to log in
          if (!isBgRefresh) {
            throw new Error('Unauthorized - please log in')
          } else {
            // Background refresh: silently fail, don't throw error
            console.warn('[useRealtimeProject] Unauthorized during background refresh')
            return
          }
        }
        if (response.status === 404) {
          setProject(null)
          if (!isBgRefresh) {
            setLoading(false)
          }
          return
        }
        // For other errors (500, etc.), handle gracefully
        if (isBgRefresh) {
          // Background refresh: silently fail, don't throw error
          console.warn('[useRealtimeProject] Error during background refresh:', response.status, response.statusText)
          return
        } else {
          // Initial load or manual refresh: throw error
          throw new Error(`Failed to fetch project: ${response.statusText}`)
        }
      }

      const data = await response.json()
      
      // Only log on initial load or if data actually changed
      if (isInitialLoadRef.current || JSON.stringify(project) !== JSON.stringify(data.project)) {
        console.log('[useRealtimeProject] Fetched project data from database:', {
          hasProject: !!data.project,
          hasPhases: !!data.project?.phases,
          phasesCount: data.project?.phases?.length || 0,
          kitType: data.project?.kit_type,
          isBackgroundRefresh: isBgRefresh,
          timestamp: new Date().toISOString()
        })
      }
      
      // Update project state with fresh data from database
      setProject(data.project || null)
      setError(null)
      
      // Mark initial load as complete
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false
      }
    } catch (err) {
      // Only set error state and log for initial load or manual refresh
      if (!isBgRefresh) {
        console.error('[useRealtimeProject] Error fetching project:', err)
        setError(err as Error)
        setLoading(false)
      } else {
        // Background refresh: silently handle errors, don't update error state
        console.warn('[useRealtimeProject] Background refresh error (silent):', err)
      }
    } finally {
      if (!isBgRefresh) {
        setLoading(false)
      }
      isRefreshingRef.current = false
    }
  }

  useEffect(() => {
    // Initial fetch
    if (user?.email) {
      isInitialLoadRef.current = true
      refreshProject(false) // Initial load, show loading state

      // Poll for updates every 3 seconds for near real-time updates (background refresh, no loading state)
      intervalRef.current = setInterval(() => {
        refreshProject(true) // Background refresh, don't show loading
      }, 3000)
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      isInitialLoadRef.current = true // Reset for next user
    }
  }, [user?.email]) // Re-run when user email changes

  // Wrapper function that matches the interface (no parameters)
  const refreshProjectWrapper = async () => {
    await refreshProject(false) // Manual refresh, show loading state
  }

  return { project, loading, error, refreshProject: refreshProjectWrapper }
}

