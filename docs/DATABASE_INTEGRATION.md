# Database Integration Guide

## Overview

This document explains how the launch-kit and dashboard components integrate with the Supabase database tables created in the migration.

## Database Schema

The application uses the following main tables:

1. **`projects`** - Main project table
2. **`onboarding_steps`** - 3 onboarding steps per project
3. **`phases`** - 4 build phases per project
4. **`checklist_items`** - Checklist items for each phase
5. **`phase_links`** - Links for each phase

## Data Transformation

### Issue

Supabase returns nested relations using snake_case naming:
- `checklist_items` (array)
- `phase_links` (array)

But our TypeScript interfaces expect camelCase:
- `checklist` (array)
- `links` (array)

### Solution

We created a transformation utility (`src/utils/transform-project.ts`) that converts Supabase data to match our TypeScript interfaces.

### Usage

```typescript
import { transformProject } from '@/utils/transform-project'

// In API routes
const { data: project } = await supabase
  .from('projects')
  .select(`
    *,
    onboarding_steps (*),
    phases (
      *,
      checklist_items (*),
      phase_links (*)
    )
  `)
  .single()

const transformedProject = transformProject(project)
```

## API Endpoints

### GET `/api/projects`

Fetches the user's project with all relations:
- Onboarding steps
- Phases with checklist items and links

**Response:**
```json
{
  "project": {
    "id": "...",
    "kit_type": "LAUNCH",
    "onboarding_percent": 50,
    "onboarding_steps": [...],
    "phases": [
      {
        "id": "...",
        "title": "Phase 1",
        "checklist": [...],  // transformed from checklist_items
        "links": [...]       // transformed from phase_links
      }
    ]
  }
}
```

### POST `/api/projects/initialize`

Creates a new project and initializes:
- 3 onboarding steps
- 4 phases
- Checklist items for each phase

Uses database functions:
- `initialize_launch_kit_project(project_id)`
- `initialize_growth_kit_project(project_id)`

## Component Integration

### LaunchKitContent

**File:** `src/components/launch-kit/LaunchKitContent.tsx`

**Props:**
```typescript
interface LaunchKitContentProps {
  project: ProjectWithRelations | null
}
```

**Features:**
- Displays onboarding step strip
- Shows progress percentage
- Links to build tracker

### BuildTracker

**File:** `src/components/launch-kit/BuildTracker.tsx`

**Props:**
```typescript
interface BuildTrackerProps {
  phases: Phase[]
  project: { next_from_us: string | null; next_from_you: string | null }
}
```

**Features:**
- Displays 4 phases
- Shows checklist items for each phase
- Shows phase links
- Displays "Next from us" and "Next from you"

### DashboardCoursueStyle

**File:** `src/components/dashboard/DashboardCoursueStyle.tsx`

**Props:**
```typescript
interface DashboardCoursueStyleProps {
  project: ProjectWithRelations | null
}
```

**Features:**
- Shows onboarding progress
- Displays current phase
- Lists incomplete onboarding steps
- Shows project tasks

## Data Flow

1. **User logs in** → Email lookup → Project fetch
2. **Project fetch** → API calls `/api/projects`
3. **API transforms** → Supabase data → TypeScript format
4. **Components receive** → Transformed project data
5. **User interacts** → Updates sent to API
6. **Database updates** → Triggers recalculate percentages

## Automatic Calculations

### Onboarding Percentage

Triggered when `onboarding_steps` are updated:
- Function: `calculate_onboarding_percent(project_id)`
- Updates: `projects.onboarding_percent`

### Onboarding Finished

Triggered when Step 3 status becomes 'DONE':
- Function: `check_onboarding_complete()`
- Updates: `projects.onboarding_finished = true`

## TypeScript Types

All types are defined in `src/types/project.ts`:

- `Project` - Base project interface
- `OnboardingStep` - Onboarding step interface
- `Phase` - Phase interface with optional checklist/links
- `ChecklistItem` - Checklist item interface
- `PhaseLink` - Phase link interface
- `ProjectWithRelations` - Project with nested relations

## Testing

To test the integration:

1. **Run migration:**
   ```bash
   # In Supabase SQL Editor or via CLI
   supabase migration up
   ```

2. **Initialize a project:**
   ```bash
   curl -X POST /api/projects/initialize \
     -H "Content-Type: application/json" \
     -d '{"kit_type": "LAUNCH"}'
   ```

3. **Fetch project:**
   ```bash
   curl /api/projects
   ```

## Common Issues

### Issue: Checklist/Links not showing

**Cause:** Data transformation not applied

**Solution:** Ensure API routes use `transformProject()`

### Issue: Phases empty

**Cause:** Project not initialized

**Solution:** Call `/api/projects/initialize` first

### Issue: Onboarding percentage not updating

**Cause:** Trigger not firing

**Solution:** Check database triggers are created in migration

## Next Steps

1. Replace mock data in pages with real API calls
2. Add error handling for API failures
3. Add loading states during data fetch
4. Implement real-time updates using Supabase subscriptions

