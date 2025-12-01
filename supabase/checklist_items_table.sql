-- Checklist Items Table
-- This file contains the checklist_items table definition and related RLS policies

CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_done BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Enable Realtime for checklist_items table
ALTER PUBLICATION supabase_realtime ADD TABLE checklist_items;

