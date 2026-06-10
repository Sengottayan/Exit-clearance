-- =============================================================================
-- Migration: 00019_manager_identity_map.sql
-- Purpose:   
--   1. Create manager_identity_map table for permanent manager remapping.
--   2. Add database indexes to optimize dashboard and case tracking.
--   3. Recreate backward-compatibility views to resolve stale column issues.
-- =============================================================================

BEGIN;

-- ── 1. Create manager_identity_map ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS manager_identity_map (
  synthetic_manager_id  TEXT PRIMARY KEY,
  clerk_user_id        TEXT NOT NULL,
  email                TEXT NOT NULL,
  mapped_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_mgr_identity_map_clerk ON manager_identity_map (clerk_user_id);

-- ── 2. Add Database Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_legacy_exit_cases_manager_id ON legacy_exit_cases (manager_id);
CREATE INDEX IF NOT EXISTS idx_legacy_exit_cases_status ON legacy_exit_cases (status);
CREATE INDEX IF NOT EXISTS idx_legacy_clearance_tasks_assignee ON legacy_clearance_tasks (assignee_id);

-- ── 3. Recreate Backward-Compatibility Views ─────────────────────────────────
-- Recreating the views ensures any new columns (like manager_email) added to the 
-- base tables are correctly exposed via the views in PostgREST.
DROP VIEW IF EXISTS exit_cases CASCADE;
CREATE OR REPLACE VIEW exit_cases AS SELECT * FROM legacy_exit_cases;

DROP VIEW IF EXISTS clearance_tasks CASCADE;
CREATE OR REPLACE VIEW clearance_tasks AS SELECT * FROM legacy_clearance_tasks;

DROP VIEW IF EXISTS case_comments CASCADE;
CREATE OR REPLACE VIEW case_comments AS SELECT * FROM legacy_case_comments;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';

COMMIT;
