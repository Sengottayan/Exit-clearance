-- ==============================================================================
-- Migration: 00022_manager_phase1.sql
-- Description: Creates tables for manager approval history and SLAs
-- Phase 1 of Manager Module Security & Data Integrity Audit.
-- ==============================================================================

-- 1. Create Manager Approval History Table
CREATE TABLE IF NOT EXISTS manager_approval_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    case_id TEXT NOT NULL, -- references legacy_exit_cases.id
    manager_id TEXT NOT NULL, -- The clerk user ID of the manager
    action TEXT NOT NULL, -- e.g., 'approved', 'rejected', 'escalated'
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by case
CREATE INDEX IF NOT EXISTS idx_manager_approval_history_case 
ON manager_approval_history(case_id);

-- Index for multitenancy
CREATE INDEX IF NOT EXISTS idx_manager_approval_history_org 
ON manager_approval_history(organization_id);


-- 2. Create Approval Escalations Table
CREATE TABLE IF NOT EXISTS approval_escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    case_id TEXT NOT NULL, -- references legacy_exit_cases.id
    manager_id TEXT NOT NULL,
    escalation_level INTEGER NOT NULL, -- 1: Reminder, 2: HR, 3: Dept Head
    escalated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent duplicate escalations for the same case/level
CREATE UNIQUE INDEX IF NOT EXISTS idx_approval_escalations_unique_level 
ON approval_escalations(case_id, escalation_level);

-- Index for multitenancy
CREATE INDEX IF NOT EXISTS idx_approval_escalations_org 
ON approval_escalations(organization_id);

-- 3. Add organization_id RLS if desired in future (currently handled by app code)
-- ALTER TABLE manager_approval_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE approval_escalations ENABLE ROW LEVEL SECURITY;
