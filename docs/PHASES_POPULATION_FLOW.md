# How Phases Table is Populated

## Overview

The `phases` table is automatically populated when a new project is created during the onboarding completion process. This document explains the complete flow.

## Flow Diagram

```
User Completes Onboarding
         ↓
POST /api/onboarding/complete
         ↓
Create/Get Supabase Auth User
         ↓
Create/Get Project in projects table
         ↓
If NEW project created:
    ↓
Call initialize_launch_kit_project() OR initialize_growth_kit_project()
    ↓
Function inserts 4 phases into phases table
    ↓
Function inserts checklist items into checklist_items table
    ↓
Phases are ready!
```

## Step-by-Step Process

### 1. User Completes Onboarding

When a user finishes Step 3 of onboarding (either Launch Kit or Growth Kit), the frontend calls:

```
POST /api/onboarding/complete
```

With payload:
```json
{
  "email": "user@example.com",
  "kit_type": "LAUNCH" | "GROWTH",
  "steps": [...]
}
```

### 2. API Endpoint: `/api/onboarding/complete`

**File:** `src/app/api/onboarding/complete/route.ts`

The endpoint:
1. Gets or creates a Supabase Auth user
2. Creates or finds a project in the `projects` table
3. **If it's a NEW project**, calls the initialization function

**Key Code:**
```typescript
// After creating a new project
const initFunction = kit_type === 'LAUNCH' 
  ? 'initialize_launch_kit_project'
  : 'initialize_growth_kit_project'

const { error: initError } = await supabaseAdmin.rpc(initFunction, {
  p_project_id: project.id
})
```

### 3. Database Functions

#### For Launch Kit: `initialize_launch_kit_project(p_project_id UUID)`

**File:** `supabase/schema.sql` (lines 368-435)

This function:
1. Creates 3 onboarding steps
2. **Creates 4 phases** in the `phases` table:
   - Phase 1: Inputs & clarity (Days 0-2)
   - Phase 2: Words that sell (Days 3-5)
   - Phase 3: Design & build (Days 6-10)
   - Phase 4: Test & launch (Days 11-14)
3. Creates checklist items for each phase

**Example SQL:**
```sql
INSERT INTO phases (project_id, phase_number, phase_id, title, subtitle, day_range, status)
VALUES
  (p_project_id, 1, 'PHASE_1', 'Inputs & clarity', 'Lock the message and plan.', 'Days 0-2', 'NOT_STARTED')
RETURNING id INTO v_phase_1_id;
```

#### For Growth Kit: `initialize_growth_kit_project(p_project_id UUID)`

**File:** `supabase/schema.sql` (lines 438-508)

This function:
1. Creates 3 onboarding steps
2. **Creates 4 phases** in the `phases` table:
   - Phase 1: Strategy locked in (Days 0-2)
   - Phase 2: Copy & email engine (Days 3-5)
   - Phase 3: Build the funnel (Days 6-10)
   - Phase 4: Test, launch & handover (Days 11-14)
3. Creates checklist items for each phase

### 4. What Gets Inserted

For each project, the function inserts:

**Phases Table:**
- 4 rows (one per phase)
- Each with: `project_id`, `phase_number`, `phase_id`, `title`, `subtitle`, `day_range`, `status='NOT_STARTED'`

**Checklist Items Table:**
- Multiple rows (3-5 items per phase)
- Each linked to a phase via `phase_id`
- All start with `is_done=false`

## Important Notes

### Automatic Population

✅ **Phases are automatically created** when:
- A new project is created during onboarding
- The project is created for the first time

❌ **Phases are NOT created** when:
- An existing project is found (already has phases)
- The project was created manually without calling the function

### Manual Population

If you need to manually populate phases for an existing project:

1. **Option 1: Call the function directly**
   ```sql
   SELECT initialize_launch_kit_project('your-project-id-here');
   -- OR
   SELECT initialize_growth_kit_project('your-project-id-here');
   ```

2. **Option 2: Use the reference SQL files**
   - `supabase/launch_kit_phases_data.sql`
   - `supabase/growth_kit_phases_data.sql`
   
   These contain example INSERT statements you can adapt.

### Phase Status Updates

After phases are created:
- Initial status: `NOT_STARTED`
- Status is automatically updated by triggers in `phases_triggers.sql`:
  - When first checklist item is checked → `IN_PROGRESS` (sets `started_at`)
  - When all checklist items are done → `DONE` (sets `completed_at`)

## Database Schema Requirements

Before phases can be populated, ensure these tables exist:

1. ✅ `projects` table (must exist first)
2. ✅ `phases` table (run `supabase/phases_table.sql`)
3. ✅ `checklist_items` table (run `supabase/checklist_items_table.sql`)
4. ✅ Initialization functions (in `supabase/schema.sql`)

## Verification

To verify phases were created:

```sql
-- Check phases for a project
SELECT 
  phase_number,
  phase_id,
  title,
  subtitle,
  day_range,
  status
FROM phases
WHERE project_id = 'your-project-id'
ORDER BY phase_number;

-- Check checklist items
SELECT 
  p.phase_number,
  p.title as phase_title,
  ci.label,
  ci.is_done,
  ci.sort_order
FROM checklist_items ci
JOIN phases p ON p.id = ci.phase_id
WHERE p.project_id = 'your-project-id'
ORDER BY p.phase_number, ci.sort_order;
```

## Troubleshooting

### Phases Not Created?

1. **Check if project exists:**
   ```sql
   SELECT id, kit_type FROM projects WHERE id = 'project-id';
   ```

2. **Check if function exists:**
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name LIKE 'initialize_%_kit_project';
   ```

3. **Check API logs:**
   - Look for `[Onboarding Complete] Initializing phases...`
   - Look for `[Onboarding Complete] Error initializing phases:` if failed

4. **Manually call the function:**
   ```sql
   SELECT initialize_launch_kit_project('project-id');
   -- Check for errors
   ```

### Phases Created But Wrong Kit Type?

- Ensure `kit_type` in the project matches what was passed to the API
- The function is selected based on `kit_type`:
  - `'LAUNCH'` → `initialize_launch_kit_project()`
  - `'GROWTH'` → `initialize_growth_kit_project()`

## Summary

The phases table is populated **automatically** when:
1. User completes onboarding
2. A new project is created
3. The API calls the appropriate initialization function
4. The function inserts 4 phases + all checklist items

No manual intervention needed! 🎉

