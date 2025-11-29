-- Test script to validate migration SQL syntax
-- This will check for syntax errors without executing

-- Set to rollback mode so nothing is committed
BEGIN;

-- Test the migration file
\i supabase/migrations/create_projects_and_onboarding_tables.sql

-- Rollback all changes (testing only)
ROLLBACK;

