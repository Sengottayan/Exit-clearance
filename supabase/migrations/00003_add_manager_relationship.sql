-- Migration: Add manager relationship to users table and fix exit_cases FK constraints
-- The original schema used LOCAL mock user IDs ('u1', 'u2') as FKs, but the app uses
-- Clerk user IDs at runtime. This migration:
--   1. Adds manager_id to the users table so each employee knows their reporting manager
--   2. Drops the FK constraints on exit_cases.employee_id / manager_id so real Clerk IDs
--      (which may not yet exist as user rows) can be stored without breaking inserts
--   3. Adds a reporting_manager_name TEXT column for display without a JOIN

-- Step 1: Add manager relationship to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS manager_id            TEXT REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS manager_name          TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS reporting_to_dept     TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS job_title             TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone                 TEXT,
  ADD COLUMN IF NOT EXISTS hire_date             DATE;

CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_id);

-- Step 2: Drop FK constraints on exit_cases so Clerk user IDs work without
--         requiring user rows to pre-exist in the users table.
--         (The users table is populated lazily on first login via /api/auth/sync-user)
ALTER TABLE exit_cases
  DROP CONSTRAINT IF EXISTS exit_cases_employee_id_fkey,
  DROP CONSTRAINT IF EXISTS exit_cases_manager_id_fkey;

-- Make manager_id nullable so cases can be submitted even when manager isn't yet in DB
ALTER TABLE exit_cases
  ALTER COLUMN manager_id DROP NOT NULL;

-- Step 3: Also relax clearance_tasks.assignee_id FK for same reason
ALTER TABLE clearance_tasks
  DROP CONSTRAINT IF EXISTS clearance_tasks_assignee_id_fkey;

-- Step 4: Seed a default system manager row that acts as fallback when no manager exists
-- (Uses a stable ID so foreign references don't break)
INSERT INTO users (id, email, role, name, dept, employee_id, job_title)
VALUES
  ('system-manager', 'manager@exitflow.system', 'manager', 'HR Manager (System)', 'HR', 'SYS-MGR-001', 'HR Manager')
ON CONFLICT (id) DO NOTHING;
