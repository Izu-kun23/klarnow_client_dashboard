-- Migration: Create user_onboarding table
-- This table tracks email and onboarding completion status for users

-- Onboarding Tracking Table
CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  onboarding_finished BOOLEAN DEFAULT false,
  onboarding_completed_at TIMESTAMPTZ,
  kit_type TEXT CHECK (kit_type IN ('LAUNCH', 'GROWTH')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_onboarding_email ON user_onboarding(email);

-- Create index on onboarding_finished for filtering
CREATE INDEX IF NOT EXISTS idx_user_onboarding_finished ON user_onboarding(onboarding_finished);

-- Enable RLS for user_onboarding
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_onboarding
CREATE POLICY "Users can view their own onboarding status"
  ON user_onboarding FOR SELECT
  USING (true); -- Allow public read for email lookup

CREATE POLICY "Admins can view all onboarding statuses"
  ON user_onboarding FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all onboarding statuses"
  ON user_onboarding FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- Function to sync onboarding status to user_onboarding table
CREATE OR REPLACE FUNCTION sync_user_onboarding()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  existing_completed_at TIMESTAMPTZ;
BEGIN
  -- Get email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id
  LIMIT 1;
  
  -- Get existing onboarding_completed_at if record exists
  IF user_email IS NOT NULL THEN
    SELECT onboarding_completed_at INTO existing_completed_at
    FROM user_onboarding
    WHERE email = user_email
    LIMIT 1;
    
    -- Insert or update user_onboarding
    INSERT INTO user_onboarding (email, onboarding_finished, kit_type, onboarding_completed_at, updated_at)
    VALUES (
      user_email,
      NEW.onboarding_finished,
      NEW.kit_type,
      CASE 
        WHEN NEW.onboarding_finished = true AND existing_completed_at IS NULL 
        THEN NOW() 
        ELSE existing_completed_at 
      END,
      NOW()
    )
    ON CONFLICT (email) 
    DO UPDATE SET
      onboarding_finished = NEW.onboarding_finished,
      kit_type = NEW.kit_type,
      onboarding_completed_at = CASE 
        WHEN NEW.onboarding_finished = true AND user_onboarding.onboarding_completed_at IS NULL 
        THEN NOW() 
        ELSE user_onboarding.onboarding_completed_at 
      END,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync onboarding status when projects table is updated
DROP TRIGGER IF EXISTS trigger_sync_user_onboarding ON projects;
CREATE TRIGGER trigger_sync_user_onboarding
AFTER INSERT OR UPDATE OF onboarding_finished ON projects
FOR EACH ROW
EXECUTE FUNCTION sync_user_onboarding();

