-- ============================================================================
-- SEED DATA: Synthetic data for development & demo
-- Matches the mock data from constants.ts and exitStore.ts
-- ============================================================================

-- ── Users ──────────────────────────────────────────────────────────────────
INSERT INTO users (id, email, role, name, dept, employee_id) VALUES
  ('u1',  'priya@company.com',     'employee',      'Priya Sharma',   'Engineering',  'EMP-1042'),
  ('u2',  'rahul@company.com',     'manager',       'Rahul Mehta',    'Engineering',  'MGR-201'),
  ('u3',  'anita@company.com',     'hr',            'Anita Desai',    'HR',           'HR-001'),
  ('u4',  'kiran@company.com',     'dept_approver', 'Kiran Patel',    'IT',           'IT-101'),
  ('u5',  'sunita@company.com',    'dept_approver', 'Sunita Rao',     'Finance',      'FIN-201'),
  ('u6',  'admin@company.com',     'admin',         'System Admin',   'IT',           'ADM-001'),
  ('u7',  'admin_dept@company.com','dept_approver', 'Admin Dept',     'Administration','ADM-101'),
  ('u8',  'procurement@company.com','dept_approver','Procurement',    'Procurement',  'PRO-101'),
  ('u9',  'infosec@company.com',   'dept_approver', 'InfoSec',        'Info Security','SEC-101'),
  ('u10', 'facilities@company.com','dept_approver', 'Facilities',     'Facilities',   'FAC-101'),
  ('u11', 'sunita.iyer@company.com','manager',      'Sunita Iyer',    'Product',      'MGR-202')
ON CONFLICT (id) DO NOTHING;

-- Update department default assignees now that users exist
UPDATE departments SET default_assignee = 'u2'  WHERE id = 'manager';
UPDATE departments SET default_assignee = 'u4'  WHERE id = 'it';
UPDATE departments SET default_assignee = 'u7'  WHERE id = 'admin';
UPDATE departments SET default_assignee = 'u5'  WHERE id = 'finance';
UPDATE departments SET default_assignee = 'u8'  WHERE id = 'procurement';
UPDATE departments SET default_assignee = 'u9'  WHERE id = 'infosec';
UPDATE departments SET default_assignee = 'u3'  WHERE id = 'hr';
UPDATE departments SET default_assignee = 'u10' WHERE id = 'facilities';

-- ── Exit Cases ─────────────────────────────────────────────────────────────

-- Case 1: In clearance, partially completed (Arjun Nair)
INSERT INTO exit_cases (id, employee_id, employee_name, employee_email, employee_role, employee_dept, manager_id, manager_name, status, resignation_date, last_working_day, notice_period_days, exit_reason, escalated)
VALUES ('CASE-2025-001', 'u1', 'Arjun Nair', 'arjun@company.com', 'Sr. Developer', 'Engineering', 'u2', 'Rahul Mehta', 'in_clearance', '2025-01-01T00:00:00Z', '2025-01-15T00:00:00Z', 14, 'better_opportunity', false);

-- Case 1 tasks
INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at, notes)
VALUES
  ('t-mgr-001', 'CASE-2025-001', 'manager', 'Manager Clearance', 'u2', 'Rahul Mehta', 'approved', 48, '2025-01-03T00:00:00Z', '2025-01-01T10:00:00Z', '2025-01-02T11:00:00Z', 'Approved - all handover completed'),
  ('t-it-001',  'CASE-2025-001', 'it', 'IT', 'u4', 'Kiran Patel', 'overdue', 24, '2025-01-03T00:00:00Z', '2025-01-02T12:00:00Z', NULL, NULL),
  ('t-adm-001', 'CASE-2025-001', 'admin', 'Administration', 'u7', 'Admin Dept', 'approved', 24, '2025-01-03T00:00:00Z', '2025-01-02T12:00:00Z', '2025-01-03T10:00:00Z', NULL),
  ('t-fin-001', 'CASE-2025-001', 'finance', 'Finance', 'u5', 'Sunita Rao', 'in_progress', 48, '2025-01-05T00:00:00Z', '2025-01-03T10:00:00Z', NULL, NULL),
  ('t-pro-001', 'CASE-2025-001', 'procurement', 'Procurement', 'u8', 'Procurement', 'approved', 48, '2025-01-05T00:00:00Z', '2025-01-03T10:00:00Z', '2025-01-04T10:00:00Z', NULL),
  ('t-sec-001', 'CASE-2025-001', 'infosec', 'Info Security', 'u9', 'InfoSec', 'approved', 24, '2025-01-04T00:00:00Z', '2025-01-03T10:00:00Z', '2025-01-05T10:00:00Z', NULL),
  ('t-hr-001',  'CASE-2025-001', 'hr', 'HR', 'u3', 'Anita Desai', 'pending', 72, '2025-01-06T00:00:00Z', NULL, NULL, NULL);

-- Case 1 checklist items for IT (overdue task)
INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, input_label, checked, input_value, sort_order)
VALUES
  ('it-1', 't-it-001', 'Laptop returned and condition verified', true, true, 'Asset tag / Serial number', true, 'LAP-2024-001', 1),
  ('it-2', 't-it-001', 'Mobile device returned (if applicable)', false, false, NULL, false, NULL, 2),
  ('it-3', 't-it-001', 'Corporate email account deactivated', true, false, NULL, false, NULL, 3),
  ('it-4', 't-it-001', 'VPN credentials revoked', true, false, NULL, true, NULL, 4),
  ('it-5', 't-it-001', 'All application access removed', true, false, NULL, true, NULL, 5),
  ('it-6', 't-it-001', 'GitHub / GitLab access removed', true, false, NULL, false, NULL, 6),
  ('it-7', 't-it-001', 'Data backup verified', true, false, NULL, false, NULL, 7);

-- Case 1 checklist items for Finance (in progress)
INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, input_label, checked, input_value, sort_order)
VALUES
  ('fin-1', 't-fin-001', 'Salary advance fully recovered', true, true, 'Amount (₹)', true, '25000', 1),
  ('fin-2', 't-fin-001', 'Loan balance settled', true, true, 'Amount (₹)', true, '150000', 2),
  ('fin-3', 't-fin-001', 'Pending expense claims processed', true, false, NULL, false, NULL, 3),
  ('fin-4', 't-fin-001', 'Final settlement amount confirmed', true, true, 'Net settlement (₹)', false, NULL, 4);

-- Case 1 checklist items for HR (pending)
INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, input_label, checked, input_value, sort_order)
VALUES
  ('hr-1', 't-hr-001', 'Exit interview completed', true, false, NULL, false, NULL, 1),
  ('hr-2', 't-hr-001', 'All HR documents collected', true, false, NULL, false, NULL, 2),
  ('hr-3', 't-hr-001', 'Policy compliance verified', true, false, NULL, false, NULL, 3),
  ('hr-4', 't-hr-001', 'Final approval granted', true, false, NULL, false, NULL, 4);

-- Case 1 timeline
INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES
  ('ev-1', 'CASE-2025-001', 'Resignation submitted',       '2025-01-01T10:00:00Z', 'Arjun Nair',   'employee'),
  ('ev-2', 'CASE-2025-001', 'Manager approved',            '2025-01-02T11:00:00Z', 'Rahul Mehta',  'manager'),
  ('ev-3', 'CASE-2025-001', 'IT clearance started',        '2025-01-02T12:00:00Z', 'Kiran Patel',  'dept_approver'),
  ('ev-4', 'CASE-2025-001', 'Admin clearance approved',    '2025-01-03T10:00:00Z', 'Admin Dept',   'dept_approver'),
  ('ev-5', 'CASE-2025-001', 'Procurement clearance approved','2025-01-04T10:00:00Z', 'Procurement',  'dept_approver'),
  ('ev-6', 'CASE-2025-001', 'InfoSec clearance approved',  '2025-01-05T10:00:00Z', 'InfoSec',      'dept_approver');


-- Case 2: Pending manager approval (Meera Krishnan)
INSERT INTO exit_cases (id, employee_id, employee_name, employee_email, employee_role, employee_dept, manager_id, manager_name, status, resignation_date, last_working_day, notice_period_days, exit_reason)
VALUES ('CASE-2025-002', 'u1', 'Meera Krishnan', 'meera@company.com', 'QA Engineer', 'Testing', 'u2', 'Rahul Mehta', 'pending_manager', '2025-01-05T00:00:00Z', '2025-01-30T00:00:00Z', 25, 'compensation');

INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at)
VALUES
  ('t-mgr-002', 'CASE-2025-002', 'manager', 'Manager Clearance', 'u2', 'Rahul Mehta', 'pending', 48, '2025-01-07T00:00:00Z'),
  ('t-it-002',  'CASE-2025-002', 'it', 'IT', 'u4', 'Kiran Patel', 'pending', 24, '2025-01-08T00:00:00Z'),
  ('t-adm-002', 'CASE-2025-002', 'admin', 'Administration', 'u7', 'Admin Dept', 'pending', 24, '2025-01-08T00:00:00Z'),
  ('t-fin-002', 'CASE-2025-002', 'finance', 'Finance', 'u5', 'Sunita Rao', 'pending', 48, '2025-01-09T00:00:00Z'),
  ('t-hr-002',  'CASE-2025-002', 'hr', 'HR', 'u3', 'Anita Desai', 'pending', 72, '2025-01-10T00:00:00Z');

INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES ('ev-2-1', 'CASE-2025-002', 'Resignation submitted', '2025-01-05T09:00:00Z', 'Meera Krishnan', 'employee');


-- Case 3: Completed (Dev Anand)
INSERT INTO exit_cases (id, employee_id, employee_name, employee_email, employee_role, employee_dept, manager_id, manager_name, status, resignation_date, last_working_day, notice_period_days, exit_reason)
VALUES ('CASE-2024-003', 'u1', 'Dev Anand', 'dev@company.com', 'Product Manager', 'Product', 'u11', 'Sunita Iyer', 'completed', '2024-11-01T00:00:00Z', '2024-11-30T00:00:00Z', 29, 'higher_studies');

INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, completed_at, notes)
VALUES
  ('t-mgr-003', 'CASE-2024-003', 'manager', 'Manager Clearance', 'u11', 'Sunita Iyer', 'approved', 48, '2024-11-03T00:00:00Z', '2024-11-02T10:00:00Z', 'All handover completed'),
  ('t-it-003',  'CASE-2024-003', 'it', 'IT', 'u4', 'Kiran Patel', 'approved', 24, '2024-11-04T00:00:00Z', '2024-11-05T10:00:00Z', 'Laptop returned, accounts deactivated'),
  ('t-adm-003', 'CASE-2024-003', 'admin', 'Administration', 'u7', 'Admin Dept', 'approved', 24, '2024-11-04T00:00:00Z', '2024-11-04T15:00:00Z', NULL),
  ('t-fin-003', 'CASE-2024-003', 'finance', 'Finance', 'u5', 'Sunita Rao', 'approved', 48, '2024-11-05T00:00:00Z', '2024-11-06T10:00:00Z', 'All settlements cleared'),
  ('t-pro-003', 'CASE-2024-003', 'procurement', 'Procurement', 'u8', 'Procurement', 'approved', 48, '2024-11-05T00:00:00Z', '2024-11-05T14:00:00Z', NULL),
  ('t-sec-003', 'CASE-2024-003', 'infosec', 'Info Security', 'u9', 'InfoSec', 'approved', 24, '2024-11-04T00:00:00Z', '2024-11-03T16:00:00Z', NULL),
  ('t-hr-003',  'CASE-2024-003', 'hr', 'HR', 'u3', 'Anita Desai', 'approved', 72, '2024-11-06T00:00:00Z', '2024-11-07T12:00:00Z', 'Exit interview completed, documents issued');

INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES
  ('ev-3-1',    'CASE-2024-003', 'Resignation submitted',   '2024-11-01T09:00:00Z', 'Dev Anand',     'employee'),
  ('ev-3-2',    'CASE-2024-003', 'Manager approved',        '2024-11-02T10:00:00Z', 'Sunita Iyer',   'manager'),
  ('ev-3-last', 'CASE-2024-003', 'Clearance completed',     '2024-11-20T10:00:00Z', 'System',        'system');

-- Case 3 exit interview
INSERT INTO exit_interviews (case_id, overall_rating, management_rating, culture_rating, reason, improvements, would_rejoin, comments, completed_at)
VALUES ('CASE-2024-003', 4, 4, 5, 'Pursuing masters', 'More training budgets', true, 'Great place to work!', '2024-11-15T10:00:00Z');

-- Case 3 documents
INSERT INTO documents (case_id, doc_type, file_name, uploaded_by, uploaded_at)
VALUES
  ('CASE-2024-003', 'relieving_letter',       'relieving-CASE-2024-003.pdf',       'u3', '2024-11-20T10:00:00Z'),
  ('CASE-2024-003', 'experience_certificate', 'experience-CASE-2024-003.pdf',      'u3', '2024-11-20T10:00:00Z');


-- Case 4: In clearance, manager approved, others pending (Priya Sharma)
INSERT INTO exit_cases (id, employee_id, employee_name, employee_email, employee_role, employee_dept, manager_id, manager_name, status, resignation_date, last_working_day, notice_period_days, exit_reason)
VALUES ('CASE-2025-004', 'u1', 'Priya Sharma', 'priya@company.com', 'Employee', 'Engineering', 'u2', 'Rahul Mehta', 'in_clearance', '2025-01-10T00:00:00Z', '2025-02-10T00:00:00Z', 31, 'personal');

INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES
  ('t-mgr-004', 'CASE-2025-004', 'manager', 'Manager Clearance', 'u2', 'Rahul Mehta', 'approved', 48, '2025-01-12T00:00:00Z', '2025-01-10T09:30:00Z', '2025-01-12T10:00:00Z'),
  ('t-it-004',  'CASE-2025-004', 'it', 'IT', 'u4', 'Kiran Patel', 'pending', 24, '2025-01-14T00:00:00Z', NULL, NULL),
  ('t-adm-004', 'CASE-2025-004', 'admin', 'Administration', 'u7', 'Admin Dept', 'pending', 24, '2025-01-14T00:00:00Z', NULL, NULL),
  ('t-fin-004', 'CASE-2025-004', 'finance', 'Finance', 'u5', 'Sunita Rao', 'pending', 48, '2025-01-16T00:00:00Z', NULL, NULL),
  ('t-pro-004', 'CASE-2025-004', 'procurement', 'Procurement', 'u8', 'Procurement', 'pending', 48, '2025-01-16T00:00:00Z', NULL, NULL),
  ('t-sec-004', 'CASE-2025-004', 'infosec', 'Info Security', 'u9', 'InfoSec', 'pending', 24, '2025-01-14T00:00:00Z', NULL, NULL),
  ('t-hr-004',  'CASE-2025-004', 'hr', 'HR', 'u3', 'Anita Desai', 'pending', 72, '2025-01-17T00:00:00Z', NULL, NULL);

INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES
  ('ev-4-1', 'CASE-2025-004', 'Resignation submitted',  '2025-01-10T09:00:00Z', 'Priya Sharma',  'employee'),
  ('ev-4-2', 'CASE-2025-004', 'Manager approved',       '2025-01-12T10:00:00Z', 'Rahul Mehta',   'manager');

-- Case 4 resignation letter document
INSERT INTO documents (case_id, doc_type, file_name, uploaded_by, uploaded_at)
VALUES ('CASE-2025-004', 'resignation_letter', 'resignation-CASE-2025-004.pdf', 'u1', '2025-01-10T09:00:00Z');


-- ── Notifications ──────────────────────────────────────────────────────────
INSERT INTO notifications (user_id, type, title, message, href, read, created_at)
VALUES
  ('u2', 'approval',   'Resignation awaiting approval',     'Arjun Nair has submitted a resignation request.',   '/cases/CASE-2025-001', false, '2025-01-01T10:00:00Z'),
  ('u3', 'completion', 'Exit clearance completed',          'Dev Anand''s exit process is now complete.',        '/cases/CASE-2024-003', true,  '2024-11-20T10:00:00Z'),
  ('u2', 'approval',   'Resignation awaiting approval',     'Meera Krishnan has submitted a resignation request.','/cases/CASE-2025-002', false, '2025-01-05T09:00:00Z'),
  ('u4', 'sla',        'SLA breach: IT clearance overdue',  'IT clearance for Arjun Nair has exceeded SLA.',     '/cases/CASE-2025-001', false, '2025-01-04T00:00:00Z'),
  ('u3', 'system',     'New clearance task assigned',       'HR clearance for Priya Sharma is ready for review.', '/tasks/CASE-2025-004__hr', false, '2025-01-12T10:00:00Z');


-- ── Audit Logs ─────────────────────────────────────────────────────────────
INSERT INTO audit_logs (actor, role, type, action, entity, details, case_id, timestamp)
VALUES
  ('Arjun Nair',   'employee',      'Case',    'Created',    'CASE-2025-001', 'Resignation submitted',              'CASE-2025-001', '2025-01-01T10:00:00Z'),
  ('Rahul Mehta',  'manager',       'Case',    'Approved',   'CASE-2025-001', 'Manager approved resignation',       'CASE-2025-001', '2025-01-02T11:00:00Z'),
  ('Kiran Patel',  'dept_approver', 'Task',    'Started',    'CASE-2025-001', 'IT clearance started',               'CASE-2025-001', '2025-01-02T12:00:00Z'),
  ('Admin Dept',   'dept_approver', 'Task',    'Approved',   'CASE-2025-001', 'Admin clearance approved',           'CASE-2025-001', '2025-01-03T10:00:00Z'),
  ('Dev Anand',    'employee',      'Case',    'Created',    'CASE-2024-003', 'Resignation submitted',              'CASE-2024-003', '2024-11-01T09:00:00Z'),
  ('Sunita Iyer',  'manager',       'Case',    'Approved',   'CASE-2024-003', 'Manager approved resignation',       'CASE-2024-003', '2024-11-02T10:00:00Z'),
  ('System',       'system',        'Case',    'Completed',  'CASE-2024-003', 'Clearance completed',                'CASE-2024-003', '2024-11-20T10:00:00Z'),
  ('Anita Desai',  'hr',            'Document','Generated',  'CASE-2024-003', 'Relieving letter generated',         'CASE-2024-003', '2024-11-20T10:00:00Z'),
  ('Anita Desai',  'hr',            'Document','Generated',  'CASE-2024-003', 'Experience certificate generated',   'CASE-2024-003', '2024-11-20T10:00:00Z'),
  ('Meera Krishnan','employee',     'Case',    'Created',    'CASE-2025-002', 'Resignation submitted',              'CASE-2025-002', '2025-01-05T09:00:00Z'),
  ('Priya Sharma', 'employee',      'Case',    'Created',    'CASE-2025-004', 'Resignation submitted',              'CASE-2025-004', '2025-01-10T09:00:00Z'),
  ('Rahul Mehta',  'manager',       'Case',    'Approved',   'CASE-2025-004', 'Manager approved resignation',       'CASE-2025-004', '2025-01-12T10:00:00Z');


-- ── Notification Preferences ────────────────────────────────────────────────
INSERT INTO notification_preferences (user_id, approval, sla, system, rejection, completion)
VALUES
  ('u1', true, true, true, true, true),
  ('u2', true, true, true, true, true),
  ('u3', true, true, true, true, true),
  ('u4', true, true, true, false, true),
  ('u5', true, false, true, true, true)
ON CONFLICT (user_id) DO NOTHING;
