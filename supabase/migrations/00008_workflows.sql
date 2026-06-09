-- Exit-Clearance: Workflows & Compliance Rules Migration
-- This migration creates the versioned workflow engine, checklist templates,
-- and SLA escalation rules.

BEGIN;

-- ============================================================================
-- 1. ORGANIZATION WORKFLOWS
-- ============================================================================

CREATE TABLE organization_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workflow_type TEXT NOT NULL DEFAULT 'standard',
    execution_mode TEXT NOT NULL DEFAULT 'parallel' CHECK (execution_mode IN ('parallel', 'sequential')),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- 2. WORKFLOW VERSIONS & STEPS (Relational Definition)
-- ============================================================================

CREATE TABLE workflow_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES organization_workflows(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A unique constraint to ensure only one active version per workflow.
-- PostgreSQL allows multiple NULLs in UNIQUE, but for booleans we use a partial index:
CREATE UNIQUE INDEX idx_workflow_active_version ON workflow_versions (workflow_id) WHERE is_active = true;

CREATE TABLE workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_version_id UUID NOT NULL REFERENCES workflow_versions(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES organization_departments(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(workflow_version_id, department_id),
    UNIQUE(workflow_version_id, step_order)
);

-- ============================================================================
-- 3. CHECKLIST TEMPLATES
-- ============================================================================

-- The old checklist_templates table does not have an organization_id and its ID is a string.
-- We will create a new multi-tenant version and migrate data to the legacy org.

CREATE TABLE org_checklist_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES organization_departments(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Migrate old checklist_templates into the Legacy Organization
INSERT INTO org_checklist_templates (organization_id, department_id, label, is_mandatory, sort_order)
SELECT 
    '00000000-0000-0000-0000-000000000000'::uuid,
    md5(dept_id)::uuid,
    label,
    is_mandatory,
    sort_order
FROM checklist_templates
ON CONFLICT DO NOTHING;

-- Drop the old table to prevent confusion (optional in a strict rollback-capable flow,
-- but since we're generating the core schemas, it's safer to rename it).
ALTER TABLE checklist_templates RENAME TO legacy_checklist_templates;

-- ============================================================================
-- 4. SLA ESCALATION RULES
-- ============================================================================

CREATE TABLE sla_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES organization_departments(id) ON DELETE CASCADE,
    warning_after_hours INTEGER NOT NULL DEFAULT 24,
    breach_after_hours INTEGER NOT NULL DEFAULT 48,
    escalate_to_member_id UUID REFERENCES organization_members(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE organization_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation on Workflows" ON organization_workflows
FOR ALL USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid);

CREATE POLICY "Tenant Isolation on Workflow Versions" ON workflow_versions
FOR ALL USING (
    workflow_id IN (
        SELECT id FROM organization_workflows 
        WHERE organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid
    )
);

CREATE POLICY "Tenant Isolation on Workflow Steps" ON workflow_steps
FOR ALL USING (
    workflow_version_id IN (
        SELECT v.id FROM workflow_versions v
        JOIN organization_workflows w ON w.id = v.workflow_id
        WHERE w.organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid
    )
);

CREATE POLICY "Tenant Isolation on Checklist Templates" ON org_checklist_templates
FOR ALL USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid);

CREATE POLICY "Tenant Isolation on SLA Rules" ON sla_rules
FOR ALL USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid);

COMMIT;
