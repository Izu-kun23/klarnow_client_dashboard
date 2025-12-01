# Admin Phases API - End-to-End Documentation

## Overview

This documentation provides complete, practical guidance for implementing phase management in your admin dashboard. It covers all API endpoints, common workflows, and real-world examples.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [API Endpoints Reference](#api-endpoints-reference)
4. [Common Workflows](#common-workflows)
5. [Complete Examples](#complete-examples)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

---

## Quick Start

### Base URL
```
https://your-domain.com/api
```

### Authentication
All endpoints require admin authentication. Include the admin's session token in the request headers.

### Common Headers
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <admin-session-token>'
}
```

---

## Authentication

### How Admin Authentication Works

1. Admin logs into the dashboard
2. Session token is stored (handled automatically by Next.js)
3. Each API request validates admin status by checking the `admins` table
4. If not an admin, returns `403 Forbidden`

### Checking Admin Status

```javascript
// This is handled automatically by the API endpoints
// But you can check it manually if needed:

const response = await fetch('/api/projects/clients', {
  headers: {
    'Authorization': `Bearer ${sessionToken}`
  }
})

if (response.status === 403) {
  // User is not an admin
}
```

---

## API Endpoints Reference

### 1. Get All Projects with Phases (Overview)

**Endpoint:** `GET /api/projects/phases`

**Description:** Fetches all projects with their phases, checklist items, and links. Perfect for the main admin dashboard overview.

**Query Parameters:**
- `kit_type` (optional): `'LAUNCH'` or `'GROWTH'` - Filter by kit type
- `status` (optional): `'NOT_STARTED'`, `'IN_PROGRESS'`, `'WAITING_ON_CLIENT'`, `'DONE'` - Filter by phase status
- `limit` (optional): Number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "projects": [
    {
      "id": "project-uuid",
      "user_id": "user-uuid",
      "kit_type": "LAUNCH",
      "email": "client@example.com",
      "current_day_of_14": 5,
      "next_from_us": "We're working on your homepage copy",
      "next_from_you": "Please review the draft",
      "onboarding_finished": true,
      "onboarding_percent": 100,
      "phases": [
        {
          "id": "phase-uuid",
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
              "id": "item-uuid",
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

**Example Request:**
```javascript
// Get all Launch Kit projects with phases in progress
const response = await fetch(
  '/api/projects/phases?kit_type=LAUNCH&status=IN_PROGRESS',
  {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }
)

const data = await response.json()
console.log(data.projects) // Array of projects
```

---

### 2. Get Phases for Specific Project

**Endpoint:** `GET /api/projects/[project_id]/phases`

**Description:** Fetches all phases for a specific project with full details. Use this when viewing a single client's project.

**URL Parameters:**
- `project_id` (required): UUID of the project

**Response:**
```json
{
  "phases": [
    {
      "id": "phase-uuid",
      "project_id": "project-uuid",
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
          "id": "item-uuid",
          "phase_id": "phase-uuid",
          "label": "Onboarding steps completed",
          "is_done": true,
          "sort_order": 1,
          "created_at": "2024-01-01T00:00:00Z",
          "updated_at": "2024-01-01T00:00:00Z"
        }
      ],
      "phase_links": [
        {
          "id": "link-uuid",
          "phase_id": "phase-uuid",
          "label": "Staging Site",
          "url": "https://staging.example.com",
          "sort_order": 1,
          "created_at": "2024-01-01T00:00:00Z"
        }
      ]
    }
  ],
  "project_id": "project-uuid"
}
```

**Example Request:**
```javascript
const projectId = '123e4567-e89b-12d3-a456-426614174000'

const response = await fetch(`/api/projects/${projectId}/phases`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const data = await response.json()
console.log(data.phases) // Array of 4 phases
```

---

### 3. Update Phase Status

**Endpoint:** `PATCH /api/projects/[project_id]/phases/[phase_id]`

**Description:** Updates a phase's status and timestamps. This is the main endpoint for tracking phase progress.

**URL Parameters:**
- `project_id` (required): UUID of the project
- `phase_id` (required): UUID of the phase

**Request Body:**
```json
{
  "status": "IN_PROGRESS",
  "started_at": "2024-01-01T00:00:00Z",  // Optional: auto-set if not provided
  "completed_at": "2024-01-05T00:00:00Z" // Optional: auto-set if status is DONE
}
```

**Valid Status Values:**
- `'NOT_STARTED'` - Phase hasn't begun
- `'IN_PROGRESS'` - Phase is actively being worked on
- `'WAITING_ON_CLIENT'` - Waiting for client action/feedback
- `'DONE'` - Phase is complete

**Auto-Timestamp Behavior:**
- Setting status to `'IN_PROGRESS'` automatically sets `started_at` (if not already set)
- Setting status to `'DONE'` automatically sets `completed_at`
- Setting status to `'NOT_STARTED'` clears both timestamps

**Response:**
```json
{
  "phase": {
    "id": "phase-uuid",
    "project_id": "project-uuid",
    "phase_number": 1,
    "status": "IN_PROGRESS",
    "started_at": "2024-01-01T00:00:00Z",
    "completed_at": null,
    "updated_at": "2024-01-01T12:00:00Z"
  },
  "message": "Phase updated successfully"
}
```

**Example Requests:**
```javascript
const projectId = 'project-uuid'
const phaseId = 'phase-uuid'

// Mark phase as in progress
await fetch(`/api/projects/${projectId}/phases/${phaseId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'IN_PROGRESS'
  })
})

// Mark phase as done
await fetch(`/api/projects/${projectId}/phases/${phaseId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'DONE'
  })
})

// Mark phase as waiting on client
await fetch(`/api/projects/${projectId}/phases/${phaseId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'WAITING_ON_CLIENT'
  })
})
```

---

### 4. Update Checklist Item

**Endpoint:** `PATCH /api/projects/[project_id]/phases/[phase_id]/checklist/[item_id]`

**Description:** Updates a checklist item's completion status, label, or sort order.

**URL Parameters:**
- `project_id` (required): UUID of the project
- `phase_id` (required): UUID of the phase
- `item_id` (required): UUID of the checklist item

**Request Body:**
```json
{
  "is_done": true,
  "label": "Updated label",  // Optional: update the label
  "sort_order": 2            // Optional: change display order
}
```

**Response:**
```json
{
  "checklist_item": {
    "id": "item-uuid",
    "phase_id": "phase-uuid",
    "label": "Onboarding steps completed",
    "is_done": true,
    "sort_order": 1,
    "updated_at": "2024-01-01T12:00:00Z"
  },
  "message": "Checklist item updated successfully"
}
```

**Example Requests:**
```javascript
const projectId = 'project-uuid'
const phaseId = 'phase-uuid'
const itemId = 'item-uuid'

// Mark checklist item as done
await fetch(`/api/projects/${projectId}/phases/${phaseId}/checklist/${itemId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    is_done: true
  })
})

// Uncheck checklist item
await fetch(`/api/projects/${projectId}/phases/${phaseId}/checklist/${itemId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    is_done: false
  })
})

// Update label and mark as done
await fetch(`/api/projects/${projectId}/phases/${phaseId}/checklist/${itemId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    is_done: true,
    label: 'Brand strategy call completed'
  })
})
```

---

### 5. Update Project 14-Day Progress

**Endpoint:** `PATCH /api/projects/[project_id]`

**Description:** Updates project-level fields like current day, "Next from us", and "Next from you" messages.

**URL Parameters:**
- `project_id` (required): UUID of the project

**Request Body:**
```json
{
  "current_day_of_14": 5,
  "next_from_us": "We are drafting your homepage and offer page copy.",
  "next_from_you": "Please review your copy and leave one round of comments."
}
```

**Response:**
```json
{
  "project": {
    "id": "project-uuid",
    "current_day_of_14": 5,
    "next_from_us": "We are drafting your homepage and offer page copy.",
    "next_from_you": "Please review your copy and leave one round of comments.",
    "updated_at": "2024-01-01T12:00:00Z"
  },
  "message": "Project updated successfully"
}
```

**Example Request:**
```javascript
const projectId = 'project-uuid'

await fetch(`/api/projects/${projectId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    current_day_of_14: 5,
    next_from_us: "We are drafting your homepage and offer page copy.",
    next_from_you: "Please review your copy and leave one round of comments."
  })
})
```

---

## Common Workflows

### Workflow 1: View All Clients' Progress

**Use Case:** Admin wants to see all clients and their current phase status.

**Steps:**
1. Fetch all projects with phases
2. Display in a table or dashboard view
3. Filter by kit type or status as needed

**Implementation:**
```javascript
async function getAllClientsProgress() {
  const response = await fetch('/api/projects/phases', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  
  const data = await response.json()
  
  // Display projects
  data.projects.forEach(project => {
    console.log(`Client: ${project.email}`)
    console.log(`Kit Type: ${project.kit_type}`)
    console.log(`Current Day: ${project.current_day_of_14}`)
    
    project.phases.forEach(phase => {
      console.log(`  Phase ${phase.phase_number}: ${phase.title} - ${phase.status}`)
    })
  })
}
```

---

### Workflow 2: Update Phase Progress

**Use Case:** Admin wants to mark a phase as "In Progress" when work begins.

**Steps:**
1. Get the project ID and phase ID
2. Update phase status to `'IN_PROGRESS'`
3. Optionally update "Next from us" message

**Implementation:**
```javascript
async function startPhase(projectId, phaseId, nextFromUs) {
  // Update phase status
  const phaseResponse = await fetch(
    `/api/projects/${projectId}/phases/${phaseId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'IN_PROGRESS'
      })
    }
  )
  
  if (!phaseResponse.ok) {
    throw new Error('Failed to update phase')
  }
  
  // Update "Next from us" message
  if (nextFromUs) {
    await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        next_from_us: nextFromUs
      })
    })
  }
}
```

---

### Workflow 3: Mark Checklist Items Complete

**Use Case:** Admin wants to check off completed tasks in a phase.

**Steps:**
1. Get project ID, phase ID, and checklist item ID
2. Update checklist item `is_done` to `true`
3. Check if all items are done → auto-update phase status to `'DONE'` (handled by database triggers)

**Implementation:**
```javascript
async function completeChecklistItem(projectId, phaseId, itemId) {
  const response = await fetch(
    `/api/projects/${projectId}/phases/${phaseId}/checklist/${itemId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        is_done: true
      })
    }
  )
  
  if (!response.ok) {
    throw new Error('Failed to update checklist item')
  }
  
  // Note: Phase status is automatically updated by database triggers
  // when all checklist items are marked as done
}
```

---

### Workflow 4: Mark Phase as Waiting on Client

**Use Case:** Admin has completed their work and is waiting for client feedback.

**Steps:**
1. Update phase status to `'WAITING_ON_CLIENT'`
2. Update "Next from you" message to tell client what to do
3. Optionally update "Next from us" message

**Implementation:**
```javascript
async function waitForClient(projectId, phaseId, nextFromYou, nextFromUs) {
  // Update phase status
  await fetch(`/api/projects/${projectId}/phases/${phaseId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: 'WAITING_ON_CLIENT'
    })
  })
  
  // Update project messages
  const updateData = {}
  if (nextFromYou) updateData.next_from_you = nextFromYou
  if (nextFromUs) updateData.next_from_us = nextFromUs
  
  if (Object.keys(updateData).length > 0) {
    await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    })
  }
}
```

---

### Workflow 5: Complete a Phase

**Use Case:** All work for a phase is done, mark it as complete.

**Steps:**
1. Ensure all checklist items are marked as done
2. Update phase status to `'DONE'`
3. Update "Next from us" message for the next phase

**Implementation:**
```javascript
async function completePhase(projectId, phaseId, nextPhaseMessage) {
  // Mark phase as done
  const phaseResponse = await fetch(
    `/api/projects/${projectId}/phases/${phaseId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'DONE'
      })
    }
  )
  
  if (!phaseResponse.ok) {
    throw new Error('Failed to complete phase')
  }
  
  // Update message for next phase
  if (nextPhaseMessage) {
    await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        next_from_us: nextPhaseMessage
      })
    })
  }
}
```

---

## Complete Examples

### Example 1: Full Phase Management Component

```javascript
// React component example
import { useState, useEffect } from 'react'

function PhaseManagement({ projectId }) {
  const [phases, setPhases] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Fetch phases
  useEffect(() => {
    async function fetchPhases() {
      const response = await fetch(`/api/projects/${projectId}/phases`)
      const data = await response.json()
      setPhases(data.phases)
      setLoading(false)
    }
    
    fetchPhases()
  }, [projectId])
  
  // Update phase status
  async function updatePhaseStatus(phaseId, newStatus) {
    const response = await fetch(
      `/api/projects/${projectId}/phases/${phaseId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      }
    )
    
    if (response.ok) {
      // Refresh phases
      const data = await response.json()
      setPhases(prev => prev.map(p => 
        p.id === phaseId ? { ...p, ...data.phase } : p
      ))
    }
  }
  
  // Toggle checklist item
  async function toggleChecklistItem(phaseId, itemId, isDone) {
    const response = await fetch(
      `/api/projects/${projectId}/phases/${phaseId}/checklist/${itemId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_done: isDone })
      }
    )
    
    if (response.ok) {
      // Refresh phases to get updated status (triggers may have updated phase)
      const refreshResponse = await fetch(`/api/projects/${projectId}/phases`)
      const data = await refreshResponse.json()
      setPhases(data.phases)
    }
  }
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      {phases.map(phase => (
        <div key={phase.id}>
          <h3>{phase.title} - {phase.status}</h3>
          <select 
            value={phase.status}
            onChange={(e) => updatePhaseStatus(phase.id, e.target.value)}
          >
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_ON_CLIENT">Waiting on Client</option>
            <option value="DONE">Done</option>
          </select>
          
          <ul>
            {phase.checklist_items.map(item => (
              <li key={item.id}>
                <input
                  type="checkbox"
                  checked={item.is_done}
                  onChange={(e) => toggleChecklistItem(
                    phase.id, 
                    item.id, 
                    e.target.checked
                  )}
                />
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
```

---

### Example 2: Admin Dashboard Overview

```javascript
async function AdminDashboard() {
  // Fetch all projects with phases
  const response = await fetch('/api/projects/phases?limit=50')
  const data = await response.json()
  
  // Group by status
  const projectsByStatus = {
    'NOT_STARTED': [],
    'IN_PROGRESS': [],
    'WAITING_ON_CLIENT': [],
    'DONE': []
  }
  
  data.projects.forEach(project => {
    project.phases.forEach(phase => {
      if (!projectsByStatus[phase.status]) {
        projectsByStatus[phase.status] = []
      }
      projectsByStatus[phase.status].push({
        project: project.email,
        phase: phase.title,
        day: project.current_day_of_14
      })
    })
  })
  
  return {
    totalProjects: data.total,
    byStatus: projectsByStatus
  }
}
```

---

## Error Handling

### Common Error Responses

**401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```
**Solution:** User is not logged in. Redirect to login.

**403 Forbidden:**
```json
{
  "error": "Forbidden: Admin access required"
}
```
**Solution:** User is not an admin. Show access denied message.

**404 Not Found:**
```json
{
  "error": "Phase not found or does not belong to this project"
}
```
**Solution:** Check that project_id and phase_id are correct.

**400 Bad Request:**
```json
{
  "error": "Invalid status. Must be one of: NOT_STARTED, IN_PROGRESS, WAITING_ON_CLIENT, DONE"
}
```
**Solution:** Check that status value is valid.

**500 Internal Server Error:**
```json
{
  "error": "Failed to update phase"
}
```
**Solution:** Check server logs, verify database connection.

### Error Handling Example

```javascript
async function updatePhaseWithErrorHandling(projectId, phaseId, status) {
  try {
    const response = await fetch(
      `/api/projects/${projectId}/phases/${phaseId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      }
    )
    
    if (!response.ok) {
      const error = await response.json()
      
      switch (response.status) {
        case 401:
          // Redirect to login
          window.location.href = '/login'
          break
        case 403:
          alert('You do not have admin access')
          break
        case 404:
          alert('Phase not found')
          break
        case 400:
          alert(`Invalid request: ${error.error}`)
          break
        default:
          alert('An error occurred. Please try again.')
      }
      
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('Network error:', error)
    alert('Network error. Please check your connection.')
    return null
  }
}
```

---

## Best Practices

### 1. Always Validate Before Updating

```javascript
// Check if phase exists before updating
const phase = await getPhase(projectId, phaseId)
if (!phase) {
  throw new Error('Phase not found')
}

// Then update
await updatePhase(projectId, phaseId, newStatus)
```

### 2. Use Optimistic Updates

```javascript
// Update UI immediately, then sync with server
setPhases(prev => prev.map(p => 
  p.id === phaseId ? { ...p, status: newStatus } : p
))

try {
  await updatePhase(projectId, phaseId, newStatus)
} catch (error) {
  // Revert on error
  setPhases(prevPhases)
  alert('Failed to update phase')
}
```

### 3. Batch Updates When Possible

```javascript
// Instead of multiple requests, batch updates
const updates = [
  { itemId: '1', is_done: true },
  { itemId: '2', is_done: true },
  { itemId: '3', is_done: true }
]

await Promise.all(
  updates.map(update =>
    updateChecklistItem(projectId, phaseId, update.itemId, update.is_done)
  )
)
```

### 4. Refresh Data After Updates

```javascript
// After updating checklist items, refresh phases
// (triggers may have auto-updated phase status)
await updateChecklistItem(projectId, phaseId, itemId, true)
await refreshPhases(projectId) // Get latest status
```

### 5. Handle Loading States

```javascript
const [loading, setLoading] = useState(false)

async function updatePhase(phaseId, status) {
  setLoading(true)
  try {
    await fetch(`/api/projects/${projectId}/phases/${phaseId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
  } finally {
    setLoading(false)
  }
}
```

### 6. Use Real-time Updates (Optional)

If you want live updates when other admins make changes:

```javascript
// Subscribe to phase changes
const supabase = createClient()
const channel = supabase
  .channel('phases')
  .on('postgres_changes', 
    { event: 'UPDATE', schema: 'public', table: 'phases' },
    (payload) => {
      // Update local state
      setPhases(prev => prev.map(p => 
        p.id === payload.new.id ? payload.new : p
      ))
    }
  )
  .subscribe()
```

---

## Summary

### Key Endpoints

1. **GET /api/projects/phases** - Get all projects (overview)
2. **GET /api/projects/[project_id]/phases** - Get phases for one project
3. **PATCH /api/projects/[project_id]/phases/[phase_id]** - Update phase status
4. **PATCH /api/projects/[project_id]/phases/[phase_id]/checklist/[item_id]** - Update checklist item
5. **PATCH /api/projects/[project_id]** - Update project messages

### Common Status Flow

```
NOT_STARTED → IN_PROGRESS → WAITING_ON_CLIENT → DONE
```

### Auto-Updates

- Phase status automatically updates when all checklist items are done (via database triggers)
- `started_at` is auto-set when status changes to `IN_PROGRESS`
- `completed_at` is auto-set when status changes to `DONE`

---

## Support

For issues or questions:
1. Check error responses for specific error messages
2. Verify admin authentication
3. Check that project_id, phase_id, and item_id are correct UUIDs
4. Review server logs for detailed error information

