# Quiz Submissions System

## Overview

This system allows you to fetch users from quiz submissions. Quiz submissions are stored when users complete a quiz (e.g., to determine which kit type they need).

## Database Schema

### `quiz_submissions` Table

Stores quiz submissions with the following fields:

- `id` - UUID primary key (use this UUID to fetch all user details)
- `full_name` - User's full name (required)
- `email` - User's email (required)
- `phone_number` - User's phone number (optional)
- `brand_name` - Brand/business name (required)
- `logo_status` - Logo status (required)
- `brand_goals` - Array of brand goals (TEXT[])
- `online_presence` - Online presence status (required)
- `audience` - Array of audience types (TEXT[])
- `brand_style` - Brand style description (required)
- `timeline` - Project timeline (required)
- `preferred_kit` - Preferred kit type ('LAUNCH' or 'GROWTH')
- `created_at`, `updated_at` - Timestamps

## API Endpoints

### 1. GET `/api/quiz-submissions`

Fetches all quiz submissions (admin only).

**Query Parameters:**
- `kit_type` - Filter by preferred_kit (LAUNCH, GROWTH)
- `limit` - Number of results (default: 100)
- `offset` - Pagination offset (default: 0)

**Example:**
```bash
GET /api/quiz-submissions?preferred_kit=LAUNCH&limit=50
```

**Response:**
```json
{
  "submissions": [
    {
      "id": "uuid-here",
      "full_name": "John Doe",
      "email": "user@example.com",
      "phone_number": "+1234567890",
      "brand_name": "My Brand",
      "logo_status": "Have logo",
      "brand_goals": ["goal1", "goal2"],
      "online_presence": "No website",
      "audience": ["B2B", "B2C"],
      "brand_style": "Modern",
      "timeline": "2-4 weeks",
      "preferred_kit": "LAUNCH",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

### 2. GET `/api/quiz-submissions/users`

Fetches unique users from quiz submissions with enriched account information (admin only).
Uses email to find UUID and fetch all user details.

**Query Parameters:**
- `email` - Filter by specific email
- `kit_type` - Filter by preferred_kit
- `limit` - Number of results (default: 100)
- `offset` - Pagination offset (default: 0)

**Example:**
```bash
GET /api/quiz-submissions/users?preferred_kit=GROWTH&limit=20
GET /api/quiz-submissions/users?email=user@example.com
```

**Response:**
```json
{
  "users": [
    {
      "id": "uuid-from-quiz-submissions",
      "user_uuid": "uuid-from-quiz-submissions",
      "email": "user@example.com",
      "full_name": "John Doe",
      "phone_number": "+1234567890",
      "brand_name": "My Brand",
      "logo_status": "Have logo",
      "brand_goals": ["goal1", "goal2"],
      "online_presence": "No website",
      "audience": ["B2B"],
      "brand_style": "Modern",
      "timeline": "2-4 weeks",
      "preferred_kit": "GROWTH",
      "submission_date": "2024-01-01T00:00:00Z",
      "has_account": true,
      "has_profile": true,
      "has_project": true,
      "user_id": "auth-user-id",
      "project": {
        "id": "...",
        "kit_type": "GROWTH",
        "onboarding_finished": false,
        "onboarding_percent": 50
      },
      "profile": {
        "id": "...",
        "name": "John Doe",
        "kit_type": "GROWTH",
        "onboarding_finished": false
      }
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0,
  "has_more": true
}
```

### 3. GET `/api/quiz-submissions/[uuid]`

Fetches a specific quiz submission by UUID and all related user details (admin only).

**Example:**
```bash
GET /api/quiz-submissions/123e4567-e89b-12d3-a456-426614174000
```

**Response:**
```json
{
  "submission": {
    "id": "uuid",
    "uuid": "uuid",
    "full_name": "John Doe",
    "email": "user@example.com",
    ...
  },
  "user": {
    "id": "auth-user-id",
    "email": "user@example.com",
    "created_at": "...",
    "last_sign_in_at": "...",
    "metadata": { ... }
  },
  "profile": { ... },
  "project": {
    "id": "...",
    "onboarding_steps": [ ... ],
    "phases": [ ... ]
  },
  "submission_history": [ ... ],
  "summary": {
    "has_account": true,
    "has_profile": true,
    "has_project": true,
    "total_submissions": 1
  }
}
```

### 4. POST `/api/quiz-submissions`

Creates a new quiz submission (public endpoint).

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "user@example.com",
  "phone_number": "+1234567890",
  "brand_name": "My Brand",
  "logo_status": "Have logo",
  "brand_goals": ["goal1", "goal2"],
  "online_presence": "No website",
  "audience": ["B2B", "B2C"],
  "brand_style": "Modern",
  "timeline": "2-4 weeks",
  "preferred_kit": "LAUNCH"
}
```

**Required Fields:**
- `full_name`
- `email`
- `brand_name`
- `logo_status`
- `online_presence`
- `brand_style`
- `timeline`

**Response:**
```json
{
  "success": true,
  "submission": {
    "id": "uuid-here",
    "full_name": "John Doe",
    "email": "user@example.com",
    ...
  }
}
```

## Usage Examples

### Fetch All Users from Quiz Submissions

```typescript
// In a React component or API route
const response = await fetch('/api/quiz-submissions/users', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})

const data = await response.json()
const users = data.users

// Filter users without accounts
const usersWithoutAccounts = users.filter(u => !u.has_account)

// Filter by preferred kit
const launchKitUsers = users.filter(u => u.preferred_kit === 'LAUNCH')
```

### Fetch User Details by UUID

```typescript
// Fetch all details for a specific user using their quiz submission UUID
const uuid = '123e4567-e89b-12d3-a456-426614174000'
const response = await fetch(`/api/quiz-submissions/${uuid}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})

const data = await response.json()
// data contains: submission, user, profile, project, submission_history, summary
```

### Create a Quiz Submission

```typescript
const submission = await fetch('/api/quiz-submissions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    full_name: 'John Doe',
    email: 'user@example.com',
    phone_number: '+1234567890',
    brand_name: 'My Brand',
    logo_status: 'Have logo',
    brand_goals: ['Increase sales', 'Build trust'],
    online_presence: 'No website',
    audience: ['B2B', 'B2C'],
    brand_style: 'Modern and professional',
    timeline: '2-4 weeks',
    preferred_kit: 'LAUNCH'
  })
})
```

## Migration

To set up the quiz submissions table, run the migration:

```bash
# In Supabase SQL Editor
# Copy and paste contents of:
supabase/migrations/create_quiz_submissions_table.sql
```

Or use Supabase CLI:

```bash
supabase migration up
```

## Security

- **Public Access:** Anyone can create quiz submissions (POST)
- **Admin Access:** Only admins can view submissions (GET)
- **RLS Policies:** Row Level Security is enabled
- **Email Uniqueness:** One submission per email (can be modified if needed)

## Integration with User System

The `/api/quiz-submissions/users` endpoint automatically:
- Checks if user exists in `auth.users`
- Checks if user profile exists in `user_profiles`
- Checks if project exists in `projects`
- Enriches user data with account status

This helps identify:
- Users who submitted quiz but haven't created account
- Users who have account but no project
- Users who are fully onboarded

## Next Steps

1. **Create Quiz Form:** Build a frontend form that submits to `/api/quiz-submissions`
2. **Admin Dashboard:** Create an admin page to view and manage submissions
3. **Automation:** Set up triggers to create user accounts from quiz submissions
4. **Notifications:** Send notifications when new submissions arrive

