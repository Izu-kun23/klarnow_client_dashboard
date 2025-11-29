-- Minimal migration for onboarding to work
-- Run this in Supabase SQL Editor

-- 1. Create projects table (minimal) - using email instead of user_id
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  kit_type TEXT NOT NULL CHECK (kit_type IN ('LAUNCH', 'GROWTH')),
  onboarding_percent INTEGER DEFAULT 0,
  onboarding_finished BOOLEAN DEFAULT false,
  current_day_of_14 INTEGER,
  next_from_us TEXT,
  next_from_you TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, kit_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_email ON projects(email);
CREATE INDEX IF NOT EXISTS idx_projects_kit_type ON projects(kit_type);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects (allow service role to insert/update)
CREATE POLICY "Allow all operations with service role"
  ON projects FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. Create onboarding_steps table (this is where all onboarding data is saved)
CREATE TABLE IF NOT EXISTS onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL CHECK (step_number >= 1 AND step_number <= 3),
  step_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'DONE')),
  required_fields_total INTEGER DEFAULT 0,
  required_fields_completed INTEGER DEFAULT 0,
  time_estimate TEXT,
  fields JSONB, -- All form data is saved here
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, step_number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_project_id ON onboarding_steps(project_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_status ON onboarding_steps(status);

-- Enable RLS
ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for onboarding_steps (allow service role to insert/update)
CREATE POLICY "Allow all operations with service role"
  ON onboarding_steps FOR ALL
  USING (true)
  WITH CHECK (true);

-- Done! Now onboarding can save to onboarding_steps table

