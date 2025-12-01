-- ============================================
-- ADD phases_state JSONB COLUMN TO projects TABLE
-- ============================================
-- This migration adds a JSONB column to store phase status and checklist completion state.
-- Phase structure is hardcoded in lib/phase-structure.ts
-- ============================================

-- Add phases_state column
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS phases_state JSONB DEFAULT NULL;

-- Add comment explaining the structure
COMMENT ON COLUMN projects.phases_state IS 'Stores phase status and checklist completion state. Format: {"PHASE_1": {"status": "IN_PROGRESS", "started_at": "...", "completed_at": null, "checklist": {"Onboarding steps completed": true, "Brand / strategy call completed": false}}}. Phase structure (titles, subtitles, day ranges, checklist labels) is hardcoded in lib/phase-structure.ts';

-- Enable Realtime publication for projects table if not already enabled
-- This allows real-time updates when phases_state changes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'projects'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE projects;
  END IF;
END $$;

