-- Migration: Create Projects and Onboarding Tables
-- Based on LOGIN_AND_ONBOARDING_FLOWS.md specification
-- This migration ensures proper structure for projects, onboarding steps, phases, and related tables

-- ============================================
-- PROJECTS TABLE
-- ============================================
-- Main table for client projects (Launch Kit or Growth Kit)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kit_type TEXT NOT NULL CHECK (kit_type IN ('LAUNCH', 'GROWTH')),
  
  -- Progress tracking
  onboarding_percent INTEGER DEFAULT 0 CHECK (onboarding_percent >= 0 AND onboarding_percent <= 100),
  onboarding_finished BOOLEAN DEFAULT false,
  current_day_of_14 INTEGER CHECK (current_day_of_14 >= 1 AND current_day_of_14 <= 14),
  
  -- Communication fields (from spec: "Next from us" and "Next from you")
  next_from_us TEXT,
  next_from_you TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, kit_type) -- One project per kit type per user
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_kit_type ON projects(kit_type);
CREATE INDEX IF NOT EXISTS idx_projects_onboarding_finished ON projects(onboarding_finished);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all projects
CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- Admins can update all projects
CREATE POLICY "Admins can update all projects"
  ON projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- ONBOARDING STEPS TABLE
-- ============================================
-- Stores the 3 onboarding steps per project
-- From spec: Each step has id, title, status, required_fields_total, required_fields_completed
CREATE TABLE IF NOT EXISTS onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL CHECK (step_number >= 1 AND step_number <= 3),
  step_id TEXT NOT NULL, -- 'STEP_1', 'STEP_2', 'STEP_3'
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'DONE')),
  required_fields_total INTEGER DEFAULT 0,
  required_fields_completed INTEGER DEFAULT 0,
  time_estimate TEXT, -- e.g., "About 5 minutes"
  fields JSONB, -- Store form data as JSON
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(project_id, step_number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_project_id ON onboarding_steps(project_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_status ON onboarding_steps(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_step_number ON onboarding_steps(step_number);

-- Enable RLS
ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for onboarding_steps
CREATE POLICY "Users can view steps for their projects"
  ON onboarding_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = onboarding_steps.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert steps for their projects"
  ON onboarding_steps FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = onboarding_steps.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update steps for their projects"
  ON onboarding_steps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = onboarding_steps.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all steps"
  ON onboarding_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all steps"
  ON onboarding_steps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert all steps"
  ON onboarding_steps FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- PHASES TABLE
-- ============================================
-- Stores the 4 build phases per project (14-day build tracker)
-- From spec: Each phase has id, title, day_range, status, checklist, links
CREATE TABLE IF NOT EXISTS phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL CHECK (phase_number >= 1 AND phase_number <= 4),
  phase_id TEXT NOT NULL, -- 'PHASE_1', 'PHASE_2', etc.
  title TEXT NOT NULL,
  subtitle TEXT,
  day_range TEXT NOT NULL, -- e.g., "Days 0-2"
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'DONE')),
  
  -- Communication fields (phase-specific)
  next_from_us TEXT,
  next_from_you TEXT,
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(project_id, phase_number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_phases_project_id ON phases(project_id);
CREATE INDEX IF NOT EXISTS idx_phases_status ON phases(status);
CREATE INDEX IF NOT EXISTS idx_phases_phase_number ON phases(phase_number);

-- Enable RLS
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for phases
CREATE POLICY "Users can view phases for their projects"
  ON phases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = phases.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all phases"
  ON phases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all phases"
  ON phases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert all phases"
  ON phases FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- CHECKLIST ITEMS TABLE
-- ============================================
-- Stores checklist items for each phase
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_done BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_checklist_items_phase_id ON checklist_items(phase_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_sort_order ON checklist_items(sort_order);

-- Enable RLS
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for checklist_items
CREATE POLICY "Users can view checklist items for their projects"
  ON checklist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM phases 
      JOIN projects ON projects.id = phases.project_id
      WHERE phases.id = checklist_items.phase_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all checklist items"
  ON checklist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all checklist items"
  ON checklist_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert all checklist items"
  ON checklist_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- PHASE LINKS TABLE
-- ============================================
-- Stores links for each phase (e.g., "View staging link", "Watch Loom walkthrough")
CREATE TABLE IF NOT EXISTS phase_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_phase_links_phase_id ON phase_links(phase_id);
CREATE INDEX IF NOT EXISTS idx_phase_links_sort_order ON phase_links(sort_order);

-- Enable RLS
ALTER TABLE phase_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for phase_links
CREATE POLICY "Users can view phase links for their projects"
  ON phase_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM phases 
      JOIN projects ON projects.id = phases.project_id
      WHERE phases.id = phase_links.phase_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all phase links"
  ON phase_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate onboarding percentage
CREATE OR REPLACE FUNCTION calculate_onboarding_percent(p_project_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_required INTEGER;
  total_completed INTEGER;
BEGIN
  SELECT 
    COALESCE(SUM(required_fields_total), 0),
    COALESCE(SUM(required_fields_completed), 0)
  INTO total_required, total_completed
  FROM onboarding_steps
  WHERE project_id = p_project_id;
  
  IF total_required = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((total_completed::FLOAT / total_required::FLOAT) * 100);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update onboarding_percent when steps are updated
CREATE OR REPLACE FUNCTION update_onboarding_percent()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects
  SET onboarding_percent = calculate_onboarding_percent(NEW.project_id),
      updated_at = NOW()
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_onboarding_percent ON onboarding_steps;
CREATE TRIGGER trigger_update_onboarding_percent
AFTER INSERT OR UPDATE ON onboarding_steps
FOR EACH ROW
EXECUTE FUNCTION update_onboarding_percent();

-- Trigger to update onboarding_finished when Step 3 is completed
CREATE OR REPLACE FUNCTION check_onboarding_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if Step 3 is DONE
  IF NEW.step_number = 3 AND NEW.status = 'DONE' THEN
    UPDATE projects
    SET onboarding_finished = true,
        updated_at = NOW()
    WHERE id = NEW.project_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_onboarding_complete ON onboarding_steps;
CREATE TRIGGER trigger_check_onboarding_complete
AFTER UPDATE OF status ON onboarding_steps
FOR EACH ROW
WHEN (NEW.status = 'DONE' AND NEW.step_number = 3)
EXECUTE FUNCTION check_onboarding_complete();

-- ============================================
-- ENABLE REALTIME (Optional)
-- ============================================
-- Uncomment these if you want real-time updates
-- ALTER PUBLICATION supabase_realtime ADD TABLE projects;
-- ALTER PUBLICATION supabase_realtime ADD TABLE onboarding_steps;
-- ALTER PUBLICATION supabase_realtime ADD TABLE phases;
-- ALTER PUBLICATION supabase_realtime ADD TABLE checklist_items;

