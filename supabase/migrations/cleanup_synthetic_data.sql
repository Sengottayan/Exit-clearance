-- =============================================================================
-- SQL Script: cleanup_synthetic_data.sql
-- Purpose:    Safely purges all synthetic mock data (users, exit cases, tasks,
--             comments, audits, and relationships) from the Supabase database,
--             leaving only structural settings and real Clerk users/orgs intact.
--             Designed to be resilient to different database migration states.
-- =============================================================================

BEGIN;

DO $$
BEGIN
    -- 1. Delete audit logs
    IF to_regclass('org_audit_logs') IS NOT NULL THEN
        EXECUTE 'DELETE FROM org_audit_logs WHERE is_synthetic = TRUE OR source_type = ''synthetic'' OR actor_user_id LIKE ''usr_%''';
    END IF;

    IF to_regclass('legacy_audit_logs') IS NOT NULL THEN
        EXECUTE 'DELETE FROM legacy_audit_logs WHERE actor LIKE ''usr_%'' OR actor IN (''Anita Desai'', ''Meera Krishnan'', ''Rahul Mehta'', ''Sunita Iyer'', ''Kiran Patel'', ''Sunita Rao'', ''Aryan Kapoor'', ''Sengottayan S'', ''Admin Dept'', ''Procurement Mgr'', ''InfoSec Lead'', ''Facilities Mgr'') OR case_id LIKE ''CASE-%'' OR case_id LIKE ''EXIT-%''';
    ELSIF to_regclass('audit_logs') IS NOT NULL THEN
        EXECUTE 'DELETE FROM audit_logs WHERE actor LIKE ''usr_%'' OR actor IN (''Anita Desai'', ''Meera Krishnan'', ''Rahul Mehta'', ''Sunita Iyer'', ''Kiran Patel'', ''Sunita Rao'', ''Aryan Kapoor'', ''Sengottayan S'', ''Admin Dept'', ''Procurement Mgr'', ''InfoSec Lead'', ''Facilities Mgr'') OR case_id LIKE ''CASE-%'' OR case_id LIKE ''EXIT-%''';
    END IF;

    -- 2. Delete escalations & approvals
    IF to_regclass('approval_escalations') IS NOT NULL THEN
        EXECUTE 'DELETE FROM approval_escalations WHERE case_id LIKE ''CASE-%'' OR case_id LIKE ''EXIT-%''';
    END IF;

    IF to_regclass('manager_approval_history') IS NOT NULL THEN
        EXECUTE 'DELETE FROM manager_approval_history WHERE case_id LIKE ''CASE-%'' OR case_id LIKE ''EXIT-%''';
    END IF;

    -- 3. Delete comments, interviews, and documents
    IF to_regclass('legacy_case_comments') IS NOT NULL THEN
        EXECUTE 'DELETE FROM legacy_case_comments WHERE case_id LIKE ''CASE-%'' OR case_id LIKE ''EXIT-%'' OR author_id LIKE ''usr_%''';
    ELSIF to_regclass('case_comments') IS NOT NULL THEN
        EXECUTE 'DELETE FROM case_comments WHERE case_id LIKE ''CASE-%'' OR case_id LIKE ''EXIT-%'' OR author_id LIKE ''usr_%''';
    END IF;

    IF to_regclass('legacy_exit_interviews') IS NOT NULL THEN
        EXECUTE 'DELETE FROM legacy_exit_interviews WHERE case_id LIKE ''CASE-%'' OR case_id LIKE ''EXIT-%''';
    ELSIF to_regclass('exit_interviews') IS NOT NULL THEN
        EXECUTE 'DELETE FROM exit_interviews WHERE case_id LIKE ''CASE-%'' OR case_id LIKE ''EXIT-%''';
    END IF;

    IF to_regclass('legacy_documents') IS NOT NULL THEN
        IF to_regclass('organization_members') IS NOT NULL THEN
            EXECUTE 'DELETE FROM legacy_documents WHERE case_id LIKE ''CASE-%'' OR case_id LIKE ''EXIT-%'' OR uploaded_by LIKE ''usr_%'' OR uploaded_by IN (SELECT user_id FROM organization_members WHERE user_id LIKE ''usr_%'')';
        ELSE
            EXECUTE 'DELETE FROM legacy_documents WHERE case_id LIKE ''CASE-%'' OR case_id LIKE ''EXIT-%'' OR uploaded_by LIKE ''usr_%''';
        END IF;
    ELSIF to_regclass('documents') IS NOT NULL THEN
        EXECUTE 'DELETE FROM documents WHERE case_id LIKE ''CASE-%'' OR case_id LIKE ''EXIT-%'' OR uploaded_by LIKE ''usr_%''';
    END IF;

    -- 4. Delete timeline events & clearance tasks
    IF to_regclass('timeline_events') IS NOT NULL THEN
        EXECUTE 'DELETE FROM timeline_events WHERE case_id LIKE ''CASE-%'' OR case_id LIKE ''EXIT-%'' OR id LIKE ''te-%'' OR id LIKE ''TL-%''';
    END IF;

    IF to_regclass('legacy_clearance_tasks') IS NOT NULL THEN
        EXECUTE 'DELETE FROM legacy_clearance_tasks WHERE case_id LIKE ''CASE-%'' OR case_id LIKE ''EXIT-%'' OR id LIKE ''ct-%'' OR id LIKE ''TASK-%'' OR id LIKE ''t-%''';
    ELSIF to_regclass('clearance_tasks') IS NOT NULL THEN
        EXECUTE 'DELETE FROM clearance_tasks WHERE case_id LIKE ''CASE-%'' OR case_id LIKE ''EXIT-%'' OR id LIKE ''ct-%'' OR id LIKE ''TASK-%'' OR id LIKE ''t-%''';
    END IF;

    -- 5. Delete exit cases
    IF to_regclass('legacy_exit_cases') IS NOT NULL THEN
        EXECUTE 'DELETE FROM legacy_exit_cases WHERE id LIKE ''CASE-%'' OR id LIKE ''EXIT-%'' OR employee_id LIKE ''usr_%'' OR manager_id LIKE ''usr_%''';
    ELSIF to_regclass('exit_cases') IS NOT NULL THEN
        EXECUTE 'DELETE FROM exit_cases WHERE id LIKE ''CASE-%'' OR id LIKE ''EXIT-%'' OR employee_id LIKE ''usr_%'' OR manager_id LIKE ''usr_%''';
    END IF;

    -- 6. Delete reporting relationships
    IF to_regclass('reporting_relationships') IS NOT NULL THEN
        IF to_regclass('organization_members') IS NOT NULL THEN
            EXECUTE 'DELETE FROM reporting_relationships WHERE employee_member_id IN (SELECT id FROM organization_members WHERE user_id LIKE ''usr_%'') OR manager_member_id IN (SELECT id FROM organization_members WHERE user_id LIKE ''usr_%'')';
        END IF;
    END IF;

    -- 7. Delete roles for members and members
    IF to_regclass('member_roles') IS NOT NULL THEN
        IF to_regclass('organization_members') IS NOT NULL THEN
            EXECUTE 'DELETE FROM member_roles WHERE member_id IN (SELECT id FROM organization_members WHERE user_id LIKE ''usr_%'')';
        END IF;
    END IF;

    IF to_regclass('organization_members') IS NOT NULL THEN
        EXECUTE 'DELETE FROM organization_members WHERE user_id LIKE ''usr_%''';
    END IF;

    -- 8. Delete department assignments for synthetic users
    IF to_regclass('department_assignments') IS NOT NULL THEN
        EXECUTE 'DELETE FROM department_assignments WHERE user_id LIKE ''usr_%''';
    END IF;

    -- 9. Delete identity maps
    IF to_regclass('manager_identity_map') IS NOT NULL THEN
        EXECUTE 'DELETE FROM manager_identity_map WHERE synthetic_manager_id LIKE ''usr_%'' OR clerk_user_id LIKE ''usr_%''';
    END IF;

    -- 10. Delete users starting with 'usr_'
    IF to_regclass('users') IS NOT NULL THEN
        EXECUTE 'DELETE FROM users WHERE id LIKE ''usr_%''';
    END IF;
END $$;

COMMIT;
