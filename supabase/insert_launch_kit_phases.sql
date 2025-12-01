-- ============================================
-- INSERT LAUNCH KIT PHASES DIRECTLY
-- ============================================
-- This script inserts Launch Kit phases directly into the phases table
-- Use this function or call it directly when creating a project
-- ============================================

CREATE OR REPLACE FUNCTION insert_launch_kit_phases(p_project_id UUID)
RETURNS void AS $$
DECLARE
  v_phase_1_id UUID;
  v_phase_2_id UUID;
  v_phase_3_id UUID;
  v_phase_4_id UUID;
BEGIN
  -- Insert Phase 1: Inputs & clarity (Days 0–2)
  INSERT INTO phases (project_id, phase_number, phase_id, title, subtitle, day_range, status)
  VALUES
    (p_project_id, 1, 'PHASE_1', 'Inputs & clarity', 'Lock the message and plan.', 'Days 0-2', 'NOT_STARTED')
  RETURNING id INTO v_phase_1_id;
  
  -- Insert Phase 2: Words that sell (Days 3–5)
  INSERT INTO phases (project_id, phase_number, phase_id, title, subtitle, day_range, status)
  VALUES
    (p_project_id, 2, 'PHASE_2', 'Words that sell', 'We write your 3 pages.', 'Days 3-5', 'NOT_STARTED')
  RETURNING id INTO v_phase_2_id;
  
  -- Insert Phase 3: Design & build (Days 6–10)
  INSERT INTO phases (project_id, phase_number, phase_id, title, subtitle, day_range, status)
  VALUES
    (p_project_id, 3, 'PHASE_3', 'Design & build', 'We turn copy into a 3 page site.', 'Days 6-10', 'NOT_STARTED')
  RETURNING id INTO v_phase_3_id;
  
  -- Insert Phase 4: Test & launch (Days 11–14)
  INSERT INTO phases (project_id, phase_number, phase_id, title, subtitle, day_range, status)
  VALUES
    (p_project_id, 4, 'PHASE_4', 'Test & launch', 'We connect domain, test and go live.', 'Days 11-14', 'NOT_STARTED')
  RETURNING id INTO v_phase_4_id;
  
  -- Insert checklist items for Phase 1
  INSERT INTO checklist_items (phase_id, label, sort_order, is_done)
  VALUES
    (v_phase_1_id, 'Onboarding steps completed', 1, false),
    (v_phase_1_id, 'Brand / strategy call completed', 2, false),
    (v_phase_1_id, 'Simple 14 day plan agreed', 3, false);
  
  -- Insert checklist items for Phase 2
  INSERT INTO checklist_items (phase_id, label, sort_order, is_done)
  VALUES
    (v_phase_2_id, 'Draft homepage copy ready', 1, false),
    (v_phase_2_id, 'Draft offer / services page ready', 2, false),
    (v_phase_2_id, 'Draft contact/about copy ready', 3, false),
    (v_phase_2_id, 'You reviewed and approved copy', 4, false);
  
  -- Insert checklist items for Phase 3
  INSERT INTO checklist_items (phase_id, label, sort_order, is_done)
  VALUES
    (v_phase_3_id, 'Site layout built for all 3 pages', 1, false),
    (v_phase_3_id, 'Mobile checks done', 2, false),
    (v_phase_3_id, 'Testimonials and proof added', 3, false),
    (v_phase_3_id, 'Staging link shared with you', 4, false);
  
  -- Insert checklist items for Phase 4
  INSERT INTO checklist_items (phase_id, label, sort_order, is_done)
  VALUES
    (v_phase_4_id, 'Forms tested', 1, false),
    (v_phase_4_id, 'Domain connected', 2, false),
    (v_phase_4_id, 'Final tweaks applied', 3, false),
    (v_phase_4_id, 'Loom walkthrough recorded and shared', 4, false);
END;
$$ LANGUAGE plpgsql;

