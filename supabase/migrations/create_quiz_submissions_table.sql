-- Migration: Create Quiz Submissions Table
-- This table stores quiz submissions from users who want to use the Klarnow service

-- Quiz Submissions Table
CREATE TABLE IF NOT EXISTS quiz_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT,
  brand_name TEXT NOT NULL,
  logo_status TEXT NOT NULL,
  brand_goals TEXT[] NOT NULL DEFAULT '{}',
  online_presence TEXT NOT NULL,
  audience TEXT[] NOT NULL DEFAULT '{}',
  brand_style TEXT NOT NULL,
  timeline TEXT NOT NULL,
  preferred_kit TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_email ON quiz_submissions(email);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_preferred_kit ON quiz_submissions(preferred_kit);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_created_at ON quiz_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_brand_name ON quiz_submissions(brand_name);

-- Enable Row Level Security
ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quiz_submissions
-- Users can view their own submissions (if they have email match)
CREATE POLICY "Users can view their own submissions"
  ON quiz_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE LOWER(auth.users.email) = LOWER(quiz_submissions.email) 
      AND auth.uid() = auth.users.id
    )
  );

-- Admins can view all submissions
CREATE POLICY "Admins can view all quiz submissions"
  ON quiz_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- Admins can insert quiz submissions
CREATE POLICY "Admins can insert quiz submissions"
  ON quiz_submissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- Admins can update quiz submissions
CREATE POLICY "Admins can update quiz submissions"
  ON quiz_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- Public can insert (for quiz form submissions)
CREATE POLICY "Public can submit quiz"
  ON quiz_submissions FOR INSERT
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quiz_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_quiz_submissions_updated_at ON quiz_submissions;
CREATE TRIGGER trigger_update_quiz_submissions_updated_at
BEFORE UPDATE ON quiz_submissions
FOR EACH ROW
EXECUTE FUNCTION update_quiz_submissions_updated_at();

-- Function to sync quiz submission to user_profiles (optional)
CREATE OR REPLACE FUNCTION sync_quiz_submission_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- If preferred_kit is determined, create/update user profile
  IF NEW.preferred_kit IS NOT NULL AND UPPER(NEW.preferred_kit) IN ('LAUNCH', 'GROWTH') THEN
    INSERT INTO user_profiles (email, name, kit_type, onboarding_finished)
    VALUES (LOWER(NEW.email), NEW.full_name, UPPER(NEW.preferred_kit), false)
    ON CONFLICT (email) 
    DO UPDATE SET
      name = COALESCE(EXCLUDED.name, user_profiles.name),
      kit_type = COALESCE(EXCLUDED.kit_type, user_profiles.kit_type),
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync to user_profiles (optional - uncomment if needed)
-- DROP TRIGGER IF EXISTS trigger_sync_quiz_to_profile ON quiz_submissions;
-- CREATE TRIGGER trigger_sync_quiz_to_profile
-- AFTER INSERT OR UPDATE OF preferred_kit ON quiz_submissions
-- FOR EACH ROW
-- WHEN (NEW.preferred_kit IS NOT NULL)
-- EXECUTE FUNCTION sync_quiz_submission_to_profile();

