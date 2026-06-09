-- Exit-Clearance: Audit & Notifications Migration
-- This migration creates the robust compliance auditing tables, exit interview tracking,
-- and user notification preference management.

BEGIN;

-- ============================================================================
-- 1. EXIT INTERVIEWS
-- ============================================================================

CREATE TABLE org_exit_interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES org_exit_cases(id) ON DELETE CASCADE,
    interviewer_member_id UUID REFERENCES organization_members(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    recommendation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(case_id)
);

-- Migrate old interviews
INSERT INTO org_exit_interviews (id, organization_id, case_id, rating, feedback, created_at)
SELECT 
    md5(ei.id)::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    md5(ei.case_id)::uuid,
    ei.overall_rating,
    ei.comments,
    ei.created_at
FROM exit_interviews ei
JOIN org_exit_cases oec ON oec.id = md5(ei.case_id)::uuid
ON CONFLICT DO NOTHING;

ALTER TABLE exit_interviews RENAME TO legacy_exit_interviews;

-- ============================================================================
-- 2. NOTIFICATIONS & PREFERENCES
-- ============================================================================

CREATE TABLE org_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    email_enabled BOOLEAN NOT NULL DEFAULT true,
    in_app_enabled BOOLEAN NOT NULL DEFAULT true,
    notify_task_assigned BOOLEAN NOT NULL DEFAULT true,
    notify_sla_warning BOOLEAN NOT NULL DEFAULT true,
    notify_case_completed BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(member_id)
);

-- Automatically create default preferences for all existing members
INSERT INTO org_notification_preferences (member_id)
SELECT id FROM organization_members
ON CONFLICT DO NOTHING;

CREATE TABLE org_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Bound to user, not member, for cross-org delivery
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rename old tables
ALTER TABLE notification_preferences RENAME TO legacy_notification_preferences;
ALTER TABLE notifications RENAME TO legacy_notifications;

-- ============================================================================
-- 3. ENHANCED AUDIT LOGS
-- ============================================================================

-- The old audit_logs table lacked organization context and deep web tracking.
CREATE TABLE org_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    actor_member_id UUID REFERENCES organization_members(id) ON DELETE SET NULL,
    entity_type audit_event_type NOT NULL,
    entity_id TEXT NOT NULL, -- Keep as TEXT because entities could be UUIDs or Legacy Strings
    action TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migrate old audit logs
INSERT INTO org_audit_logs (
    organization_id, actor_user_id, entity_type, entity_id, action, created_at, old_value, new_value
)
SELECT 
    '00000000-0000-0000-0000-000000000000'::uuid,
    actor,
    type,
    entity,
    action,
    created_at,
    CASE WHEN details = '' THEN '{}'::jsonb ELSE jsonb_build_object('details', details) END,
    '{}'::jsonb
FROM audit_logs
ON CONFLICT DO NOTHING;

ALTER TABLE audit_logs RENAME TO legacy_audit_logs;

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE org_exit_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation on Exit Interviews" ON org_exit_interviews
FOR ALL USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid);

CREATE POLICY "Tenant Isolation on Preferences" ON org_notification_preferences
FOR ALL USING (
    member_id IN (
        SELECT id FROM organization_members
        WHERE organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid
    )
);

CREATE POLICY "Tenant Isolation on Notifications" ON org_notifications
FOR ALL USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid);

-- Audit logs are generally read-only for standard users, but isolated nonetheless
CREATE POLICY "Tenant Isolation on Audit Logs" ON org_audit_logs
FOR SELECT USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid);

CREATE POLICY "Platform Admins bypass audit RLS" ON org_audit_logs
FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin');

COMMIT;
