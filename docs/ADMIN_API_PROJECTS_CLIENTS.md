# Admin API Documentation - Fetching Clients from Projects Table

## Overview

This documentation provides API endpoint specifications for fetching client information (name/email) from the `projects` table in Supabase. Users in the `projects` table have access to the dashboard.

## Database Structure

The `projects` table structure:

- `id` (UUID) - Project ID
- `user_id` (UUID) - References `auth.users(id)` - This is the key to get user email
- `kit_type` (TEXT) - 'LAUNCH' or 'GROWTH'
- `onboarding_finished` (BOOLEAN)
- `onboarding_percent` (INTEGER)
- `current_day_of_14` (INTEGER) - Current day in the 14-day cycle
- `next_from_us` (TEXT) - What Klarnow is doing next
- `next_from_you` (TEXT) - What the client needs to do next
- `created_at`, `updated_at` (TIMESTAMPTZ)

To get client name/email:

- **Email**: Join `projects.user_id` with `auth.users.id` to get `auth.users.email`
- **Name**: Join with `user_profiles.email` to get `user_profiles.name`, OR join with `quiz_submissions.email` to get `quiz_submissions.full_name` (fallback)

## API Endpoint Specification

### GET /api/projects/clients

Fetches all clients who have access (exist in projects table) with their name and email.

**Authentication**: Admin only (check `admins` table)

**Query Parameters**:

- `kit_type` (optional): Filter by 'LAUNCH' or 'GROWTH'
- `onboarding_finished` (optional): Filter by boolean (true/false)
- `limit` (optional): Number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response**:

```json
{
  "clients": [
    {
      "project_id": "uuid",
      "user_id": "uuid",
      "email": "client@example.com",
      "name": "Client Name",
      "kit_type": "LAUNCH",
      "onboarding_finished": true,
      "onboarding_percent": 100,
      "current_day_of_14": 5,
      "next_from_us": "We're working on your homepage copy",
      "next_from_you": "Please review the draft",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 50,
  "count": 50,
  "limit": 100,
  "offset": 0,
  "has_more": false
}
```

**Response Fields**:

- `clients`: Array of client objects with project and user information
- `total`: Total number of unique users with access (distinct user_ids in projects table)
- `count`: Total number of projects returned (may be more than `total` if a user has multiple projects)
- `limit`: Number of results per page
- `offset`: Current pagination offset
- `has_more`: Boolean indicating if there are more results

**Client Object Fields**:

- `project_id`: UUID of the project
- `user_id`: UUID of the user (from auth.users)
- `email`: User's email address (from auth.users)
- `name`: User's name (from user_profiles or quiz_submissions, may be null)
- `kit_type`: 'LAUNCH' or 'GROWTH'
- `onboarding_finished`: Boolean indicating if onboarding is complete
- `onboarding_percent`: Integer (0-100) indicating onboarding progress
- `current_day_of_14`: Current day in the 14-day cycle (may be null)
- `next_from_us`: What Klarnow is doing next (may be null)
- `next_from_you`: What the client needs to do next (may be null)
- `created_at`: Project creation timestamp
- `updated_at`: Project last update timestamp

## Example Usage

### Fetch all clients

```bash
GET /api/projects/clients
```

**Response**:

```json
{
  "clients": [...],
  "total": 50,
  "count": 50,
  "limit": 100,
  "offset": 0,
  "has_more": false
}
```

### Fetch LAUNCH kit clients only

```bash
GET /api/projects/clients?kit_type=LAUNCH
```

**Response**:

```json
{
  "clients": [
    {
      "project_id": "...",
      "user_id": "...",
      "email": "client@example.com",
      "name": "Client Name",
      "kit_type": "LAUNCH",
      ...
    }
  ],
  "total": 25,
  "count": 25,
  "limit": 100,
  "offset": 0,
  "has_more": false
}
```

### Fetch clients who completed onboarding

```bash
GET /api/projects/clients?onboarding_finished=true
```

**Response**:

```json
{
  "clients": [
    {
      "project_id": "...",
      "onboarding_finished": true,
      "onboarding_percent": 100,
      ...
    }
  ],
  "total": 30,
  "count": 30,
  "limit": 100,
  "offset": 0,
  "has_more": false
}
```

### Pagination

```bash
GET /api/projects/clients?limit=50&offset=0
```

**Response**:

```json
{
  "clients": [...],
  "total": 100,
  "count": 50,
  "limit": 50,
  "offset": 0,
  "has_more": true
}
```

### Combined filters

```bash
GET /api/projects/clients?kit_type=GROWTH&onboarding_finished=false&limit=25&offset=0
```

**Response**:

```json
{
  "clients": [
    {
      "project_id": "...",
      "kit_type": "GROWTH",
      "onboarding_finished": false,
      ...
    }
  ],
  "total": 15,
  "count": 15,
  "limit": 25,
  "offset": 0,
  "has_more": false
}
```

## Error Responses

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

### 500 Internal Server Error

Server error occurred while fetching data.

```json
{
  "error": "Internal server error"
}
```

## Implementation Details

### Authentication Flow

1. Check if user is authenticated via `supabase.auth.getUser()`
2. Verify user is in the `admins` table
3. Use service role client for full database access

### Data Fetching Strategy

Since Supabase doesn't support direct joins with `auth.users`, the implementation:

1. Fetches all projects (with optional filters)
2. Extracts unique `user_id` values
3. Fetches `auth.users` using `supabase.auth.admin.listUsers()`
4. Creates a map of `user_id` to `email`
5. Fetches `user_profiles` for names (primary source)
6. Fetches `quiz_submissions` for names (fallback if not in user_profiles)
7. Combines all data into the response

### Name Resolution Priority

1. **First**: Check `user_profiles.name` (if exists)
2. **Second**: Check `quiz_submissions.full_name` from latest submission (if exists)
3. **Fallback**: `null` if name not found in either table

### Counting Users with Access

The `total` field represents the count of **unique users** (distinct `user_id` values) in the projects table. This is the number of users who have access to the dashboard.

The `count` field represents the total number of **projects** returned, which may be higher than `total` if a user has multiple projects (e.g., one LAUNCH and one GROWTH kit).

## Notes

- The `count` field represents the total number of projects returned (may include multiple projects per user)
- The `total` field represents the total number of unique users with access (distinct user_ids in projects table)
- Name may be `null` if not found in `user_profiles` or `quiz_submissions`
- Email will always be present (from `auth.users`) unless the user has been deleted
- One user can have multiple projects (one per kit type), so the response may include multiple entries per user
- Projects are ordered by `created_at` descending (newest first)
- All timestamps are in ISO 8601 format (UTC)

## Usage in Frontend

### JavaScript/TypeScript Example

```typescript
async function fetchClients(filters?: {
  kitType?: 'LAUNCH' | 'GROWTH'
  onboardingFinished?: boolean
  limit?: number
  offset?: number
}) {
  const params = new URLSearchParams()
  
  if (filters?.kitType) {
    params.append('kit_type', filters.kitType)
  }
  if (filters?.onboardingFinished !== undefined) {
    params.append('onboarding_finished', String(filters.onboardingFinished))
  }
  if (filters?.limit) {
    params.append('limit', String(filters.limit))
  }
  if (filters?.offset) {
    params.append('offset', String(filters.offset))
  }

  const response = await fetch(`/api/projects/clients?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include auth cookies
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch clients: ${response.statusText}`)
  }

  return await response.json()
}

// Usage examples
const allClients = await fetchClients()
const launchClients = await fetchClients({ kitType: 'LAUNCH' })
const completedClients = await fetchClients({ onboardingFinished: true })
const paginatedClients = await fetchClients({ limit: 50, offset: 0 })
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react'

interface Client {
  project_id: string
  user_id: string
  email: string
  name: string | null
  kit_type: 'LAUNCH' | 'GROWTH'
  onboarding_finished: boolean
  onboarding_percent: number
  // ... other fields
}

interface ClientsResponse {
  clients: Client[]
  total: number
  count: number
  limit: number
  offset: number
  has_more: boolean
}

function useClients(filters?: {
  kitType?: 'LAUNCH' | 'GROWTH'
  onboardingFinished?: boolean
}) {
  const [data, setData] = useState<ClientsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        
        if (filters?.kitType) {
          params.append('kit_type', filters.kitType)
        }
        if (filters?.onboardingFinished !== undefined) {
          params.append('onboarding_finished', String(filters.onboardingFinished))
        }

        const response = await fetch(`/api/projects/clients?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`)
        }

        const result = await response.json()
        setData(result)
        setError(null)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [filters?.kitType, filters?.onboardingFinished])

  return { data, loading, error }
}

// Usage in component
function ClientsList() {
  const { data, loading, error } = useClients({ kitType: 'LAUNCH' })

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!data) return null

  return (
    <div>
      <h2>Clients with Access ({data.total} users)</h2>
      <ul>
        {data.clients.map(client => (
          <li key={client.project_id}>
            {client.name || client.email} - {client.kit_type}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

## Summary

This API endpoint provides a comprehensive way to:

1. **Fetch all clients** who have access to the dashboard (users in the `projects` table)
2. **Get client information** including name and email
3. **Filter clients** by kit type and onboarding status
4. **Count users** with access (the `total` field shows unique users)
5. **Paginate results** for large datasets

The endpoint is admin-only and requires proper authentication. It efficiently combines data from multiple tables (`projects`, `auth.users`, `user_profiles`, `quiz_submissions`) to provide a complete view of clients with dashboard access.

