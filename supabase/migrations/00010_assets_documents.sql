-- Exit-Clearance: Assets & Documentation Migration
-- This migration creates the asset tracking structures, separates user uploaded
-- attachments from system-generated documents, and establishes document templates.

BEGIN;

-- ============================================================================
-- 1. EMPLOYEE ASSETS
-- ============================================================================

CREATE TABLE employee_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL,
    asset_tag TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'returned', 'lost', 'damaged', 'written_off')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    returned_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE asset_return_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES employee_assets(id) ON DELETE CASCADE,
    returned_to_member_id UUID REFERENCES organization_members(id) ON DELETE SET NULL,
    condition TEXT NOT NULL DEFAULT 'good' CHECK (condition IN ('good', 'fair', 'poor', 'damaged')),
    remarks TEXT,
    returned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. DOCUMENTS & ATTACHMENTS
-- ============================================================================

-- The old documents table lacks organization_id and distinguishes poorly between
-- user uploads and system-generated files. We split it here.

CREATE TABLE org_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES org_exit_cases(id) ON DELETE CASCADE,
    document_type document_type NOT NULL,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    generated_by_member_id UUID REFERENCES organization_members(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migrate old documents into org_documents
INSERT INTO org_documents (id, organization_id, case_id, document_type, file_name, storage_path)
SELECT 
    md5(d.id)::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    md5(d.case_id)::uuid,
    d.type,
    d.name,
    d.url
FROM documents d
ON CONFLICT DO NOTHING;

ALTER TABLE documents RENAME TO legacy_documents;

-- Attachments (User Uploads like NDA, Handover forms)
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES org_exit_cases(id) ON DELETE CASCADE,
    uploaded_by_member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. DOCUMENT TEMPLATES
-- ============================================================================

CREATE TABLE document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    template_html TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE employee_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_return_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation on Assets" ON employee_assets
FOR ALL USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid);

CREATE POLICY "Tenant Isolation on Asset Returns" ON asset_return_records
FOR ALL USING (
    asset_id IN (
        SELECT id FROM employee_assets
        WHERE organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid
    )
);

CREATE POLICY "Tenant Isolation on Documents" ON org_documents
FOR ALL USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid);

CREATE POLICY "Tenant Isolation on Attachments" ON attachments
FOR ALL USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid);

CREATE POLICY "Tenant Isolation on Templates" ON document_templates
FOR ALL USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'db_org_id')::uuid);

COMMIT;
