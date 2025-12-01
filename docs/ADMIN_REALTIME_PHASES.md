# Admin Dashboard - Realtime Phases Subscription

## Overview

Use Supabase Realtime to automatically update phases in the admin dashboard when changes occur. This provides live updates without manual refresh.

## Implementation

### Setup Supabase Client

Make sure you have a Supabase client configured with realtime enabled:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for admin
  {
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
)
```

### React Hook for Realtime Phases

```typescript
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

interface Phase {
  id: string
  project_id: string
  phase_number: number
  phase_id: string
  title: string
  subtitle: string | null
  day_range: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'WAITING_ON_CLIENT' | 'DONE'
  started_at: string | null
  completed_at: string | null
  checklist_items?: ChecklistItem[]
  phase_links?: PhaseLink[]
}

function useRealtimePhases(projectId: string) {
  const [phases, setPhases] = useState<Phase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const channelRef = useRef<any>(null)

  const refreshPhases = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/phases`)
      if (!response.ok) {
        throw new Error('Failed to fetch phases')
      }
      const data = await response.json()
      setPhases(data.phases)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!projectId) return

    // Initial fetch
    refreshPhases()

    // Setup Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      }
    )

    // Subscribe to phases changes
    const channel = supabase
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
          console.log('Phase changed:', payload)
          refreshPhases()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checklist_items',
          filter: `phase_id=in.(${phases.map(p => p.id).join(',')})` // This will be updated after initial load
        },
        (payload) => {
          console.log('Checklist item changed:', payload)
          refreshPhases()
        }
      )
      .subscribe()

    channelRef.current = channel

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [projectId])

  // Update checklist_items subscription when phases change
  useEffect(() => {
    if (phases.length === 0 || !channelRef.current) return

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Remove old subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // Create new subscription with updated phase IDs
    const phaseIds = phases.map(p => p.id).join(',')
    const channel = supabase
      .channel(`checklist_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checklist_items',
          filter: `phase_id=in.(${phaseIds})`
        },
        (payload) => {
          console.log('Checklist item changed:', payload)
          refreshPhases()
        }
      )
      .subscribe()

    channelRef.current = channel
  }, [phases.map(p => p.id).join(',')])

  return { phases, loading, error, refreshPhases }
}
```

### Simplified Version (Recommended)

For a simpler implementation that refreshes on any change:

```typescript
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

function useRealtimePhases(projectId: string) {
  const [phases, setPhases] = useState<Phase[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<any>(null)

  const refreshPhases = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/phases`)
      if (!response.ok) throw new Error('Failed to fetch phases')
      const data = await response.json()
      setPhases(data.phases)
    } catch (err) {
      console.error('Error fetching phases:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!projectId) return

    // Initial fetch
    refreshPhases()

    // Setup Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      }
    )

    // Subscribe to phases changes
    const channel = supabase
      .channel(`phases_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'phases',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Phase changed:', payload.eventType, payload.new || payload.old)
          refreshPhases()
        }
      )
      .subscribe()

    channelRef.current = channel

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [projectId])

  return { phases, loading, refreshPhases }
}
```

### Component Usage

```typescript
import { useRealtimePhases } from '@/hooks/useRealtimePhases'

function AdminPhasesView({ projectId }: { projectId: string }) {
  const { phases, loading, refreshPhases } = useRealtimePhases(projectId)

  if (loading) {
    return <div>Loading phases...</div>
  }

  return (
    <div>
      <h2>Project Phases (Live Updates)</h2>
      {phases.map(phase => (
        <div key={phase.id}>
          <h3>Phase {phase.phase_number}: {phase.title}</h3>
          <p>Status: {phase.status}</p>
          <ul>
            {phase.checklist_items?.map(item => (
              <li key={item.id}>
                {item.is_done ? '✅' : '☐'} {item.label}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
```

## Listening to Checklist Items

To also listen to checklist item changes (which will trigger phase status updates):

```typescript
// After fetching phases, subscribe to checklist_items
useEffect(() => {
  if (phases.length === 0) return

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get all phase IDs
  const phaseIds = phases.map(p => p.id)

  // Subscribe to checklist_items for all phases in this project
  const checklistChannel = supabase
    .channel(`checklist_${projectId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'checklist_items',
        // Note: Supabase doesn't support IN filter directly in realtime
        // You may need to subscribe to each phase individually or use a different approach
      },
      (payload) => {
        // Check if the changed item belongs to one of our phases
        const changedPhase = phases.find(p => p.id === payload.new?.phase_id || payload.old?.phase_id)
        if (changedPhase) {
          console.log('Checklist item changed, refreshing phases...')
          refreshPhases()
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(checklistChannel)
  }
}, [phases, projectId])
```

## Alternative: Subscribe to All Checklist Items

Since Supabase Realtime doesn't support `IN` filters directly, you can:

1. **Subscribe to each phase individually** (if you have a small number of phases):

```typescript
phases.forEach(phase => {
  const channel = supabase
    .channel(`checklist_phase_${phase.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'checklist_items',
        filter: `phase_id=eq.${phase.id}`
      },
      () => refreshPhases()
    )
    .subscribe()
})
```

2. **Use a broader filter and filter client-side**:

```typescript
// Subscribe to all checklist_items and filter client-side
const channel = supabase
  .channel(`checklist_all_${projectId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'checklist_items'
    },
    (payload) => {
      // Check if this checklist item belongs to one of our phases
      const phaseIds = phases.map(p => p.id)
      const changedPhaseId = payload.new?.phase_id || payload.old?.phase_id
      
      if (phaseIds.includes(changedPhaseId)) {
        refreshPhases()
      }
    }
  )
  .subscribe()
```

## Complete Example Hook

```typescript
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

export function useRealtimePhases(projectId: string) {
  const [phases, setPhases] = useState<Phase[]>([])
  const [loading, setLoading] = useState(true)
  const channelsRef = useRef<any[]>([])

  const refreshPhases = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/phases`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch phases')
      const data = await response.json()
      setPhases(data.phases)
    } catch (err) {
      console.error('Error fetching phases:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!projectId) return

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      }
    )

    // Initial fetch
    refreshPhases()

    // Subscribe to phases table
    const phasesChannel = supabase
      .channel(`phases_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'phases',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Phase change detected:', payload.eventType)
          refreshPhases()
        }
      )
      .subscribe()

    channelsRef.current.push(phasesChannel)

    // Cleanup
    return () => {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel)
      })
      channelsRef.current = []
    }
  }, [projectId])

  // Subscribe to checklist_items when phases are loaded
  useEffect(() => {
    if (phases.length === 0) return

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Subscribe to each phase's checklist items
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
            console.log('Checklist item changed for phase:', phase.phase_number)
            refreshPhases()
          }
        )
        .subscribe()
    })

    channelsRef.current.push(...checklistChannels)

    return () => {
      checklistChannels.forEach(channel => {
        supabase.removeChannel(channel)
      })
    }
  }, [phases.map(p => p.id).join(',')])

  return { phases, loading, refreshPhases }
}
```

## Notes

1. **Service Role Key**: Use the service role key for admin access to bypass RLS
2. **Channel Naming**: Use unique channel names per project to avoid conflicts
3. **Cleanup**: Always remove channels on unmount to prevent memory leaks
4. **Rate Limiting**: Supabase has rate limits on realtime events (default 10 events/second)
5. **RLS**: Make sure RLS policies allow the admin to read phases and checklist_items

## Testing

To test the realtime subscription:

1. Open the admin dashboard
2. In another tab/window, update a phase status or checklist item via the API
3. The admin dashboard should automatically refresh and show the updated data

