-- Production Level Fix: Expand & Contract Pattern
-- We create backwards-compatible views for all the legacy tables that were renamed.
-- This ensures zero-downtime and allows the frontend API routes to continue querying the original table names.
-- PostgREST automatically supports querying and updating simple views.

BEGIN;

CREATE OR REPLACE VIEW exit_cases AS SELECT * FROM legacy_exit_cases;
CREATE OR REPLACE VIEW clearance_tasks AS SELECT * FROM legacy_clearance_tasks;
CREATE OR REPLACE VIEW case_comments AS SELECT * FROM legacy_case_comments;
CREATE OR REPLACE VIEW documents AS SELECT * FROM legacy_documents;
CREATE OR REPLACE VIEW audit_logs AS SELECT * FROM legacy_audit_logs;
CREATE OR REPLACE VIEW notifications AS SELECT * FROM legacy_notifications;
CREATE OR REPLACE VIEW notification_preferences AS SELECT * FROM legacy_notification_preferences;
CREATE OR REPLACE VIEW exit_interviews AS SELECT * FROM legacy_exit_interviews;
CREATE OR REPLACE VIEW checklist_templates AS SELECT * FROM legacy_checklist_templates;

-- Re-expose the PostgREST schema cache to ensure these new views are detected immediately
NOTIFY pgrst, 'reload schema';

COMMIT;
