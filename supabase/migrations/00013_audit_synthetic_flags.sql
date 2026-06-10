-- Exit-Clearance: Audit Synthetic Flags Migration
-- Adds is_synthetic, synthetic_archived_at, and source_type columns to org_audit_logs.
-- Also creates a trigger that auto-archives synthetic rows when the first real event lands.

BEGIN;

-- ============================================================================
-- 1. EXTEND org_audit_logs
-- ============================================================================

ALTER TABLE org_audit_logs
  ADD COLUMN IF NOT EXISTS is_synthetic          BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS synthetic_archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_type           TEXT      NOT NULL DEFAULT 'real'
    CHECK (source_type IN ('real', 'synthetic', 'legacy'));

-- Performance index: used by every KPI and list query to exclude archived synthetic rows
CREATE INDEX IF NOT EXISTS idx_audit_logs_source_type
  ON org_audit_logs(organization_id, is_synthetic, synthetic_archived_at, created_at DESC);

-- ============================================================================
-- 2. BACKFILL: Mark migrated legacy rows
-- ============================================================================

-- Records migrated from the old audit_logs table (inserted during migration 00011)
-- had no source_type. Mark them as legacy so they can be distinguished.
UPDATE org_audit_logs
SET source_type = 'legacy'
WHERE source_type = 'real'
  AND created_at < NOW() - INTERVAL '1 day'; -- rough heuristic: old migrated rows

-- ============================================================================
-- 3. TRIGGER: Auto-archive synthetic rows when first real event arrives
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_archive_synthetic_on_real_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire when a REAL event is being inserted
  IF NEW.is_synthetic = FALSE AND NEW.source_type = 'real' THEN
    -- Check if there are currently un-archived synthetic rows for this org
    IF EXISTS (
      SELECT 1 FROM org_audit_logs
      WHERE organization_id = NEW.organization_id
        AND is_synthetic = TRUE
        AND synthetic_archived_at IS NULL
      LIMIT 1
    ) THEN
      -- Archive all synthetic rows for this org
      UPDATE org_audit_logs
      SET synthetic_archived_at = NOW()
      WHERE organization_id = NEW.organization_id
        AND is_synthetic = TRUE
        AND synthetic_archived_at IS NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_archive_synthetic ON org_audit_logs;

CREATE TRIGGER trg_archive_synthetic
  AFTER INSERT ON org_audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION fn_archive_synthetic_on_real_activity();

COMMIT;
