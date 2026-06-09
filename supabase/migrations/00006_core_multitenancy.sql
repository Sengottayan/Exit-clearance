-- Exit-Clearance: Core Multitenancy & Access Control Migration
-- This migration transitions the system to a multi-tenant B2B architecture.
-- It creates the base tenant structures and migrates existing single-tenant users
-- into a default 'Legacy Organization' to prevent data loss.

BEGIN;

-- ============================================================================
-- 1. ORGANIZATIONS
-- ============================================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_org_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('trial', 'active', 'suspended', 'cancelled')),
    subscription_plan TEXT NOT NULL DEFAULT 'free',
    logo_url TEXT,
    created_by TEXT NOT NULL, -- references users(id) conceptually, but added before FK
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_organizations_clerk_id ON organizations(clerk_org_id);
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Create the default Legacy Organization for existing data
INSERT INTO organizations (id, clerk_org_id, name, slug, created_by)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'org_legacy_default',
    'Legacy Organization',
    'legacy-org',
    'system'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. USERS (Refining the local cache layer)
-- ============================================================================

-- The `users` table already exists. We will preserve it but add first_name/last_name
-- for better caching. We will not drop the old columns yet to avoid breaking 
-- existing cases during the multi-file migration. They will be dropped in a cleanup phase.

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Update existing users with split names
UPDATE users SET 
    first_name = split_part(name, ' ', 1),
    last_name = SUBSTRING(name FROM POSITION(' ' IN name) + 1)
WHERE first_name IS NULL;

-- ============================================================================
-- 3. ORGANIZATION MEMBERS (The Tenant Identity)
-- ============================================================================

CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id_string TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);

-- Migrate existing users into the Legacy Organization
INSERT INTO organization_members (organization_id, user_id, employee_id_string)
SELECT '00000000-0000-0000-0000-000000000000', id, employee_id
FROM users
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. NORMALIZED RBAC (Roles & Permissions)
-- ============================================================================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_system_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(organization_id, name)
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    system_key TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(role_id, permission_id)
);

CREATE TABLE member_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(member_id, role_id)
);

-- Seed System Permissions
INSERT INTO permissions (name, system_key, description) VALUES
    ('Manage Users', 'users.manage', 'Can invite and manage members'),
    ('Manage Workflows', 'workflows.manage', 'Can configure exit workflows'),
    ('Approve Clearance', 'clearance.approve', 'Can approve assigned clearance tasks'),
    ('View All Cases', 'cases.view_all', 'Can view all exit cases across departments'),
    ('Manage Cases', 'cases.manage', 'Can manually override or cancel cases')
ON CONFLICT (system_key) DO NOTHING;

-- Seed Default Legacy Roles
INSERT INTO roles (id, organization_id, name, is_system_default) VALUES
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'HR Admin', true),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'Manager', true),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'Department Approver', true),
    ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'Employee', true)
ON CONFLICT DO NOTHING;

-- Migrate Existing User Roles into member_roles
-- (Maps the legacy ENUM role to the new dynamic member_roles table)
INSERT INTO member_roles (member_id, role_id)
SELECT 
    om.id,
    CASE u.role
        WHEN 'hr' THEN '10000000-0000-0000-0000-000000000001'::uuid
        WHEN 'admin' THEN '10000000-0000-0000-0000-000000000001'::uuid
        WHEN 'manager' THEN '10000000-0000-0000-0000-000000000002'::uuid
        WHEN 'dept_approver' THEN '10000000-0000-0000-0000-000000000003'::uuid
        ELSE '10000000-0000-0000-0000-000000000004'::uuid
    END
FROM organization_members om
JOIN users u ON u.id = om.user_id
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) ACTIVATION
-- ============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_roles ENABLE ROW LEVEL SECURITY;

-- Unified Tenant Isolation Policy Function
-- We will use this paradigm across all tables in future migrations.
-- Example: (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid

CREATE POLICY "Platform Admins bypass all RLS" ON organizations
FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin');

CREATE POLICY "Tenant Isolation on Organizations" ON organizations
FOR ALL USING (id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid);

CREATE POLICY "Platform Admins bypass members RLS" ON organization_members
FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin');

CREATE POLICY "Tenant Isolation on Members" ON organization_members
FOR ALL USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid);

CREATE POLICY "Platform Admins bypass roles RLS" ON roles
FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin');

CREATE POLICY "Tenant Isolation on Roles" ON roles
FOR ALL USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid);

COMMIT;
