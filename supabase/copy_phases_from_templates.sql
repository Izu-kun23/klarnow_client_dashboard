-- ============================================
-- COPY PHASES FROM TEMPLATES
-- ============================================
-- Function to copy phase templates into the phases table for a project
-- This function reads from the constant phase_templates and checklist_item_templates tables
-- and creates project-specific phases and checklist items
-- ============================================

CREATE OR REPLACE FUNCTION copy_phases_from_templates(p_project_id UUID, p_kit_type TEXT)
RETURNS void AS $$
DECLARE
  v_phase_template RECORD;
  v_phase_id UUID;
  v_checklist_template RECORD;
BEGIN
  -- Loop through all phase templates for the given kit type
  FOR v_phase_template IN
    SELECT * FROM phase_templates
    WHERE kit_type = p_kit_type
    ORDER BY phase_number
  LOOP
    -- Insert phase from template
    INSERT INTO phases (
      project_id,
      phase_number,
      phase_id,
      title,
      subtitle,
      day_range,
      status
    )
    VALUES (
      p_project_id,
      v_phase_template.phase_number,
      v_phase_template.phase_id,
      v_phase_template.title,
      v_phase_template.subtitle,
      v_phase_template.day_range,
      'NOT_STARTED'
    )
    RETURNING id INTO v_phase_id;
    
    -- Insert checklist items from templates
    FOR v_checklist_template IN
      SELECT * FROM checklist_item_templates
      WHERE phase_template_id = v_phase_template.id
      ORDER BY sort_order
    LOOP
      INSERT INTO checklist_items (
        phase_id,
        label,
        sort_order,
        is_done
      )
      VALUES (
        v_phase_id,
        v_checklist_template.label,
        v_checklist_template.sort_order,
        false
      );
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

