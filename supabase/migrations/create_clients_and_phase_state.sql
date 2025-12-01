-- Migration: Create clients, onboarding_answers, and client_phase_state tables
-- This implements the new database flow where:
-- 1. Onboarding answers are saved to onboarding_answers
-- 2. After onboarding, a clients record is created
-- 3. Phase state (status, checklist) is stored in client_phase_state
-- 4. Static phase structure stays in frontend code

-- 1. onboarding_answers table
CREATE TABLE IF NOT EXISTS onboarding_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL, -- Stores all onboarding form data
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_answers_user_id ON onboarding_answers(user_id);

-- Enable RLS
ALTER TABLE onboarding_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for onboarding_answers
CREATE POLICY "Users can view their own onboarding answers"
  ON onboarding_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding answers"
  ON onboarding_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all onboarding answers"
  ON onboarding_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- 2. clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('LAUNCH', 'GROWTH')),
  onboarding_answers_id UUID REFERENCES onboarding_answers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, plan) -- One client record per user per plan
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_plan ON clients(plan);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "Users can view their own client record"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own client record"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own client record"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all clients"
  ON clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all clients"
  ON clients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- 3. client_phase_state table
-- Stores ONLY dynamic info per client & per phase
CREATE TABLE IF NOT EXISTS client_phase_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  phase_id TEXT NOT NULL, -- e.g., 'PHASE_1', 'PHASE_2', etc.
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' 
    CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'DONE')),
  checklist JSONB NOT NULL DEFAULT '{}', -- { "label": true/false }
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, phase_id) -- One state record per client per phase
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_client_phase_state_client_id ON client_phase_state(client_id);
CREATE INDEX IF NOT EXISTS idx_client_phase_state_phase_id ON client_phase_state(phase_id);
CREATE INDEX IF NOT EXISTS idx_client_phase_state_status ON client_phase_state(status);

-- Enable RLS
ALTER TABLE client_phase_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_phase_state
CREATE POLICY "Users can view phase state for their clients"
  ON client_phase_state FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_phase_state.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update phase state for their clients"
  ON client_phase_state FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_phase_state.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all phase state"
  ON client_phase_state FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all phase state"
  ON client_phase_state FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert phase state"
  ON client_phase_state FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- Enable Realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE clients;
ALTER PUBLICATION supabase_realtime ADD TABLE client_phase_state;
ALTER PUBLICATION supabase_realtime ADD TABLE onboarding_answers;

-- Function to initialize phase state for a client
-- This creates entries in client_phase_state for all phases based on the plan
-- Note: The checklist will be empty initially. The application code (onboarding completion route)
-- will populate the checklist with the actual labels from the phase structure.
CREATE OR REPLACE FUNCTION initialize_client_phase_state(
  p_client_id UUID,
  p_plan TEXT
)
RETURNS void AS $$
DECLARE
  v_phase_ids TEXT[] := ARRAY['PHASE_1', 'PHASE_2', 'PHASE_3', 'PHASE_4'];
  v_phase_id TEXT;
  v_checklist JSONB;
BEGIN
  -- Initialize checklist based on plan and phase
  -- Note: Checklist labels come from frontend code (lib/phase-structure.ts)
  -- This function just creates the entries with empty checklists
  FOR v_phase_id IN SELECT unnest(v_phase_ids) LOOP
    -- Initialize empty checklist (will be populated by application code)
    v_checklist := '{}'::JSONB;
    
    -- Insert phase state with default values
    INSERT INTO client_phase_state (client_id, phase_id, status, checklist)
    VALUES (p_client_id, v_phase_id, 'NOT_STARTED', v_checklist)
    ON CONFLICT (client_id, phase_id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

