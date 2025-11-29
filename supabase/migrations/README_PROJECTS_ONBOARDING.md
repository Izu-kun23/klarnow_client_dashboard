# Projects and Onboarding Tables Migration

This migration creates the core database tables for the Klarnow Client Dashboard based on the `LOGIN_AND_ONBOARDING_FLOWS.md` specification.

## Tables Created

### 1. `projects` Table
Main table storing client projects (Launch Kit or Growth Kit).

**Fields:**
- `id` - UUID primary key
- `user_id` - References auth.users
- `kit_type` - 'LAUNCH' or 'GROWTH'
- `onboarding_percent` - 0-100, calculated automatically
- `onboarding_finished` - Boolean, set to true when Step 3 completes
- `current_day_of_14` - Day counter (1-14)
- `next_from_us` - Text field for PM updates
- `next_from_you` - Text field for client actions
- `created_at`, `updated_at` - Timestamps

**Constraints:**
- One project per kit type per user (UNIQUE constraint)

### 2. `onboarding_steps` Table
Stores the 3 onboarding steps per project.

**Fields:**
- `id` - UUID primary key
- `project_id` - References projects
- `step_number` - 1, 2, or 3
- `step_id` - 'STEP_1', 'STEP_2', 'STEP_3'
- `title` - Step title
- `status` - 'NOT_STARTED', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'DONE'
- `required_fields_total` - Total required fields
- `required_fields_completed` - Completed fields count
- `time_estimate` - e.g., "About 5 minutes"
- `fields` - JSONB storing form data
- `started_at`, `completed_at` - Timestamps
- `created_at`, `updated_at` - Timestamps

**Constraints:**
- One step per step_number per project (UNIQUE constraint)

### 3. `phases` Table
Stores the 4 build phases per project (14-day build tracker).

**Fields:**
- `id` - UUID primary key
- `project_id` - References projects
- `phase_number` - 1, 2, 3, or 4
- `phase_id` - 'PHASE_1', 'PHASE_2', etc.
- `title` - Phase title
- `subtitle` - Phase subtitle
- `day_range` - e.g., "Days 0-2"
- `status` - 'NOT_STARTED', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'DONE'
- `next_from_us` - Phase-specific PM updates
- `next_from_you` - Phase-specific client actions
- `started_at`, `completed_at` - Timestamps
- `created_at`, `updated_at` - Timestamps

**Constraints:**
- One phase per phase_number per project (UNIQUE constraint)

### 4. `checklist_items` Table
Stores checklist items for each phase.

**Fields:**
- `id` - UUID primary key
- `phase_id` - References phases
- `label` - Checklist item text
- `is_done` - Boolean completion status
- `sort_order` - Display order
- `created_at`, `updated_at` - Timestamps

### 5. `phase_links` Table
Stores links for each phase (e.g., staging links, Loom videos).

**Fields:**
- `id` - UUID primary key
- `phase_id` - References phases
- `label` - Link label
- `url` - Link URL
- `sort_order` - Display order
- `created_at` - Timestamp

## Automatic Functions

### `calculate_onboarding_percent(project_id)`
Calculates onboarding percentage based on completed vs total required fields across all steps.

### `update_onboarding_percent()`
Trigger function that automatically updates `projects.onboarding_percent` when onboarding steps are updated.

### `check_onboarding_complete()`
Trigger function that sets `projects.onboarding_finished = true` when Step 3 status becomes 'DONE'.

## Row Level Security (RLS)

All tables have RLS enabled with policies:
- **Users**: Can view/update their own projects and related data
- **Admins**: Can view/update all projects and related data

## Usage

Run this migration in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of create_projects_and_onboarding_tables.sql
```

Or use Supabase CLI:

```bash
supabase migration up
```

## Data Flow

1. **Project Creation**: User creates a project → `projects` table
2. **Onboarding Steps**: System creates 3 steps → `onboarding_steps` table
3. **Step Completion**: User completes step → Updates `required_fields_completed` → Triggers `onboarding_percent` update
4. **Step 3 Complete**: When Step 3 is DONE → Triggers `onboarding_finished = true`
5. **Phases**: System creates 4 phases → `phases` table
6. **Phase Data**: Each phase has checklist items and links → `checklist_items` and `phase_links` tables

## Status Values

All status fields use these enum values:
- `NOT_STARTED` - Initial state
- `IN_PROGRESS` - Currently active
- `WAITING_ON_CLIENT` - Needs client action
- `DONE` - Completed

## Notes

- The `fields` column in `onboarding_steps` stores form data as JSONB for flexibility
- All timestamps use `TIMESTAMPTZ` for timezone support
- Foreign keys use `ON DELETE CASCADE` to maintain data integrity
- Indexes are created for common query patterns

