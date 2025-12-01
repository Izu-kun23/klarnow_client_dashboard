-- ============================================
-- PHASE TEMPLATES TABLE
-- ============================================
-- Stores constant phase definitions for Launch Kit and Growth Kit
-- These templates are copied when a project is created
-- ============================================

CREATE TABLE IF NOT EXISTS phase_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_type TEXT NOT NULL CHECK (kit_type IN ('LAUNCH', 'GROWTH')),
  phase_number INTEGER NOT NULL CHECK (phase_number >= 1 AND phase_number <= 4),
  phase_id TEXT NOT NULL, -- 'PHASE_1', 'PHASE_2', 'PHASE_3', 'PHASE_4'
  title TEXT NOT NULL,
  subtitle TEXT,
  day_range TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(kit_type, phase_number) -- One phase per number per kit type
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_phase_templates_kit_type ON phase_templates(kit_type);
CREATE INDEX IF NOT EXISTS idx_phase_templates_phase_number ON phase_templates(phase_number);

-- ============================================
-- CHECKLIST ITEM TEMPLATES TABLE
-- ============================================
-- Stores constant checklist item definitions for each phase template
-- ============================================

CREATE TABLE IF NOT EXISTS checklist_item_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_template_id UUID NOT NULL REFERENCES phase_templates(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(phase_template_id, sort_order) -- One item per sort order per phase
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_checklist_item_templates_phase_template_id ON checklist_item_templates(phase_template_id);

-- ============================================
-- INSERT CONSTANT PHASE DATA
-- ============================================

-- Launch Kit Phase Templates
INSERT INTO phase_templates (kit_type, phase_number, phase_id, title, subtitle, day_range)
VALUES
  ('LAUNCH', 1, 'PHASE_1', 'Inputs & clarity', 'Lock the message and plan.', 'Days 0-2'),
  ('LAUNCH', 2, 'PHASE_2', 'Words that sell', 'We write your 3 pages.', 'Days 3-5'),
  ('LAUNCH', 3, 'PHASE_3', 'Design & build', 'We turn copy into a 3 page site.', 'Days 6-10'),
  ('LAUNCH', 4, 'PHASE_4', 'Test & launch', 'We connect domain, test and go live.', 'Days 11-14')
ON CONFLICT (kit_type, phase_number) DO NOTHING;

-- Growth Kit Phase Templates
INSERT INTO phase_templates (kit_type, phase_number, phase_id, title, subtitle, day_range)
VALUES
  ('GROWTH', 1, 'PHASE_1', 'Strategy locked in', 'Offer, goal and funnel map agreed.', 'Days 0-2'),
  ('GROWTH', 2, 'PHASE_2', 'Copy & email engine', 'We write your site copy and 5 emails.', 'Days 3-5'),
  ('GROWTH', 3, 'PHASE_3', 'Build the funnel', 'Pages, lead magnet and blog hub built.', 'Days 6-10'),
  ('GROWTH', 4, 'PHASE_4', 'Test & handover', 'We test the full journey and go live.', 'Days 11-14')
ON CONFLICT (kit_type, phase_number) DO NOTHING;

-- ============================================
-- INSERT CONSTANT CHECKLIST ITEM DATA
-- ============================================

-- Launch Kit Phase 1 Checklist Items
INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Onboarding steps completed', 1
FROM phase_templates pt
WHERE pt.kit_type = 'LAUNCH' AND pt.phase_number = 1
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Brand / strategy call completed', 2
FROM phase_templates pt
WHERE pt.kit_type = 'LAUNCH' AND pt.phase_number = 1
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Simple 14 day plan agreed', 3
FROM phase_templates pt
WHERE pt.kit_type = 'LAUNCH' AND pt.phase_number = 1
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

-- Launch Kit Phase 2 Checklist Items
INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Draft homepage copy ready', 1
FROM phase_templates pt
WHERE pt.kit_type = 'LAUNCH' AND pt.phase_number = 2
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Draft offer / services page ready', 2
FROM phase_templates pt
WHERE pt.kit_type = 'LAUNCH' AND pt.phase_number = 2
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Draft contact/about copy ready', 3
FROM phase_templates pt
WHERE pt.kit_type = 'LAUNCH' AND pt.phase_number = 2
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'You reviewed and approved copy', 4
FROM phase_templates pt
WHERE pt.kit_type = 'LAUNCH' AND pt.phase_number = 2
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

-- Launch Kit Phase 3 Checklist Items
INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Site layout built for all 3 pages', 1
FROM phase_templates pt
WHERE pt.kit_type = 'LAUNCH' AND pt.phase_number = 3
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Mobile checks done', 2
FROM phase_templates pt
WHERE pt.kit_type = 'LAUNCH' AND pt.phase_number = 3
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Testimonials and proof added', 3
FROM phase_templates pt
WHERE pt.kit_type = 'LAUNCH' AND pt.phase_number = 3
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Staging link shared with you', 4
FROM phase_templates pt
WHERE pt.kit_type = 'LAUNCH' AND pt.phase_number = 3
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

-- Launch Kit Phase 4 Checklist Items
INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Forms tested', 1
FROM phase_templates pt
WHERE pt.kit_type = 'LAUNCH' AND pt.phase_number = 4
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Domain connected', 2
FROM phase_templates pt
WHERE pt.kit_type = 'LAUNCH' AND pt.phase_number = 4
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Final tweaks applied', 3
FROM phase_templates pt
WHERE pt.kit_type = 'LAUNCH' AND pt.phase_number = 4
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Loom walkthrough recorded and shared', 4
FROM phase_templates pt
WHERE pt.kit_type = 'LAUNCH' AND pt.phase_number = 4
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

-- Growth Kit Phase 1 Checklist Items
INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Onboarding complete', 1
FROM phase_templates pt
WHERE pt.kit_type = 'GROWTH' AND pt.phase_number = 1
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Strategy / funnel call done', 2
FROM phase_templates pt
WHERE pt.kit_type = 'GROWTH' AND pt.phase_number = 1
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Main offer + 90 day goal confirmed', 3
FROM phase_templates pt
WHERE pt.kit_type = 'GROWTH' AND pt.phase_number = 1
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Simple funnel map agreed', 4
FROM phase_templates pt
WHERE pt.kit_type = 'GROWTH' AND pt.phase_number = 1
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

-- Growth Kit Phase 2 Checklist Items
INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Draft website copy ready', 1
FROM phase_templates pt
WHERE pt.kit_type = 'GROWTH' AND pt.phase_number = 2
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Draft 5-email nurture sequence ready', 2
FROM phase_templates pt
WHERE pt.kit_type = 'GROWTH' AND pt.phase_number = 2
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'You reviewed and approved copy', 3
FROM phase_templates pt
WHERE pt.kit_type = 'GROWTH' AND pt.phase_number = 2
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Any changes locked in', 4
FROM phase_templates pt
WHERE pt.kit_type = 'GROWTH' AND pt.phase_number = 2
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

-- Growth Kit Phase 3 Checklist Items
INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, '4-6 page site built on staging', 1
FROM phase_templates pt
WHERE pt.kit_type = 'GROWTH' AND pt.phase_number = 3
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Lead magnet page + thank you page built', 2
FROM phase_templates pt
WHERE pt.kit_type = 'GROWTH' AND pt.phase_number = 3
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Opt-in forms wired to your email platform', 3
FROM phase_templates pt
WHERE pt.kit_type = 'GROWTH' AND pt.phase_number = 3
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Blog hub and 1-2 starter posts set up', 4
FROM phase_templates pt
WHERE pt.kit_type = 'GROWTH' AND pt.phase_number = 3
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Staging link shared', 5
FROM phase_templates pt
WHERE pt.kit_type = 'GROWTH' AND pt.phase_number = 3
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

-- Growth Kit Phase 4 Checklist Items
INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Funnel tested from first visit to booked call', 1
FROM phase_templates pt
WHERE pt.kit_type = 'GROWTH' AND pt.phase_number = 4
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Domain connected', 2
FROM phase_templates pt
WHERE pt.kit_type = 'GROWTH' AND pt.phase_number = 4
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Tracking checked (Analytics / pixels)', 3
FROM phase_templates pt
WHERE pt.kit_type = 'GROWTH' AND pt.phase_number = 4
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, '5-email sequence switched on', 4
FROM phase_templates pt
WHERE pt.kit_type = 'GROWTH' AND pt.phase_number = 4
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

INSERT INTO checklist_item_templates (phase_template_id, label, sort_order)
SELECT pt.id, 'Loom walkthrough recorded and shared', 5
FROM phase_templates pt
WHERE pt.kit_type = 'GROWTH' AND pt.phase_number = 4
ON CONFLICT (phase_template_id, sort_order) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE phase_templates IS 'Stores constant phase definitions for Launch Kit and Growth Kit. These are copied when projects are created.';
COMMENT ON TABLE checklist_item_templates IS 'Stores constant checklist item definitions for each phase template.';

