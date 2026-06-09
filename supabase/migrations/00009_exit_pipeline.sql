-- Exit-Clearance: Exit Pipeline & State Tracking Migration
-- This migration creates the core resignation workflow, versioned exit cases,
-- dynamic checklist instances, and history tracking.

BEGIN;

-- ============================================================================
-- 1. RESIGNATION REQUESTS (The pre-case funnel)
-- ============================================================================

CREATE TABLE resignation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    reason TEXT,
    comments TEXT,
    status TEXT NOT NULL DEFAULT 'pending_manager' CHECK (status IN ('pending_manager', 'pending_hr', 'approved', 'rejected', 'withdrawn')),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE resignation_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES resignation_requests(id) ON DELETE CASCADE,
    approver_member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    approval_type TEXT NOT NULL CHECK (approval_type IN ('manager', 'hr', 'legal')),
    status TEXT NOT NULL CHECK (status IN ('approved', 'rejected')),
    comments TEXT,
    approved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. EXIT CASES (With Immutable Snapshots)
-- ============================================================================

-- The old exit_cases table does not have an organization_id and uses string IDs.
-- We will create a new multi-tenant version and migrate data to the legacy org.

CREATE TABLE org_exit_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    resignation_request_id UUID REFERENCES resignation_requests(id) ON DELETE SET NULL,
    employee_member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    workflow_version_id UUID REFERENCES workflow_versions(id) ON DELETE SET NULL,
    status case_status NOT NULL DEFAULT 'pending_manager',
    resignation_date TIMESTAMPTZ NOT NULL,
    last_working_day TIMESTAMPTZ NOT NULL,
    notice_period_days INTEGER NOT NULL DEFAULT 0,
    exit_reason TEXT NOT NULL DEFAULT '',
    escalated BOOLEAN NOT NULL DEFAULT false,
    cancel_reason TEXT,
    tags TEXT[] DEFAULT '{}',
    -- Immutable Snapshots to prevent historical corruption
    snapshot_employee_name TEXT NOT NULL,
    snapshot_employee_email TEXT NOT NULL,
    snapshot_employee_dept TEXT NOT NULL,
    snapshot_employee_title TEXT,
    snapshot_employee_phone TEXT,
    snapshot_manager_name TEXT NOT NULL,
    snapshot_manager_email TEXT,
    snapshot_department_name TEXT,
    snapshot_organization_name TEXT NOT NULL,
    snapshot_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migrate old exit_cases into the Legacy Organization
-- (Note: Generating random UUIDs for IDs since old ones were strings. 
-- In a perfect migration, we'd hash the string IDs, but it breaks standard UUID formats. 
-- We'll use md5(id)::uuid for deterministic migration).
INSERT INTO org_exit_cases (
    id, organization_id, employee_member_id, status, resignation_date, last_working_day, 
    notice_period_days, exit_reason, escalated, cancel_reason, tags,
    snapshot_employee_name, snapshot_employee_email, snapshot_employee_dept,
    snapshot_manager_name, snapshot_organization_name
)
SELECT 
    md5(ec.id)::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    om.id,
    ec.status,
    ec.resignation_date,
    ec.last_working_day,
    ec.notice_period_days,
    ec.exit_reason,
    ec.escalated,
    ec.cancel_reason,
    ec.tags,
    ec.employee_name,
    ec.employee_email,
    ec.employee_dept,
    ec.manager_name,
    'Legacy Organization'
FROM exit_cases ec
JOIN organization_members om ON om.user_id = ec.employee_id
ON CONFLICT DO NOTHING;

-- Rename old table to prevent confusion
ALTER TABLE exit_cases RENAME TO legacy_exit_cases;

-- ============================================================================
-- 3. CLEARANCE TASKS & ITEMS
-- ============================================================================

CREATE TABLE org_clearance_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES org_exit_cases(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES organization_departments(id) ON DELETE CASCADE,
    assigned_to_member_id UUID REFERENCES organization_members(id) ON DELETE SET NULL,
    status task_status NOT NULL DEFAULT 'pending',
    sla_due_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    escalated BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migrate old clearance_tasks
INSERT INTO org_clearance_tasks (
    id, organization_id, case_id, department_id, assigned_to_member_id, 
    status, sla_due_at, completed_at, rejection_reason, escalated
)
SELECT 
    md5(ct.id)::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    md5(ct.case_id)::uuid,
    md5(ct.dept_id)::uuid,
    om.id,
    ct.status,
    ct.sla_due_at,
    ct.completed_at,
    ct.rejection_reason,
    false as escalated
FROM clearance_tasks ct
JOIN org_exit_cases oec ON oec.id = md5(ct.case_id)::uuid
LEFT JOIN organization_members om ON om.user_id = ct.assignee_id
ON CONFLICT DO NOTHING;

ALTER TABLE clearance_tasks RENAME TO legacy_clearance_tasks;

-- The new instance-level checklist items (fixes "Where do responses live?")
CREATE TABLE clearance_task_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES org_clearance_tasks(id) ON DELETE CASCADE,
    template_id UUID REFERENCES org_checklist_templates(id) ON DELETE SET NULL,
    label TEXT NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT true,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    value TEXT, -- For tracking serial numbers, notes, etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. CASE COMMENTS & AUDIT TRAILS
-- ============================================================================

CREATE TABLE org_case_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES org_exit_cases(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migrate old comments
INSERT INTO org_case_comments (id, organization_id, case_id, member_id, comment, is_internal, created_at)
SELECT 
    md5(cc.id)::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    md5(cc.case_id)::uuid,
    om.id,
    cc.message,
    false,
    cc.created_at
FROM case_comments cc
JOIN org_exit_cases oec ON oec.id = md5(cc.case_id)::uuid
JOIN organization_members om ON om.user_id = cc.author_id
ON CONFLICT DO NOTHING;

ALTER TABLE case_comments RENAME TO legacy_case_comments;

CREATE TABLE task_assignment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES org_clearance_tasks(id) ON DELETE CASCADE,
    assigned_from_member_id UUID REFERENCES organization_members(id) ON DELETE SET NULL,
    assigned_to_member_id UUID REFERENCES organization_members(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE task_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES org_clearance_tasks(id) ON DELETE CASCADE,
    old_status task_status,
    new_status task_status NOT NULL,
    changed_by_member_id UUID REFERENCES organization_members(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE resignation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE resignation_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_exit_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_clearance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE clearance_task_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_case_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation on Requests" ON resignation_requests
FOR ALL USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid);

CREATE POLICY "Tenant Isolation on Approvals" ON resignation_approvals
FOR ALL USING (
    request_id IN (
        SELECT id FROM resignation_requests
        WHERE organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid
    )
);

CREATE POLICY "Tenant Isolation on Exit Cases" ON org_exit_cases
FOR ALL USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid);

CREATE POLICY "Tenant Isolation on Clearance Tasks" ON org_clearance_tasks
FOR ALL USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid);

CREATE POLICY "Tenant Isolation on Task Items" ON clearance_task_items
FOR ALL USING (
    task_id IN (
        SELECT id FROM org_clearance_tasks
        WHERE organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid
    )
);

CREATE POLICY "Tenant Isolation on Comments" ON org_case_comments
FOR ALL USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid);

CREATE POLICY "Tenant Isolation on Assignment History" ON task_assignment_history
FOR ALL USING (
    task_id IN (
        SELECT id FROM org_clearance_tasks
        WHERE organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid
    )
);

CREATE POLICY "Tenant Isolation on Status History" ON task_status_history
FOR ALL USING (
    task_id IN (
        SELECT id FROM org_clearance_tasks
        WHERE organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid
    )
);

COMMIT;
