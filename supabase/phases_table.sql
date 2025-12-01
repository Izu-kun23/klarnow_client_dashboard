-- ============================================
-- PHASES TABLE
-- ============================================
-- Stores the 4 phases for each project (Launch Kit or Growth Kit)
-- Each project has exactly 4 phases, numbered 1-4
-- Phases track progress through the 14-day build process

CREATE TABLE IF NOT EXISTS phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL CHECK (phase_number >= 1 AND phase_number <= 4),
  phase_id TEXT NOT NULL, -- 'PHASE_1', 'PHASE_2', 'PHASE_3', 'PHASE_4'
  title TEXT NOT NULL, -- e.g., "Inputs & clarity"
  subtitle TEXT, -- e.g., "Lock the message and plan."
  day_range TEXT NOT NULL, -- e.g., "Days 0-2"
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'DONE')),
  
  -- Timestamps
  started_at TIMESTAMPTZ, -- Set when first checklist item is checked
  completed_at TIMESTAMPTZ, -- Set when all checklist items are done
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(project_id, phase_number) -- One phase per number per project
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_phases_project_id ON phases(project_id);
CREATE INDEX IF NOT EXISTS idx_phases_status ON phases(status);
CREATE INDEX IF NOT EXISTS idx_phases_phase_number ON phases(phase_number);
CREATE INDEX IF NOT EXISTS idx_phases_project_status ON phases(project_id, status);

-- Enable Row Level Security
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Users can view phases for their own projects
-- Works with projects table that has user_id column
CREATE POLICY "Users can view phases for their projects"
  ON phases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = phases.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Users can insert phases for their own projects (for initialization)
CREATE POLICY "Users can insert phases for their projects"
  ON phases FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = phases.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Admins can view all phases
CREATE POLICY "Admins can view all phases"
  ON phases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- Admins can insert phases for any project
CREATE POLICY "Admins can insert phases"
  ON phases FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- Admins can update all phases
CREATE POLICY "Admins can update all phases"
  ON phases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- Service role can do everything (bypasses RLS)
-- This is handled automatically by Supabase service role key

-- ============================================
-- REALTIME
-- ============================================
-- Enable Realtime subscriptions for phases table
-- This allows clients to receive live updates when phases change
ALTER PUBLICATION supabase_realtime ADD TABLE phases;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE phases IS 'Stores the 4 phases for each project. Each phase represents a stage in the 14-day build process.';
COMMENT ON COLUMN phases.phase_number IS 'Phase number: 1, 2, 3, or 4';
COMMENT ON COLUMN phases.phase_id IS 'Phase identifier: PHASE_1, PHASE_2, PHASE_3, or PHASE_4';
COMMENT ON COLUMN phases.status IS 'Current status: NOT_STARTED, IN_PROGRESS, WAITING_ON_CLIENT, or DONE';
COMMENT ON COLUMN phases.started_at IS 'Timestamp when phase was first started (first checklist item checked)';
COMMENT ON COLUMN phases.completed_at IS 'Timestamp when phase was completed (all checklist items done)';

