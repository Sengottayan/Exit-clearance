-- =============================================================================
-- SQL Script: insert_synthetic_data.sql
-- Purpose:    Seeds realistic synthetic mock data (users, members, roles, case logs,
--             comments, audits, and relationships) for testing.
--             Fully updated to comply with the multi-tenant B2B database schema
--             and the default legacy organization ('00000000-0000-0000-0000-000000000000').
-- =============================================================================

BEGIN;

-- ── 1. CLEANUP PHASE ─────────────────────────────────────────────────────────
-- Purge existing synthetic data safely before seeding to avoid conflict errors.
DO $$
BEGIN
    -- Delete audit logs
    IF to_regclass('org_audit_logs') IS NOT NULL THEN
        EXECUTE 'DELETE FROM org_audit_logs WHERE is_synthetic = TRUE OR source_type = ''synthetic'' OR actor_user_id LIKE ''usr_%''';
    END IF;

    IF to_regclass('legacy_audit_logs') IS NOT NULL THEN
        EXECUTE 'DELETE FROM legacy_audit_logs WHERE actor LIKE ''usr_%'' OR actor IN (''Anita Desai'', ''Meera Krishnan'', ''Rahul Mehta'', ''Sunita Iyer'', ''Kiran Patel'', ''Sunita Rao'', ''Aryan Kapoor'', ''Sengottayan S'', ''Admin Dept'', ''Procurement Mgr'', ''InfoSec Lead'', ''Facilities Mgr'') OR case_id LIKE ''CASE-%'' OR case_id LIKE ''EXIT-%''';
    ELSIF to_regclass('audit_logs') IS NOT NULL THEN
        EXECUTE 'DELETE FROM audit_logs WHERE actor LIKE ''usr_%'' OR actor IN (''Anita Desai'', ''Meera Krishnan'', ''Rahul Mehta'', ''Sunita Iyer'', ''Kiran Patel'', ''Sunita Rao'', ''Aryan Kapoor'', ''Sengottayan S'', ''Admin Dept'', ''Procurement Mgr'', ''InfoSec Lead'', ''Facilities Mgr'') OR case_id LIKE ''CASE-%'' OR case_id LIKE ''EXIT-%''';
    END IF;

    -- Delete escalations & approvals
    IF to_regclass('approval_escalations') IS NOT NULL THEN
        EXECUTE 'DELETE FROM approval_escalations WHERE case_id LIKE ''CASE-%'' OR case_id LIKE ''EXIT-%''';
    END IF;

    IF to_regclass('manager_approval_history') IS NOT NULL THEN
        EXECUTE 'DELETE FROM manager_approval_history WHERE case_id LIKE ''CASE-%'' OR case_id LIKE ''EXIT-%''';
    END IF;

    -- Delete comments, interviews, and documents
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

    -- Delete timeline events & clearance tasks
    IF to_regclass('timeline_events') IS NOT NULL THEN
        EXECUTE 'DELETE FROM timeline_events WHERE case_id LIKE ''CASE-%'' OR case_id LIKE ''EXIT-%'' OR id LIKE ''te-%'' OR id LIKE ''TL-%''';
    END IF;

    IF to_regclass('legacy_clearance_tasks') IS NOT NULL THEN
        EXECUTE 'DELETE FROM legacy_clearance_tasks WHERE case_id LIKE ''CASE-%'' OR case_id LIKE ''EXIT-%'' OR id LIKE ''ct-%'' OR id LIKE ''TASK-%'' OR id LIKE ''t-%''';
    ELSIF to_regclass('clearance_tasks') IS NOT NULL THEN
        EXECUTE 'DELETE FROM clearance_tasks WHERE case_id LIKE ''CASE-%'' OR case_id LIKE ''EXIT-%'' OR id LIKE ''ct-%'' OR id LIKE ''TASK-%'' OR id LIKE ''t-%''';
    END IF;

    -- Delete exit cases
    IF to_regclass('legacy_exit_cases') IS NOT NULL THEN
        EXECUTE 'DELETE FROM legacy_exit_cases WHERE id LIKE ''CASE-%'' OR id LIKE ''EXIT-%'' OR employee_id LIKE ''usr_%'' OR manager_id LIKE ''usr_%''';
    ELSIF to_regclass('exit_cases') IS NOT NULL THEN
        EXECUTE 'DELETE FROM exit_cases WHERE id LIKE ''CASE-%'' OR id LIKE ''EXIT-%'' OR employee_id LIKE ''usr_%'' OR manager_id LIKE ''usr_%''';
    END IF;

    -- Delete reporting relationships
    IF to_regclass('reporting_relationships') IS NOT NULL THEN
        IF to_regclass('organization_members') IS NOT NULL THEN
            EXECUTE 'DELETE FROM reporting_relationships WHERE employee_member_id IN (SELECT id FROM organization_members WHERE user_id LIKE ''usr_%'') OR manager_member_id IN (SELECT id FROM organization_members WHERE user_id LIKE ''usr_%'')';
        END IF;
    END IF;

    -- Delete roles for members and members
    IF to_regclass('member_roles') IS NOT NULL THEN
        IF to_regclass('organization_members') IS NOT NULL THEN
            EXECUTE 'DELETE FROM member_roles WHERE member_id IN (SELECT id FROM organization_members WHERE user_id LIKE ''usr_%'')';
        END IF;
    END IF;

    IF to_regclass('organization_members') IS NOT NULL THEN
        EXECUTE 'DELETE FROM organization_members WHERE user_id LIKE ''usr_%''';
    END IF;

    -- Delete department assignments for synthetic users
    IF to_regclass('department_assignments') IS NOT NULL THEN
        EXECUTE 'DELETE FROM department_assignments WHERE user_id LIKE ''usr_%''';
    END IF;

    -- Delete identity maps
    IF to_regclass('manager_identity_map') IS NOT NULL THEN
        EXECUTE 'DELETE FROM manager_identity_map WHERE synthetic_manager_id LIKE ''usr_%'' OR clerk_user_id LIKE ''usr_%''';
    END IF;

    -- Delete users starting with 'usr_'
    IF to_regclass('users') IS NOT NULL THEN
        EXECUTE 'DELETE FROM users WHERE id LIKE ''usr_%''';
    END IF;
END $$;


-- ── 2. SEED USERS ────────────────────────────────────────────────────────────
INSERT INTO users (id, email, role, name, first_name, last_name, dept, employee_id, created_at) VALUES
  -- Managers
  ('usr_mgr_001', 'meera.krishnan@offboardiq.com',    'manager',       'Meera Krishnan',    'Meera',       'Krishnan',  'Engineering',    'MGR-2001', NOW() - INTERVAL '3 years'),
  ('usr_mgr_002', 'rahul.mehta@offboardiq.com',       'manager',       'Rahul Mehta',       'Rahul',       'Mehta',     'Product',        'MGR-2002', NOW() - INTERVAL '2 years'),
  ('usr_mgr_003', 'sunita.iyer@offboardiq.com',       'manager',       'Sunita Iyer',       'Sunita',      'Iyer',      'Finance',        'MGR-2003', NOW() - INTERVAL '4 years'),
  ('usr_mgr_004', 'aryan.kapoor@offboardiq.com',      'manager',       'Aryan Kapoor',      'Aryan',       'Kapoor',    'Sales',          'MGR-2004', NOW() - INTERVAL '3 years'),
  
  -- HR
  ('usr_hr_001',  'anita.desai@offboardiq.com',       'hr',            'Anita Desai',       'Anita',       'Desai',     'HR',             'HR-3001',  NOW() - INTERVAL '2 years'),
  ('usr_hr_002',  'sengottayan.s@offboardiq.com',     'hr',            'Sengottayan S',     'Sengottayan', 'S',         'HR',             'HR-3002',  NOW() - INTERVAL '1 year'),
  
  -- Department Approvers
  ('usr_it_001',  'kiran.patel@offboardiq.com',       'dept_approver', 'Kiran Patel',       'Kiran',       'Patel',     'IT',             'IT-4001',  NOW() - INTERVAL '2 years'),
  ('usr_fin_001', 'sunita.rao@offboardiq.com',        'dept_approver', 'Sunita Rao',        'Sunita',      'Rao',       'Finance',        'FIN-4002', NOW() - INTERVAL '18 months'),
  ('usr_adm_001', 'admin.dept@offboardiq.com',        'dept_approver', 'Admin Dept',        'Admin',       'Dept',      'Administration', 'ADM-4003', NOW() - INTERVAL '2 years'),
  ('usr_pro_001', 'procurement.mgr@offboardiq.com',   'dept_approver', 'Procurement Mgr',   'Procurement', 'Mgr',       'Procurement',    'PRO-4004', NOW() - INTERVAL '1 year'),
  ('usr_sec_001', 'infosec.lead@offboardiq.com',      'dept_approver', 'InfoSec Lead',      'InfoSec',     'Lead',      'Info Security',  'SEC-4005', NOW() - INTERVAL '2 years'),
  ('usr_fac_001', 'facilities.mgr@offboardiq.com',    'dept_approver', 'Facilities Mgr',    'Facilities',  'Mgr',       'Facilities',     'FAC-4006', NOW() - INTERVAL '1 year'),
  
  -- HR Dataset Employees (001-012)
  ('usr_emp_001', 'arjun.nair@offboardiq.com',        'employee',      'Arjun Nair',        'Arjun',       'Nair',      'Engineering',    'EMP-1001', NOW() - INTERVAL '2 years'),
  ('usr_emp_002', 'divya.reddy@offboardiq.com',       'employee',      'Divya Reddy',       'Divya',       'Reddy',     'Finance',        'EMP-1002', NOW() - INTERVAL '18 months'),
  ('usr_emp_003', 'vikram.singh@offboardiq.com',      'employee',      'Vikram Singh',      'Vikram',      'Singh',     'Product',        'EMP-1003', NOW() - INTERVAL '14 months'),
  ('usr_emp_004', 'priya.sharma@offboardiq.com',      'employee',      'Priya Sharma',      'Priya',       'Sharma',    'Engineering',    'EMP-1004', NOW() - INTERVAL '22 months'),
  ('usr_emp_005', 'neha.gupta@offboardiq.com',        'employee',      'Neha Gupta',        'Neha',        'Gupta',     'Marketing',      'EMP-1005', NOW() - INTERVAL '10 months'),
  ('usr_emp_006', 'rohan.kapoor@offboardiq.com',      'employee',      'Rohan Kapoor',      'Rohan',       'Kapoor',    'Sales',          'EMP-1006', NOW() - INTERVAL '8 months'),
  ('usr_emp_007', 'sita.ram@offboardiq.com',          'employee',      'Sita Ram',          'Sita',        'Ram',       'Operations',     'EMP-1007', NOW() - INTERVAL '30 months'),
  ('usr_emp_008', 'arun.menon@offboardiq.com',        'employee',      'Arun Menon',        'Arun',        'Menon',     'Engineering',    'EMP-1008', NOW() - INTERVAL '16 months'),
  ('usr_emp_009', 'kavya.iyer@offboardiq.com',        'employee',      'Kavya Iyer',        'Kavya',       'Iyer',      'Design',         'EMP-1009', NOW() - INTERVAL '12 months'),
  ('usr_emp_010', 'suresh.pillai@offboardiq.com',     'employee',      'Suresh Pillai',     'Suresh',      'Pillai',    'Finance',        'EMP-1010', NOW() - INTERVAL '20 months'),
  ('usr_emp_011', 'ananya.bose@offboardiq.com',       'employee',      'Ananya Bose',       'Ananya',      'Bose',      'Product',        'EMP-1011', NOW() - INTERVAL '9 months'),
  ('usr_emp_012', 'ravi.chandra@offboardiq.com',      'employee',      'Ravi Chandra',      'Ravi',        'Chandra',   'Sales',          'EMP-1012', NOW() - INTERVAL '11 months'),
  
  -- Manager Dataset Employees (101-112)
  ('usr_emp_101', 'deepa.rajan@offboardiq.com',        'employee',      'Deepa Rajan',       'Deepa',       'Rajan',     'Sales',          'EMP-3001', NOW() - INTERVAL '24 months'),
  ('usr_emp_102', 'sameer.khan@offboardiq.com',        'employee',      'Sameer Khan',       'Sameer',      'Khan',      'Sales',          'EMP-3002', NOW() - INTERVAL '18 months'),
  ('usr_emp_103', 'lakshmi.nair@offboardiq.com',       'employee',      'Lakshmi Nair',      'Lakshmi',     'Nair',      'Sales',          'EMP-3003', NOW() - INTERVAL '20 months'),
  ('usr_emp_104', 'abhishek.jain@offboardiq.com',      'employee',      'Abhishek Jain',     'Abhishek',    'Jain',      'Sales',          'EMP-3004', NOW() - INTERVAL '15 months'),
  ('usr_emp_105', 'pooja.verma@offboardiq.com',        'employee',      'Pooja Verma',       'Pooja',       'Verma',     'Marketing',      'EMP-3005', NOW() - INTERVAL '22 months'),
  ('usr_emp_106', 'nikhil.chandra@offboardiq.com',      'employee',      'Nikhil Chandra',    'Nikhil',      'Chandra',   'Engineering',    'EMP-3006', NOW() - INTERVAL '30 months'),
  ('usr_emp_107', 'ritu.menon@offboardiq.com',         'employee',      'Ritu Menon',        'Ritu',        'Menon',     'Design',         'EMP-3007', NOW() - INTERVAL '12 months'),
  ('usr_emp_108', 'girish.pai@offboardiq.com',         'employee',      'Girish Pai',        'Girish',      'Pai',       'Product',        'EMP-3008', NOW() - INTERVAL '16 months'),
  ('usr_emp_109', 'swetha.rao@offboardiq.com',         'employee',      'Swetha Rao',        'Swetha',      'Rao',       'Sales',          'EMP-3009', NOW() - INTERVAL '28 months'),
  ('usr_emp_110', 'vijay.kumar@offboardiq.com',        'employee',      'Vijay Kumar',       'Vijay',       'Kumar',     'Sales',          'EMP-3010', NOW() - INTERVAL '10 months'),
  ('usr_emp_111', 'meena.iyer@offboardiq.com',         'employee',      'Meena Iyer',        'Meena',       'Iyer',      'Operations',     'EMP-3011', NOW() - INTERVAL '14 months'),
  ('usr_emp_112', 'praveen.das@offboardiq.com',        'employee',      'Praveen Das',       'Praveen',     'Das',       'Finance',        'EMP-3012', NOW() - INTERVAL '17 months')
ON CONFLICT (id) DO NOTHING;


-- ── 3. SEED ORG MEMBERS ──────────────────────────────────────────────────────
INSERT INTO organization_members (id, organization_id, user_id, employee_id_string) VALUES
  (md5('usr_mgr_001')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_mgr_001', 'MGR-2001'),
  (md5('usr_mgr_002')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_mgr_002', 'MGR-2002'),
  (md5('usr_mgr_003')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_mgr_003', 'MGR-2003'),
  (md5('usr_mgr_004')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_mgr_004', 'MGR-2004'),
  
  (md5('usr_hr_001')::uuid,  '00000000-0000-0000-0000-000000000000', 'usr_hr_001',  'HR-3001'),
  (md5('usr_hr_002')::uuid,  '00000000-0000-0000-0000-000000000000', 'usr_hr_002',  'HR-3002'),
  
  (md5('usr_it_001')::uuid,  '00000000-0000-0000-0000-000000000000', 'usr_it_001',  'IT-4001'),
  (md5('usr_fin_001')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_fin_001', 'FIN-4002'),
  (md5('usr_adm_001')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_adm_001', 'ADM-4003'),
  (md5('usr_pro_001')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_pro_001', 'PRO-4004'),
  (md5('usr_sec_001')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_sec_001', 'SEC-4005'),
  (md5('usr_fac_001')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_fac_001', 'FAC-4006'),
  
  (md5('usr_emp_001')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_emp_001', 'EMP-1001'),
  (md5('usr_emp_002')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_emp_002', 'EMP-1002'),
  (md5('usr_emp_003')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_emp_003', 'EMP-1003'),
  (md5('usr_emp_004')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_emp_004', 'EMP-1004'),
  (md5('usr_emp_005')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_emp_005', 'EMP-1005'),
  (md5('usr_emp_006')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_emp_006', 'EMP-1006'),
  (md5('usr_emp_007')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_emp_007', 'EMP-1007'),
  (md5('usr_emp_008')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_emp_008', 'EMP-1008'),
  (md5('usr_emp_009')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_emp_009', 'EMP-1009'),
  (md5('usr_emp_010')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_emp_010', 'EMP-1010'),
  (md5('usr_emp_011')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_emp_011', 'EMP-1011'),
  (md5('usr_emp_012')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_emp_012', 'EMP-1012'),
  
  (md5('usr_emp_101')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_emp_101', 'EMP-3001'),
  (md5('usr_emp_102')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_emp_102', 'EMP-3002'),
  (md5('usr_emp_103')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_emp_103', 'EMP-3003'),
  (md5('usr_emp_104')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_emp_104', 'EMP-3004'),
  (md5('usr_emp_105')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_emp_105', 'EMP-3005'),
  (md5('usr_emp_106')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_emp_106', 'EMP-3006'),
  (md5('usr_emp_107')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_emp_107', 'EMP-3007'),
  (md5('usr_emp_108')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_emp_108', 'EMP-3008'),
  (md5('usr_emp_109')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_emp_109', 'EMP-3009'),
  (md5('usr_emp_110')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_emp_110', 'EMP-3010'),
  (md5('usr_emp_111')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_emp_111', 'EMP-3011'),
  (md5('usr_emp_112')::uuid, '00000000-0000-0000-0000-000000000000', 'usr_emp_112', 'EMP-3012')
ON CONFLICT (organization_id, user_id) DO NOTHING;


-- ── 4. SEED MEMBER ROLES ─────────────────────────────────────────────────────
DO $$
BEGIN
    IF to_regclass('member_roles') IS NOT NULL THEN
        EXECUTE $insert_member_roles$
            INSERT INTO member_roles (member_id, role_id) VALUES
              (md5('usr_mgr_001')::uuid, '10000000-0000-0000-0000-000000000002'),
              (md5('usr_mgr_002')::uuid, '10000000-0000-0000-0000-000000000002'),
              (md5('usr_mgr_003')::uuid, '10000000-0000-0000-0000-000000000002'),
              (md5('usr_mgr_004')::uuid, '10000000-0000-0000-0000-000000000002'),
              
              (md5('usr_hr_001')::uuid,  '10000000-0000-0000-0000-000000000001'),
              (md5('usr_hr_002')::uuid,  '10000000-0000-0000-0000-000000000001'),
              
              (md5('usr_it_001')::uuid,  '10000000-0000-0000-0000-000000000003'),
              (md5('usr_fin_001')::uuid, '10000000-0000-0000-0000-000000000003'),
              (md5('usr_adm_001')::uuid, '10000000-0000-0000-0000-000000000003'),
              (md5('usr_pro_001')::uuid, '10000000-0000-0000-0000-000000000003'),
              (md5('usr_sec_001')::uuid, '10000000-0000-0000-0000-000000000003'),
              (md5('usr_fac_001')::uuid, '10000000-0000-0000-0000-000000000003'),
              
              (md5('usr_emp_001')::uuid, '10000000-0000-0000-0000-000000000004'),
              (md5('usr_emp_002')::uuid, '10000000-0000-0000-0000-000000000004'),
              (md5('usr_emp_003')::uuid, '10000000-0000-0000-0000-000000000004'),
              (md5('usr_emp_004')::uuid, '10000000-0000-0000-0000-000000000004'),
              (md5('usr_emp_005')::uuid, '10000000-0000-0000-0000-000000000004'),
              (md5('usr_emp_006')::uuid, '10000000-0000-0000-0000-000000000004'),
              (md5('usr_emp_007')::uuid, '10000000-0000-0000-0000-000000000004'),
              (md5('usr_emp_008')::uuid, '10000000-0000-0000-0000-000000000004'),
              (md5('usr_emp_009')::uuid, '10000000-0000-0000-0000-000000000004'),
              (md5('usr_emp_010')::uuid, '10000000-0000-0000-0000-000000000004'),
              (md5('usr_emp_011')::uuid, '10000000-0000-0000-0000-000000000004'),
              (md5('usr_emp_012')::uuid, '10000000-0000-0000-0000-000000000004'),
              
              (md5('usr_emp_101')::uuid, '10000000-0000-0000-0000-000000000004'),
              (md5('usr_emp_102')::uuid, '10000000-0000-0000-0000-000000000004'),
              (md5('usr_emp_103')::uuid, '10000000-0000-0000-0000-000000000004'),
              (md5('usr_emp_104')::uuid, '10000000-0000-0000-0000-000000000004'),
              (md5('usr_emp_105')::uuid, '10000000-0000-0000-0000-000000000004'),
              (md5('usr_emp_106')::uuid, '10000000-0000-0000-0000-000000000004'),
              (md5('usr_emp_107')::uuid, '10000000-0000-0000-0000-000000000004'),
              (md5('usr_emp_108')::uuid, '10000000-0000-0000-0000-000000000004'),
              (md5('usr_emp_109')::uuid, '10000000-0000-0000-0000-000000000004'),
              (md5('usr_emp_110')::uuid, '10000000-0000-0000-0000-000000000004'),
              (md5('usr_emp_111')::uuid, '10000000-0000-0000-0000-000000000004'),
              (md5('usr_emp_112')::uuid, '10000000-0000-0000-0000-000000000004')
            ON CONFLICT (member_id, role_id) DO NOTHING;
        $insert_member_roles$;
    END IF;
END $$;


-- ── 5. SEED REPORTING RELATIONSHIPS ──────────────────────────────────────────
INSERT INTO reporting_relationships (organization_id, employee_member_id, manager_member_id, type) VALUES
  ('00000000-0000-0000-0000-000000000000', md5('usr_emp_001')::uuid, md5('usr_mgr_001')::uuid, 'solid'),
  ('00000000-0000-0000-0000-000000000000', md5('usr_emp_002')::uuid, md5('usr_mgr_003')::uuid, 'solid'),
  ('00000000-0000-0000-0000-000000000000', md5('usr_emp_003')::uuid, md5('usr_mgr_002')::uuid, 'solid'),
  ('00000000-0000-0000-0000-000000000000', md5('usr_emp_004')::uuid, md5('usr_mgr_001')::uuid, 'solid'),
  ('00000000-0000-0000-0000-000000000000', md5('usr_emp_005')::uuid, md5('usr_mgr_001')::uuid, 'solid'),
  ('00000000-0000-0000-0000-000000000000', md5('usr_emp_006')::uuid, md5('usr_mgr_002')::uuid, 'solid'),
  ('00000000-0000-0000-0000-000000000000', md5('usr_emp_007')::uuid, md5('usr_mgr_001')::uuid, 'solid'),
  ('00000000-0000-0000-0000-000000000000', md5('usr_emp_008')::uuid, md5('usr_mgr_001')::uuid, 'solid'),
  ('00000000-0000-0000-0000-000000000000', md5('usr_emp_009')::uuid, md5('usr_mgr_002')::uuid, 'solid'),
  ('00000000-0000-0000-0000-000000000000', md5('usr_emp_010')::uuid, md5('usr_mgr_003')::uuid, 'solid'),
  ('00000000-0000-0000-0000-000000000000', md5('usr_emp_011')::uuid, md5('usr_mgr_002')::uuid, 'solid'),
  ('00000000-0000-0000-0000-000000000000', md5('usr_emp_012')::uuid, md5('usr_mgr_002')::uuid, 'solid'),
  
  ('00000000-0000-0000-0000-000000000000', md5('usr_emp_101')::uuid, md5('usr_mgr_004')::uuid, 'solid'),
  ('00000000-0000-0000-0000-000000000000', md5('usr_emp_102')::uuid, md5('usr_mgr_004')::uuid, 'solid'),
  ('00000000-0000-0000-0000-000000000000', md5('usr_emp_103')::uuid, md5('usr_mgr_004')::uuid, 'solid'),
  ('00000000-0000-0000-0000-000000000000', md5('usr_emp_104')::uuid, md5('usr_mgr_004')::uuid, 'solid'),
  ('00000000-0000-0000-0000-000000000000', md5('usr_emp_105')::uuid, md5('usr_mgr_004')::uuid, 'solid'),
  ('00000000-0000-0000-0000-000000000000', md5('usr_emp_106')::uuid, md5('usr_mgr_004')::uuid, 'solid'),
  ('00000000-0000-0000-0000-000000000000', md5('usr_emp_107')::uuid, md5('usr_mgr_004')::uuid, 'solid'),
  ('00000000-0000-0000-0000-000000000000', md5('usr_emp_108')::uuid, md5('usr_mgr_004')::uuid, 'solid'),
  ('00000000-0000-0000-0000-000000000000', md5('usr_emp_109')::uuid, md5('usr_mgr_004')::uuid, 'solid'),
  ('00000000-0000-0000-0000-000000000000', md5('usr_emp_110')::uuid, md5('usr_mgr_004')::uuid, 'solid'),
  ('00000000-0000-0000-0000-000000000000', md5('usr_emp_111')::uuid, md5('usr_mgr_004')::uuid, 'solid'),
  ('00000000-0000-0000-0000-000000000000', md5('usr_emp_112')::uuid, md5('usr_mgr_004')::uuid, 'solid')
ON CONFLICT DO NOTHING;


-- ── 6. SEED DEPARTMENT ASSIGNMENTS ───────────────────────────────────────────
INSERT INTO department_assignments (user_id, department, dept_label, authority, is_active) VALUES
  ('usr_it_001',  'it',          'IT',             'primary', true),
  ('usr_fin_001', 'finance',     'Finance',        'primary', true),
  ('usr_adm_001', 'admin',       'Administration', 'primary', true),
  ('usr_pro_001', 'procurement', 'Procurement',    'primary', true),
  ('usr_sec_001', 'infosec',     'Info Security',  'primary', true),
  ('usr_fac_001', 'facilities',  'Facilities',     'primary', true)
ON CONFLICT (user_id, department) DO NOTHING;


-- ── 7. SEED MANAGER IDENTITY MAPS ────────────────────────────────────────────
INSERT INTO manager_identity_map (synthetic_manager_id, clerk_user_id, email) VALUES
  ('usr_mgr_001', 'clerk_user_mgr_001', 'meera.krishnan@offboardiq.com'),
  ('usr_mgr_002', 'clerk_user_mgr_002', 'rahul.mehta@offboardiq.com'),
  ('usr_mgr_003', 'clerk_user_mgr_003', 'sunita.iyer@offboardiq.com'),
  ('usr_mgr_004', 'clerk_user_mgr_004', 'aryan.kapoor@offboardiq.com')
ON CONFLICT (synthetic_manager_id) DO NOTHING;


-- ── 8. SEED EXIT CASES (legacy_exit_cases) ───────────────────────────────────
INSERT INTO legacy_exit_cases (
  id, organization_id, employee_id, employee_name, employee_email, employee_role, employee_dept,
  manager_id, manager_name, manager_email, status, resignation_date, last_working_day,
  notice_period_days, exit_reason, escalated, tags, created_at, updated_at
) VALUES
  -- HR Dataset Cases (CASE-2026-1001 to 1012)
  ('CASE-2026-1001', '00000000-0000-0000-0000-000000000000', 'usr_emp_001', 'Arjun Nair',    'arjun.nair@offboardiq.com',    'Software Engineer',   'Engineering', 'usr_mgr_001', 'Meera Krishnan', 'meera.krishnan@offboardiq.com', 'completed',       NOW() - INTERVAL '95 days', NOW() - INTERVAL '65 days', 30, 'better_opportunity', false, ARRAY['standard'],                NOW() - INTERVAL '95 days', NOW() - INTERVAL '65 days'),
  ('CASE-2026-1002', '00000000-0000-0000-0000-000000000000', 'usr_emp_002', 'Divya Reddy',   'divya.reddy@offboardiq.com',   'Finance Analyst',     'Finance',     'usr_mgr_003', 'Sunita Iyer',    'sunita.iyer@offboardiq.com',    'completed',       NOW() - INTERVAL '80 days', NOW() - INTERVAL '50 days', 30, 'compensation',       false, ARRAY['standard'],                NOW() - INTERVAL '80 days', NOW() - INTERVAL '50 days'),
  ('CASE-2026-1003', '00000000-0000-0000-0000-000000000000', 'usr_emp_010', 'Suresh Pillai', 'suresh.pillai@offboardiq.com', 'Senior Analyst',      'Finance',     'usr_mgr_003', 'Sunita Iyer',    'sunita.iyer@offboardiq.com',    'completed',       NOW() - INTERVAL '70 days', NOW() - INTERVAL '40 days', 30, 'relocation',         false, ARRAY['standard'],                NOW() - INTERVAL '70 days', NOW() - INTERVAL '40 days'),
  ('CASE-2026-1004', '00000000-0000-0000-0000-000000000000', 'usr_emp_007', 'Sita Ram',      'sita.ram@offboardiq.com',      'Operations Lead',     'Operations',  'usr_mgr_001', 'Meera Krishnan', 'meera.krishnan@offboardiq.com', 'completed',       NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days', 30, 'higher_studies',     false, ARRAY['standard'],                NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days'),
  ('CASE-2026-1005', '00000000-0000-0000-0000-000000000000', 'usr_emp_003', 'Vikram Singh',  'vikram.singh@offboardiq.com',  'Product Manager',     'Product',     'usr_mgr_002', 'Rahul Mehta',    'rahul.mehta@offboardiq.com',    'in_clearance',    NOW() - INTERVAL '25 days', NOW() + INTERVAL '5 days',  30, 'better_opportunity', false, ARRAY['standard'],                NOW() - INTERVAL '25 days', NOW() - INTERVAL '5 days'),
  ('CASE-2026-1006', '00000000-0000-0000-0000-000000000000', 'usr_emp_004', 'Priya Sharma',  'priya.sharma@offboardiq.com',  'Senior Engineer',     'Engineering', 'usr_mgr_001', 'Meera Krishnan', 'meera.krishnan@offboardiq.com', 'in_clearance',    NOW() - INTERVAL '18 days', NOW() + INTERVAL '12 days', 30, 'personal',           false, ARRAY['standard'],                NOW() - INTERVAL '18 days', NOW() - INTERVAL '2 days'),
  ('CASE-2026-1007', '00000000-0000-0000-0000-000000000000', 'usr_emp_008', 'Arun Menon',    'arun.menon@offboardiq.com',    'Backend Engineer',    'Engineering', 'usr_mgr_001', 'Meera Krishnan', 'meera.krishnan@offboardiq.com', 'in_clearance',    NOW() - INTERVAL '12 days', NOW() + INTERVAL '18 days', 30, 'compensation',       false, ARRAY['standard'],                NOW() - INTERVAL '12 days', NOW() - INTERVAL '1 day'),
  ('CASE-2026-1008', '00000000-0000-0000-0000-000000000000', 'usr_emp_009', 'Kavya Iyer',    'kavya.iyer@offboardiq.com',    'UI/UX Designer',      'Design',      'usr_mgr_002', 'Rahul Mehta',    'rahul.mehta@offboardiq.com',    'in_clearance',    NOW() - INTERVAL '8 days',  NOW() + INTERVAL '22 days', 30, 'better_opportunity', false, ARRAY['standard'],                NOW() - INTERVAL '8 days',  NOW()),
  ('CASE-2026-1009', '00000000-0000-0000-0000-000000000000', 'usr_emp_005', 'Neha Gupta',    'neha.gupta@offboardiq.com',    'Marketing Executive', 'Marketing',   'usr_mgr_001', 'Meera Krishnan', 'meera.krishnan@offboardiq.com', 'pending_manager', NOW() - INTERVAL '3 days',  NOW() + INTERVAL '27 days', 30, 'work_environment',   false, ARRAY['standard'],                NOW() - INTERVAL '3 days',  NOW() - INTERVAL '1 day'),
  ('CASE-2026-1010', '00000000-0000-0000-0000-000000000000', 'usr_emp_006', 'Rohan Kapoor',  'rohan.kapoor@offboardiq.com',  'Sales Executive',     'Sales',       'usr_mgr_002', 'Rahul Mehta',    'rahul.mehta@offboardiq.com',    'pending_manager', NOW() - INTERVAL '1 day',   NOW() + INTERVAL '29 days', 30, 'better_opportunity', false, ARRAY['standard'],                NOW() - INTERVAL '1 day',   NOW()),
  ('CASE-2026-1011', '00000000-0000-0000-0000-000000000000', 'usr_emp_011', 'Ananya Bose',   'ananya.bose@offboardiq.com',   'Product Analyst',     'Product',     'usr_mgr_002', 'Rahul Mehta',    'rahul.mehta@offboardiq.com',    'pending_manager', NOW(),                      NOW() + INTERVAL '30 days', 30, 'higher_studies',     false, ARRAY['standard'],                NOW(),                      NOW()),
  ('CASE-2026-1012', '00000000-0000-0000-0000-000000000000', 'usr_emp_012', 'Ravi Chandra',  'ravi.chandra@offboardiq.com',  'Sales Manager',       'Sales',       'usr_mgr_002', 'Rahul Mehta',    'rahul.mehta@offboardiq.com',    'in_clearance',    NOW() - INTERVAL '35 days', NOW() - INTERVAL '5 days',  30, 'compensation',       true,  ARRAY['escalated', 'sla_breach'], NOW() - INTERVAL '35 days', NOW() - INTERVAL '2 days'),

  -- Manager Dataset Cases (EXIT-MGR-2001 to 2012)
  ('EXIT-MGR-2001', '00000000-0000-0000-0000-000000000000', 'usr_emp_101', 'Deepa Rajan',    'deepa.rajan@offboardiq.com',    'Sales Executive',     'Sales',       'usr_mgr_004', 'Aryan Kapoor',  'aryan.kapoor@offboardiq.com',  'pending_manager', NOW() - INTERVAL '2 days',  NOW() + INTERVAL '28 days', 30, 'better_opportunity', false, ARRAY['urgent'],                  NOW() - INTERVAL '2 days',  NOW() - INTERVAL '2 days'),
  ('EXIT-MGR-2002', '00000000-0000-0000-0000-000000000000', 'usr_emp_102', 'Sameer Khan',    'sameer.khan@offboardiq.com',    'Account Manager',     'Sales',       'usr_mgr_004', 'Aryan Kapoor',  'aryan.kapoor@offboardiq.com',  'pending_manager', NOW() - INTERVAL '4 days',  NOW() + INTERVAL '26 days', 30, 'compensation',       false, ARRAY['standard'],                NOW() - INTERVAL '4 days',  NOW() - INTERVAL '4 days'),
  ('EXIT-MGR-2003', '00000000-0000-0000-0000-000000000000', 'usr_emp_110', 'Vijay Kumar',    'vijay.kumar@offboardiq.com',    'Sales Coordinator',   'Sales',       'usr_mgr_004', 'Aryan Kapoor',  'aryan.kapoor@offboardiq.com',  'pending_manager', NOW() - INTERVAL '6 days',  NOW() + INTERVAL '24 days', 30, 'work_environment',   false, ARRAY['standard'],                NOW() - INTERVAL '6 days',  NOW() - INTERVAL '6 days'),
  ('EXIT-MGR-2004', '00000000-0000-0000-0000-000000000000', 'usr_emp_103', 'Lakshmi Nair',   'lakshmi.nair@offboardiq.com',   'Senior Sales Exec',   'Sales',       'usr_mgr_004', 'Aryan Kapoor',  'aryan.kapoor@offboardiq.com',  'in_clearance',    NOW() - INTERVAL '20 days', NOW() + INTERVAL '10 days', 30, 'relocation',         false, ARRAY['standard'],                NOW() - INTERVAL '20 days', NOW() - INTERVAL '5 days'),
  ('EXIT-MGR-2005', '00000000-0000-0000-0000-000000000000', 'usr_emp_104', 'Abhishek Jain',  'abhishek.jain@offboardiq.com',  'Sales Manager',       'Sales',       'usr_mgr_004', 'Aryan Kapoor',  'aryan.kapoor@offboardiq.com',  'in_clearance',    NOW() - INTERVAL '25 days', NOW() + INTERVAL '5 days',  30, 'personal',           false, ARRAY['priority'],                NOW() - INTERVAL '25 days', NOW() - INTERVAL '10 days'),
  ('EXIT-MGR-2006', '00000000-0000-0000-0000-000000000000', 'usr_emp_105', 'Pooja Verma',    'pooja.verma@offboardiq.com',    'Marketing Executive', 'Marketing',   'usr_mgr_004', 'Aryan Kapoor',  'aryan.kapoor@offboardiq.com',  'in_clearance',    NOW() - INTERVAL '30 days', NOW() + INTERVAL '2 days',  32, 'higher_studies',     false, ARRAY['standard'],                NOW() - INTERVAL '30 days', NOW() - INTERVAL '15 days'),
  ('EXIT-MGR-2007', '00000000-0000-0000-0000-000000000000', 'usr_emp_106', 'Nikhil Chandra', 'nikhil.chandra@offboardiq.com', 'Software Engineer',   'Engineering', 'usr_mgr_004', 'Aryan Kapoor',  'aryan.kapoor@offboardiq.com',  'in_clearance',    NOW() - INTERVAL '35 days', NOW() - INTERVAL '1 day',   34, 'better_opportunity', false, ARRAY['overdue','priority'],     NOW() - INTERVAL '35 days', NOW() - INTERVAL '20 days'),
  ('EXIT-MGR-2008', '00000000-0000-0000-0000-000000000000', 'usr_emp_107', 'Ritu Menon',     'ritu.menon@offboardiq.com',     'UI Designer',         'Design',      'usr_mgr_004', 'Aryan Kapoor',  'aryan.kapoor@offboardiq.com',  'cancelled',       NOW() - INTERVAL '45 days', NOW() - INTERVAL '15 days', 30, 'personal',           false, ARRAY['withdrawn'],               NOW() - INTERVAL '45 days', NOW() - INTERVAL '30 days'),
  ('EXIT-MGR-2009', '00000000-0000-0000-0000-000000000000', 'usr_emp_108', 'Girish Pai',     'girish.pai@offboardiq.com',     'Product Manager',     'Product',     'usr_mgr_004', 'Aryan Kapoor',  'aryan.kapoor@offboardiq.com',  'completed',       NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days', 30, 'compensation',       false, ARRAY['standard'],                NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days'),
  ('EXIT-MGR-2010', '00000000-0000-0000-0000-000000000000', 'usr_emp_109', 'Swetha Rao',     'swetha.rao@offboardiq.com',     'Sales Lead',          'Sales',       'usr_mgr_004', 'Aryan Kapoor',  'aryan.kapoor@offboardiq.com',  'completed',       NOW() - INTERVAL '75 days', NOW() - INTERVAL '45 days', 30, 'relocation',         false, ARRAY['standard'],                NOW() - INTERVAL '75 days', NOW() - INTERVAL '45 days'),
  ('EXIT-MGR-2011', '00000000-0000-0000-0000-000000000000', 'usr_emp_111', 'Meena Iyer',     'meena.iyer@offboardiq.com',     'Operations Analyst',  'Operations',  'usr_mgr_004', 'Aryan Kapoor',  'aryan.kapoor@offboardiq.com',  'completed',       NOW() - INTERVAL '85 days', NOW() - INTERVAL '55 days', 30, 'better_opportunity', false, ARRAY['standard'],                NOW() - INTERVAL '85 days', NOW() - INTERVAL '55 days'),
  ('EXIT-MGR-2012', '00000000-0000-0000-0000-000000000000', 'usr_emp_112', 'Praveen Das',    'praveen.das@offboardiq.com',    'Finance Analyst',     'Finance',     'usr_mgr_004', 'Aryan Kapoor',  'aryan.kapoor@offboardiq.com',  'completed',       NOW() - INTERVAL '95 days', NOW() - INTERVAL '65 days', 30, 'higher_studies',     false, ARRAY['standard'],                NOW() - INTERVAL '95 days', NOW() - INTERVAL '65 days')
ON CONFLICT (id) DO NOTHING;


-- ── 9. SEED CLEARANCE TASKS (legacy_clearance_tasks) ──────────────────────────
INSERT INTO legacy_clearance_tasks (
  id, organization_id, case_id, dept_id, dept_label, assignee_id, assignee_name,
  status, sla_hours, sla_due_at, started_at, completed_at, notes, created_at, updated_at
) VALUES
  -- CASE-2026-1001 tasks (completed)
  ('TASK-1001-MGR', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1001', 'manager',     'Manager Clearance', 'usr_mgr_001', 'Meera Krishnan', 'approved', 48, NOW()-INTERVAL '93 days', NOW()-INTERVAL '94 days', NOW()-INTERVAL '92 days', 'All KT sessions done',            NOW()-INTERVAL '95 days', NOW()-INTERVAL '92 days'),
  ('TASK-1001-IT',  '00000000-0000-0000-0000-000000000000', 'CASE-2026-1001', 'it',          'IT',                'usr_it_001',  'Kiran Patel',    'approved', 24, NOW()-INTERVAL '93 days', NOW()-INTERVAL '93 days', NOW()-INTERVAL '91 days', 'Laptop returned, accounts closed', NOW()-INTERVAL '95 days', NOW()-INTERVAL '91 days'),
  ('TASK-1001-FIN', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1001', 'finance',     'Finance',           'usr_fin_001', 'Sunita Rao',     'approved', 48, NOW()-INTERVAL '91 days', NOW()-INTERVAL '91 days', NOW()-INTERVAL '89 days', 'FnF settled: ₹1,24,500',          NOW()-INTERVAL '95 days', NOW()-INTERVAL '89 days'),
  ('TASK-1001-ADM', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1001', 'admin',       'Administration',    'usr_adm_001', 'Admin Dept',     'approved', 24, NOW()-INTERVAL '92 days', NOW()-INTERVAL '92 days', NOW()-INTERVAL '90 days', 'ID card and keys returned',        NOW()-INTERVAL '95 days', NOW()-INTERVAL '90 days'),
  ('TASK-1001-SEC', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1001', 'infosec',     'Info Security',     'usr_sec_001', 'InfoSec Lead',   'approved', 24, NOW()-INTERVAL '93 days', NOW()-INTERVAL '93 days', NOW()-INTERVAL '91 days', 'All access revoked',               NOW()-INTERVAL '95 days', NOW()-INTERVAL '91 days'),
  ('TASK-1001-HR',  '00000000-0000-0000-0000-000000000000', 'CASE-2026-1001', 'hr',          'HR',                'usr_hr_001',  'Anita Desai',    'approved', 72, NOW()-INTERVAL '89 days', NOW()-INTERVAL '89 days', NOW()-INTERVAL '66 days', 'Exit interview completed',         NOW()-INTERVAL '95 days', NOW()-INTERVAL '66 days'),

  -- CASE-2026-1002 tasks (completed)
  ('TASK-1002-MGR', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1002', 'manager',     'Manager Clearance', 'usr_mgr_003', 'Sunita Iyer',    'approved', 48, NOW()-INTERVAL '78 days', NOW()-INTERVAL '79 days', NOW()-INTERVAL '77 days', 'Handover complete',                NOW()-INTERVAL '80 days', NOW()-INTERVAL '77 days'),
  ('TASK-1002-IT',  '00000000-0000-0000-0000-000000000000', 'CASE-2026-1002', 'it',          'IT',                'usr_it_001',  'Kiran Patel',    'approved', 24, NOW()-INTERVAL '79 days', NOW()-INTERVAL '79 days', NOW()-INTERVAL '78 days', 'MacBook Pro returned',             NOW()-INTERVAL '80 days', NOW()-INTERVAL '78 days'),
  ('TASK-1002-FIN', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1002', 'finance',     'Finance',           'usr_fin_001', 'Sunita Rao',     'approved', 48, NOW()-INTERVAL '77 days', NOW()-INTERVAL '77 days', NOW()-INTERVAL '75 days', 'Final settlement processed',       NOW()-INTERVAL '80 days', NOW()-INTERVAL '75 days'),
  ('TASK-1002-ADM', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1002', 'admin',       'Administration',    'usr_adm_001', 'Admin Dept',     'approved', 24, NOW()-INTERVAL '79 days', NOW()-INTERVAL '79 days', NOW()-INTERVAL '77 days', 'Desk cleared',                     NOW()-INTERVAL '80 days', NOW()-INTERVAL '77 days'),
  ('TASK-1002-SEC', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1002', 'infosec',     'Info Security',     'usr_sec_001', 'InfoSec Lead',   'approved', 24, NOW()-INTERVAL '79 days', NOW()-INTERVAL '79 days', NOW()-INTERVAL '78 days', 'Access decommissioned',            NOW()-INTERVAL '80 days', NOW()-INTERVAL '78 days'),
  ('TASK-1002-HR',  '00000000-0000-0000-0000-000000000000', 'CASE-2026-1002', 'hr',          'HR',                'usr_hr_001',  'Anita Desai',    'approved', 72, NOW()-INTERVAL '75 days', NOW()-INTERVAL '75 days', NOW()-INTERVAL '51 days', 'Relieving letter issued',          NOW()-INTERVAL '80 days', NOW()-INTERVAL '51 days'),

  -- CASE-2026-1005 tasks (in progress)
  ('TASK-1005-MGR', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1005', 'manager',     'Manager Clearance', 'usr_mgr_002', 'Rahul Mehta',    'approved', 48, NOW()-INTERVAL '23 days', NOW()-INTERVAL '24 days', NOW()-INTERVAL '22 days', 'KT complete, projects handed over',NOW()-INTERVAL '25 days', NOW()-INTERVAL '22 days'),
  ('TASK-1005-IT',  '00000000-0000-0000-0000-000000000000', 'CASE-2026-1005', 'it',          'IT',                'usr_it_001',  'Kiran Patel',    'approved', 24, NOW()-INTERVAL '24 days', NOW()-INTERVAL '24 days', NOW()-INTERVAL '23 days', 'Laptop returned',                  NOW()-INTERVAL '25 days', NOW()-INTERVAL '23 days'),
  ('TASK-1005-FIN', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1005', 'finance',     'Finance',           'usr_fin_001', 'Sunita Rao',     'in_progress', 48, NOW()-INTERVAL '22 days', NOW()-INTERVAL '10 days', null, null,                               NOW()-INTERVAL '25 days', NOW()-INTERVAL '10 days'),
  ('TASK-1005-ADM', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1005', 'admin',       'Administration',    'usr_adm_001', 'Admin Dept',     'pending',  24, NOW()-INTERVAL '23 days', null, null, null,                                                      NOW()-INTERVAL '25 days', NOW()-INTERVAL '25 days'),
  ('TASK-1005-SEC', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1005', 'infosec',     'Info Security',     'usr_sec_001', 'InfoSec Lead',   'approved', 24, NOW()-INTERVAL '24 days', NOW()-INTERVAL '24 days', NOW()-INTERVAL '23 days', 'All credentials deactivated',      NOW()-INTERVAL '25 days', NOW()-INTERVAL '23 days'),
  ('TASK-1005-HR',  '00000000-0000-0000-0000-000000000000', 'CASE-2026-1005', 'hr',          'HR',                'usr_hr_001',  'Anita Desai',    'pending',  72, NOW()-INTERVAL '21 days', null, null, null,                                                      NOW()-INTERVAL '25 days', NOW()-INTERVAL '25 days'),

  -- CASE-2026-1006 tasks (in progress)
  ('TASK-1006-MGR', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1006', 'manager',     'Manager Clearance', 'usr_mgr_001', 'Meera Krishnan', 'approved', 48, NOW()-INTERVAL '16 days', NOW()-INTERVAL '17 days', NOW()-INTERVAL '15 days', 'KT done',                          NOW()-INTERVAL '18 days', NOW()-INTERVAL '15 days'),
  ('TASK-1006-IT',  '00000000-0000-0000-0000-000000000000', 'CASE-2026-1006', 'it',          'IT',                'usr_it_001',  'Kiran Patel',    'in_progress', 24, NOW()-INTERVAL '16 days', NOW()-INTERVAL '5 days', null, null,                               NOW()-INTERVAL '18 days', NOW()-INTERVAL '5 days'),
  ('TASK-1006-FIN', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1006', 'finance',     'Finance',           'usr_fin_001', 'Sunita Rao',     'pending',  48, NOW()-INTERVAL '14 days', null, null, null,                                                      NOW()-INTERVAL '18 days', NOW()-INTERVAL '18 days'),
  ('TASK-1006-ADM', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1006', 'admin',       'Administration',    'usr_adm_001', 'Admin Dept',     'pending',  24, NOW()-INTERVAL '16 days', null, null, null,                                                      NOW()-INTERVAL '18 days', NOW()-INTERVAL '18 days'),
  ('TASK-1006-SEC', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1006', 'infosec',     'Info Security',     'usr_sec_001', 'InfoSec Lead',   'pending',  24, NOW()-INTERVAL '16 days', null, null, null,                                                      NOW()-INTERVAL '18 days', NOW()-INTERVAL '18 days'),
  ('TASK-1006-HR',  '00000000-0000-0000-0000-000000000000', 'CASE-2026-1006', 'hr',          'HR',                'usr_hr_001',  'Anita Desai',    'pending',  72, NOW()-INTERVAL '12 days', null, null, null,                                                      NOW()-INTERVAL '18 days', NOW()-INTERVAL '18 days'),

  -- CASE-2026-1007 tasks
  ('TASK-1007-MGR', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1007', 'manager',     'Manager Clearance', 'usr_mgr_001', 'Meera Krishnan', 'approved', 48, NOW()-INTERVAL '10 days', NOW()-INTERVAL '11 days', NOW()-INTERVAL '9 days', 'Projects handed over',             NOW()-INTERVAL '12 days', NOW()-INTERVAL '9 days'),
  ('TASK-1007-IT',  '00000000-0000-0000-0000-000000000000', 'CASE-2026-1007', 'it',          'IT',                'usr_it_001',  'Kiran Patel',    'pending',  24, NOW()-INTERVAL '10 days', null, null, null,                                                      NOW()-INTERVAL '12 days', NOW()-INTERVAL '12 days'),
  ('TASK-1007-FIN', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1007', 'finance',     'Finance',           'usr_fin_001', 'Sunita Rao',     'pending',  48, NOW()-INTERVAL '8 days',  null, null, null,                                                      NOW()-INTERVAL '12 days', NOW()-INTERVAL '12 days'),
  ('TASK-1007-ADM', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1007', 'admin',       'Administration',    'usr_adm_001', 'Admin Dept',     'pending',  24, NOW()-INTERVAL '10 days', null, null, null,                                                      NOW()-INTERVAL '12 days', NOW()-INTERVAL '12 days'),
  ('TASK-1007-SEC', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1007', 'infosec',     'Info Security',     'usr_sec_001', 'InfoSec Lead',   'pending',  24, NOW()-INTERVAL '10 days', null, null, null,                                                      NOW()-INTERVAL '12 days', NOW()-INTERVAL '12 days'),
  ('TASK-1007-HR',  '00000000-0000-0000-0000-000000000000', 'CASE-2026-1007', 'hr',          'HR',                'usr_hr_001',  'Anita Desai',    'pending',  72, NOW()-INTERVAL '6 days',  null, null, null,                                                      NOW()-INTERVAL '12 days', NOW()-INTERVAL '12 days'),

  -- CASE-2026-1012 tasks (escalated)
  ('TASK-1012-MGR', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1012', 'manager',     'Manager Clearance', 'usr_mgr_002', 'Rahul Mehta',    'approved', 48, NOW()-INTERVAL '33 days', NOW()-INTERVAL '34 days', NOW()-INTERVAL '32 days', 'Approved after reminder',          NOW()-INTERVAL '35 days', NOW()-INTERVAL '32 days'),
  ('TASK-1012-IT',  '00000000-0000-0000-0000-000000000000', 'CASE-2026-1012', 'it',          'IT',                'usr_it_001',  'Kiran Patel',    'overdue',  24, NOW()-INTERVAL '10 days', NOW()-INTERVAL '20 days', null, null,                                  NOW()-INTERVAL '35 days', NOW()-INTERVAL '20 days'),
  ('TASK-1012-FIN', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1012', 'finance',     'Finance',           'usr_fin_001', 'Sunita Rao',     'rejected', 48, NOW()-INTERVAL '8 days',  NOW()-INTERVAL '15 days', NOW()-INTERVAL '8 days',  'Pending loan recovery',            NOW()-INTERVAL '35 days', NOW()-INTERVAL '8 days'),
  ('TASK-1012-ADM', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1012', 'admin',       'Administration',    'usr_adm_001', 'Admin Dept',     'overdue',  24, NOW()-INTERVAL '5 days',  null, null, null,                                                      NOW()-INTERVAL '35 days', NOW()-INTERVAL '35 days'),
  ('TASK-1012-SEC', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1012', 'infosec',     'Info Security',     'usr_sec_001', 'InfoSec Lead',   'overdue',  24, NOW()-INTERVAL '6 days',  null, null, null,                                                      NOW()-INTERVAL '35 days', NOW()-INTERVAL '35 days'),
  ('TASK-1012-HR',  '00000000-0000-0000-0000-000000000000', 'CASE-2026-1012', 'hr',          'HR',                'usr_hr_001',  'Anita Desai',    'pending',  72, NOW()-INTERVAL '3 days',  null, null, null,                                                      NOW()-INTERVAL '35 days', NOW()-INTERVAL '35 days')
ON CONFLICT (id) DO NOTHING;


  -- EXIT-MGR-2004 tasks
INSERT INTO legacy_clearance_tasks (
  id, organization_id, case_id, dept_id, dept_label, assignee_id, assignee_name,
  status, sla_hours, sla_due_at, completed_at, created_at
) VALUES
  ('ct-2004-mgr', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2004', 'manager',   'Manager Clearance', 'usr_mgr_004', 'Aryan Kapoor',  'approved', 48, NOW() - INTERVAL '17 days', NOW() - INTERVAL '16 days', NOW() - INTERVAL '20 days'),
  ('ct-2004-it',  '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2004', 'it',         'IT',                'usr_it_001',  'Kiran Patel',   'approved', 24, NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '19 days'),
  ('ct-2004-fin', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2004', 'finance',    'Finance',           'usr_fin_001', 'Sunita Rao',    'pending',  48, NOW() + INTERVAL '5 days',  NULL,                       NOW() - INTERVAL '18 days'),
  ('ct-2004-hr',  '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2004', 'hr',         'HR',                'usr_hr_001',  'Anita Desai',   'pending',  72, NOW() + INTERVAL '8 days',  NULL,                       NOW() - INTERVAL '18 days'),

  -- EXIT-MGR-2005 tasks
  ('ct-2005-mgr', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2005', 'manager',   'Manager Clearance', 'usr_mgr_004', 'Aryan Kapoor',  'approved', 48, NOW() - INTERVAL '22 days', NOW() - INTERVAL '21 days', NOW() - INTERVAL '25 days'),
  ('ct-2005-it',  '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2005', 'it',         'IT',                'usr_it_001',  'Kiran Patel',   'approved', 24, NOW() - INTERVAL '18 days', NOW() - INTERVAL '17 days', NOW() - INTERVAL '24 days'),
  ('ct-2005-fin', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2005', 'finance',    'Finance',           'usr_fin_001', 'Sunita Rao',    'approved', 48, NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days', NOW() - INTERVAL '23 days'),
  ('ct-2005-hr',  '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2005', 'hr',         'HR',                'usr_hr_001',  'Anita Desai',   'pending',  72, NOW() + INTERVAL '1 day',   NULL,                       NOW() - INTERVAL '22 days'),

  -- EXIT-MGR-2006 tasks
  ('ct-2006-mgr', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2006', 'manager',   'Manager Clearance', 'usr_mgr_004', 'Aryan Kapoor',  'approved', 48, NOW() - INTERVAL '27 days', NOW() - INTERVAL '26 days', NOW() - INTERVAL '30 days'),
  ('ct-2006-it',  '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2006', 'it',         'IT',                'usr_it_001',  'Kiran Patel',   'approved', 24, NOW() - INTERVAL '24 days', NOW() - INTERVAL '23 days', NOW() - INTERVAL '29 days'),
  ('ct-2006-fin', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2006', 'finance',    'Finance',           'usr_fin_001', 'Sunita Rao',    'pending',  48, NOW() - INTERVAL '5 days',  NULL,                       NOW() - INTERVAL '28 days'),
  ('ct-2006-hr',  '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2006', 'hr',         'HR',                'usr_hr_001',  'Anita Desai',   'pending',  72, NOW() + INTERVAL '3 days',  NULL,                       NOW() - INTERVAL '28 days'),

  -- EXIT-MGR-2007 tasks
  ('ct-2007-mgr', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2007', 'manager',   'Manager Clearance', 'usr_mgr_004', 'Aryan Kapoor',  'approved', 48, NOW() - INTERVAL '32 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '35 days'),
  ('ct-2007-it',  '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2007', 'it',         'IT',                'usr_it_001',  'Kiran Patel',   'pending',  24, NOW() - INTERVAL '10 days', NULL,                       NOW() - INTERVAL '34 days'),
  ('ct-2007-fin', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2007', 'finance',    'Finance',           'usr_fin_001', 'Sunita Rao',    'pending',  48, NOW() - INTERVAL '8 days',  NULL,                       NOW() - INTERVAL '33 days'),
  ('ct-2007-hr',  '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2007', 'hr',         'HR',                'usr_hr_001',  'Anita Desai',   'pending',  72, NOW() - INTERVAL '3 days',  NULL,                       NOW() - INTERVAL '32 days'),

  -- EXIT-MGR-2009 tasks
  ('ct-2009-mgr', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2009', 'manager', 'Manager Clearance', 'usr_mgr_004', 'Aryan Kapoor', 'approved', 48, NOW() - INTERVAL '57 days', NOW() - INTERVAL '56 days', NOW() - INTERVAL '60 days'),
  ('ct-2009-it',  '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2009', 'it',       'IT',               'usr_it_001',  'Kiran Patel',  'approved', 24, NOW() - INTERVAL '55 days', NOW() - INTERVAL '54 days', NOW() - INTERVAL '59 days'),
  ('ct-2009-fin', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2009', 'finance',  'Finance',          'usr_fin_001', 'Sunita Rao',   'approved', 48, NOW() - INTERVAL '50 days', NOW() - INTERVAL '49 days', NOW() - INTERVAL '58 days'),
  ('ct-2009-hr',  '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2009', 'hr',       'HR',               'usr_hr_001',  'Anita Desai',  'approved', 72, NOW() - INTERVAL '45 days', NOW() - INTERVAL '44 days', NOW() - INTERVAL '57 days'),

  -- EXIT-MGR-2010 tasks
  ('ct-2010-mgr', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2010', 'manager', 'Manager Clearance', 'usr_mgr_004', 'Aryan Kapoor', 'approved', 48, NOW() - INTERVAL '72 days', NOW() - INTERVAL '71 days', NOW() - INTERVAL '75 days'),
  ('ct-2010-it',  '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2010', 'it',       'IT',               'usr_it_001',  'Kiran Patel',  'approved', 24, NOW() - INTERVAL '70 days', NOW() - INTERVAL '69 days', NOW() - INTERVAL '74 days'),
  ('ct-2010-fin', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2010', 'finance',  'Finance',          'usr_fin_001', 'Sunita Rao',   'approved', 48, NOW() - INTERVAL '65 days', NOW() - INTERVAL '64 days', NOW() - INTERVAL '73 days'),
  ('ct-2010-hr',  '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2010', 'hr',       'HR',               'usr_hr_001',  'Anita Desai',  'approved', 72, NOW() - INTERVAL '50 days', NOW() - INTERVAL '49 days', NOW() - INTERVAL '72 days')
ON CONFLICT (id) DO NOTHING;


-- ── 10. SEED TIMELINE EVENTS ─────────────────────────────────────────────────
INSERT INTO timeline_events (id, organization_id, case_id, label, timestamp, actor, actor_role, is_pending, created_at) VALUES
  -- CASE-2026-1001
  ('TL-1001-1', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1001', 'Resignation submitted by employee',         NOW()-INTERVAL '95 days', 'Arjun Nair',     'employee',  false, NOW()-INTERVAL '95 days'),
  ('TL-1001-2', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1001', 'Exit case created by HR',                   NOW()-INTERVAL '94 days', 'Anita Desai',    'hr',        false, NOW()-INTERVAL '94 days'),
  ('TL-1001-3', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1001', 'Manager approved resignation',              NOW()-INTERVAL '92 days', 'Meera Krishnan', 'manager',   false, NOW()-INTERVAL '92 days'),
  ('TL-1001-4', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1001', 'IT clearance approved',                     NOW()-INTERVAL '91 days', 'Kiran Patel',    'dept_approver', false, NOW()-INTERVAL '91 days'),
  ('TL-1001-5', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1001', 'Finance settlement cleared',                NOW()-INTERVAL '89 days', 'Sunita Rao',     'dept_approver', false, NOW()-INTERVAL '89 days'),
  ('TL-1001-6', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1001', 'Exit interview completed',                  NOW()-INTERVAL '68 days', 'Anita Desai',    'hr',        false, NOW()-INTERVAL '68 days'),
  ('TL-1001-7', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1001', 'Relieving letter generated',                NOW()-INTERVAL '66 days', 'Anita Desai',    'hr',        false, NOW()-INTERVAL '66 days'),
  ('TL-1001-8', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1001', 'Exit case completed',                       NOW()-INTERVAL '65 days', 'System',         'system',    false, NOW()-INTERVAL '65 days'),
  
  -- CASE-2026-1005
  ('TL-1005-1', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1005', 'Resignation submitted by employee',         NOW()-INTERVAL '25 days', 'Vikram Singh',   'employee',  false, NOW()-INTERVAL '25 days'),
  ('TL-1005-2', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1005', 'Exit case created by HR',                   NOW()-INTERVAL '24 days', 'Anita Desai',    'hr',        false, NOW()-INTERVAL '24 days'),
  ('TL-1005-3', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1005', 'Manager approved resignation',              NOW()-INTERVAL '22 days', 'Rahul Mehta',    'manager',   false, NOW()-INTERVAL '22 days'),
  ('TL-1005-4', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1005', 'Clearance workflow initiated',              NOW()-INTERVAL '22 days', 'System',         'system',    false, NOW()-INTERVAL '22 days'),
  ('TL-1005-5', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1005', 'IT clearance approved',                     NOW()-INTERVAL '23 days', 'Kiran Patel',    'dept_approver', false, NOW()-INTERVAL '23 days'),
  ('TL-1005-6', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1005', 'Finance settlement in progress',            NOW()-INTERVAL '10 days', 'Sunita Rao',     'dept_approver', false, NOW()-INTERVAL '10 days'),
  
  -- CASE-2026-1012 (escalated)
  ('TL-1012-1', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1012', 'Resignation submitted by employee',         NOW()-INTERVAL '35 days', 'Ravi Chandra',   'employee',  false, NOW()-INTERVAL '35 days'),
  ('TL-1012-2', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1012', 'Exit case created by HR',                   NOW()-INTERVAL '34 days', 'Anita Desai',    'hr',        false, NOW()-INTERVAL '34 days'),
  ('TL-1012-3', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1012', 'Manager approved resignation',              NOW()-INTERVAL '32 days', 'Rahul Mehta',    'manager',   false, NOW()-INTERVAL '32 days'),
  ('TL-1012-4', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1012', 'Case escalated due to SLA breach',          NOW()-INTERVAL '10 days', 'System',         'system',    false, NOW()-INTERVAL '10 days'),
  ('TL-1012-5', '00000000-0000-0000-0000-000000000000', 'CASE-2026-1012', 'Finance task rejected — loan pending',      NOW()-INTERVAL '8 days',  'Sunita Rao',     'dept_approver', false, NOW()-INTERVAL '8 days'),

  -- EXIT-MGR-2001
  ('te-mgr-01', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2001', 'Resignation Submitted',         NOW() - INTERVAL '2 days',  'Deepa Rajan',   'employee',      true,  NOW() - INTERVAL '2 days'),
  -- EXIT-MGR-2002
  ('te-mgr-02', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2002', 'Resignation Submitted',         NOW() - INTERVAL '4 days',  'Sameer Khan',   'employee',      true,  NOW() - INTERVAL '4 days'),
  -- EXIT-MGR-2003
  ('te-mgr-03', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2003', 'Resignation Submitted',         NOW() - INTERVAL '6 days',  'Vijay Kumar',   'employee',      true,  NOW() - INTERVAL '6 days'),
  -- EXIT-MGR-2004
  ('te-mgr-04', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2004', 'Resignation Submitted',         NOW() - INTERVAL '20 days', 'Lakshmi Nair',  'employee',      false, NOW() - INTERVAL '20 days'),
  ('te-mgr-05', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2004', 'Resignation Approved',          NOW() - INTERVAL '19 days', 'Aryan Kapoor',  'manager',       false, NOW() - INTERVAL '19 days'),
  ('te-mgr-06', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2004', 'IT Clearance Completed',         NOW() - INTERVAL '14 days', 'Kiran Patel',   'dept_approver', false, NOW() - INTERVAL '14 days'),
  ('te-mgr-07', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2004', 'Finance Clearance Pending',      NOW() - INTERVAL '1 day',   'Sunita Rao',    'dept_approver', true,  NOW() - INTERVAL '1 day'),
  -- EXIT-MGR-2006
  ('te-mgr-08', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2006', 'Resignation Submitted',         NOW() - INTERVAL '30 days', 'Pooja Verma',   'employee',      false, NOW() - INTERVAL '30 days'),
  ('te-mgr-09', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2006', 'Resignation Approved',          NOW() - INTERVAL '29 days', 'Aryan Kapoor',  'manager',       false, NOW() - INTERVAL '29 days'),
  ('te-mgr-10', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2006', 'IT Clearance Completed',         NOW() - INTERVAL '23 days', 'Kiran Patel',   'dept_approver', false, NOW() - INTERVAL '23 days'),
  ('te-mgr-11', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2006', 'Finance Clearance SLA BREACHED', NOW() - INTERVAL '5 days',   'Sunita Rao',    'dept_approver', true,  NOW() - INTERVAL '5 days'),
  -- EXIT-MGR-2009
  ('te-mgr-12', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2009', 'Resignation Submitted',         NOW() - INTERVAL '60 days', 'Girish Pai',    'employee',      false, NOW() - INTERVAL '60 days'),
  ('te-mgr-13', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2009', 'Resignation Approved',          NOW() - INTERVAL '59 days', 'Aryan Kapoor',  'manager',       false, NOW() - INTERVAL '59 days'),
  ('te-mgr-14', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2009', 'IT Clearance Completed',         NOW() - INTERVAL '54 days', 'Kiran Patel',   'dept_approver', false, NOW() - INTERVAL '54 days'),
  ('te-mgr-15', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2009', 'Finance Clearance Completed',    NOW() - INTERVAL '49 days', 'Sunita Rao',    'dept_approver', false, NOW() - INTERVAL '49 days'),
  ('te-mgr-16', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2009', 'HR Clearance Completed',         NOW() - INTERVAL '44 days', 'Anita Desai',   'hr',            false, NOW() - INTERVAL '44 days'),
  ('te-mgr-17', '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2009', 'Relieving Letter Issued',        NOW() - INTERVAL '30 days', 'Anita Desai',   'hr',            false, NOW() - INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;


-- ── 11. SEED CASE COMMENTS (legacy_case_comments) ────────────────────────────
INSERT INTO legacy_case_comments (id, organization_id, case_id, author_id, author_name, author_role, message, visibility, timestamp, created_at) VALUES
  (gen_random_uuid()::text, '00000000-0000-0000-0000-000000000000', 'CASE-2026-1005', 'usr_hr_001', 'Anita Desai', 'hr', 'Finance team — please expedite the FnF calculation. Last working day is in 5 days.', 'internal', NOW()-INTERVAL '8 days', NOW()-INTERVAL '8 days'),
  (gen_random_uuid()::text, '00000000-0000-0000-0000-000000000000', 'CASE-2026-1005', 'usr_fin_001', 'Sunita Rao', 'dept_approver', 'On it. Loan recovery confirmation pending from accounts. Will update by EOD.', 'all', NOW()-INTERVAL '7 days', NOW()-INTERVAL '7 days'),
  (gen_random_uuid()::text, '00000000-0000-0000-0000-000000000000', 'CASE-2026-1006', 'usr_hr_001', 'Anita Desai', 'hr', 'Please note: Priya has requested early release. Kindly prioritise her clearance tasks.', 'internal', NOW()-INTERVAL '15 days', NOW()-INTERVAL '15 days'),
  (gen_random_uuid()::text, '00000000-0000-0000-0000-000000000000', 'CASE-2026-1012', 'usr_hr_001', 'Anita Desai', 'hr', 'This case has been escalated. SLA breached on IT, Admin, and InfoSec tasks. Immediate action required.', 'internal', NOW()-INTERVAL '9 days', NOW()-INTERVAL '9 days'),
  (gen_random_uuid()::text, '00000000-0000-0000-0000-000000000000', 'CASE-2026-1012', 'usr_mgr_002', 'Rahul Mehta', 'manager', 'I have reminded the IT and admin teams. They are working on it.', 'all', NOW()-INTERVAL '8 days', NOW()-INTERVAL '8 days'),
  (gen_random_uuid()::text, '00000000-0000-0000-0000-000000000000', 'CASE-2026-1012', 'usr_fin_001', 'Sunita Rao', 'dept_approver', 'Finance task rejected — Ravi has an outstanding loan of ₹35,000. Settlement required before final clearance.', 'all', NOW()-INTERVAL '8 days', NOW()-INTERVAL '8 days'),

  (gen_random_uuid()::text, '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2001', 'usr_mgr_004', 'Aryan Kapoor', 'manager', 'Please provide your knowledge transfer documentation before LWD.', 'all', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  (gen_random_uuid()::text, '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2001', 'usr_hr_001',  'Anita Desai',  'hr', 'HR acknowledges the resignation. Exit interview scheduled.', 'internal', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours'),
  (gen_random_uuid()::text, '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2004', 'usr_mgr_004', 'Aryan Kapoor', 'manager', 'IT and manager approvals done. Pending finance sign-off.', 'all', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  (gen_random_uuid()::text, '00000000-0000-0000-0000-000000000000', 'EXIT-MGR-2006', 'usr_hr_001',  'Anita Desai',  'hr', 'Finance SLA breached. Escalating to finance lead.', 'internal', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;


-- ── 12. SEED EXIT INTERVIEWS (legacy_exit_interviews) ────────────────────────
INSERT INTO legacy_exit_interviews (id, case_id, overall_rating, management_rating, culture_rating, reason, improvements, would_rejoin, comments, completed_at, created_at) VALUES
  (gen_random_uuid()::text, 'CASE-2026-1001', 4, 4, 3, 'Received a senior engineer role with 40% salary hike at a startup.', 'Better career growth paths and more competitive compensation packages would help retention.', true, 'I enjoyed working here. The team is great but I needed faster career progression.', NOW()-INTERVAL '68 days', NOW()-INTERVAL '68 days'),
  (gen_random_uuid()::text, 'CASE-2026-1002', 3, 3, 4, 'Compensation was not matching industry standards for my role and experience.', 'Regular compensation reviews and transparent pay bands would improve retention.', false, 'Good workplace culture but salary was a major concern.', NOW()-INTERVAL '53 days', NOW()-INTERVAL '53 days'),
  (gen_random_uuid()::text, 'CASE-2026-1003', 4, 5, 4, 'Relocating to Hyderabad to be closer to family.', 'Remote work options would have helped me stay.', true, 'Loved the management style. Only leaving due to personal reasons.', NOW()-INTERVAL '43 days', NOW()-INTERVAL '43 days'),
  (gen_random_uuid()::text, 'CASE-2026-1004', 5, 5, 5, 'Pursuing an MBA at IIM Bangalore.', 'Nothing to improve — this is a great place to work.', true, 'Best team I have ever worked with. Will definitely recommend this company.', NOW()-INTERVAL '33 days', NOW()-INTERVAL '33 days')
ON CONFLICT (case_id) DO NOTHING;


-- ── 13. SEED LEGACY AUDIT LOGS (legacy_audit_logs) ───────────────────────────
INSERT INTO legacy_audit_logs (id, organization_id, timestamp, actor, role, type, action, entity, details, case_id, created_at)
SELECT gen_random_uuid()::text, '00000000-0000-0000-0000-000000000000'::uuid, * FROM (VALUES
  (NOW()-INTERVAL '95 days', 'Arjun Nair',     'employee',      'Case'::"audit_event_type",     'Created',   'CASE-2026-1001', 'Resignation submitted',           'CASE-2026-1001', NOW()-INTERVAL '95 days'),
  (NOW()-INTERVAL '94 days', 'Anita Desai',    'hr',            'Case'::"audit_event_type",     'Created',   'CASE-2026-1001', 'Exit case created by HR',         'CASE-2026-1001', NOW()-INTERVAL '94 days'),
  (NOW()-INTERVAL '92 days', 'Meera Krishnan', 'manager',       'Task'::"audit_event_type",     'Approved',  'TASK-1001-MGR',  'Manager approved resignation',    'CASE-2026-1001', NOW()-INTERVAL '92 days'),
  (NOW()-INTERVAL '91 days', 'Kiran Patel',    'dept_approver', 'Task'::"audit_event_type",     'Approved',  'TASK-1001-IT',   'IT clearance completed',          'CASE-2026-1001', NOW()-INTERVAL '91 days'),
  (NOW()-INTERVAL '89 days', 'Sunita Rao',     'dept_approver', 'Task'::"audit_event_type",     'Approved',  'TASK-1001-FIN',  'Finance settlement cleared',      'CASE-2026-1001', NOW()-INTERVAL '89 days'),
  (NOW()-INTERVAL '66 days', 'Anita Desai',    'hr',            'Document'::"audit_event_type", 'Generated', 'CASE-2026-1001', 'Relieving letter generated',      'CASE-2026-1001', NOW()-INTERVAL '66 days'),
  (NOW()-INTERVAL '25 days', 'Vikram Singh',   'employee',      'Case'::"audit_event_type",     'Created',   'CASE-2026-1005', 'Resignation submitted',           'CASE-2026-1005', NOW()-INTERVAL '25 days'),
  (NOW()-INTERVAL '10 days', 'System',         'system',        'Case'::"audit_event_type",     'Updated',   'CASE-2026-1012', 'Case escalated due to SLA breach','CASE-2026-1012', NOW()-INTERVAL '10 days'),
  (NOW()-INTERVAL '8 days',  'Sunita Rao',     'dept_approver', 'Task'::"audit_event_type",     'Rejected',  'TASK-1012-FIN',  'Finance task rejected',           'CASE-2026-1012', NOW()-INTERVAL '8 days')
) AS t(timestamp, actor, role, type, action, entity, details, case_id, created_at);


-- ── 14. SEED ORG AUDIT LOGS (org_audit_logs) ─────────────────────────────────
INSERT INTO org_audit_logs (
  organization_id, actor_user_id, entity_type, entity_id,
  action, old_value, new_value, ip_address, user_agent, session_id,
  is_synthetic, source_type, created_at
)
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  actor_user_id,
  entity_type::audit_event_type,
  entity_id,
  action,
  old_value,
  new_value,
  ip_address,
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/124',
  session_id,
  true,
  'synthetic',
  created_at
FROM (VALUES
  ('usr_hr_001',  'Case', 'CASE-2026-1001', 'Created',    '{}', '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Exit case created for Arjun Nair"}',          '192.168.1.101', 'ses_legacy_001', NOW()-INTERVAL '95 days'),
  ('usr_emp_001', 'Case', 'CASE-2026-1001', 'Submitted',  '{}', '{"severity":"info","actor_name":"Arjun Nair","actor_role":"employee","details":"Resignation submitted by employee"}',    '192.168.1.201', 'ses_legacy_002', NOW()-INTERVAL '95 days'),
  ('usr_mgr_001', 'Case', 'CASE-2026-1001', 'Approved',   '{"status":"pending_manager"}', '{"status":"in_clearance","severity":"info","actor_name":"Meera Krishnan","actor_role":"manager","details":"Manager approved resignation"}', '192.168.1.111', 'ses_legacy_003', NOW()-INTERVAL '92 days'),
  ('usr_hr_001',  'Case', 'CASE-2026-1001', 'Completed',  '{"status":"in_clearance"}', '{"status":"completed","severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Exit case completed successfully"}', '192.168.1.101', 'ses_legacy_004', NOW()-INTERVAL '65 days'),
  
  ('usr_hr_001',  'Case', 'CASE-2026-1002', 'Created',    '{}', '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Exit case created for Divya Reddy"}',         '192.168.1.101', 'ses_legacy_005', NOW()-INTERVAL '80 days'),
  ('usr_mgr_003', 'Case', 'CASE-2026-1002', 'Approved',   '{"status":"pending_manager"}', '{"status":"in_clearance","severity":"info","actor_name":"Sunita Iyer","actor_role":"manager","details":"Manager approved resignation"}', '192.168.1.112', 'ses_legacy_006', NOW()-INTERVAL '77 days'),
  ('usr_hr_001',  'Case', 'CASE-2026-1002', 'Completed',  '{"status":"in_clearance"}', '{"status":"completed","severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Exit case completed"}', '192.168.1.101', 'ses_legacy_007', NOW()-INTERVAL '50 days'),
  
  ('usr_hr_001',  'Case', 'CASE-2026-1005', 'Created',    '{}', '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Exit case created for Vikram Singh"}',        '192.168.1.101', 'ses_legacy_008', NOW()-INTERVAL '25 days'),
  ('usr_mgr_002', 'Case', 'CASE-2026-1005', 'Approved',   '{"status":"pending_manager"}', '{"status":"in_clearance","severity":"info","actor_name":"Rahul Mehta","actor_role":"manager","details":"Manager approved clearance"}', '192.168.1.110', 'ses_legacy_009', NOW()-INTERVAL '22 days'),
  
  ('usr_hr_001',  'Case', 'CASE-2026-1006', 'Created',    '{}', '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Exit case created for Priya Sharma"}',        '192.168.1.101', 'ses_legacy_010', NOW()-INTERVAL '18 days'),
  ('usr_hr_001',  'Case', 'CASE-2026-1009', 'Created',    '{}', '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Exit case created for Neha Gupta"}',          '192.168.1.101', 'ses_legacy_011', NOW()-INTERVAL '3 days'),
  ('usr_hr_001',  'Case', 'CASE-2026-1010', 'Created',    '{}', '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Exit case created for Rohan Kapoor"}',        '192.168.1.101', 'ses_legacy_012', NOW()-INTERVAL '1 day'),
  ('usr_hr_001',  'Case', 'CASE-2026-1012', 'Escalated',  '{"escalated":false}', '{"escalated":true,"severity":"warn","actor_name":"System","actor_role":"system","details":"Case escalated due to SLA breach"}', '192.168.1.1', 'ses_legacy_013', NOW()-INTERVAL '10 days'),
  
  ('usr_it_001',  'Task', 'TASK-1001-IT',  'Approved',   '{"status":"pending"}', '{"status":"approved","severity":"info","actor_name":"Kiran Patel","actor_role":"IT","details":"IT clearance completed, laptop returned"}',        '192.168.1.105', 'ses_legacy_014', NOW()-INTERVAL '91 days'),
  ('usr_fin_001', 'Task', 'TASK-1001-FIN', 'Approved',   '{"status":"pending"}', '{"status":"approved","severity":"info","actor_name":"Sunita Rao","actor_role":"Finance","details":"Finance settlement cleared: ₹1,24,500"}',      '192.168.1.106', 'ses_legacy_015', NOW()-INTERVAL '89 days'),
  ('usr_it_001',  'Task', 'TASK-1002-IT',  'Approved',   '{"status":"pending"}', '{"status":"approved","severity":"info","actor_name":"Kiran Patel","actor_role":"IT","details":"MacBook Pro returned, accounts deactivated"}',    '192.168.1.105', 'ses_legacy_016', NOW()-INTERVAL '78 days'),
  ('usr_it_001',  'Task', 'TASK-1005-IT',  'Approved',   '{"status":"pending"}', '{"status":"approved","severity":"info","actor_name":"Kiran Patel","actor_role":"IT","details":"IT clearance completed"}',                       '192.168.1.105', 'ses_legacy_017', NOW()-INTERVAL '23 days'),
  ('usr_fin_001', 'Task', 'TASK-1012-FIN', 'Rejected',   '{"status":"in_progress"}', '{"status":"rejected","severity":"warn","actor_name":"Sunita Rao","actor_role":"Finance","details":"Outstanding loan of ₹35,000 — clearance rejected"}', '192.168.1.106', 'ses_legacy_018', NOW()-INTERVAL '8 days'),
  ('usr_it_001',  'Task', 'TASK-1012-IT',  'Overdue',    '{"status":"in_progress"}', '{"status":"overdue","severity":"error","actor_name":"System","actor_role":"system","details":"IT task breached 24-hour SLA"}',                  '192.168.1.1',   'ses_legacy_019', NOW()-INTERVAL '10 days'),
  ('usr_adm_001', 'Task', 'TASK-1012-ADM', 'Overdue',    '{"status":"pending"}', '{"status":"overdue","severity":"error","actor_name":"System","actor_role":"system","details":"Admin task breached SLA deadline"}',              '192.168.1.1',   'ses_legacy_020', NOW()-INTERVAL '5 days'),
  
  ('usr_hr_001',  'Document', 'CASE-2026-1001', 'Generated', '{}', '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Relieving letter generated for Arjun Nair"}',       '192.168.1.101', 'ses_legacy_021', NOW()-INTERVAL '66 days'),
  ('usr_hr_001',  'Document', 'CASE-2026-1001', 'Generated', '{}', '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Experience certificate generated"}',                '192.168.1.101', 'ses_legacy_022', NOW()-INTERVAL '65 days'),
  ('usr_hr_001',  'Document', 'CASE-2026-1002', 'Generated', '{}', '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Relieving letter generated for Divya Reddy"}',      '192.168.1.101', 'ses_legacy_023', NOW()-INTERVAL '51 days'),
  ('usr_emp_001', 'Document', 'CASE-2026-1001', 'Uploaded',  '{}', '{"severity":"info","actor_name":"Arjun Nair","actor_role":"employee","details":"Resignation letter uploaded by employee"}',    '192.168.1.201', 'ses_legacy_024', NOW()-INTERVAL '95 days'),
  ('usr_fin_001', 'Document', 'CASE-2026-1002', 'Uploaded',  '{}', '{"severity":"info","actor_name":"Sunita Rao","actor_role":"Finance","details":"FnF Settlement document uploaded"}',           '192.168.1.106', 'ses_legacy_025', NOW()-INTERVAL '75 days'),
  
  ('usr_it_001',  'Task', 'ASSET-MacBook-001', 'Returned', '{"status":"assigned"}', '{"severity":"info","actor_name":"Kiran Patel","actor_role":"IT","details":"MacBook Pro 16\" returned, condition: Good"}', '192.168.1.105', 'ses_legacy_026', NOW()-INTERVAL '91 days'),
  ('usr_it_001',  'Task', 'ASSET-iPhone-001',  'Returned', '{"status":"assigned"}', '{"severity":"info","actor_name":"Kiran Patel","actor_role":"IT","details":"iPhone 14 Pro returned, condition: Good"}',    '192.168.1.105', 'ses_legacy_027', NOW()-INTERVAL '78 days'),
  ('usr_it_001',  'Task', 'ASSET-MacBook-002', 'Added',    '{}', '{"severity":"info","actor_name":"Kiran Patel","actor_role":"IT","details":"MacBook Air 13\" registered for exit tracking"}','192.168.1.105', 'ses_legacy_028', NOW()-INTERVAL '18 days'),
  
  ('usr_hr_001',  'System', 'usr_emp_001', 'Login',        '{}', '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Successful login from Bengaluru office"}',            '192.168.1.101', 'ses_legacy_029', NOW()-INTERVAL '5 days'),
  ('usr_hr_002',  'System', 'usr_emp_002', 'Login',        '{}', '{"severity":"info","actor_name":"Sengottayan S","actor_role":"HR","details":"Successful login"}',                               '192.168.1.102', 'ses_legacy_030', NOW()-INTERVAL '4 days'),
  ('usr_mgr_001', 'System', 'usr_mgr_001', 'Login',        '{}', '{"severity":"info","actor_name":"Meera Krishnan","actor_role":"manager","details":"Session started from mobile device"}',       '192.168.1.111', 'ses_legacy_031', NOW()-INTERVAL '2 days'),
  (null,          'System', 'unknown@offboardiq.com', 'Failed Login', '{}', '{"severity":"error","actor_name":"Unknown","actor_role":"unknown","details":"Invalid password — 3 failed attempts"}','192.168.99.221','ses_legacy_032', NOW()-INTERVAL '1 day'),
  ('usr_mgr_002', 'System', 'usr_mgr_002', 'Updated',      '{}', '{"severity":"warn","actor_name":"Rahul Mehta","actor_role":"manager","details":"Profile settings updated"}',                   '192.168.1.110', 'ses_legacy_033', NOW()-INTERVAL '6 days'),
  ('usr_it_001',  'System', 'usr_emp_003', 'Updated',      '{}', '{"severity":"warn","actor_name":"Kiran Patel","actor_role":"IT","details":"User access levels modified for exit processing"}',  '192.168.1.105', 'ses_legacy_034', NOW()-INTERVAL '22 days'),
  
  ('usr_hr_001', 'Case',     'CASE-2026-1003', 'Created',  '{}', '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Exit case created for Suresh Pillai"}',            '192.168.1.101', 'ses_a01', NOW()-INTERVAL '70 days'),
  ('usr_hr_001', 'Case',     'CASE-2026-1004', 'Created',  '{}', '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Exit case created for Sita Ram"}',                 '192.168.1.101', 'ses_a02', NOW()-INTERVAL '60 days'),
  ('usr_hr_001', 'Case',     'CASE-2026-1003', 'Completed','{}', '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Case completed — Suresh Pillai exit processed"}',  '192.168.1.101', 'ses_a03', NOW()-INTERVAL '40 days'),
  ('usr_hr_001', 'Case',     'CASE-2026-1004', 'Completed','{}', '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Case completed — Sita Ram exit processed"}',       '192.168.1.101', 'ses_a04', NOW()-INTERVAL '30 days'),
  ('usr_it_001', 'Task',     'TASK-1003-IT',   'Approved', '{}', '{"severity":"info","actor_name":"Kiran Patel","actor_role":"IT","details":"IT clearance done for Suresh Pillai"}',            '192.168.1.105', 'ses_a05', NOW()-INTERVAL '68 days'),
  ('usr_fin_001','Task',     'TASK-1003-FIN',  'Approved', '{}', '{"severity":"info","actor_name":"Sunita Rao","actor_role":"Finance","details":"Finance settlement done for Suresh Pillai"}',  '192.168.1.106', 'ses_a06', NOW()-INTERVAL '66 days'),
  ('usr_it_001', 'Task',     'TASK-1004-IT',   'Approved', '{}', '{"severity":"info","actor_name":"Kiran Patel","actor_role":"IT","details":"IT clearance done for Sita Ram"}',                 '192.168.1.105', 'ses_a07', NOW()-INTERVAL '58 days'),
  ('usr_hr_001', 'Document', 'CASE-2026-1003', 'Generated','{}', '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Relieving letter generated for Suresh Pillai"}',   '192.168.1.101', 'ses_a08', NOW()-INTERVAL '41 days'),
  ('usr_hr_001', 'Document', 'CASE-2026-1004', 'Generated','{}', '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Experience certificate generated for Sita Ram"}',   '192.168.1.101', 'ses_a09', NOW()-INTERVAL '31 days'),
  ('usr_hr_001', 'Case',     'CASE-2026-1007', 'Created',  '{}', '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Exit case created for Arun Menon"}',               '192.168.1.101', 'ses_a10', NOW()-INTERVAL '12 days'),
  ('usr_hr_001', 'Case',     'CASE-2026-1008', 'Created',  '{}', '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Exit case created for Kavya Iyer"}',               '192.168.1.101', 'ses_a11', NOW()-INTERVAL '8 days'),
  ('usr_hr_001', 'Case',     'CASE-2026-1011', 'Created',  '{}', '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Exit case created for Ananya Bose"}',              '192.168.1.101', 'ses_a12', NOW()),
  ('usr_sec_001','Task',     'TASK-1005-SEC',  'Approved', '{}', '{"severity":"info","actor_name":"InfoSec Lead","actor_role":"InfoSec","details":"All credentials and VPN revoked"}',           '192.168.1.120', 'ses_a13', NOW()-INTERVAL '24 days'),
  ('usr_adm_001','Task',     'TASK-1005-ADM',  'Approved', '{}', '{"severity":"info","actor_name":"Admin Dept","actor_role":"Administration","details":"ID card, keys, and swipe card returned"}','192.168.1.115','ses_a14', NOW()-INTERVAL '20 days'),
  ('usr_mgr_001','Case',     'CASE-2026-1006', 'Approved', '{}', '{"severity":"info","actor_name":"Meera Krishnan","actor_role":"manager","details":"Manager approved Priya Sharma resignation"}','192.168.1.111','ses_a15', NOW()-INTERVAL '15 days'),
  ('usr_mgr_001','Case',     'CASE-2026-1007', 'Approved', '{}', '{"severity":"info","actor_name":"Meera Krishnan","actor_role":"manager","details":"Manager approved Arun Menon resignation"}', '192.168.1.111', 'ses_a16', NOW()-INTERVAL '9 days'),
  ('usr_mgr_002','Case',     'CASE-2026-1008', 'Approved', '{}', '{"severity":"info","actor_name":"Rahul Mehta","actor_role":"manager","details":"Manager approved Kavya Iyer resignation"}',   '192.168.1.110', 'ses_a17', NOW()-INTERVAL '5 days'),
  ('usr_hr_001', 'System',     'usr_emp_005',    'Updated',  '{}', '{"severity":"warn","actor_name":"Anita Desai","actor_role":"HR","details":"Employee profile updated for exit processing"}',   '192.168.1.101', 'ses_a18', NOW()-INTERVAL '3 days'),
  ('usr_hr_001', 'System',     'usr_emp_006',    'Updated',  '{}', '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Employee Rohan Kapoor marked for exit"}',          '192.168.1.101', 'ses_a19', NOW()-INTERVAL '1 day'),
  ('usr_hr_001', 'Task',     'TASK-1006-MGR',  'Approved', '{}', '{"severity":"info","actor_name":"Meera Krishnan","actor_role":"manager","details":"Manager clearance done for Priya Sharma"}','192.168.1.111', 'ses_a20', NOW()-INTERVAL '15 days'),
  (null,         'System',     'hacker@external.com','Failed Login','{}','{"severity":"error","actor_name":"Unknown","actor_role":"unknown","details":"Brute force attempt detected — IP blocked"}','203.45.67.89',  'ses_a21', NOW()-INTERVAL '45 days'),
  ('usr_it_001', 'Task',     'TASK-1006-IT',   'Approved', '{}', '{"severity":"info","actor_name":"Kiran Patel","actor_role":"IT","details":"IT assets collected from Priya Sharma"}',          '192.168.1.105', 'ses_a22', NOW()-INTERVAL '5 days'),
  ('usr_fin_001','Document', 'CASE-2026-1005', 'Uploaded', '{}', '{"severity":"info","actor_name":"Sunita Rao","actor_role":"Finance","details":"Pending expense report uploaded for review"}',  '192.168.1.106', 'ses_a23', NOW()-INTERVAL '12 days'),
  ('usr_hr_002', 'Case',     'CASE-2026-1009', 'Updated',  '{}', '{"severity":"info","actor_name":"Sengottayan S","actor_role":"HR","details":"Case notes updated for Neha Gupta exit"}',       '192.168.1.102', 'ses_a24', NOW()-INTERVAL '2 days')
) AS t(actor_user_id, entity_type, entity_id, action, old_value_json, new_value_json, ip_address, session_id, created_at),
LATERAL (SELECT t.old_value_json::jsonb AS old_value, t.new_value_json::jsonb AS new_value) vals;


-- ── 15. POST-PROCESS TENANT IDENTIFIER MAPPING ──────────────────────────────
-- If the user has created an organization via Clerk (e.g., ROR Technologies),
-- this block dynamically finds it and updates all legacy '00000000-0000-0000-0000-000000000000'
-- organization IDs to that target ID so seeded records appear in the logged-in user's panel.
DO $$
DECLARE
    v_target_org_id UUID;
BEGIN
    SELECT id INTO v_target_org_id 
    FROM organizations 
    WHERE id != '00000000-0000-0000-0000-000000000000' 
    LIMIT 1;

    IF v_target_org_id IS NOT NULL THEN
        RAISE NOTICE 'Updating seeded synthetic data to use active tenant organization ID: %', v_target_org_id;

        UPDATE organization_members 
        SET organization_id = v_target_org_id 
        WHERE organization_id = '00000000-0000-0000-0000-000000000000';

        IF to_regclass('reporting_relationships') IS NOT NULL THEN
            UPDATE reporting_relationships 
            SET organization_id = v_target_org_id 
            WHERE organization_id = '00000000-0000-0000-0000-000000000000';
        END IF;

        IF to_regclass('legacy_exit_cases') IS NOT NULL THEN
            UPDATE legacy_exit_cases 
            SET organization_id = v_target_org_id 
            WHERE organization_id = '00000000-0000-0000-0000-000000000000';
        END IF;

        IF to_regclass('legacy_clearance_tasks') IS NOT NULL THEN
            UPDATE legacy_clearance_tasks 
            SET organization_id = v_target_org_id 
            WHERE organization_id = '00000000-0000-0000-0000-000000000000';
        END IF;

        IF to_regclass('timeline_events') IS NOT NULL THEN
            UPDATE timeline_events 
            SET organization_id = v_target_org_id 
            WHERE organization_id = '00000000-0000-0000-0000-000000000000';
        END IF;

        IF to_regclass('legacy_case_comments') IS NOT NULL THEN
            UPDATE legacy_case_comments 
            SET organization_id = v_target_org_id 
            WHERE organization_id = '00000000-0000-0000-0000-000000000000';
        END IF;

        IF to_regclass('legacy_audit_logs') IS NOT NULL THEN
            UPDATE legacy_audit_logs 
            SET organization_id = v_target_org_id 
            WHERE organization_id = '00000000-0000-0000-0000-000000000000';
        END IF;

        IF to_regclass('org_audit_logs') IS NOT NULL THEN
            UPDATE org_audit_logs 
            SET organization_id = v_target_org_id 
            WHERE organization_id = '00000000-0000-0000-0000-000000000000';
        END IF;
    END IF;
END $$;

COMMIT;
