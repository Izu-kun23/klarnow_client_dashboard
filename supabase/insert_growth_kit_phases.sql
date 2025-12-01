-- ============================================
-- INSERT GROWTH KIT PHASES DIRECTLY
-- ============================================
-- This script inserts Growth Kit phases directly into the phases table
-- Use this function or call it directly when creating a project
-- ============================================

CREATE OR REPLACE FUNCTION insert_growth_kit_phases(p_project_id UUID)
RETURNS void AS $$
DECLARE
  v_phase_1_id UUID;
  v_phase_2_id UUID;
  v_phase_3_id UUID;
  v_phase_4_id UUID;
BEGIN
  -- Insert Phase 1: Strategy locked in (Days 0–2)
  INSERT INTO phases (project_id, phase_number, phase_id, title, subtitle, day_range, status)
  VALUES
    (p_project_id, 1, 'PHASE_1', 'Strategy locked in', 'Offer, goal and funnel map agreed.', 'Days 0-2', 'NOT_STARTED')
  RETURNING id INTO v_phase_1_id;
  
  -- Insert Phase 2: Copy & email engine (Days 3–5)
  INSERT INTO phases (project_id, phase_number, phase_id, title, subtitle, day_range, status)
  VALUES
    (p_project_id, 2, 'PHASE_2', 'Copy & email engine', 'We write your site copy and 5 emails.', 'Days 3-5', 'NOT_STARTED')
  RETURNING id INTO v_phase_2_id;
  
  -- Insert Phase 3: Build the funnel (Days 6–10)
  INSERT INTO phases (project_id, phase_number, phase_id, title, subtitle, day_range, status)
  VALUES
    (p_project_id, 3, 'PHASE_3', 'Build the funnel', 'Pages, lead magnet and blog hub built.', 'Days 6-10', 'NOT_STARTED')
  RETURNING id INTO v_phase_3_id;
  
  -- Insert Phase 4: Test & handover (Days 11–14)
  INSERT INTO phases (project_id, phase_number, phase_id, title, subtitle, day_range, status)
  VALUES
    (p_project_id, 4, 'PHASE_4', 'Test & handover', 'We test the full journey and go live.', 'Days 11-14', 'NOT_STARTED')
  RETURNING id INTO v_phase_4_id;
  
  -- Insert checklist items for Phase 1
  INSERT INTO checklist_items (phase_id, label, sort_order, is_done)
  VALUES
    (v_phase_1_id, 'Onboarding complete', 1, false),
    (v_phase_1_id, 'Strategy / funnel call done', 2, false),
    (v_phase_1_id, 'Main offer + 90 day goal confirmed', 3, false),
    (v_phase_1_id, 'Simple funnel map agreed', 4, false);
  
  -- Insert checklist items for Phase 2
  INSERT INTO checklist_items (phase_id, label, sort_order, is_done)
  VALUES
    (v_phase_2_id, 'Draft website copy ready', 1, false),
    (v_phase_2_id, 'Draft 5-email nurture sequence ready', 2, false),
    (v_phase_2_id, 'You reviewed and approved copy', 3, false),
    (v_phase_2_id, 'Any changes locked in', 4, false);
  
  -- Insert checklist items for Phase 3
  INSERT INTO checklist_items (phase_id, label, sort_order, is_done)
  VALUES
    (v_phase_3_id, '4-6 page site built on staging', 1, false),
    (v_phase_3_id, 'Lead magnet page + thank you page built', 2, false),
    (v_phase_3_id, 'Opt-in forms wired to your email platform', 3, false),
    (v_phase_3_id, 'Blog hub and 1-2 starter posts set up', 4, false),
    (v_phase_3_id, 'Staging link shared', 5, false);
  
  -- Insert checklist items for Phase 4
  INSERT INTO checklist_items (phase_id, label, sort_order, is_done)
  VALUES
    (v_phase_4_id, 'Funnel tested from first visit to booked call', 1, false),
    (v_phase_4_id, 'Domain connected', 2, false),
    (v_phase_4_id, 'Tracking checked (Analytics / pixels)', 3, false),
    (v_phase_4_id, '5-email sequence switched on', 4, false),
    (v_phase_4_id, 'Loom walkthrough recorded and shared', 5, false);
END;
$$ LANGUAGE plpgsql;

