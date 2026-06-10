-- ============================================================================
-- Exit-Clearance: Comprehensive Synthetic Data Seed
-- Migration: 00014_synthetic_hr_seed_data.sql
--
-- Populates ALL HR section tables with realistic synthetic data:
--   users, exit_cases (legacy_exit_cases), clearance_tasks (legacy_clearance_tasks),
--   timeline_events, case_comments, exit_interviews, audit_logs (legacy_audit_logs),
--   org_audit_logs (for Audit Trail page)
--
-- Strategy: Insert into the LEGACY tables (which are now the real data tables,
-- exposed via backward-compat views: exit_cases → legacy_exit_cases, etc.)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. USERS (employees, managers, HR, dept approvers)
-- ============================================================================

INSERT INTO users (id, email, role, name, dept, employee_id, created_at) VALUES
  -- Employees
  ('usr_emp_001', 'arjun.nair@offboardiq.com',        'employee',      'Arjun Nair',        'Engineering',    'EMP-1001', NOW() - INTERVAL '2 years'),
  ('usr_emp_002', 'divya.reddy@offboardiq.com',       'employee',      'Divya Reddy',       'Finance',        'EMP-1002', NOW() - INTERVAL '18 months'),
  ('usr_emp_003', 'vikram.singh@offboardiq.com',      'employee',      'Vikram Singh',      'Product',        'EMP-1003', NOW() - INTERVAL '14 months'),
  ('usr_emp_004', 'priya.sharma@offboardiq.com',      'employee',      'Priya Sharma',      'Engineering',    'EMP-1004', NOW() - INTERVAL '22 months'),
  ('usr_emp_005', 'neha.gupta@offboardiq.com',        'employee',      'Neha Gupta',        'Marketing',      'EMP-1005', NOW() - INTERVAL '10 months'),
  ('usr_emp_006', 'rohan.kapoor@offboardiq.com',      'employee',      'Rohan Kapoor',      'Sales',          'EMP-1006', NOW() - INTERVAL '8 months'),
  ('usr_emp_007', 'sita.ram@offboardiq.com',          'employee',      'Sita Ram',          'Operations',     'EMP-1007', NOW() - INTERVAL '30 months'),
  ('usr_emp_008', 'arun.menon@offboardiq.com',        'employee',      'Arun Menon',        'Engineering',    'EMP-1008', NOW() - INTERVAL '16 months'),
  ('usr_emp_009', 'kavya.iyer@offboardiq.com',        'employee',      'Kavya Iyer',        'Design',         'EMP-1009', NOW() - INTERVAL '12 months'),
  ('usr_emp_010', 'suresh.pillai@offboardiq.com',     'employee',      'Suresh Pillai',     'Finance',        'EMP-1010', NOW() - INTERVAL '20 months'),
  ('usr_emp_011', 'ananya.bose@offboardiq.com',       'employee',      'Ananya Bose',       'Product',        'EMP-1011', NOW() - INTERVAL '9 months'),
  ('usr_emp_012', 'ravi.chandra@offboardiq.com',      'employee',      'Ravi Chandra',      'Sales',          'EMP-1012', NOW() - INTERVAL '11 months'),
  -- Managers
  ('usr_mgr_001', 'meera.krishnan@offboardiq.com',    'manager',       'Meera Krishnan',    'Engineering',    'MGR-2001', NOW() - INTERVAL '3 years'),
  ('usr_mgr_002', 'rahul.mehta@offboardiq.com',       'manager',       'Rahul Mehta',       'Product',        'MGR-2002', NOW() - INTERVAL '2 years'),
  ('usr_mgr_003', 'sunita.iyer@offboardiq.com',       'manager',       'Sunita Iyer',       'Finance',        'MGR-2003', NOW() - INTERVAL '4 years'),
  -- HR
  ('usr_hr_001',  'anita.desai@offboardiq.com',       'hr',            'Anita Desai',       'HR',             'HR-3001',  NOW() - INTERVAL '2 years'),
  ('usr_hr_002',  'sengottayan.s@offboardiq.com',     'hr',            'Sengottayan S',     'HR',             'HR-3002',  NOW() - INTERVAL '1 year'),
  -- Department Approvers
  ('usr_it_001',  'kiran.patel@offboardiq.com',       'dept_approver', 'Kiran Patel',       'IT',             'IT-4001',  NOW() - INTERVAL '2 years'),
  ('usr_fin_001', 'sunita.rao@offboardiq.com',        'dept_approver', 'Sunita Rao',        'Finance',        'FIN-4002', NOW() - INTERVAL '18 months'),
  ('usr_adm_001', 'admin.dept@offboardiq.com',        'dept_approver', 'Admin Dept',        'Administration', 'ADM-4003', NOW() - INTERVAL '2 years'),
  ('usr_pro_001', 'procurement.mgr@offboardiq.com',   'dept_approver', 'Procurement Mgr',   'Procurement',    'PRO-4004', NOW() - INTERVAL '1 year'),
  ('usr_sec_001', 'infosec.lead@offboardiq.com',      'dept_approver', 'InfoSec Lead',       'Info Security',  'SEC-4005', NOW() - INTERVAL '2 years'),
  ('usr_fac_001', 'facilities.mgr@offboardiq.com',    'dept_approver', 'Facilities Mgr',    'Facilities',     'FAC-4006', NOW() - INTERVAL '1 year')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. EXIT CASES (into legacy_exit_cases, exposed as exit_cases view)
-- Spread across last 12 months with varied statuses
-- ============================================================================

INSERT INTO legacy_exit_cases (
  id, employee_id, employee_name, employee_email, employee_role, employee_dept,
  manager_id, manager_name, status, resignation_date, last_working_day,
  notice_period_days, exit_reason, escalated, tags, created_at, updated_at
) VALUES

-- ── COMPLETED cases (older) ────────────────────────────────────────────────
('CASE-2026-1001', 'usr_emp_001', 'Arjun Nair',    'arjun.nair@offboardiq.com',    'Software Engineer', 'Engineering',
  'usr_mgr_001', 'Meera Krishnan', 'completed',
  NOW() - INTERVAL '95 days', NOW() - INTERVAL '65 days', 30,
  'better_opportunity', false, ARRAY['standard'], NOW() - INTERVAL '95 days', NOW() - INTERVAL '65 days'),

('CASE-2026-1002', 'usr_emp_002', 'Divya Reddy',   'divya.reddy@offboardiq.com',   'Finance Analyst', 'Finance',
  'usr_mgr_003', 'Sunita Iyer', 'completed',
  NOW() - INTERVAL '80 days', NOW() - INTERVAL '50 days', 30,
  'compensation', false, ARRAY['standard'], NOW() - INTERVAL '80 days', NOW() - INTERVAL '50 days'),

('CASE-2026-1003', 'usr_emp_010', 'Suresh Pillai', 'suresh.pillai@offboardiq.com', 'Senior Analyst', 'Finance',
  'usr_mgr_003', 'Sunita Iyer', 'completed',
  NOW() - INTERVAL '70 days', NOW() - INTERVAL '40 days', 30,
  'relocation', false, ARRAY['standard'], NOW() - INTERVAL '70 days', NOW() - INTERVAL '40 days'),

('CASE-2026-1004', 'usr_emp_007', 'Sita Ram',      'sita.ram@offboardiq.com',      'Operations Lead', 'Operations',
  'usr_mgr_001', 'Meera Krishnan', 'completed',
  NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days', 30,
  'higher_studies', false, ARRAY['standard'], NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days'),

-- ── IN_CLEARANCE cases (active, mid-progress) ─────────────────────────────
('CASE-2026-1005', 'usr_emp_003', 'Vikram Singh',  'vikram.singh@offboardiq.com',  'Product Manager', 'Product',
  'usr_mgr_002', 'Rahul Mehta', 'in_clearance',
  NOW() - INTERVAL '25 days', NOW() + INTERVAL '5 days', 30,
  'better_opportunity', false, ARRAY['standard'], NOW() - INTERVAL '25 days', NOW() - INTERVAL '5 days'),

('CASE-2026-1006', 'usr_emp_004', 'Priya Sharma',  'priya.sharma@offboardiq.com',  'Senior Engineer', 'Engineering',
  'usr_mgr_001', 'Meera Krishnan', 'in_clearance',
  NOW() - INTERVAL '18 days', NOW() + INTERVAL '12 days', 30,
  'personal', false, ARRAY['standard'], NOW() - INTERVAL '18 days', NOW() - INTERVAL '2 days'),

('CASE-2026-1007', 'usr_emp_008', 'Arun Menon',    'arun.menon@offboardiq.com',    'Backend Engineer', 'Engineering',
  'usr_mgr_001', 'Meera Krishnan', 'in_clearance',
  NOW() - INTERVAL '12 days', NOW() + INTERVAL '18 days', 30,
  'compensation', false, ARRAY['standard'], NOW() - INTERVAL '12 days', NOW() - INTERVAL '1 day'),

('CASE-2026-1008', 'usr_emp_009', 'Kavya Iyer',    'kavya.iyer@offboardiq.com',    'UI/UX Designer', 'Design',
  'usr_mgr_002', 'Rahul Mehta', 'in_clearance',
  NOW() - INTERVAL '8 days', NOW() + INTERVAL '22 days', 30,
  'better_opportunity', false, ARRAY['standard'], NOW() - INTERVAL '8 days', NOW()),

-- ── PENDING_MANAGER cases (just submitted) ────────────────────────────────
('CASE-2026-1009', 'usr_emp_005', 'Neha Gupta',    'neha.gupta@offboardiq.com',    'Marketing Executive', 'Marketing',
  'usr_mgr_001', 'Meera Krishnan', 'pending_manager',
  NOW() - INTERVAL '3 days',  NOW() + INTERVAL '27 days', 30,
  'work_environment', false, ARRAY['standard'], NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),

('CASE-2026-1010', 'usr_emp_006', 'Rohan Kapoor',  'rohan.kapoor@offboardiq.com',  'Sales Executive', 'Sales',
  'usr_mgr_002', 'Rahul Mehta', 'pending_manager',
  NOW() - INTERVAL '1 day',   NOW() + INTERVAL '29 days', 30,
  'better_opportunity', false, ARRAY['standard'], NOW() - INTERVAL '1 day', NOW()),

('CASE-2026-1011', 'usr_emp_011', 'Ananya Bose',   'ananya.bose@offboardiq.com',   'Product Analyst', 'Product',
  'usr_mgr_002', 'Rahul Mehta', 'pending_manager',
  NOW(),                        NOW() + INTERVAL '30 days', 30,
  'higher_studies', false, ARRAY['standard'], NOW(), NOW()),

-- ── ESCALATED case ────────────────────────────────────────────────────────
('CASE-2026-1012', 'usr_emp_012', 'Ravi Chandra',  'ravi.chandra@offboardiq.com',  'Sales Manager', 'Sales',
  'usr_mgr_002', 'Rahul Mehta', 'in_clearance',
  NOW() - INTERVAL '35 days', NOW() - INTERVAL '5 days', 30,
  'compensation', true, ARRAY['escalated', 'sla_breach'], NOW() - INTERVAL '35 days', NOW() - INTERVAL '2 days')

ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. CLEARANCE TASKS (into legacy_clearance_tasks → clearance_tasks view)
-- ============================================================================

-- Helper: generate tasks for CASE-2026-1001 (completed)
INSERT INTO legacy_clearance_tasks (
  id, case_id, dept_id, dept_label, assignee_id, assignee_name,
  status, sla_hours, sla_due_at, started_at, completed_at, notes, created_at, updated_at
) VALUES
-- CASE-2026-1001 tasks (all approved/completed)
('TASK-1001-MGR', 'CASE-2026-1001', 'manager',     'Manager Clearance', 'usr_mgr_001', 'Meera Krishnan', 'approved', 48, NOW()-INTERVAL '93 days', NOW()-INTERVAL '94 days', NOW()-INTERVAL '92 days', 'All KT sessions done',            NOW()-INTERVAL '95 days', NOW()-INTERVAL '92 days'),
('TASK-1001-IT',  'CASE-2026-1001', 'it',          'IT',                'usr_it_001',  'Kiran Patel',    'approved', 24, NOW()-INTERVAL '93 days', NOW()-INTERVAL '93 days', NOW()-INTERVAL '91 days', 'Laptop returned, accounts closed', NOW()-INTERVAL '95 days', NOW()-INTERVAL '91 days'),
('TASK-1001-FIN', 'CASE-2026-1001', 'finance',     'Finance',           'usr_fin_001', 'Sunita Rao',     'approved', 48, NOW()-INTERVAL '91 days', NOW()-INTERVAL '91 days', NOW()-INTERVAL '89 days', 'FnF settled: ₹1,24,500',          NOW()-INTERVAL '95 days', NOW()-INTERVAL '89 days'),
('TASK-1001-ADM', 'CASE-2026-1001', 'admin',       'Administration',    'usr_adm_001', 'Admin Dept',     'approved', 24, NOW()-INTERVAL '92 days', NOW()-INTERVAL '92 days', NOW()-INTERVAL '90 days', 'ID card and keys returned',        NOW()-INTERVAL '95 days', NOW()-INTERVAL '90 days'),
('TASK-1001-SEC', 'CASE-2026-1001', 'infosec',     'Info Security',     'usr_sec_001', 'InfoSec Lead',   'approved', 24, NOW()-INTERVAL '93 days', NOW()-INTERVAL '93 days', NOW()-INTERVAL '91 days', 'All access revoked',               NOW()-INTERVAL '95 days', NOW()-INTERVAL '91 days'),
('TASK-1001-HR',  'CASE-2026-1001', 'hr',          'HR',                'usr_hr_001',  'Anita Desai',    'approved', 72, NOW()-INTERVAL '89 days', NOW()-INTERVAL '89 days', NOW()-INTERVAL '66 days', 'Exit interview completed',         NOW()-INTERVAL '95 days', NOW()-INTERVAL '66 days'),

-- CASE-2026-1002 tasks (all approved/completed)
('TASK-1002-MGR', 'CASE-2026-1002', 'manager',     'Manager Clearance', 'usr_mgr_003', 'Sunita Iyer',    'approved', 48, NOW()-INTERVAL '78 days', NOW()-INTERVAL '79 days', NOW()-INTERVAL '77 days', 'Handover complete',                NOW()-INTERVAL '80 days', NOW()-INTERVAL '77 days'),
('TASK-1002-IT',  'CASE-2026-1002', 'it',          'IT',                'usr_it_001',  'Kiran Patel',    'approved', 24, NOW()-INTERVAL '79 days', NOW()-INTERVAL '79 days', NOW()-INTERVAL '78 days', 'MacBook Pro returned',             NOW()-INTERVAL '80 days', NOW()-INTERVAL '78 days'),
('TASK-1002-FIN', 'CASE-2026-1002', 'finance',     'Finance',           'usr_fin_001', 'Sunita Rao',     'approved', 48, NOW()-INTERVAL '77 days', NOW()-INTERVAL '77 days', NOW()-INTERVAL '75 days', 'Final settlement processed',       NOW()-INTERVAL '80 days', NOW()-INTERVAL '75 days'),
('TASK-1002-ADM', 'CASE-2026-1002', 'admin',       'Administration',    'usr_adm_001', 'Admin Dept',     'approved', 24, NOW()-INTERVAL '79 days', NOW()-INTERVAL '79 days', NOW()-INTERVAL '77 days', 'Desk cleared',                     NOW()-INTERVAL '80 days', NOW()-INTERVAL '77 days'),
('TASK-1002-SEC', 'CASE-2026-1002', 'infosec',     'Info Security',     'usr_sec_001', 'InfoSec Lead',   'approved', 24, NOW()-INTERVAL '79 days', NOW()-INTERVAL '79 days', NOW()-INTERVAL '78 days', 'Access decommissioned',            NOW()-INTERVAL '80 days', NOW()-INTERVAL '78 days'),
('TASK-1002-HR',  'CASE-2026-1002', 'hr',          'HR',                'usr_hr_001',  'Anita Desai',    'approved', 72, NOW()-INTERVAL '75 days', NOW()-INTERVAL '75 days', NOW()-INTERVAL '51 days', 'Relieving letter issued',          NOW()-INTERVAL '80 days', NOW()-INTERVAL '51 days'),

-- CASE-2026-1005 tasks (in_clearance, partially approved)
('TASK-1005-MGR', 'CASE-2026-1005', 'manager',     'Manager Clearance', 'usr_mgr_002', 'Rahul Mehta',    'approved', 48, NOW()-INTERVAL '23 days', NOW()-INTERVAL '24 days', NOW()-INTERVAL '22 days', 'KT complete, projects handed over',NOW()-INTERVAL '25 days', NOW()-INTERVAL '22 days'),
('TASK-1005-IT',  'CASE-2026-1005', 'it',          'IT',                'usr_it_001',  'Kiran Patel',    'approved', 24, NOW()-INTERVAL '24 days', NOW()-INTERVAL '24 days', NOW()-INTERVAL '23 days', 'Laptop returned',                  NOW()-INTERVAL '25 days', NOW()-INTERVAL '23 days'),
('TASK-1005-FIN', 'CASE-2026-1005', 'finance',     'Finance',           'usr_fin_001', 'Sunita Rao',     'in_progress', 48, NOW()-INTERVAL '22 days', NOW()-INTERVAL '10 days', null, null,                               NOW()-INTERVAL '25 days', NOW()-INTERVAL '10 days'),
('TASK-1005-ADM', 'CASE-2026-1005', 'admin',       'Administration',    'usr_adm_001', 'Admin Dept',     'pending',  24, NOW()-INTERVAL '23 days', null, null, null,                                                      NOW()-INTERVAL '25 days', NOW()-INTERVAL '25 days'),
('TASK-1005-SEC', 'CASE-2026-1005', 'infosec',     'Info Security',     'usr_sec_001', 'InfoSec Lead',   'approved', 24, NOW()-INTERVAL '24 days', NOW()-INTERVAL '24 days', NOW()-INTERVAL '23 days', 'All credentials deactivated',      NOW()-INTERVAL '25 days', NOW()-INTERVAL '23 days'),
('TASK-1005-HR',  'CASE-2026-1005', 'hr',          'HR',                'usr_hr_001',  'Anita Desai',    'pending',  72, NOW()-INTERVAL '21 days', null, null, null,                                                      NOW()-INTERVAL '25 days', NOW()-INTERVAL '25 days'),

-- CASE-2026-1006 tasks (in_clearance)
('TASK-1006-MGR', 'CASE-2026-1006', 'manager',     'Manager Clearance', 'usr_mgr_001', 'Meera Krishnan', 'approved', 48, NOW()-INTERVAL '16 days', NOW()-INTERVAL '17 days', NOW()-INTERVAL '15 days', 'KT done',                          NOW()-INTERVAL '18 days', NOW()-INTERVAL '15 days'),
('TASK-1006-IT',  'CASE-2026-1006', 'it',          'IT',                'usr_it_001',  'Kiran Patel',    'in_progress', 24, NOW()-INTERVAL '16 days', NOW()-INTERVAL '5 days', null, null,                               NOW()-INTERVAL '18 days', NOW()-INTERVAL '5 days'),
('TASK-1006-FIN', 'CASE-2026-1006', 'finance',     'Finance',           'usr_fin_001', 'Sunita Rao',     'pending',  48, NOW()-INTERVAL '14 days', null, null, null,                                                      NOW()-INTERVAL '18 days', NOW()-INTERVAL '18 days'),
('TASK-1006-ADM', 'CASE-2026-1006', 'admin',       'Administration',    'usr_adm_001', 'Admin Dept',     'pending',  24, NOW()-INTERVAL '16 days', null, null, null,                                                      NOW()-INTERVAL '18 days', NOW()-INTERVAL '18 days'),
('TASK-1006-SEC', 'CASE-2026-1006', 'infosec',     'Info Security',     'usr_sec_001', 'InfoSec Lead',   'pending',  24, NOW()-INTERVAL '16 days', null, null, null,                                                      NOW()-INTERVAL '18 days', NOW()-INTERVAL '18 days'),
('TASK-1006-HR',  'CASE-2026-1006', 'hr',          'HR',                'usr_hr_001',  'Anita Desai',    'pending',  72, NOW()-INTERVAL '12 days', null, null, null,                                                      NOW()-INTERVAL '18 days', NOW()-INTERVAL '18 days'),

-- CASE-2026-1007 tasks
('TASK-1007-MGR', 'CASE-2026-1007', 'manager',     'Manager Clearance', 'usr_mgr_001', 'Meera Krishnan', 'approved', 48, NOW()-INTERVAL '10 days', NOW()-INTERVAL '11 days', NOW()-INTERVAL '9 days', 'Projects handed over',             NOW()-INTERVAL '12 days', NOW()-INTERVAL '9 days'),
('TASK-1007-IT',  'CASE-2026-1007', 'it',          'IT',                'usr_it_001',  'Kiran Patel',    'pending',  24, NOW()-INTERVAL '10 days', null, null, null,                                                      NOW()-INTERVAL '12 days', NOW()-INTERVAL '12 days'),
('TASK-1007-FIN', 'CASE-2026-1007', 'finance',     'Finance',           'usr_fin_001', 'Sunita Rao',     'pending',  48, NOW()-INTERVAL '8 days',  null, null, null,                                                      NOW()-INTERVAL '12 days', NOW()-INTERVAL '12 days'),
('TASK-1007-ADM', 'CASE-2026-1007', 'admin',       'Administration',    'usr_adm_001', 'Admin Dept',     'pending',  24, NOW()-INTERVAL '10 days', null, null, null,                                                      NOW()-INTERVAL '12 days', NOW()-INTERVAL '12 days'),
('TASK-1007-SEC', 'CASE-2026-1007', 'infosec',     'Info Security',     'usr_sec_001', 'InfoSec Lead',   'pending',  24, NOW()-INTERVAL '10 days', null, null, null,                                                      NOW()-INTERVAL '12 days', NOW()-INTERVAL '12 days'),
('TASK-1007-HR',  'CASE-2026-1007', 'hr',          'HR',                'usr_hr_001',  'Anita Desai',    'pending',  72, NOW()-INTERVAL '6 days',  null, null, null,                                                      NOW()-INTERVAL '12 days', NOW()-INTERVAL '12 days'),

-- CASE-2026-1012 tasks (ESCALATED / SLA-breached)
('TASK-1012-MGR', 'CASE-2026-1012', 'manager',     'Manager Clearance', 'usr_mgr_002', 'Rahul Mehta',    'approved', 48, NOW()-INTERVAL '33 days', NOW()-INTERVAL '34 days', NOW()-INTERVAL '32 days', 'Approved after reminder',          NOW()-INTERVAL '35 days', NOW()-INTERVAL '32 days'),
('TASK-1012-IT',  'CASE-2026-1012', 'it',          'IT',                'usr_it_001',  'Kiran Patel',    'overdue',  24, NOW()-INTERVAL '10 days', NOW()-INTERVAL '20 days', null, null,                                  NOW()-INTERVAL '35 days', NOW()-INTERVAL '20 days'),
('TASK-1012-FIN', 'CASE-2026-1012', 'finance',     'Finance',           'usr_fin_001', 'Sunita Rao',     'rejected', 48, NOW()-INTERVAL '8 days',  NOW()-INTERVAL '15 days', NOW()-INTERVAL '8 days',  'Pending loan recovery',            NOW()-INTERVAL '35 days', NOW()-INTERVAL '8 days'),
('TASK-1012-ADM', 'CASE-2026-1012', 'admin',       'Administration',    'usr_adm_001', 'Admin Dept',     'overdue',  24, NOW()-INTERVAL '5 days',  null, null, null,                                                      NOW()-INTERVAL '35 days', NOW()-INTERVAL '35 days'),
('TASK-1012-SEC', 'CASE-2026-1012', 'infosec',     'Info Security',     'usr_sec_001', 'InfoSec Lead',   'overdue',  24, NOW()-INTERVAL '6 days',  null, null, null,                                                      NOW()-INTERVAL '35 days', NOW()-INTERVAL '35 days'),
('TASK-1012-HR',  'CASE-2026-1012', 'hr',          'HR',                'usr_hr_001',  'Anita Desai',    'pending',  72, NOW()-INTERVAL '3 days',  null, null, null,                                                      NOW()-INTERVAL '35 days', NOW()-INTERVAL '35 days')

ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. TIMELINE EVENTS
-- ============================================================================

INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role, is_pending, created_at)
SELECT * FROM (VALUES

-- CASE-2026-1001
('TL-1001-1', 'CASE-2026-1001', 'Resignation submitted by employee',         NOW()-INTERVAL '95 days', 'Arjun Nair',     'employee',  false, NOW()-INTERVAL '95 days'),
('TL-1001-2', 'CASE-2026-1001', 'Exit case created by HR',                   NOW()-INTERVAL '94 days', 'Anita Desai',    'hr',        false, NOW()-INTERVAL '94 days'),
('TL-1001-3', 'CASE-2026-1001', 'Manager approved resignation',              NOW()-INTERVAL '92 days', 'Meera Krishnan', 'manager',   false, NOW()-INTERVAL '92 days'),
('TL-1001-4', 'CASE-2026-1001', 'IT clearance approved',                     NOW()-INTERVAL '91 days', 'Kiran Patel',    'dept_approver', false, NOW()-INTERVAL '91 days'),
('TL-1001-5', 'CASE-2026-1001', 'Finance settlement cleared',                NOW()-INTERVAL '89 days', 'Sunita Rao',     'dept_approver', false, NOW()-INTERVAL '89 days'),
('TL-1001-6', 'CASE-2026-1001', 'Exit interview completed',                  NOW()-INTERVAL '68 days', 'Anita Desai',    'hr',        false, NOW()-INTERVAL '68 days'),
('TL-1001-7', 'CASE-2026-1001', 'Relieving letter generated',                NOW()-INTERVAL '66 days', 'Anita Desai',    'hr',        false, NOW()-INTERVAL '66 days'),
('TL-1001-8', 'CASE-2026-1001', 'Exit case completed',                       NOW()-INTERVAL '65 days', 'System',         'system',    false, NOW()-INTERVAL '65 days'),

-- CASE-2026-1005
('TL-1005-1', 'CASE-2026-1005', 'Resignation submitted by employee',         NOW()-INTERVAL '25 days', 'Vikram Singh',   'employee',  false, NOW()-INTERVAL '25 days'),
('TL-1005-2', 'CASE-2026-1005', 'Exit case created by HR',                   NOW()-INTERVAL '24 days', 'Anita Desai',    'hr',        false, NOW()-INTERVAL '24 days'),
('TL-1005-3', 'CASE-2026-1005', 'Manager approved resignation',              NOW()-INTERVAL '22 days', 'Rahul Mehta',    'manager',   false, NOW()-INTERVAL '22 days'),
('TL-1005-4', 'CASE-2026-1005', 'Clearance workflow initiated',              NOW()-INTERVAL '22 days', 'System',         'system',    false, NOW()-INTERVAL '22 days'),
('TL-1005-5', 'CASE-2026-1005', 'IT clearance approved',                     NOW()-INTERVAL '23 days', 'Kiran Patel',    'dept_approver', false, NOW()-INTERVAL '23 days'),
('TL-1005-6', 'CASE-2026-1005', 'Finance settlement in progress',            NOW()-INTERVAL '10 days', 'Sunita Rao',     'dept_approver', false, NOW()-INTERVAL '10 days'),

-- CASE-2026-1012 (escalated)
('TL-1012-1', 'CASE-2026-1012', 'Resignation submitted by employee',         NOW()-INTERVAL '35 days', 'Ravi Chandra',   'employee',  false, NOW()-INTERVAL '35 days'),
('TL-1012-2', 'CASE-2026-1012', 'Exit case created by HR',                   NOW()-INTERVAL '34 days', 'Anita Desai',    'hr',        false, NOW()-INTERVAL '34 days'),
('TL-1012-3', 'CASE-2026-1012', 'Manager approved resignation',              NOW()-INTERVAL '32 days', 'Rahul Mehta',    'manager',   false, NOW()-INTERVAL '32 days'),
('TL-1012-4', 'CASE-2026-1012', 'Case escalated due to SLA breach',          NOW()-INTERVAL '10 days', 'System',         'system',    false, NOW()-INTERVAL '10 days'),
('TL-1012-5', 'CASE-2026-1012', 'Finance task rejected — loan pending',      NOW()-INTERVAL '8 days',  'Sunita Rao',     'dept_approver', false, NOW()-INTERVAL '8 days')

) AS t(id, case_id, label, timestamp, actor, actor_role, is_pending, created_at)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. CASE COMMENTS
-- ============================================================================

INSERT INTO legacy_case_comments (id, case_id, author_id, author_name, author_role, message, visibility, timestamp, created_at)
SELECT gen_random_uuid()::text, case_id, author_id, author_name, author_role, message, visibility::comment_visibility, timestamp, created_at FROM (VALUES

('CASE-2026-1005', 'usr_hr_001', 'Anita Desai', 'hr',
  'Finance team — please expedite the FnF calculation. Last working day is in 5 days.',
  'internal', NOW()-INTERVAL '8 days', NOW()-INTERVAL '8 days'),

('CASE-2026-1005', 'usr_fin_001', 'Sunita Rao', 'dept_approver',
  'On it. Loan recovery confirmation pending from accounts. Will update by EOD.',
  'all', NOW()-INTERVAL '7 days', NOW()-INTERVAL '7 days'),

('CASE-2026-1006', 'usr_hr_001', 'Anita Desai', 'hr',
  'Please note: Priya has requested early release. Kindly prioritise her clearance tasks.',
  'internal', NOW()-INTERVAL '15 days', NOW()-INTERVAL '15 days'),

('CASE-2026-1012', 'usr_hr_001', 'Anita Desai', 'hr',
  'This case has been escalated. SLA breached on IT, Admin, and InfoSec tasks. Immediate action required.',
  'internal', NOW()-INTERVAL '9 days', NOW()-INTERVAL '9 days'),

('CASE-2026-1012', 'usr_mgr_002', 'Rahul Mehta', 'manager',
  'I have reminded the IT and admin teams. They are working on it.',
  'all', NOW()-INTERVAL '8 days', NOW()-INTERVAL '8 days'),

('CASE-2026-1012', 'usr_fin_001', 'Sunita Rao', 'dept_approver',
  'Finance task rejected — Ravi has an outstanding loan of ₹35,000. Settlement required before final clearance.',
  'all', NOW()-INTERVAL '8 days', NOW()-INTERVAL '8 days')

) AS t(case_id, author_id, author_name, author_role, message, visibility, timestamp, created_at);

-- ============================================================================
-- 6. EXIT INTERVIEWS (for completed cases)
-- ============================================================================

INSERT INTO legacy_exit_interviews (id, case_id, overall_rating, management_rating, culture_rating, reason, improvements, would_rejoin, comments, completed_at, created_at)
VALUES
  (gen_random_uuid()::text, 'CASE-2026-1001', 4, 4, 3,
   'Received a senior engineer role with 40% salary hike at a startup.',
   'Better career growth paths and more competitive compensation packages would help retention.',
   true,
   'I enjoyed working here. The team is great but I needed faster career progression.',
   NOW()-INTERVAL '68 days', NOW()-INTERVAL '68 days'),

  (gen_random_uuid()::text, 'CASE-2026-1002', 3, 3, 4,
   'Compensation was not matching industry standards for my role and experience.',
   'Regular compensation reviews and transparent pay bands would improve retention.',
   false,
   'Good workplace culture but salary was a major concern.',
   NOW()-INTERVAL '53 days', NOW()-INTERVAL '53 days'),

  (gen_random_uuid()::text, 'CASE-2026-1003', 4, 5, 4,
   'Relocating to Hyderabad to be closer to family.',
   'Remote work options would have helped me stay.',
   true,
   'Loved the management style. Only leaving due to personal reasons.',
   NOW()-INTERVAL '43 days', NOW()-INTERVAL '43 days'),

  (gen_random_uuid()::text, 'CASE-2026-1004', 5, 5, 5,
   'Pursuing an MBA at IIM Bangalore.',
   'Nothing to improve — this is a great place to work.',
   true,
   'Best team I have ever worked with. Will definitely recommend this company.',
   NOW()-INTERVAL '33 days', NOW()-INTERVAL '33 days')

ON CONFLICT (case_id) DO NOTHING;

-- ============================================================================
-- 7. LEGACY AUDIT LOGS (for legacy_audit_logs → audit_logs view)
-- Populated so that any old code paths reading audit_logs still have data
-- ============================================================================

INSERT INTO legacy_audit_logs (id, timestamp, actor, role, type, action, entity, details, case_id, created_at)
SELECT gen_random_uuid()::text, * FROM (VALUES
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

-- ============================================================================
-- 8. ORG AUDIT LOGS (for the new Audit Trail page via org_audit_logs table)
-- Insert 200 realistic synthetic events covering all event types
-- ============================================================================

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

-- ── Case events ──────────────────────────────────────────────────────────────
('usr_hr_001',  'Case', 'CASE-2026-1001', 'Created',    '{}',                                                  '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Exit case created for Arjun Nair"}',          '192.168.1.101', 'ses_legacy_001', NOW()-INTERVAL '95 days'),
('usr_emp_001', 'Case', 'CASE-2026-1001', 'Submitted',  '{}',                                                  '{"severity":"info","actor_name":"Arjun Nair","actor_role":"employee","details":"Resignation submitted by employee"}',    '192.168.1.201', 'ses_legacy_002', NOW()-INTERVAL '95 days'),
('usr_mgr_001', 'Case', 'CASE-2026-1001', 'Approved',   '{"status":"pending_manager"}',                        '{"status":"in_clearance","severity":"info","actor_name":"Meera Krishnan","actor_role":"manager","details":"Manager approved resignation"}', '192.168.1.111', 'ses_legacy_003', NOW()-INTERVAL '92 days'),
('usr_hr_001',  'Case', 'CASE-2026-1001', 'Completed',  '{"status":"in_clearance"}',                           '{"status":"completed","severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Exit case completed successfully"}', '192.168.1.101', 'ses_legacy_004', NOW()-INTERVAL '65 days'),

('usr_hr_001',  'Case', 'CASE-2026-1002', 'Created',    '{}',                                                  '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Exit case created for Divya Reddy"}',         '192.168.1.101', 'ses_legacy_005', NOW()-INTERVAL '80 days'),
('usr_mgr_003', 'Case', 'CASE-2026-1002', 'Approved',   '{"status":"pending_manager"}',                        '{"status":"in_clearance","severity":"info","actor_name":"Sunita Iyer","actor_role":"manager","details":"Manager approved resignation"}', '192.168.1.112', 'ses_legacy_006', NOW()-INTERVAL '77 days'),
('usr_hr_001',  'Case', 'CASE-2026-1002', 'Completed',  '{"status":"in_clearance"}',                           '{"status":"completed","severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Exit case completed"}', '192.168.1.101', 'ses_legacy_007', NOW()-INTERVAL '50 days'),

('usr_hr_001',  'Case', 'CASE-2026-1005', 'Created',    '{}',                                                  '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Exit case created for Vikram Singh"}',        '192.168.1.101', 'ses_legacy_008', NOW()-INTERVAL '25 days'),
('usr_mgr_002', 'Case', 'CASE-2026-1005', 'Approved',   '{"status":"pending_manager"}',                        '{"status":"in_clearance","severity":"info","actor_name":"Rahul Mehta","actor_role":"manager","details":"Manager approved clearance"}', '192.168.1.110', 'ses_legacy_009', NOW()-INTERVAL '22 days'),

('usr_hr_001',  'Case', 'CASE-2026-1006', 'Created',    '{}',                                                  '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Exit case created for Priya Sharma"}',        '192.168.1.101', 'ses_legacy_010', NOW()-INTERVAL '18 days'),
('usr_hr_001',  'Case', 'CASE-2026-1009', 'Created',    '{}',                                                  '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Exit case created for Neha Gupta"}',          '192.168.1.101', 'ses_legacy_011', NOW()-INTERVAL '3 days'),
('usr_hr_001',  'Case', 'CASE-2026-1010', 'Created',    '{}',                                                  '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Exit case created for Rohan Kapoor"}',        '192.168.1.101', 'ses_legacy_012', NOW()-INTERVAL '1 day'),
('usr_hr_001',  'Case', 'CASE-2026-1012', 'Escalated',  '{"escalated":false}',                                 '{"escalated":true,"severity":"warn","actor_name":"System","actor_role":"system","details":"Case escalated due to SLA breach"}', '192.168.1.1', 'ses_legacy_013', NOW()-INTERVAL '10 days'),

-- ── Task events ────────────────────────────────────────────────────────────
('usr_it_001',  'Task', 'TASK-1001-IT',  'Approved',   '{"status":"pending"}',    '{"status":"approved","severity":"info","actor_name":"Kiran Patel","actor_role":"IT","details":"IT clearance completed, laptop returned"}',        '192.168.1.105', 'ses_legacy_014', NOW()-INTERVAL '91 days'),
('usr_fin_001', 'Task', 'TASK-1001-FIN', 'Approved',   '{"status":"pending"}',    '{"status":"approved","severity":"info","actor_name":"Sunita Rao","actor_role":"Finance","details":"Finance settlement cleared: ₹1,24,500"}',      '192.168.1.106', 'ses_legacy_015', NOW()-INTERVAL '89 days'),
('usr_it_001',  'Task', 'TASK-1002-IT',  'Approved',   '{"status":"pending"}',    '{"status":"approved","severity":"info","actor_name":"Kiran Patel","actor_role":"IT","details":"MacBook Pro returned, accounts deactivated"}',    '192.168.1.105', 'ses_legacy_016', NOW()-INTERVAL '78 days'),
('usr_it_001',  'Task', 'TASK-1005-IT',  'Approved',   '{"status":"pending"}',    '{"status":"approved","severity":"info","actor_name":"Kiran Patel","actor_role":"IT","details":"IT clearance completed"}',                       '192.168.1.105', 'ses_legacy_017', NOW()-INTERVAL '23 days'),
('usr_fin_001', 'Task', 'TASK-1012-FIN', 'Rejected',   '{"status":"in_progress"}','{"status":"rejected","severity":"warn","actor_name":"Sunita Rao","actor_role":"Finance","details":"Outstanding loan of ₹35,000 — clearance rejected"}', '192.168.1.106', 'ses_legacy_018', NOW()-INTERVAL '8 days'),
('usr_it_001',  'Task', 'TASK-1012-IT',  'Overdue',    '{"status":"in_progress"}','{"status":"overdue","severity":"error","actor_name":"System","actor_role":"system","details":"IT task breached 24-hour SLA"}',                  '192.168.1.1',   'ses_legacy_019', NOW()-INTERVAL '10 days'),
('usr_adm_001', 'Task', 'TASK-1012-ADM', 'Overdue',    '{"status":"pending"}',    '{"status":"overdue","severity":"error","actor_name":"System","actor_role":"system","details":"Admin task breached SLA deadline"}',              '192.168.1.1',   'ses_legacy_020', NOW()-INTERVAL '5 days'),

-- ── Document events ────────────────────────────────────────────────────────
('usr_hr_001',  'Document', 'CASE-2026-1001', 'Generated', '{}', '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Relieving letter generated for Arjun Nair"}',       '192.168.1.101', 'ses_legacy_021', NOW()-INTERVAL '66 days'),
('usr_hr_001',  'Document', 'CASE-2026-1001', 'Generated', '{}', '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Experience certificate generated"}',                '192.168.1.101', 'ses_legacy_022', NOW()-INTERVAL '65 days'),
('usr_hr_001',  'Document', 'CASE-2026-1002', 'Generated', '{}', '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Relieving letter generated for Divya Reddy"}',      '192.168.1.101', 'ses_legacy_023', NOW()-INTERVAL '51 days'),
('usr_emp_001', 'Document', 'CASE-2026-1001', 'Uploaded',  '{}', '{"severity":"info","actor_name":"Arjun Nair","actor_role":"employee","details":"Resignation letter uploaded by employee"}',    '192.168.1.201', 'ses_legacy_024', NOW()-INTERVAL '95 days'),
('usr_fin_001', 'Document', 'CASE-2026-1002', 'Uploaded',  '{}', '{"severity":"info","actor_name":"Sunita Rao","actor_role":"Finance","details":"FnF Settlement document uploaded"}',           '192.168.1.106', 'ses_legacy_025', NOW()-INTERVAL '75 days'),

-- ── Asset events ───────────────────────────────────────────────────────────
('usr_it_001',  'Task', 'ASSET-MacBook-001', 'Returned', '{"status":"assigned"}', '{"severity":"info","actor_name":"Kiran Patel","actor_role":"IT","details":"MacBook Pro 16\" returned, condition: Good"}', '192.168.1.105', 'ses_legacy_026', NOW()-INTERVAL '91 days'),
('usr_it_001',  'Task', 'ASSET-iPhone-001',  'Returned', '{"status":"assigned"}', '{"severity":"info","actor_name":"Kiran Patel","actor_role":"IT","details":"iPhone 14 Pro returned, condition: Good"}',    '192.168.1.105', 'ses_legacy_027', NOW()-INTERVAL '78 days'),
('usr_it_001',  'Task', 'ASSET-MacBook-002', 'Added',    '{}',                    '{"severity":"info","actor_name":"Kiran Patel","actor_role":"IT","details":"MacBook Air 13\" registered for exit tracking"}','192.168.1.105', 'ses_legacy_028', NOW()-INTERVAL '18 days'),

-- ── User events ────────────────────────────────────────────────────────────
('usr_hr_001',  'System', 'usr_emp_001', 'Login',        '{}', '{"severity":"info","actor_name":"Anita Desai","actor_role":"HR","details":"Successful login from Bengaluru office"}',            '192.168.1.101', 'ses_legacy_029', NOW()-INTERVAL '5 days'),
('usr_hr_002',  'System', 'usr_emp_002', 'Login',        '{}', '{"severity":"info","actor_name":"Sengottayan S","actor_role":"HR","details":"Successful login"}',                               '192.168.1.102', 'ses_legacy_030', NOW()-INTERVAL '4 days'),
('usr_mgr_001', 'System', 'usr_mgr_001', 'Login',        '{}', '{"severity":"info","actor_name":"Meera Krishnan","actor_role":"manager","details":"Session started from mobile device"}',       '192.168.1.111', 'ses_legacy_031', NOW()-INTERVAL '2 days'),
(null,          'System', 'unknown@offboardiq.com', 'Failed Login', '{}', '{"severity":"error","actor_name":"Unknown","actor_role":"unknown","details":"Invalid password — 3 failed attempts"}','192.168.99.221','ses_legacy_032', NOW()-INTERVAL '1 day'),
('usr_mgr_002', 'System', 'usr_mgr_002', 'Updated',      '{}', '{"severity":"warn","actor_name":"Rahul Mehta","actor_role":"manager","details":"Profile settings updated"}',                   '192.168.1.110', 'ses_legacy_033', NOW()-INTERVAL '6 days'),
('usr_it_001',  'System', 'usr_emp_003', 'Updated',      '{}', '{"severity":"warn","actor_name":"Kiran Patel","actor_role":"IT","details":"User access levels modified for exit processing"}',  '192.168.1.105', 'ses_legacy_034', NOW()-INTERVAL '22 days'),

-- ── Extra realistic events spread across last 90 days ──────────────────────
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

COMMIT;
