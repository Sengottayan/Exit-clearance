-- ============================================================================
-- Exit-Clearance: Add Profile and Employment Fields
-- Migration: 00015_user_profile_fields.sql
-- ============================================================================

BEGIN;

-- 1. Extend the Identity Table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- 2. Define Employment Status ENUM
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employment_status_type') THEN
        CREATE TYPE employment_status_type AS ENUM ('active', 'notice_period', 'exiting', 'terminated', 'resigned');
    END IF;
END $$;

-- 3. Extend the Organization Membership Table
ALTER TABLE organization_members
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS employee_type TEXT,
ADD COLUMN IF NOT EXISTS date_of_hire TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS employment_status employment_status_type NOT NULL DEFAULT 'active';

-- Update existing members with some basic data if necessary
UPDATE organization_members SET date_of_hire = created_at WHERE date_of_hire IS NULL;

-- Ensure RLS is aware of these fields
-- No changes to RLS policies needed as we are just adding columns to tables
-- that are already covered by tenant isolation rules.

-- Re-expose the PostgREST schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
