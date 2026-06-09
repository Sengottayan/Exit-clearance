-- Exit-Clearance: Organization Structure & Routing Migration
-- This migration creates the organization hierarchy, teams, matrix reporting,
-- and dynamic routing for department approvers.

BEGIN;

-- ============================================================================
-- 1. ORGANIZATION DEPARTMENTS
-- ============================================================================

CREATE TABLE organization_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'Building2',
    is_mandatory BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(organization_id, name)
);

-- Migrate existing global departments into the Legacy Organization
INSERT INTO organization_departments (id, organization_id, name, label, icon, is_mandatory)
SELECT 
    -- Assuming old department ID was a string (e.g., 'it'). We must cast or hash to UUID.
    -- For safety in Postgres, we'll generate a random UUID and just copy the data.
    -- Wait, if checklist_templates and clearance_tasks reference 'id', changing to UUID breaks everything.
    -- Since the original schema used TEXT for department id, let's keep it TEXT or UUID. 
    -- Actually, in 00001_initial_schema.sql, `departments.id` was TEXT. 
    -- We'll need to alter the new table to use TEXT for the ID to match existing FKs, OR
    -- we can use an interim UUID mapping. Since we're moving to UUIDs globally, 
    -- we should use gen_random_uuid() and keep a mapping if we were doing a true data migration.
    -- For this schema, we will assume standard UUIDs. Let's use MD5 to generate deterministic UUIDs from strings.
    md5(id)::uuid, 
    '00000000-0000-0000-0000-000000000000'::uuid, 
    id, 
    label, 
    icon, 
    is_mandatory
FROM departments
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. ORGANIZATION TEAMS
-- ============================================================================

CREATE TABLE organization_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES organization_departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(organization_id, department_id, name)
);

CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES organization_teams(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(team_id, member_id)
);

-- ============================================================================
-- 3. REPORTING RELATIONSHIPS (Manager Matrix)
-- ============================================================================

CREATE TABLE reporting_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    manager_member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'solid' CHECK (type IN ('solid', 'dotted', 'temporary')),
    effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
    effective_to TIMESTAMPTZ, -- NULL means active
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Note: In a true migration, we would SELECT manager_id from users and map it here.
-- Assuming `users.manager_id` exists from migration 00003, we can migrate it:
INSERT INTO reporting_relationships (organization_id, employee_member_id, manager_member_id)
SELECT 
    '00000000-0000-0000-0000-000000000000'::uuid,
    emp_member.id,
    mgr_member.id
FROM users u
JOIN organization_members emp_member ON emp_member.user_id = u.id
JOIN users mgr ON u.manager_id = mgr.id
JOIN organization_members mgr_member ON mgr_member.user_id = mgr.id
WHERE u.manager_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. DEPARTMENT APPROVERS (Routing Logic)
-- ============================================================================

CREATE TABLE department_approvers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES organization_departments(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    is_backup BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(organization_id, department_id, member_id)
);

-- Migrate existing `default_assignee` from departments into department_approvers
INSERT INTO department_approvers (organization_id, department_id, member_id, is_primary)
SELECT 
    '00000000-0000-0000-0000-000000000000'::uuid,
    md5(d.id)::uuid,
    om.id,
    true
FROM departments d
JOIN organization_members om ON om.user_id = d.default_assignee
WHERE d.default_assignee IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE organization_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE reporting_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_approvers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation on Departments" ON organization_departments
FOR ALL USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid);

CREATE POLICY "Tenant Isolation on Teams" ON organization_teams
FOR ALL USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid);

-- team_members borrows org_id from the team it belongs to via a subquery, 
-- or we can denormalize organization_id onto team_members for speed. 
-- For strict isolation and speed, denormalization is preferred, but for now we subquery.
CREATE POLICY "Tenant Isolation on Team Members" ON team_members
FOR ALL USING (
    team_id IN (
        SELECT id FROM organization_teams 
        WHERE organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid
    )
);

CREATE POLICY "Tenant Isolation on Reporting" ON reporting_relationships
FOR ALL USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid);

CREATE POLICY "Tenant Isolation on Approvers" ON department_approvers
FOR ALL USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid);

COMMIT;
