-- Exit-Clearance: Initial Schema
-- This migration creates all tables mapped from the existing TypeScript types.
-- Clerk handles auth; our `users` table syncs via webhook or on first login.

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('employee', 'manager', 'hr', 'dept_approver', 'admin');

CREATE TYPE case_status AS ENUM ('pending_manager', 'in_clearance', 'completed', 'cancelled');

CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'approved', 'rejected', 'overdue');

CREATE TYPE comment_visibility AS ENUM ('all', 'internal');

CREATE TYPE notification_type AS ENUM ('approval', 'sla', 'system', 'rejection', 'completion');

CREATE TYPE audit_event_type AS ENUM ('Case', 'Task', 'Document', 'Comment', 'System');

CREATE TYPE document_type AS ENUM ('resignation_letter', 'relieving_letter', 'experience_certificate', 'attachment');

-- ============================================================================
-- USERS
-- ============================================================================

-- Maps 1:1 with Clerk user IDs. Inserted via webhook on user creation.
CREATE TABLE users (
  id            TEXT PRIMARY KEY,          -- Clerk user ID
  email         TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'employee',
  name          TEXT NOT NULL,
  dept          TEXT NOT NULL DEFAULT '',
  employee_id   TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);

-- ============================================================================
-- DEPARTMENTS (configuration)
-- ============================================================================

CREATE TABLE departments (
  id               TEXT PRIMARY KEY,       -- e.g. 'it', 'finance', 'hr'
  label            TEXT NOT NULL,
  icon             TEXT NOT NULL DEFAULT 'Building2',
  is_mandatory     BOOLEAN NOT NULL DEFAULT true,
  sla_hours        INTEGER NOT NULL DEFAULT 24,
  default_assignee TEXT REFERENCES users (id) ON DELETE SET NULL,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- CHECKLIST TEMPLATES (per-department default checklists)
-- ============================================================================

CREATE TABLE checklist_templates (
  id           TEXT PRIMARY KEY,          -- e.g. 'it-1', 'fin-2'
  dept_id      TEXT NOT NULL REFERENCES departments (id) ON DELETE CASCADE,
  label        TEXT NOT NULL,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  has_input    BOOLEAN NOT NULL DEFAULT false,
  input_label  TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_templates_dept ON checklist_templates (dept_id);

-- ============================================================================
-- WORKFLOW CONFIGS (templates that define which departments are involved)
-- ============================================================================

CREATE TABLE workflow_configs (
  id            TEXT PRIMARY KEY,          -- e.g. 'standard', 'contractor'
  name          TEXT NOT NULL,
  description   TEXT,
  dept_ids      TEXT[] NOT NULL DEFAULT '{}',
  sla_multiplier REAL NOT NULL DEFAULT 1.0,
  is_default    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- SETTINGS (key-value store for app-wide configuration)
-- ============================================================================

CREATE TABLE settings (
  key          TEXT PRIMARY KEY,
  value        JSONB NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default settings
INSERT INTO settings (key, value) VALUES
  ('sla_warning_hours', '24'::jsonb),
  ('escalation_hours', '48'::jsonb),
  ('default_workflow_template_id', '"standard"'::jsonb);

-- ============================================================================
-- EXIT CASES
-- ============================================================================

CREATE TABLE exit_cases (
  id                TEXT PRIMARY KEY,      -- e.g. 'CASE-2025-001'
  employee_id       TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  employee_name     TEXT NOT NULL,
  employee_email    TEXT NOT NULL,
  employee_role     TEXT NOT NULL DEFAULT '',
  employee_dept     TEXT NOT NULL DEFAULT '',
  manager_id        TEXT NOT NULL REFERENCES users (id) ON DELETE SET NULL,
  manager_name      TEXT NOT NULL DEFAULT '',
  status            case_status NOT NULL DEFAULT 'pending_manager',
  resignation_date  TIMESTAMPTZ NOT NULL,
  last_working_day  TIMESTAMPTZ NOT NULL,
  notice_period_days INTEGER NOT NULL DEFAULT 0,
  exit_reason       TEXT NOT NULL DEFAULT '',
  escalated         BOOLEAN NOT NULL DEFAULT false,
  cancel_reason     TEXT,
  tags              TEXT[] DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exit_cases_employee ON exit_cases (employee_id);
CREATE INDEX idx_exit_cases_manager ON exit_cases (manager_id);
CREATE INDEX idx_exit_cases_status  ON exit_cases (status);

-- ============================================================================
-- CLEARANCE TASKS (one per department per case)
-- ============================================================================

CREATE TABLE clearance_tasks (
  id               TEXT PRIMARY KEY,       -- e.g. 't-it-001'
  case_id          TEXT NOT NULL REFERENCES exit_cases (id) ON DELETE CASCADE,
  dept_id          TEXT NOT NULL REFERENCES departments (id) ON DELETE CASCADE,
  dept_label       TEXT NOT NULL,
  assignee_id      TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  assignee_name    TEXT NOT NULL DEFAULT '',
  status           task_status NOT NULL DEFAULT 'pending',
  sla_hours        INTEGER NOT NULL DEFAULT 24,
  sla_due_at       TIMESTAMPTZ NOT NULL,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  notes            TEXT,
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clearance_tasks_case     ON clearance_tasks (case_id);
CREATE INDEX idx_clearance_tasks_assignee ON clearance_tasks (assignee_id);
CREATE INDEX idx_clearance_tasks_status   ON clearance_tasks (status);

-- ============================================================================
-- CHECKLIST ITEMS (per-task)
-- ============================================================================

CREATE TABLE checklist_items (
  id           TEXT PRIMARY KEY,           -- e.g. 'it-1'
  task_id      TEXT NOT NULL REFERENCES clearance_tasks (id) ON DELETE CASCADE,
  label        TEXT NOT NULL,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  has_input    BOOLEAN NOT NULL DEFAULT false,
  input_label  TEXT,
  checked      BOOLEAN NOT NULL DEFAULT false,
  input_value  TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_items_task ON checklist_items (task_id);

-- ============================================================================
-- TIMELINE EVENTS
-- ============================================================================

CREATE TABLE timeline_events (
  id         TEXT PRIMARY KEY,
  case_id    TEXT NOT NULL REFERENCES exit_cases (id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  timestamp  TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor      TEXT NOT NULL,
  actor_role TEXT NOT NULL DEFAULT '',
  is_pending BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_timeline_events_case ON timeline_events (case_id);
CREATE INDEX idx_timeline_events_ts  ON timeline_events (timestamp DESC);

-- ============================================================================
-- EXIT INTERVIEWS
-- ============================================================================

CREATE TABLE exit_interviews (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  case_id           TEXT NOT NULL UNIQUE REFERENCES exit_cases (id) ON DELETE CASCADE,
  overall_rating    INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  management_rating INTEGER NOT NULL CHECK (management_rating >= 1 AND management_rating <= 5),
  culture_rating    INTEGER NOT NULL CHECK (culture_rating >= 1 AND culture_rating <= 5),
  reason            TEXT NOT NULL DEFAULT '',
  improvements      TEXT,
  would_rejoin      BOOLEAN NOT NULL DEFAULT true,
  comments          TEXT,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exit_interviews_case ON exit_interviews (case_id);

-- ============================================================================
-- DOCUMENTS
-- ============================================================================

CREATE TABLE documents (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  case_id     TEXT NOT NULL REFERENCES exit_cases (id) ON DELETE CASCADE,
  doc_type    document_type NOT NULL,
  file_name   TEXT NOT NULL,
  file_path   TEXT,                              -- Supabase Storage path
  file_size   INTEGER,
  mime_type   TEXT,
  uploaded_by TEXT REFERENCES users (id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_case ON documents (case_id);

-- ============================================================================
-- CASE COMMENTS
-- ============================================================================

CREATE TABLE case_comments (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  case_id     TEXT NOT NULL REFERENCES exit_cases (id) ON DELETE CASCADE,
  author_id   TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT '',
  author_role TEXT NOT NULL DEFAULT '',
  message     TEXT NOT NULL,
  visibility  comment_visibility NOT NULL DEFAULT 'all',
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_case_comments_case ON case_comments (case_id);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL DEFAULT '',
  href       TEXT,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications (user_id);
CREATE INDEX idx_notifications_read ON notifications (user_id, read);

-- ============================================================================
-- NOTIFICATION PREFERENCES
-- ============================================================================

CREATE TABLE notification_preferences (
  user_id    TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  approval   BOOLEAN NOT NULL DEFAULT true,
  sla        BOOLEAN NOT NULL DEFAULT true,
  system     BOOLEAN NOT NULL DEFAULT true,
  rejection  BOOLEAN NOT NULL DEFAULT true,
  completion BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- AUDIT LOGS
-- ============================================================================

CREATE TABLE audit_logs (
  id        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor     TEXT NOT NULL,
  role      TEXT NOT NULL DEFAULT '',
  type      audit_event_type NOT NULL,
  action    TEXT NOT NULL,
  entity    TEXT NOT NULL,
  details   TEXT NOT NULL DEFAULT '',
  case_id   TEXT REFERENCES exit_cases (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_ts      ON audit_logs (timestamp DESC);
CREATE INDEX idx_audit_logs_type    ON audit_logs (type);
CREATE INDEX idx_audit_logs_case    ON audit_logs (case_id);
CREATE INDEX idx_audit_logs_actor   ON audit_logs (actor);

-- ============================================================================
-- UPDATED_AT TRIGGER HELPER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_departments_updated_at
  BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_exit_cases_updated_at
  BEFORE UPDATE ON exit_cases FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_clearance_tasks_updated_at
  BEFORE UPDATE ON clearance_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_checklist_items_updated_at
  BEFORE UPDATE ON checklist_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_exit_interviews_updated_at
  BEFORE UPDATE ON exit_interviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_workflow_configs_updated_at
  BEFORE UPDATE ON workflow_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Seed departments
INSERT INTO departments (id, label, icon, is_mandatory, sla_hours, sort_order) VALUES
  ('manager',     'Manager Clearance', 'Users',       true,  48, 1),
  ('it',          'IT',                'Monitor',     true,  24, 2),
  ('admin',       'Administration',    'Building2',   true,  24, 3),
  ('finance',     'Finance',           'Landmark',    true,  48, 4),
  ('procurement', 'Procurement',       'Package',     false, 48, 5),
  ('infosec',     'Info Security',     'ShieldCheck', true,  24, 6),
  ('hr',          'HR',                'Heart',       true,  72, 7),
  ('facilities',  'Facilities',        'MapPin',      false, 24, 8)
ON CONFLICT (id) DO NOTHING;

-- Seed workflow configs
INSERT INTO workflow_configs (id, name, description, dept_ids, sla_multiplier, is_default) VALUES
  ('standard',   'Standard Exit',   'Full clearance for permanent employees across all mandatory departments.',
   ARRAY['manager','it','admin','finance','procurement','infosec','hr','facilities'], 1.0, true),
  ('contractor', 'Contractor Exit', 'Streamlined clearance — Manager, IT, Admin, and HR only.',
   ARRAY['manager','it','admin','hr'], 1.0, false),
  ('executive',  'Executive Exit',  'Full clearance with extended SLA windows for senior departures.',
   ARRAY['manager','it','admin','finance','procurement','infosec','hr','facilities'], 1.5, false)
ON CONFLICT (id) DO NOTHING;

-- Seed checklist templates
INSERT INTO checklist_templates (id, dept_id, label, is_mandatory, has_input, input_label, sort_order) VALUES
  ('it-1', 'it', 'Laptop returned and condition verified',               true,  true,  'Asset tag / Serial number', 1),
  ('it-2', 'it', 'Mobile device returned (if applicable)',              false, false, null, 2),
  ('it-3', 'it', 'Corporate email account deactivated',                 true,  false, null, 3),
  ('it-4', 'it', 'VPN credentials revoked',                             true,  false, null, 4),
  ('it-5', 'it', 'All application access removed',                      true,  false, null, 5),
  ('it-6', 'it', 'GitHub / GitLab access removed',                      true,  false, null, 6),
  ('it-7', 'it', 'Data backup verified',                                 true,  false, null, 7),
  ('fin-1', 'finance', 'Salary advance fully recovered',                true,  true,  'Amount (₹)', 1),
  ('fin-2', 'finance', 'Loan balance settled',                          true,  true,  'Amount (₹)', 2),
  ('fin-3', 'finance', 'Pending expense claims processed',              true,  false, null, 3),
  ('fin-4', 'finance', 'Final settlement amount confirmed',             true,  true,  'Net settlement (₹)', 4),
  ('adm-1', 'admin', 'Employee ID card returned',                       true,  false, null, 1),
  ('adm-2', 'admin', 'Access / swipe card returned',                    true,  true,  'Card number', 2),
  ('adm-3', 'admin', 'Parking tag surrendered',                         false, false, null, 3),
  ('adm-4', 'admin', 'Office keys returned',                            true,  false, null, 4),
  ('adm-5', 'admin', 'Desk cleared and handed over',                    true,  false, null, 5),
  ('mgr-1', 'manager', 'All projects handed over',                      true,  false, null, 1),
  ('mgr-2', 'manager', 'Knowledge transfer sessions completed',         true,  false, null, 2),
  ('mgr-3', 'manager', 'All timesheets submitted and approved',         true,  false, null, 3),
  ('mgr-4', 'manager', 'Client introductions made',                     false, false, null, 4),
  ('mgr-5', 'manager', 'Release date confirmed',                        true,  false, null, 5),
  ('sec-1', 'infosec', 'Security compliance sign-off completed',         true,  false, null, 1),
  ('sec-2', 'infosec', 'Data confidentiality agreement signed',          true,  false, null, 2),
  ('sec-3', 'infosec', 'Full access review completed',                   true,  false, null, 3),
  ('hr-1', 'hr', 'Exit interview completed',                             true,  false, null, 1),
  ('hr-2', 'hr', 'All HR documents collected',                          true,  false, null, 2),
  ('hr-3', 'hr', 'Policy compliance verified',                          true,  false, null, 3),
  ('hr-4', 'hr', 'Final approval granted',                               true,  false, null, 4),
  ('pro-1', 'procurement', 'Vendor-owned assets returned',              true,  false, null, 1),
  ('pro-2', 'procurement', 'Asset procurement records closed',          true,  false, null, 2),
  ('fac-1', 'facilities', 'Workspace inspected and handed over',        true,  false, null, 1),
  ('fac-2', 'facilities', 'Facility access fully closed',               true,  false, null, 2)
ON CONFLICT (id) DO NOTHING;
