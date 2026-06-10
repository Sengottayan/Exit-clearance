-- =============================================================================
-- Migration: 00017_manager_synthetic_data.sql
-- Purpose:   Realistic synthetic data for Manager Module testing.
--            Adds one dedicated test manager (usr_mgr_004) with 12 exit cases
--            covering all statuses and SLA states.
-- =============================================================================

BEGIN;

-- ── 1. Add Manager & Team Members ────────────────────────────────────────────

INSERT INTO users (id, email, role, name, dept, employee_id, created_at) VALUES
  -- Manager
  ('usr_mgr_004', 'aryan.kapoor@offboardiq.com',   'manager',  'Aryan Kapoor',    'Sales',        'MGR-2004', NOW() - INTERVAL '3 years'),
  -- Team employees
  ('usr_emp_101', 'deepa.rajan@offboardiq.com',    'employee', 'Deepa Rajan',     'Sales',        'EMP-3001', NOW() - INTERVAL '24 months'),
  ('usr_emp_102', 'sameer.khan@offboardiq.com',    'employee', 'Sameer Khan',     'Sales',        'EMP-3002', NOW() - INTERVAL '18 months'),
  ('usr_emp_103', 'lakshmi.nair@offboardiq.com',   'employee', 'Lakshmi Nair',    'Sales',        'EMP-3003', NOW() - INTERVAL '20 months'),
  ('usr_emp_104', 'abhishek.jain@offboardiq.com',  'employee', 'Abhishek Jain',   'Sales',        'EMP-3004', NOW() - INTERVAL '15 months'),
  ('usr_emp_105', 'pooja.verma@offboardiq.com',    'employee', 'Pooja Verma',     'Marketing',    'EMP-3005', NOW() - INTERVAL '22 months'),
  ('usr_emp_106', 'nikhil.chandra@offboardiq.com', 'employee', 'Nikhil Chandra',  'Engineering',  'EMP-3006', NOW() - INTERVAL '30 months'),
  ('usr_emp_107', 'ritu.menon@offboardiq.com',     'employee', 'Ritu Menon',      'Design',       'EMP-3007', NOW() - INTERVAL '12 months'),
  ('usr_emp_108', 'girish.pai@offboardiq.com',     'employee', 'Girish Pai',      'Product',      'EMP-3008', NOW() - INTERVAL '16 months'),
  ('usr_emp_109', 'swetha.rao@offboardiq.com',     'employee', 'Swetha Rao',      'Sales',        'EMP-3009', NOW() - INTERVAL '28 months'),
  ('usr_emp_110', 'vijay.kumar@offboardiq.com',    'employee', 'Vijay Kumar',     'Sales',        'EMP-3010', NOW() - INTERVAL '10 months'),
  ('usr_emp_111', 'meena.iyer@offboardiq.com',     'employee', 'Meena Iyer',      'Operations',   'EMP-3011', NOW() - INTERVAL '14 months'),
  ('usr_emp_112', 'praveen.das@offboardiq.com',    'employee', 'Praveen Das',     'Finance',      'EMP-3012', NOW() - INTERVAL '17 months')
ON CONFLICT (id) DO NOTHING;

-- ── 2. Exit Cases — 12 across all statuses ───────────────────────────────────

INSERT INTO legacy_exit_cases (
  id, employee_id, employee_name, employee_email, employee_role, employee_dept,
  manager_id, manager_name, status, resignation_date, last_working_day,
  notice_period_days, exit_reason, escalated, tags, created_at, updated_at
) VALUES

-- ── 3 × pending_manager (awaiting approval) ──────────────────────────────────
('EXIT-MGR-2001', 'usr_emp_101', 'Deepa Rajan',    'deepa.rajan@offboardiq.com',
  'Sales Executive',    'Sales',       'usr_mgr_004', 'Aryan Kapoor',
  'pending_manager', NOW() - INTERVAL '2 days', NOW() + INTERVAL '28 days', 30,
  'better_opportunity', false, ARRAY['urgent'], NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

('EXIT-MGR-2002', 'usr_emp_102', 'Sameer Khan',    'sameer.khan@offboardiq.com',
  'Account Manager',    'Sales',       'usr_mgr_004', 'Aryan Kapoor',
  'pending_manager', NOW() - INTERVAL '4 days', NOW() + INTERVAL '26 days', 30,
  'compensation',       false, ARRAY['standard'], NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

('EXIT-MGR-2003', 'usr_emp_110', 'Vijay Kumar',    'vijay.kumar@offboardiq.com',
  'Sales Coordinator',  'Sales',       'usr_mgr_004', 'Aryan Kapoor',
  'pending_manager', NOW() - INTERVAL '6 days', NOW() + INTERVAL '24 days', 30,
  'work_environment',   false, ARRAY['standard'], NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),

-- ── 4 × in_clearance (active clearance, mixed SLA) ───────────────────────────
('EXIT-MGR-2004', 'usr_emp_103', 'Lakshmi Nair',   'lakshmi.nair@offboardiq.com',
  'Senior Sales Exec',  'Sales',       'usr_mgr_004', 'Aryan Kapoor',
  'in_clearance', NOW() - INTERVAL '20 days', NOW() + INTERVAL '10 days', 30,
  'relocation',         false, ARRAY['standard'], NOW() - INTERVAL '20 days', NOW() - INTERVAL '5 days'),

('EXIT-MGR-2005', 'usr_emp_104', 'Abhishek Jain',  'abhishek.jain@offboardiq.com',
  'Sales Manager',      'Sales',       'usr_mgr_004', 'Aryan Kapoor',
  'in_clearance', NOW() - INTERVAL '25 days', NOW() + INTERVAL '5 days', 30,
  'personal',           false, ARRAY['priority'], NOW() - INTERVAL '25 days', NOW() - INTERVAL '10 days'),

('EXIT-MGR-2006', 'usr_emp_105', 'Pooja Verma',    'pooja.verma@offboardiq.com',
  'Marketing Executive','Marketing',   'usr_mgr_004', 'Aryan Kapoor',
  'in_clearance', NOW() - INTERVAL '30 days', NOW() + INTERVAL '2 days', 32,
  'higher_studies',     false, ARRAY['standard'], NOW() - INTERVAL '30 days', NOW() - INTERVAL '15 days'),

('EXIT-MGR-2007', 'usr_emp_106', 'Nikhil Chandra', 'nikhil.chandra@offboardiq.com',
  'Software Engineer',  'Engineering', 'usr_mgr_004', 'Aryan Kapoor',
  'in_clearance', NOW() - INTERVAL '35 days', NOW() - INTERVAL '1 day', 34,
  'better_opportunity', false, ARRAY['overdue','priority'], NOW() - INTERVAL '35 days', NOW() - INTERVAL '20 days'),

-- ── 1 × cancelled ────────────────────────────────────────────────────────────
('EXIT-MGR-2008', 'usr_emp_107', 'Ritu Menon',     'ritu.menon@offboardiq.com',
  'UI Designer',        'Design',      'usr_mgr_004', 'Aryan Kapoor',
  'cancelled', NOW() - INTERVAL '45 days', NOW() - INTERVAL '15 days', 30,
  'personal',           false, ARRAY['withdrawn'], NOW() - INTERVAL '45 days', NOW() - INTERVAL '30 days'),

-- ── 4 × completed ────────────────────────────────────────────────────────────
('EXIT-MGR-2009', 'usr_emp_108', 'Girish Pai',     'girish.pai@offboardiq.com',
  'Product Manager',    'Product',     'usr_mgr_004', 'Aryan Kapoor',
  'completed', NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days', 30,
  'compensation',       false, ARRAY['standard'], NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days'),

('EXIT-MGR-2010', 'usr_emp_109', 'Swetha Rao',     'swetha.rao@offboardiq.com',
  'Sales Lead',         'Sales',       'usr_mgr_004', 'Aryan Kapoor',
  'completed', NOW() - INTERVAL '75 days', NOW() - INTERVAL '45 days', 30,
  'relocation',         false, ARRAY['standard'], NOW() - INTERVAL '75 days', NOW() - INTERVAL '45 days'),

('EXIT-MGR-2011', 'usr_emp_111', 'Meena Iyer',     'meena.iyer@offboardiq.com',
  'Operations Analyst', 'Operations',  'usr_mgr_004', 'Aryan Kapoor',
  'completed', NOW() - INTERVAL '85 days', NOW() - INTERVAL '55 days', 30,
  'better_opportunity', false, ARRAY['standard'], NOW() - INTERVAL '85 days', NOW() - INTERVAL '55 days'),

('EXIT-MGR-2012', 'usr_emp_112', 'Praveen Das',    'praveen.das@offboardiq.com',
  'Finance Analyst',    'Finance',     'usr_mgr_004', 'Aryan Kapoor',
  'completed', NOW() - INTERVAL '95 days', NOW() - INTERVAL '65 days', 30,
  'higher_studies',     false, ARRAY['standard'], NOW() - INTERVAL '95 days', NOW() - INTERVAL '65 days')

ON CONFLICT (id) DO NOTHING;

-- ── 3. Clearance Tasks ───────────────────────────────────────────────────────

-- EXIT-MGR-2004 (Lakshmi Nair) — Clearance well in progress, on track
INSERT INTO legacy_clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, completed_at, created_at) VALUES
  ('ct-2004-mgr', 'EXIT-MGR-2004', 'manager',   'Manager Clearance', 'usr_mgr_004', 'Aryan Kapoor',  'approved', 48, NOW() - INTERVAL '17 days', NOW() - INTERVAL '16 days', NOW() - INTERVAL '20 days'),
  ('ct-2004-it',  'EXIT-MGR-2004', 'it',         'IT',                'usr_it_001',  'Kiran Patel',   'approved', 24, NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '19 days'),
  ('ct-2004-fin', 'EXIT-MGR-2004', 'finance',    'Finance',           'usr_fin_001', 'Sunita Rao',    'pending',  48, NOW() + INTERVAL '5 days',  NULL,                       NOW() - INTERVAL '18 days'),
  ('ct-2004-hr',  'EXIT-MGR-2004', 'hr',         'HR',                'usr_hr_001',  'Anita Desai',   'pending',  72, NOW() + INTERVAL '8 days',  NULL,                       NOW() - INTERVAL '18 days')
ON CONFLICT (id) DO NOTHING;

-- EXIT-MGR-2005 (Abhishek Jain) — 1 task at risk (due soon)
INSERT INTO legacy_clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, completed_at, created_at) VALUES
  ('ct-2005-mgr', 'EXIT-MGR-2005', 'manager',   'Manager Clearance', 'usr_mgr_004', 'Aryan Kapoor',  'approved', 48, NOW() - INTERVAL '22 days', NOW() - INTERVAL '21 days', NOW() - INTERVAL '25 days'),
  ('ct-2005-it',  'EXIT-MGR-2005', 'it',         'IT',                'usr_it_001',  'Kiran Patel',   'approved', 24, NOW() - INTERVAL '18 days', NOW() - INTERVAL '17 days', NOW() - INTERVAL '24 days'),
  ('ct-2005-fin', 'EXIT-MGR-2005', 'finance',    'Finance',           'usr_fin_001', 'Sunita Rao',    'approved', 48, NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days', NOW() - INTERVAL '23 days'),
  ('ct-2005-hr',  'EXIT-MGR-2005', 'hr',         'HR',                'usr_hr_001',  'Anita Desai',   'pending',  72, NOW() + INTERVAL '1 day',   NULL,                       NOW() - INTERVAL '22 days')
ON CONFLICT (id) DO NOTHING;

-- EXIT-MGR-2006 (Pooja Verma) — 1 overdue task (SLA past due)
INSERT INTO legacy_clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, completed_at, created_at) VALUES
  ('ct-2006-mgr', 'EXIT-MGR-2006', 'manager',   'Manager Clearance', 'usr_mgr_004', 'Aryan Kapoor',  'approved', 48, NOW() - INTERVAL '27 days', NOW() - INTERVAL '26 days', NOW() - INTERVAL '30 days'),
  ('ct-2006-it',  'EXIT-MGR-2006', 'it',         'IT',                'usr_it_001',  'Kiran Patel',   'approved', 24, NOW() - INTERVAL '24 days', NOW() - INTERVAL '23 days', NOW() - INTERVAL '29 days'),
  ('ct-2006-fin', 'EXIT-MGR-2006', 'finance',    'Finance',           'usr_fin_001', 'Sunita Rao',    'pending',  48, NOW() - INTERVAL '5 days',  NULL,                       NOW() - INTERVAL '28 days'),   -- OVERDUE
  ('ct-2006-hr',  'EXIT-MGR-2006', 'hr',         'HR',                'usr_hr_001',  'Anita Desai',   'pending',  72, NOW() + INTERVAL '3 days',  NULL,                       NOW() - INTERVAL '28 days')
ON CONFLICT (id) DO NOTHING;

-- EXIT-MGR-2007 (Nikhil Chandra) — LWD already passed, most tasks overdue
INSERT INTO legacy_clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, completed_at, created_at) VALUES
  ('ct-2007-mgr', 'EXIT-MGR-2007', 'manager',   'Manager Clearance', 'usr_mgr_004', 'Aryan Kapoor',  'approved', 48, NOW() - INTERVAL '32 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '35 days'),
  ('ct-2007-it',  'EXIT-MGR-2007', 'it',         'IT',                'usr_it_001',  'Kiran Patel',   'pending',  24, NOW() - INTERVAL '10 days', NULL,                       NOW() - INTERVAL '34 days'),   -- OVERDUE
  ('ct-2007-fin', 'EXIT-MGR-2007', 'finance',    'Finance',           'usr_fin_001', 'Sunita Rao',    'pending',  48, NOW() - INTERVAL '8 days',  NULL,                       NOW() - INTERVAL '33 days'),   -- OVERDUE
  ('ct-2007-hr',  'EXIT-MGR-2007', 'hr',         'HR',                'usr_hr_001',  'Anita Desai',   'pending',  72, NOW() - INTERVAL '3 days',  NULL,                       NOW() - INTERVAL '32 days')    -- OVERDUE
ON CONFLICT (id) DO NOTHING;

-- EXIT-MGR-2009 and EXIT-MGR-2010 — Completed case tasks (all approved)
INSERT INTO legacy_clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, completed_at, created_at) VALUES
  ('ct-2009-mgr', 'EXIT-MGR-2009', 'manager', 'Manager Clearance', 'usr_mgr_004', 'Aryan Kapoor', 'approved', 48, NOW() - INTERVAL '57 days', NOW() - INTERVAL '56 days', NOW() - INTERVAL '60 days'),
  ('ct-2009-it',  'EXIT-MGR-2009', 'it',       'IT',               'usr_it_001',  'Kiran Patel',  'approved', 24, NOW() - INTERVAL '55 days', NOW() - INTERVAL '54 days', NOW() - INTERVAL '59 days'),
  ('ct-2009-fin', 'EXIT-MGR-2009', 'finance',  'Finance',          'usr_fin_001', 'Sunita Rao',   'approved', 48, NOW() - INTERVAL '50 days', NOW() - INTERVAL '49 days', NOW() - INTERVAL '58 days'),
  ('ct-2009-hr',  'EXIT-MGR-2009', 'hr',       'HR',               'usr_hr_001',  'Anita Desai',  'approved', 72, NOW() - INTERVAL '45 days', NOW() - INTERVAL '44 days', NOW() - INTERVAL '57 days'),
  ('ct-2010-mgr', 'EXIT-MGR-2010', 'manager', 'Manager Clearance', 'usr_mgr_004', 'Aryan Kapoor', 'approved', 48, NOW() - INTERVAL '72 days', NOW() - INTERVAL '71 days', NOW() - INTERVAL '75 days'),
  ('ct-2010-it',  'EXIT-MGR-2010', 'it',       'IT',               'usr_it_001',  'Kiran Patel',  'approved', 24, NOW() - INTERVAL '70 days', NOW() - INTERVAL '69 days', NOW() - INTERVAL '74 days'),
  ('ct-2010-fin', 'EXIT-MGR-2010', 'finance',  'Finance',          'usr_fin_001', 'Sunita Rao',   'approved', 48, NOW() - INTERVAL '65 days', NOW() - INTERVAL '64 days', NOW() - INTERVAL '73 days'),
  ('ct-2010-hr',  'EXIT-MGR-2010', 'hr',       'HR',               'usr_hr_001',  'Anita Desai',  'approved', 72, NOW() - INTERVAL '50 days', NOW() - INTERVAL '49 days', NOW() - INTERVAL '72 days')
ON CONFLICT (id) DO NOTHING;

-- ── 4. Timeline Events ───────────────────────────────────────────────────────

INSERT INTO timeline_events (id, case_id, actor, actor_role, label, is_pending, timestamp) VALUES
  -- EXIT-MGR-2001 (Pending)
  ('te-mgr-01', 'EXIT-MGR-2001', 'Deepa Rajan',   'employee', 'Resignation Submitted',         true,  NOW() - INTERVAL '2 days'),
  -- EXIT-MGR-2002 (Pending)
  ('te-mgr-02', 'EXIT-MGR-2002', 'Sameer Khan',   'employee', 'Resignation Submitted',         true,  NOW() - INTERVAL '4 days'),
  -- EXIT-MGR-2003 (Pending)
  ('te-mgr-03', 'EXIT-MGR-2003', 'Vijay Kumar',   'employee', 'Resignation Submitted',         true,  NOW() - INTERVAL '6 days'),
  -- EXIT-MGR-2004 (In Clearance — on track)
  ('te-mgr-04', 'EXIT-MGR-2004', 'Lakshmi Nair',  'employee', 'Resignation Submitted',         false, NOW() - INTERVAL '20 days'),
  ('te-mgr-05', 'EXIT-MGR-2004', 'Aryan Kapoor',  'manager',  'Resignation Approved',          false, NOW() - INTERVAL '19 days'),
  ('te-mgr-06', 'EXIT-MGR-2004', 'Kiran Patel',   'dept_approver', 'IT Clearance Completed',  false, NOW() - INTERVAL '14 days'),
  ('te-mgr-07', 'EXIT-MGR-2004', 'Sunita Rao',    'dept_approver', 'Finance Clearance Pending',true,  NOW()),
  -- EXIT-MGR-2006 (In Clearance — overdue)
  ('te-mgr-08', 'EXIT-MGR-2006', 'Pooja Verma',   'employee', 'Resignation Submitted',         false, NOW() - INTERVAL '30 days'),
  ('te-mgr-09', 'EXIT-MGR-2006', 'Aryan Kapoor',  'manager',  'Resignation Approved',          false, NOW() - INTERVAL '29 days'),
  ('te-mgr-10', 'EXIT-MGR-2006', 'Kiran Patel',   'dept_approver', 'IT Clearance Completed',  false, NOW() - INTERVAL '23 days'),
  ('te-mgr-11', 'EXIT-MGR-2006', 'Sunita Rao',    'dept_approver', 'Finance Clearance OVERDUE',true,  NOW() - INTERVAL '5 days'),
  -- EXIT-MGR-2009 (Completed)
  ('te-mgr-12', 'EXIT-MGR-2009', 'Girish Pai',    'employee', 'Resignation Submitted',         false, NOW() - INTERVAL '60 days'),
  ('te-mgr-13', 'EXIT-MGR-2009', 'Aryan Kapoor',  'manager',  'Resignation Approved',          false, NOW() - INTERVAL '59 days'),
  ('te-mgr-14', 'EXIT-MGR-2009', 'Kiran Patel',   'dept_approver', 'IT Clearance Completed',  false, NOW() - INTERVAL '54 days'),
  ('te-mgr-15', 'EXIT-MGR-2009', 'Sunita Rao',    'dept_approver', 'Finance Clearance Completed',false,NOW() - INTERVAL '49 days'),
  ('te-mgr-16', 'EXIT-MGR-2009', 'Anita Desai',   'hr',       'HR Clearance Completed',        false, NOW() - INTERVAL '44 days'),
  ('te-mgr-17', 'EXIT-MGR-2009', 'Anita Desai',   'hr',       'Relieving Letter Issued',       false, NOW() - INTERVAL '30 days')
ON CONFLICT DO NOTHING;

-- ── 5. Case Comments ─────────────────────────────────────────────────────────

INSERT INTO case_comments (case_id, author_id, author_name, author_role, message, visibility, timestamp) VALUES
  ('EXIT-MGR-2001', 'usr_mgr_004', 'Aryan Kapoor', 'manager',  'Please provide your knowledge transfer documentation before LWD.', 'all',      NOW() - INTERVAL '1 day'),
  ('EXIT-MGR-2001', 'usr_hr_001',  'Anita Desai',  'hr',       'HR acknowledges the resignation. Exit interview scheduled.', 'internal', NOW() - INTERVAL '12 hours'),
  ('EXIT-MGR-2004', 'usr_mgr_004', 'Aryan Kapoor', 'manager',  'IT and manager approvals done. Pending finance sign-off.', 'all',      NOW() - INTERVAL '3 days'),
  ('EXIT-MGR-2006', 'usr_hr_001',  'Anita Desai',  'hr',       'Finance SLA breached. Escalating to finance lead.', 'internal', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

COMMIT;
