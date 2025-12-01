# Viewing Phases After Onboarding - Admin Guide

## Current Situation

Currently, when users complete onboarding:
1. ✅ Onboarding data is saved to **localStorage** only
2. ❌ **Projects are NOT automatically created** in Supabase
3. ❌ **Phases are NOT automatically initialized** in Supabase

This means that **phases won't appear in the admin dashboard** until projects are created and phases are initialized in the database.

## How to View Phases (After Projects Are Created)

Once projects and phases exist in Supabase, you can view them using these API endpoints:

### Option 1: View All Projects with Phases

**Endpoint**: `GET /api/projects/phases`

This shows all projects with their phases, checklist items, and links in one view.

**Example Request**:
```bash
GET /api/projects/phases
```

**Response**:
```json
{
  "projects": [
    {
      "id": "project-uuid",
      "user_id": "user-uuid",
      "email": "client@example.com",
      "kit_type": "LAUNCH",
      "current_day_of_14": 5,
      "phases": [
        {
          "id": "phase-uuid",
          "phase_number": 1,
          "title": "Inputs & clarity",
          "status": "IN_PROGRESS",
          "checklist_items": [...],
          "phase_links": [...]
        }
      ]
    }
  ]
}
```

**Filter by Kit Type**:
```bash
GET /api/projects/phases?kit_type=LAUNCH
```

**Filter by Phase Status**:
```bash
GET /api/projects/phases?status=IN_PROGRESS
```

### Option 2: View Phases for a Specific Project

**Endpoint**: `GET /api/projects/[project_id]/phases`

This shows all phases for a specific client's project.

**Example Request**:
```bash
GET /api/projects/123e4567-e89b-12d3-a456-426614174000/phases
```

**Response**:
```json
{
  "phases": [
    {
      "id": "phase-uuid",
      "project_id": "project-uuid",
      "phase_number": 1,
      "title": "Inputs & clarity",
      "status": "IN_PROGRESS",
      "checklist_items": [
        {
          "id": "item-uuid",
          "label": "Onboarding steps completed",
          "is_done": true
        }
      ],
      "phase_links": []
    }
  ],
  "project_id": "project-uuid"
}
```

### Option 3: View Clients First, Then Their Phases

**Step 1**: Get list of clients with projects:
```bash
GET /api/projects/clients
```

**Step 2**: For each client, get their phases:
```bash
GET /api/projects/{project_id}/phases
```

## Setting Up Automatic Project & Phase Creation

To automatically create projects and phases when users complete onboarding, you need to:

### Step 1: Create an API Endpoint for Onboarding Completion

Create: `src/app/api/onboarding/complete/route.ts`

This endpoint should:
1. Create a project in Supabase when onboarding is complete
2. Initialize phases using the database functions (`initialize_launch_kit_project` or `initialize_growth_kit_project`)
3. Save onboarding data to Supabase

### Step 2: Update Onboarding Step 3 Forms

Modify `Step3Form.tsx` for both Launch Kit and Growth Kit to:
1. Call the new API endpoint when onboarding is complete
2. Create the project in Supabase
3. Initialize phases automatically

### Step 3: Implementation Example

Here's how the flow should work:

```typescript
// In Step3Form.tsx handleFinish function
const handleFinish = async () => {
  // ... existing localStorage saving code ...

  if (allFieldsComplete) {
    // Call API to create project and initialize phases
    const response = await fetch('/api/onboarding/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        kit_type: kitType,
        onboarding_data: onboardingData
      })
    })

    if (response.ok) {
      const { project } = await response.json()
      console.log('Project created:', project.id)
      // Phases are now initialized!
    }
  }
}
```

## Manual Project Creation (For Testing)

If you need to manually create projects and phases for existing users, you can:

### Option 1: Use the Script

Run the existing script:
```bash
node scripts/create-user-simple.js
```

This will:
1. Create a user in Supabase Auth
2. Create a project
3. Initialize phases automatically

### Option 2: Use Supabase SQL Editor

1. **Create the project**:
```sql
INSERT INTO projects (user_id, kit_type, onboarding_finished, onboarding_percent)
VALUES (
  'user-uuid-here',
  'LAUNCH', -- or 'GROWTH'
  true,
  100
)
RETURNING id;
```

2. **Initialize phases** (use the returned project ID):
```sql
-- For Launch Kit
SELECT initialize_launch_kit_project('project-uuid-here');

-- OR for Growth Kit
SELECT initialize_growth_kit_project('project-uuid-here');
```

### Option 3: Create API Endpoint for Manual Creation

Create an admin-only endpoint to manually create projects for users:

**Endpoint**: `POST /api/admin/projects/create`

```typescript
// Request body
{
  "user_id": "uuid",
  "kit_type": "LAUNCH" | "GROWTH"
}

// Response
{
  "project": { ... },
  "phases_initialized": true
}
```

## Recommended Solution: Auto-Create on Onboarding Complete

The best approach is to **automatically create projects and phases when onboarding is completed**. Here's the recommended implementation:

### 1. Create Onboarding Completion API

**File**: `src/app/api/onboarding/complete/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { kit_type, user_id, onboarding_data } = await request.json()

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if project already exists
    const { data: existingProject } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('user_id', user_id)
      .eq('kit_type', kit_type)
      .single()

    let projectId

    if (existingProject) {
      // Update existing project
      const { data: updatedProject } = await supabaseAdmin
        .from('projects')
        .update({
          onboarding_finished: true,
          onboarding_percent: 100,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProject.id)
        .select()
        .single()
      
      projectId = updatedProject.id
    } else {
      // Create new project
      const { data: newProject, error: projectError } = await supabaseAdmin
        .from('projects')
        .insert({
          user_id,
          kit_type,
          onboarding_finished: true,
          onboarding_percent: 100
        })
        .select()
        .single()

      if (projectError) {
        throw projectError
      }

      projectId = newProject.id

      // Initialize phases
      const initFunction = kit_type === 'LAUNCH' 
        ? 'initialize_launch_kit_project'
        : 'initialize_growth_kit_project'

      const { error: initError } = await supabaseAdmin.rpc(initFunction, {
        p_project_id: projectId
      })

      if (initError) {
        console.error('Error initializing phases:', initError)
        // Don't fail the request, but log the error
      }
    }

    return NextResponse.json({
      project_id: projectId,
      phases_initialized: true
    })
  } catch (error: any) {
    console.error('Error completing onboarding:', error)
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}
```

### 2. Update Step3Form to Call This API

In both `LaunchKitStep3Form.tsx` and `GrowthKitStep3Form.tsx`, update the `handleFinish` function:

```typescript
if (allFieldsComplete) {
  // Get user ID from auth
  const userData = localStorage.getItem('user')
  const user = JSON.parse(userData)
  
  // Call API to create project and initialize phases
  try {
    const response = await fetch('/api/onboarding/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        kit_type: kitType,
        user_id: user.user_id || user.id, // You'll need to store user_id from auth
        onboarding_data: onboardingData
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log('Project created and phases initialized:', result.project_id)
    }
  } catch (error) {
    console.error('Error creating project:', error)
    // Don't block the user, but log the error
  }

  // Continue with existing redirect logic
  router.push(`/${kitType.toLowerCase()}-kit/build-tracker`)
}
```

## Summary

**Current State**:
- ❌ Projects/phases are NOT auto-created on onboarding completion
- ✅ API endpoints exist to view phases (once they exist)
- ✅ Database functions exist to initialize phases

**To View Phases**:
1. First, ensure projects and phases exist in Supabase
2. Use `GET /api/projects/phases` to see all projects with phases
3. Use `GET /api/projects/[project_id]/phases` to see phases for a specific project

**Recommended Next Steps**:
1. Create the `/api/onboarding/complete` endpoint
2. Update Step3Form components to call it
3. Test the flow: Complete onboarding → Project created → Phases initialized → View in admin dashboard

Once this is implemented, phases will automatically appear in your admin dashboard after users complete onboarding!

