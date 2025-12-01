# Phases & Checklist Implementation

## Overview

The home page displays project phases with checklists using a **hybrid architecture**: static phase structure stored in frontend code, combined with dynamic state stored in the database. This approach separates content (structure) from state (progress), making it easy to update phase content without database migrations.

## Architecture

### Static Structure (Frontend)
- **Location**: `src/lib/phase-structure.ts`
- **Contains**: Phase titles, subtitles, day ranges, checklist labels, links
- **Defined per Kit Type**: Separate structures for Launch Kit and Growth Kit
- **Never stored in database**: Content lives in code for easy updates

### Dynamic State (Database)
- **Table**: `client_phase_state` (Prisma/MySQL)
- **Contains**: 
  - `status`: NOT_STARTED | IN_PROGRESS | WAITING_ON_CLIENT | DONE
  - `checklist`: JSON object with label → boolean mapping
  - `startedAt`, `completedAt`: Timestamps
- **Stored per client**: Each client has their own phase state records

## Data Flow

### 1. Home Page Load
```
HomePage Component
  ↓
useRealtimeProject() Hook
  ↓
GET /api/my-project?email={email}
  ↓
Fetches: Client + Phase States from Database
  ↓
Gets: Static Phase Structure from Code
  ↓
Merges: Structure + State = MergedPhase[]
  ↓
Renders: Phase Cards with Checklist Items
```

### 2. Real-Time Updates
- **Polling**: Every 3 seconds (background refresh, no loading state)
- **Manual Refresh**: After checklist updates
- **No Flicker**: Background updates don't trigger loading states

### 3. Checklist Update Flow
```
User clicks checklist item
  ↓
handleChecklistUpdate() in HomePage
  ↓
PATCH /api/my-project/phases
  Body: { phase_id, checklist_label, is_done }
  ↓
API Updates Database:
  - Updates checklist JSON in client_phase_state
  - If first item checked: status → IN_PROGRESS, sets startedAt
  ↓
Returns updated project data
  ↓
HomePage refreshes project data
  ↓
UI updates immediately
```

## Key Functions

### `getPhaseStructureForKitType(kitType)`
Returns the static phase structure (titles, labels) for Launch or Growth Kit.

### `mergePhaseStructureWithState(structure, phasesState)`
Combines:
- **Structure**: Static phase definitions from code
- **State**: Dynamic status and checklist completion from database
- **Result**: Complete `MergedPhase[]` with both static and dynamic data

### `useRealtimeProject()`
Custom hook that:
- Fetches project data on mount
- Polls for updates every 3 seconds (background)
- Provides `refreshProject()` for manual updates
- Manages loading states (only on initial load)

## Database Schema

```prisma
model ClientPhaseState {
  id          String    @id @default(uuid())
  clientId    String    // Links to Client
  phaseId     String    // PHASE_1, PHASE_2, PHASE_3, PHASE_4
  status      Status    // NOT_STARTED | IN_PROGRESS | WAITING_ON_CLIENT | DONE
  checklist   Json      // { "Onboarding steps completed": true, ... }
  startedAt   DateTime?
  completedAt DateTime?
  updatedAt   DateTime  @updatedAt
}
```

## API Endpoints

### GET `/api/my-project`
- Fetches client record by email/userId
- Fetches all phase states from `client_phase_state`
- Merges with static structure
- Returns complete project with phases

### PATCH `/api/my-project/phases`
- Updates checklist item in database
- **Auto-status update**: If checklist item checked and status is NOT_STARTED → changes to IN_PROGRESS
- Sets `startedAt` timestamp when phase first becomes IN_PROGRESS
- Returns updated project data

## Status Transitions

### Automatic Status Updates
- **NOT_STARTED → IN_PROGRESS**: When any checklist item is checked
- **IN_PROGRESS → DONE**: Manual update (future: when all items checked)
- **Status Preservation**: Won't change status if already IN_PROGRESS, WAITING_ON_CLIENT, or DONE

## Benefits

1. **No Content Duplication**: Phase titles/labels defined once in code
2. **Easy Updates**: Change phase content without database migrations
3. **Real-Time Sync**: Polling keeps UI updated automatically
4. **Scalable**: Only dynamic state stored in database
5. **Type-Safe**: TypeScript ensures structure matches state

## File Structure

```
src/
├── app/
│   ├── home/
│   │   └── page.tsx              # Home page component
│   └── api/
│       └── my-project/
│           ├── route.ts          # GET project data
│           └── phases/
│               └── route.ts      # GET/PATCH phases
├── hooks/
│   └── useRealtimeProject.ts     # Real-time project data hook
├── lib/
│   └── phase-structure.ts        # Static phase definitions
└── components/
    └── client-dashboard/
        ├── PhaseCard.tsx          # Phase card component
        └── ExpandedPhaseDetails.tsx # Expanded phase view
```

## Example Data

### Static Structure (from code)
```typescript
{
  phase_id: "PHASE_1",
  phase_number: 1,
  title: "Inputs & clarity",
  subtitle: "Lock the message and plan.",
  day_range: "Days 0-2",
  checklist: [
    "Onboarding steps completed",
    "Brand / strategy call completed",
    "14 day plan agreed"
  ]
}
```

### Database State
```json
{
  "status": "IN_PROGRESS",
  "started_at": "2024-01-15T10:00:00Z",
  "checklist": {
    "Onboarding steps completed": true,
    "Brand / strategy call completed": false,
    "14 day plan agreed": false
  }
}
```

### Merged Result (what UI sees)
```typescript
{
  phase_id: "PHASE_1",
  phase_number: 1,
  title: "Inputs & clarity",
  subtitle: "Lock the message and plan.",
  day_range: "Days 0-2",
  status: "IN_PROGRESS",
  started_at: "2024-01-15T10:00:00Z",
  checklist: [
    { label: "Onboarding steps completed", is_done: true },
    { label: "Brand / strategy call completed", is_done: false },
    { label: "14 day plan agreed", is_done: false }
  ]
}
```

## Onboarding Completion Logic

### How Onboarding Completion is Determined

**Rule**: If a user's email and userId exist in the `clients` table, they have completed onboarding.

**Implementation**:
- Onboarding pages check the database via `/api/my-project` endpoint
- If the response contains a project with an `id` (not null), the client exists
- Client exists = Onboarding complete → Redirect to `/home` to see phases
- Client doesn't exist = Onboarding incomplete → Show onboarding steps

**Utility Function**: `checkOnboardingComplete(email)` in `src/utils/onboarding-check.ts`
- Checks if client record exists in database
- Returns `true` if client found, `false` otherwise

**Applied to**:
- All Launch Kit onboarding pages (step-1, step-2, step-3)
- All Growth Kit onboarding pages (step-1, step-2, step-3)
- Automatically redirects to `/home` if client exists

## Future Enhancements

- Auto-complete phase when all checklist items are checked
- WebSocket support for true real-time updates (replacing polling)
- Phase locking: prevent editing previous phases
- Admin dashboard for bulk phase status updates

