# Admin Phases API Documentation

## Overview

This documentation provides comprehensive API endpoints for admins to manage phases, checklist items, and track 14-day progress for client projects. This enables end-to-end management of the brand building process from the admin dashboard.

## Table of Contents

1. [Database Structure](#database-structure)
2. [API Endpoints](#api-endpoints)
3. [Authentication](#authentication)
4. [Usage Examples](#usage-examples)
5. [Error Handling](#error-handling)
6. [Frontend Integration](#frontend-integration)

## Database Structure

### Phases Table

The `phases` table stores information about each phase of a project:

- `id` (UUID) - Phase ID (primary key)
- `project_id` (UUID) - References `projects(id)` (foreign key)
- `phase_number` (INTEGER) - Phase number (1-4)
- `phase_id` (TEXT) - Phase identifier ('PHASE_1', 'PHASE_2', etc.)
- `title` (TEXT) - Phase title (e.g., "Inputs & clarity")
- `subtitle` (TEXT) - Phase subtitle (e.g., "Lock the message and plan.")
- `day_range` (TEXT) - Day range (e.g., "Days 0-2")
- `status` (TEXT) - Phase status: 'NOT_STARTED', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'DONE'
- `started_at` (TIMESTAMPTZ) - When phase was started
- `completed_at` (TIMESTAMPTZ) - When phase was completed
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

### Checklist Items Table

The `checklist_items` table stores checklist items for each phase:

- `id` (UUID) - Checklist item ID (primary key)
- `phase_id` (UUID) - References `phases(id)` (foreign key)
- `label` (TEXT) - Checklist item label (e.g., "Onboarding steps completed")
- `is_done` (BOOLEAN) - Completion status (default: false)
- `sort_order` (INTEGER) - Display order (default: 0)
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

### Phase Links Table

The `phase_links` table stores links associated with each phase:

- `id` (UUID) - Link ID (primary key)
- `phase_id` (UUID) - References `phases(id)` (foreign key)
- `label` (TEXT) - Link label (e.g., "Staging Site")
- `url` (TEXT) - Link URL
- `sort_order` (INTEGER) - Display order (default: 0)
- `created_at` (TIMESTAMPTZ) - Creation timestamp

### Projects Table (14-Day Tracking)

The `projects` table includes fields for tracking 14-day progress:

- `id` (UUID) - Project ID (primary key)
- `user_id` (UUID) - References `auth.users(id)` (foreign key)
- `kit_type` (TEXT) - 'LAUNCH' or 'GROWTH'
- `current_day_of_14` (INTEGER) - Current day in the 14-day cycle (1-14, nullable)
- `next_from_us` (TEXT) - What Klarnow is doing next (nullable)
- `next_from_you` (TEXT) - What the client needs to do next (nullable)
- `onboarding_finished` (BOOLEAN) - Onboarding completion status
- `onboarding_percent` (INTEGER) - Onboarding progress (0-100)
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

## API Endpoints

### 1. GET /api/projects/[project_id]/phases

Fetches all phases for a specific project with checklist items and links.

**Authentication**: Admin only

**URL Parameters**:
- `project_id` (required) - UUID of the project

**Response**:

```json
{
  "phases": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "phase_number": 1,
      "phase_id": "PHASE_1",
      "title": "Inputs & clarity",
      "subtitle": "Lock the message and plan.",
      "day_range": "Days 0-2",
      "status": "IN_PROGRESS",
      "started_at": "2024-01-01T00:00:00Z",
      "completed_at": null,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "checklist_items": [
        {
          "id": "uuid",
          "phase_id": "uuid",
          "label": "Onboarding steps completed",
          "is_done": true,
          "sort_order": 1,
          "created_at": "2024-01-01T00:00:00Z",
          "updated_at": "2024-01-01T00:00:00Z"
        }
      ],
      "phase_links": [
        {
          "id": "uuid",
          "phase_id": "uuid",
          "label": "Staging Site",
          "url": "https://example.com",
          "sort_order": 1,
          "created_at": "2024-01-01T00:00:00Z"
        }
      ]
    }
  ],
  "project_id": "uuid"
}
```

**Example Request**:

```bash
GET /api/projects/123e4567-e89b-12d3-a456-426614174000/phases
```

---

### 2. GET /api/projects/phases

Fetches phases for all projects (admin overview). Useful for seeing all clients' progress at once.

**Authentication**: Admin only

**Query Parameters**:
- `kit_type` (optional) - Filter by 'LAUNCH' or 'GROWTH'
- `status` (optional) - Filter by phase status ('NOT_STARTED', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'DONE')
- `limit` (optional) - Number of results (default: 100)
- `offset` (optional) - Pagination offset (default: 0)

**Response**:

```json
{
  "projects": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "kit_type": "LAUNCH",
      "current_day_of_14": 5,
      "next_from_us": "We're working on your homepage copy",
      "next_from_you": "Please review the draft",
      "onboarding_finished": true,
      "onboarding_percent": 100,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "email": "client@example.com",
      "phases": [
        {
          "id": "uuid",
          "phase_number": 1,
          "phase_id": "PHASE_1",
          "title": "Inputs & clarity",
          "subtitle": "Lock the message and plan.",
          "day_range": "Days 0-2",
          "status": "IN_PROGRESS",
          "started_at": "2024-01-01T00:00:00Z",
          "completed_at": null,
          "checklist_items": [
            {
              "id": "uuid",
              "label": "Onboarding steps completed",
              "is_done": true,
              "sort_order": 1
            }
          ],
          "phase_links": []
        }
      ]
    }
  ],
  "total": 50,
  "limit": 100,
  "offset": 0,
  "has_more": false
}
```

**Example Requests**:

```bash
# Get all projects with phases
GET /api/projects/phases

# Get only LAUNCH kit projects
GET /api/projects/phases?kit_type=LAUNCH

# Get projects with phases in progress
GET /api/projects/phases?status=IN_PROGRESS

# Get projects waiting on client
GET /api/projects/phases?status=WAITING_ON_CLIENT

# Pagination
GET /api/projects/phases?limit=50&offset=0
```

---

### 3. PATCH /api/projects/[project_id]/phases/[phase_id]

Update phase status and timestamps.

**Authentication**: Admin only

**URL Parameters**:
- `project_id` (required) - UUID of the project
- `phase_id` (required) - UUID of the phase

**Request Body**:

```json
{
  "status": "IN_PROGRESS",
  "started_at": "2024-01-01T00:00:00Z",
  "completed_at": null
}
```

**Fields**:
- `status` (optional) - Phase status: 'NOT_STARTED', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'DONE'
- `started_at` (optional) - ISO timestamp when phase started (can be manually set)
- `completed_at` (optional) - ISO timestamp when phase completed (can be manually set)

**Auto-timestamp Behavior**:
- If `status` is set to 'IN_PROGRESS' and `started_at` is not provided, it will be automatically set to the current time
- If `status` is set to 'DONE' and `completed_at` is not provided, it will be automatically set to the current time
- If `status` is set to 'NOT_STARTED', both `started_at` and `completed_at` will be set to null

**Response**:

```json
{
  "phase": {
    "id": "uuid",
    "project_id": "uuid",
    "phase_number": 1,
    "phase_id": "PHASE_1",
    "title": "Inputs & clarity",
    "status": "IN_PROGRESS",
    "started_at": "2024-01-01T00:00:00Z",
    "completed_at": null,
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Phase updated successfully"
}
```

**Example Requests**:

```bash
# Mark phase as in progress
PATCH /api/projects/123e4567-e89b-12d3-a456-426614174000/phases/456e7890-e89b-12d3-a456-426614174001
Content-Type: application/json

{
  "status": "IN_PROGRESS"
}

# Mark phase as done
PATCH /api/projects/123e4567-e89b-12d3-a456-426614174000/phases/456e7890-e89b-12d3-a456-426614174001
Content-Type: application/json

{
  "status": "DONE"
}

# Mark phase as waiting on client
PATCH /api/projects/123e4567-e89b-12d3-a456-426614174000/phases/456e7890-e89b-12d3-a456-426614174001
Content-Type: application/json

{
  "status": "WAITING_ON_CLIENT"
}
```

---

### 4. PATCH /api/projects/[project_id]/phases/[phase_id]/checklist/[item_id]

Update checklist item status, label, or sort order.

**Authentication**: Admin only

**URL Parameters**:
- `project_id` (required) - UUID of the project
- `phase_id` (required) - UUID of the phase
- `item_id` (required) - UUID of the checklist item

**Request Body**:

```json
{
  "is_done": true,
  "label": "Updated label",
  "sort_order": 2
}
```

**Fields**:
- `is_done` (optional) - Boolean indicating if checklist item is complete
- `label` (optional) - Updated label text
- `sort_order` (optional) - Updated display order

**Response**:

```json
{
  "checklist_item": {
    "id": "uuid",
    "phase_id": "uuid",
    "label": "Onboarding steps completed",
    "is_done": true,
    "sort_order": 1,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Checklist item updated successfully"
}
```

**Example Requests**:

```bash
# Mark checklist item as done
PATCH /api/projects/123e4567-e89b-12d3-a456-426614174000/phases/456e7890-e89b-12d3-a456-426614174001/checklist/789e0123-e89b-12d3-a456-426614174002
Content-Type: application/json

{
  "is_done": true
}

# Update checklist item label
PATCH /api/projects/123e4567-e89b-12d3-a456-426614174000/phases/456e7890-e89b-12d3-a456-426614174001/checklist/789e0123-e89b-12d3-a456-426614174002
Content-Type: application/json

{
  "label": "Brand / strategy call completed"
}

# Update multiple fields
PATCH /api/projects/123e4567-e89b-12d3-a456-426614174000/phases/456e7890-e89b-12d3-a456-426614174001/checklist/789e0123-e89b-12d3-a456-426614174002
Content-Type: application/json

{
  "is_done": true,
  "sort_order": 2
}
```

---

### 5. PATCH /api/projects/[project_id]

Update project fields for 14-day tracking: `current_day_of_14`, `next_from_us`, `next_from_you`.

**Authentication**: Admin only

**URL Parameters**:
- `project_id` (required) - UUID of the project

**Request Body**:

```json
{
  "current_day_of_14": 5,
  "next_from_us": "We're working on your homepage copy",
  "next_from_you": "Please review the draft"
}
```

**Fields**:
- `current_day_of_14` (optional) - Integer between 1 and 14 representing current day
- `next_from_us` (optional) - Text describing what Klarnow is doing next
- `next_from_you` (optional) - Text describing what the client needs to do next

**Response**:

```json
{
  "project": {
    "id": "uuid",
    "user_id": "uuid",
    "kit_type": "LAUNCH",
    "current_day_of_14": 5,
    "next_from_us": "We're working on your homepage copy",
    "next_from_you": "Please review the draft",
    "onboarding_finished": true,
    "onboarding_percent": 100,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Project updated successfully"
}
```

**Example Requests**:

```bash
# Update current day
PATCH /api/projects/123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json

{
  "current_day_of_14": 5
}

# Update next actions
PATCH /api/projects/123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json

{
  "next_from_us": "We're working on your homepage copy",
  "next_from_you": "Please review the draft"
}

# Update all fields
PATCH /api/projects/123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json

{
  "current_day_of_14": 5,
  "next_from_us": "We're working on your homepage copy",
  "next_from_you": "Please review the draft"
}
```

## Authentication

All endpoints require admin authentication. The authentication flow:

1. Check if user is authenticated via `supabase.auth.getUser()`
2. Verify user exists in the `admins` table
3. Use service role client for full database access

**Authentication Headers**: Cookies are automatically included with requests (handled by Next.js).

## Error Handling

### 401 Unauthorized

User is not authenticated.

```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden

User is authenticated but not an admin.

```json
{
  "error": "Forbidden: Admin access required"
}
```

### 404 Not Found

Resource not found (project, phase, or checklist item).

```json
{
  "error": "Project not found"
}
```

or

```json
{
  "error": "Phase not found or does not belong to this project"
}
```

### 400 Bad Request

Invalid request data.

```json
{
  "error": "Invalid status. Must be one of: NOT_STARTED, IN_PROGRESS, WAITING_ON_CLIENT, DONE"
}
```

or

```json
{
  "error": "current_day_of_14 must be a number between 1 and 14"
}
```

### 500 Internal Server Error

Server error occurred.

```json
{
  "error": "Internal server error"
}
```

## Frontend Integration

### TypeScript Types

```typescript
// Status enum
export type PhaseStatus = 
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'WAITING_ON_CLIENT'
  | 'DONE'

// Phase interface
export interface Phase {
  id: string
  project_id: string
  phase_number: number
  phase_id: string
  title: string
  subtitle: string | null
  day_range: string
  status: PhaseStatus
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  checklist_items?: ChecklistItem[]
  phase_links?: PhaseLink[]
}

// Checklist item interface
export interface ChecklistItem {
  id: string
  phase_id: string
  label: string
  is_done: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// Phase link interface
export interface PhaseLink {
  id: string
  phase_id: string
  label: string
  url: string
  sort_order: number
  created_at: string
}
```

### React Hook Example - Fetch Phases

```typescript
import { useState, useEffect } from 'react'

interface UsePhasesResult {
  phases: Phase[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

function usePhases(projectId: string): UsePhasesResult {
  const [phases, setPhases] = useState<Phase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchPhases = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/phases`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch phases: ${response.statusText}`)
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
    fetchPhases()
  }, [projectId])

  return { phases, loading, error, refetch: fetchPhases }
}
```

### React Hook Example - Update Phase Status

```typescript
async function updatePhaseStatus(
  projectId: string,
  phaseId: string,
  status: PhaseStatus
) {
  const response = await fetch(
    `/api/projects/${projectId}/phases/${phaseId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ status }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update phase')
  }

  return await response.json()
}
```

### React Hook Example - Update Checklist Item

```typescript
async function updateChecklistItem(
  projectId: string,
  phaseId: string,
  itemId: string,
  updates: {
    is_done?: boolean
    label?: string
    sort_order?: number
  }
) {
  const response = await fetch(
    `/api/projects/${projectId}/phases/${phaseId}/checklist/${itemId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(updates),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update checklist item')
  }

  return await response.json()
}
```

### React Hook Example - Update Project Progress

```typescript
async function updateProjectProgress(
  projectId: string,
  updates: {
    current_day_of_14?: number
    next_from_us?: string
    next_from_you?: string
  }
) {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update project')
  }

  return await response.json()
}
```

### React Component Example - Phase Management

```typescript
import { useState } from 'react'

function PhaseManagement({ projectId }: { projectId: string }) {
  const { phases, loading, error, refetch } = usePhases(projectId)
  const [updating, setUpdating] = useState<string | null>(null)

  const handleStatusChange = async (phaseId: string, status: PhaseStatus) => {
    setUpdating(phaseId)
    try {
      await updatePhaseStatus(projectId, phaseId, status)
      await refetch()
    } catch (err) {
      console.error('Failed to update phase:', err)
      alert('Failed to update phase status')
    } finally {
      setUpdating(null)
    }
  }

  const handleChecklistToggle = async (
    phaseId: string,
    itemId: string,
    isDone: boolean
  ) => {
    try {
      await updateChecklistItem(projectId, phaseId, itemId, { is_done: isDone })
      await refetch()
    } catch (err) {
      console.error('Failed to update checklist:', err)
      alert('Failed to update checklist item')
    }
  }

  if (loading) return <div>Loading phases...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h2>Project Phases</h2>
      {phases.map(phase => (
        <div key={phase.id}>
          <h3>
            Phase {phase.phase_number}: {phase.title}
          </h3>
          <p>Status: {phase.status}</p>
          <select
            value={phase.status}
            onChange={(e) =>
              handleStatusChange(phase.id, e.target.value as PhaseStatus)
            }
            disabled={updating === phase.id}
          >
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_ON_CLIENT">Waiting on Client</option>
            <option value="DONE">Done</option>
          </select>
          
          <h4>Checklist</h4>
          <ul>
            {phase.checklist_items?.map(item => (
              <li key={item.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={item.is_done}
                    onChange={(e) =>
                      handleChecklistToggle(phase.id, item.id, e.target.checked)
                    }
                  />
                  {item.label}
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
```

### React Component Example - 14-Day Progress Tracker

```typescript
function DayProgressTracker({ projectId }: { projectId: string }) {
  const [day, setDay] = useState<number>(1)
  const [nextFromUs, setNextFromUs] = useState('')
  const [nextFromYou, setNextFromYou] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProjectProgress(projectId, {
        current_day_of_14: day,
        next_from_us: nextFromUs,
        next_from_you: nextFromYou,
      })
      alert('Progress updated successfully!')
    } catch (err) {
      console.error('Failed to update progress:', err)
      alert('Failed to update progress')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h3>14-Day Progress Tracker</h3>
      <div>
        <label>
          Current Day (1-14):
          <input
            type="number"
            min="1"
            max="14"
            value={day}
            onChange={(e) => setDay(parseInt(e.target.value))}
          />
        </label>
      </div>
      <div>
        <label>
          Next from Us:
          <textarea
            value={nextFromUs}
            onChange={(e) => setNextFromUs(e.target.value)}
            placeholder="What is Klarnow doing next?"
          />
        </label>
      </div>
      <div>
        <label>
          Next from You:
          <textarea
            value={nextFromYou}
            onChange={(e) => setNextFromYou(e.target.value)}
            placeholder="What does the client need to do?"
          />
        </label>
      </div>
      <button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Progress'}
      </button>
    </div>
  )
}
```

## Common Use Cases

### 1. View All Clients' Progress

```typescript
// Fetch all projects with phases
const response = await fetch('/api/projects/phases')
const { projects } = await response.json()

// Filter by status
const inProgressProjects = projects.filter((p: any) =>
  p.phases.some((phase: Phase) => phase.status === 'IN_PROGRESS')
)
```

### 2. Track 14-Day Progress

```typescript
// Update day 5 progress
await updateProjectProgress(projectId, {
  current_day_of_14: 5,
  next_from_us: "We're working on your homepage copy",
  next_from_you: "Please review the draft",
})
```

### 3. Mark Phase as Complete

```typescript
// Mark phase as done
await updatePhaseStatus(projectId, phaseId, 'DONE')

// The API will automatically set completed_at timestamp
```

### 4. Update Multiple Checklist Items

```typescript
// Mark multiple checklist items as done
for (const item of checklistItems) {
  await updateChecklistItem(projectId, phaseId, item.id, {
    is_done: true,
  })
}
```

### 5. Filter Projects by Phase Status

```typescript
// Get all projects waiting on client
const response = await fetch('/api/projects/phases?status=WAITING_ON_CLIENT')
const { projects } = await response.json()
```

## Summary

This API provides complete end-to-end management of:

1. **Phase Management**: View and update phase statuses for all projects
2. **Checklist Management**: Update checklist items to track progress
3. **14-Day Tracking**: Monitor and update current day and next actions
4. **Client Overview**: See all clients' progress in one view
5. **Filtering**: Filter by kit type, phase status, and more

All endpoints are admin-only and include proper authentication, validation, and error handling. The API is designed to be easily integrated into React/Next.js admin dashboards with TypeScript support.

