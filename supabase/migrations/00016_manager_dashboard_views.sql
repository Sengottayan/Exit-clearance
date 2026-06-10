-- =============================================================================
-- Migration: 00016_manager_dashboard_views.sql
-- Purpose:   Database views that power the Manager Dashboard KPI cards,
--            Exit Cases Trend chart, and SLA Status donut chart.
-- =============================================================================

BEGIN;

-- ── 1. Manager Dashboard KPI Metrics ─────────────────────────────────────────
-- Per-manager aggregate counts. Used by GET /api/manager/dashboard
CREATE OR REPLACE VIEW manager_dashboard_metrics AS
SELECT
  ec.manager_id,
  COUNT(*)                                            AS total_cases,
  COUNT(*) FILTER (WHERE ec.status = 'pending_manager') AS pending_approval,
  COUNT(*) FILTER (WHERE ec.status = 'in_clearance')    AS in_clearance,
  COUNT(*) FILTER (WHERE ec.status = 'completed')       AS completed,
  -- SLA Overdue: case has at least one pending task past its SLA deadline
  COUNT(DISTINCT ec.id) FILTER (
    WHERE EXISTS (
      SELECT 1
      FROM   clearance_tasks ct
      WHERE  ct.case_id = ec.id
        AND  ct.status   NOT IN ('approved', 'completed')
        AND  ct.sla_due_at < NOW()
    )
  )                                                   AS sla_overdue
FROM exit_cases ec
WHERE ec.status NOT IN ('cancelled')
GROUP BY ec.manager_id;

-- ── 2. 30-Day Daily Exit Trend ────────────────────────────────────────────────
-- Day-by-day case creation, completion and overdue counts.
-- Used by GET /api/manager/dashboard/trend
CREATE OR REPLACE VIEW case_trend_daily AS
SELECT
  ec.manager_id,
  DATE(ec.created_at)  AS trend_date,
  COUNT(*)             AS total_created,
  COUNT(*) FILTER (WHERE ec.status = 'completed')     AS total_completed,
  COUNT(DISTINCT ec.id) FILTER (
    WHERE EXISTS (
      SELECT 1
      FROM   clearance_tasks ct
      WHERE  ct.case_id       = ec.id
        AND  ct.status         NOT IN ('approved', 'completed')
        AND  ct.sla_due_at    < NOW()
    )
  )                    AS total_overdue
FROM exit_cases ec
WHERE ec.created_at >= (CURRENT_DATE - INTERVAL '30 days')
  AND ec.status NOT IN ('cancelled')
GROUP BY ec.manager_id, DATE(ec.created_at)
ORDER BY ec.manager_id, trend_date;

-- ── 3. SLA Status Breakdown ───────────────────────────────────────────────────
-- Active-case SLA health per manager.
-- Used by GET /api/manager/dashboard/sla
CREATE OR REPLACE VIEW case_sla_status AS
SELECT
  manager_id,
  SUM(CASE WHEN sla_bucket = 'on_track' THEN 1 ELSE 0 END) AS on_track,
  SUM(CASE WHEN sla_bucket = 'at_risk'  THEN 1 ELSE 0 END) AS at_risk,
  SUM(CASE WHEN sla_bucket = 'overdue'  THEN 1 ELSE 0 END) AS overdue,
  COUNT(*)                                                   AS total
FROM (
  SELECT
    ec.id,
    ec.manager_id,
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM   clearance_tasks ct
        WHERE  ct.case_id    = ec.id
          AND  ct.status      NOT IN ('approved', 'completed')
          AND  ct.sla_due_at < NOW()
      ) THEN 'overdue'
      WHEN ec.status = 'in_clearance' THEN 'at_risk'
      ELSE 'on_track'
    END AS sla_bucket
  FROM exit_cases ec
  WHERE ec.status NOT IN ('completed', 'cancelled')
) sla_calc
GROUP BY manager_id;

COMMIT;
