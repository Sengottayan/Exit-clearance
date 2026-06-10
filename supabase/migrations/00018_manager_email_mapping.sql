-- =============================================================================
-- Migration: 00018_manager_email_mapping.sql
-- Purpose:   
--   1. Add manager_email column to legacy_exit_cases for email-based ID remapping
--      (production-safe alternative to hardcoded ID matching)
--   2. Create department_assignments table for dept_approvers (scalable multi-dept support)
--   3. Backfill manager_email from existing synthetic data
-- =============================================================================

BEGIN;

-- ── 1. Add manager_email to legacy_exit_cases ─────────────────────────────────
-- This allows us to remap manager_id from fake synthetic IDs to real Clerk IDs
-- by matching on the manager's email address (which stays constant).
ALTER TABLE legacy_exit_cases
  ADD COLUMN IF NOT EXISTS manager_email TEXT;

-- Create an index for fast email-based lookups during remapping
CREATE INDEX IF NOT EXISTS idx_legacy_exit_cases_manager_email ON legacy_exit_cases (manager_email);

-- ── 2. Backfill manager_email for existing synthetic data ─────────────────────
-- For the synthetic manager (usr_mgr_004), set the email from the users table
UPDATE legacy_exit_cases lec
SET manager_email = u.email
FROM users u
WHERE lec.manager_id = u.id
  AND lec.manager_email IS NULL;

-- ── 3. Create department_assignments table ────────────────────────────────────
-- Scalable model: one dept_approver can manage multiple departments.
-- This is the enterprise-safe alternative to storing dept directly in users.
CREATE TABLE IF NOT EXISTS department_assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department  TEXT NOT NULL,     -- e.g. 'it', 'finance', 'hr', 'admin', 'infosec'
  dept_label  TEXT NOT NULL,     -- e.g. 'IT', 'Finance', 'HR'
  authority   TEXT NOT NULL DEFAULT 'approver' CHECK (authority IN ('approver', 'primary', 'backup')),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, department)
);

CREATE INDEX IF NOT EXISTS idx_dept_assignments_user    ON department_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_dept_assignments_dept    ON department_assignments(department);
CREATE INDEX IF NOT EXISTS idx_dept_assignments_active  ON department_assignments(is_active) WHERE is_active = true;

-- ── 4. Migrate existing dept_approver assignments from legacy data ────────────
-- Seed from clearance_tasks where assignee is a dept_approver role
INSERT INTO department_assignments (user_id, department, dept_label, authority)
SELECT DISTINCT
  ct.assignee_id,
  ct.dept_id,
  ct.dept_label,
  'primary'
FROM legacy_clearance_tasks ct
JOIN users u ON u.id = ct.assignee_id
WHERE u.role = 'dept_approver'
  AND ct.dept_id IS NOT NULL
ON CONFLICT (user_id, department) DO NOTHING;

-- ── 5. Expose via backward-compatibility view ─────────────────────────────────
-- Allow APIs to query department_assignments like any other table
NOTIFY pgrst, 'reload schema';

COMMIT;
