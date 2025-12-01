-- Phase Status Auto-Update Functions and Triggers
-- This file contains functions and triggers for automatically updating phase status
-- based on checklist item completion.

-- Function to calculate and update phase status based on checklist items
CREATE OR REPLACE FUNCTION calculate_phase_status(p_phase_id UUID)
RETURNS TEXT AS $$
DECLARE
  total_items INTEGER;
  completed_items INTEGER;
  current_status TEXT;
BEGIN
  -- Count total and completed checklist items for this phase
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE is_done = true)
  INTO total_items, completed_items
  FROM checklist_items
  WHERE phase_id = p_phase_id;

  -- Get current phase status
  SELECT status INTO current_status
  FROM phases
  WHERE id = p_phase_id;

  -- Determine status based on checklist completion
  IF total_items = 0 THEN
    -- No checklist items, keep current status or default to NOT_STARTED
    RETURN COALESCE(current_status, 'NOT_STARTED');
  ELSIF completed_items = 0 THEN
    -- No items completed
    RETURN 'NOT_STARTED';
  ELSIF completed_items = total_items THEN
    -- All items completed
    RETURN 'DONE';
  ELSE
    -- Some items completed but not all
    RETURN 'IN_PROGRESS';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update phase status and timestamps
CREATE OR REPLACE FUNCTION update_phase_status_on_checklist_change()
RETURNS TRIGGER AS $$
DECLARE
  v_phase_id UUID;
  v_new_status TEXT;
  v_old_status TEXT;
  v_started_at TIMESTAMPTZ;
  v_completed_at TIMESTAMPTZ;
BEGIN
  -- Get phase_id from the checklist item (works for INSERT, UPDATE, DELETE)
  IF TG_OP = 'DELETE' THEN
    v_phase_id := OLD.phase_id;
  ELSE
    v_phase_id := NEW.phase_id;
  END IF;

  -- Get current phase status and timestamps
  SELECT status, started_at, completed_at
  INTO v_old_status, v_started_at, v_completed_at
  FROM phases
  WHERE id = v_phase_id;

  -- Calculate new status
  v_new_status := calculate_phase_status(v_phase_id);

  -- Update phase status and timestamps
  UPDATE phases
  SET 
    status = v_new_status,
    started_at = CASE
      -- Set started_at when transitioning from NOT_STARTED to IN_PROGRESS
      WHEN v_old_status = 'NOT_STARTED' AND v_new_status = 'IN_PROGRESS' AND v_started_at IS NULL
      THEN NOW()
      ELSE v_started_at
    END,
    completed_at = CASE
      -- Set completed_at when transitioning to DONE
      WHEN v_new_status = 'DONE' AND v_completed_at IS NULL
      THEN NOW()
      -- Clear completed_at if status changes away from DONE
      WHEN v_new_status != 'DONE' AND v_completed_at IS NOT NULL
      THEN NULL
      ELSE v_completed_at
    END,
    updated_at = NOW()
  WHERE id = v_phase_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update phase status when checklist items change
DROP TRIGGER IF EXISTS trigger_update_phase_status_on_checklist_change ON checklist_items;
CREATE TRIGGER trigger_update_phase_status_on_checklist_change
AFTER INSERT OR UPDATE OF is_done OR DELETE ON checklist_items
FOR EACH ROW
EXECUTE FUNCTION update_phase_status_on_checklist_change();

