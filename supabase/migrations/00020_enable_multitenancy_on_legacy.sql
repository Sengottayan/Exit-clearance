BEGIN;

-- Add organization_id
ALTER TABLE legacy_exit_cases ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE legacy_clearance_tasks ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE legacy_case_comments ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE legacy_documents ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE timeline_events ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE legacy_audit_logs ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Backfill legacy_exit_cases
UPDATE legacy_exit_cases lec
SET organization_id = om.organization_id
FROM organization_members om
WHERE lec.employee_id = om.user_id;

-- Fallback for cases where employee might not be in organization_members
UPDATE legacy_exit_cases
SET organization_id = '00000000-0000-0000-0000-000000000000'
WHERE organization_id IS NULL;

-- Backfill child tables
UPDATE legacy_clearance_tasks lct
SET organization_id = lec.organization_id
FROM legacy_exit_cases lec
WHERE lct.case_id = lec.id;

-- Fallback for tasks
UPDATE legacy_clearance_tasks
SET organization_id = '00000000-0000-0000-0000-000000000000'
WHERE organization_id IS NULL;

UPDATE legacy_case_comments lcc
SET organization_id = lec.organization_id
FROM legacy_exit_cases lec
WHERE lcc.case_id = lec.id;

-- Fallback for comments
UPDATE legacy_case_comments
SET organization_id = '00000000-0000-0000-0000-000000000000'
WHERE organization_id IS NULL;

UPDATE legacy_documents ld
SET organization_id = lec.organization_id
FROM legacy_exit_cases lec
WHERE ld.case_id = lec.id;

-- Fallback for documents
UPDATE legacy_documents
SET organization_id = '00000000-0000-0000-0000-000000000000'
WHERE organization_id IS NULL;

UPDATE timeline_events lte
SET organization_id = lec.organization_id
FROM legacy_exit_cases lec
WHERE lte.case_id = lec.id;

-- Fallback for timeline events
UPDATE timeline_events
SET organization_id = '00000000-0000-0000-0000-000000000000'
WHERE organization_id IS NULL;

-- Backfill audit logs based on case_id
UPDATE legacy_audit_logs lal
SET organization_id = lec.organization_id
FROM legacy_exit_cases lec
WHERE lal.case_id = lec.id;

-- Backfill audit logs without case_id (fallback to default)
UPDATE legacy_audit_logs
SET organization_id = '00000000-0000-0000-0000-000000000000'
WHERE organization_id IS NULL;

-- Add Constraints
ALTER TABLE legacy_exit_cases ADD CONSTRAINT fk_exit_cases_org FOREIGN KEY (organization_id) REFERENCES organizations(id);
ALTER TABLE legacy_clearance_tasks ADD CONSTRAINT fk_tasks_org FOREIGN KEY (organization_id) REFERENCES organizations(id);
ALTER TABLE legacy_case_comments ADD CONSTRAINT fk_comments_org FOREIGN KEY (organization_id) REFERENCES organizations(id);
ALTER TABLE legacy_documents ADD CONSTRAINT fk_documents_org FOREIGN KEY (organization_id) REFERENCES organizations(id);
ALTER TABLE timeline_events ADD CONSTRAINT fk_timeline_org FOREIGN KEY (organization_id) REFERENCES organizations(id);
ALTER TABLE legacy_audit_logs ADD CONSTRAINT fk_audit_org FOREIGN KEY (organization_id) REFERENCES organizations(id);

-- Enforce NOT NULL
ALTER TABLE legacy_exit_cases ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE legacy_clearance_tasks ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE legacy_case_comments ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE legacy_documents ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE timeline_events ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE legacy_audit_logs ALTER COLUMN organization_id SET NOT NULL;

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_exit_cases_org ON legacy_exit_cases (organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_org ON legacy_clearance_tasks (organization_id);
CREATE INDEX IF NOT EXISTS idx_comments_org ON legacy_case_comments (organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_org ON legacy_documents (organization_id);
CREATE INDEX IF NOT EXISTS idx_timeline_org ON timeline_events (organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_org ON legacy_audit_logs (organization_id);
CREATE INDEX IF NOT EXISTS idx_exit_cases_org_status ON legacy_exit_cases (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_org_status ON legacy_clearance_tasks (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_org_created ON legacy_audit_logs (organization_id, created_at);

-- Re-expose the PostgREST schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
