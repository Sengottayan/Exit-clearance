-- ============================================================================
-- RICH SEED DATA MIGRATION
-- Wipes existing mock data and replaces it with 10+ realistic exit cases.
-- ============================================================================

-- Clean existing data
DELETE FROM notifications;
DELETE FROM audit_logs;
DELETE FROM documents;
DELETE FROM exit_interviews;
DELETE FROM timeline_events;
DELETE FROM checklist_items;
DELETE FROM clearance_tasks;
DELETE FROM exit_cases;


INSERT INTO exit_cases (id, employee_id, employee_name, employee_email, employee_role, employee_dept, manager_id, manager_name, status, resignation_date, last_working_day, notice_period_days, exit_reason, escalated)
VALUES ('CASE-2026-1001', 'emp_1', 'Arjun Nair', 'arjun.nair@company.com', 'Sr. Developer', 'Engineering', 'u2', 'Rahul Mehta', 'in_clearance', '2026-05-28T10:59:01.909793Z', '2026-06-27T10:59:01.909793Z', 30, 'relocation', false);


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES
  ('dd247819-3695-4bb6-8347-99c07d84ba94', 'CASE-2026-1001', 'Resignation submitted', '2026-05-28T10:59:01.909793Z', 'Arjun Nair', 'employee');


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES
  ('ed1a560c-26b1-494d-9f04-b2eee8134519', 'CASE-2026-1001', 'Manager approved', '2026-05-29T01:59:01.909793Z', 'Rahul Mehta', 'manager');


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('58d66634-e165-4dea-afec-c8b71aea604e', 'CASE-2026-1001', 'manager', 'Manager Clearance', 'u2', 'Rahul Mehta', 'approved', 48, '2026-05-31T01:59:01.909793Z', '2026-05-29T01:59:01.909793Z', '2026-05-29T01:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('95131765-2762-4859-95ce-3ace1de67491', '58d66634-e165-4dea-afec-c8b71aea604e', 'Standard check 1 completed', true, false, true, 1),
  ('5c50e58f-6c5e-4550-b6ac-d1ef42449685', '58d66634-e165-4dea-afec-c8b71aea604e', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('69e97a95-fdeb-4ceb-a713-a8f3e0434aa3', 'CASE-2026-1001', 'it', 'IT', 'u4', 'Kiran Patel', 'overdue', 24, '2026-05-30T01:59:01.909793Z', '2026-05-29T10:59:01.909793Z', NULL);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('9a9d3bb5-0e92-40e1-8b64-10d3466a97c2', 'CASE-2026-1001', 'admin', 'Administration', 'u7', 'Admin Dept', 'pending', 24, '2026-05-30T01:59:01.909793Z', NULL, NULL);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('ae1ea5f7-bd74-4369-8293-04e8f3038cb3', 'CASE-2026-1001', 'finance', 'Finance', 'u5', 'Sunita Rao', 'in_progress', 48, '2026-05-31T01:59:01.909793Z', '2026-05-29T10:59:01.909793Z', NULL);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('28b520c3-b321-419c-872c-c7c6aa6ad59f', 'CASE-2026-1001', 'procurement', 'Procurement', 'u8', 'Procurement', 'in_progress', 48, '2026-05-31T01:59:01.909793Z', '2026-05-29T09:59:01.909793Z', NULL);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('5deb3e1a-a3e8-4c9b-9e57-38f3416cf40b', 'CASE-2026-1001', 'infosec', 'Info Security', 'u9', 'InfoSec', 'overdue', 24, '2026-05-30T01:59:01.909793Z', '2026-05-29T09:59:01.909793Z', NULL);


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES ('bef8b35f-6555-4329-a88c-d3d702684052', 'CASE-2026-1001', 'HR clearance approved', '2026-05-30T00:59:01.909793Z', 'Anita Desai', 'dept_approver');


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('12c00f95-f6e8-4017-a18f-29322f9023fa', 'CASE-2026-1001', 'hr', 'HR', 'u3', 'Anita Desai', 'approved', 72, '2026-06-01T01:59:01.909793Z', '2026-05-29T02:59:01.909793Z', '2026-05-30T00:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('9394e4ac-758e-46ae-8bae-6480af4fceeb', '12c00f95-f6e8-4017-a18f-29322f9023fa', 'Standard check 1 completed', true, false, true, 1),
  ('4e7d7c3b-6993-4728-9e8b-e314c22f36b5', '12c00f95-f6e8-4017-a18f-29322f9023fa', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES ('08ae7e4b-45ab-474a-9309-956a16a3d659', 'CASE-2026-1001', 'Facilities clearance approved', '2026-05-29T19:59:01.909793Z', 'Facilities', 'dept_approver');


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('b3b6c7ed-bd36-42ab-90ef-7449d5664d52', 'CASE-2026-1001', 'facilities', 'Facilities', 'u10', 'Facilities', 'approved', 24, '2026-05-30T01:59:01.909793Z', '2026-05-29T11:59:01.909793Z', '2026-05-29T19:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('e84fd470-fca5-47d7-a779-bf7a80427400', 'b3b6c7ed-bd36-42ab-90ef-7449d5664d52', 'Standard check 1 completed', true, false, true, 1),
  ('0ffea3fa-60ed-412d-92b2-5182bafd24a7', 'b3b6c7ed-bd36-42ab-90ef-7449d5664d52', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO exit_cases (id, employee_id, employee_name, employee_email, employee_role, employee_dept, manager_id, manager_name, status, resignation_date, last_working_day, notice_period_days, exit_reason, escalated)
VALUES ('CASE-2026-1002', 'emp_2', 'Meera Krishnan', 'meera.krishnan@company.com', 'QA Engineer', 'Testing', 'u2', 'Rahul Mehta', 'pending_manager', '2026-06-08T10:59:01.909793Z', '2026-07-08T10:59:01.909793Z', 30, 'relocation', false);


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES
  ('84ab9365-83ec-4387-98aa-1b51f3090088', 'CASE-2026-1002', 'Resignation submitted', '2026-06-08T10:59:01.909793Z', 'Meera Krishnan', 'employee');


INSERT INTO exit_cases (id, employee_id, employee_name, employee_email, employee_role, employee_dept, manager_id, manager_name, status, resignation_date, last_working_day, notice_period_days, exit_reason, escalated)
VALUES ('CASE-2026-1003', 'emp_5', 'Vikram Singh', 'vikram.singh@company.com', 'DevOps Engineer', 'IT', 'u4', 'Kiran Patel', 'pending_manager', '2026-06-06T10:59:01.909793Z', '2026-07-06T10:59:01.909793Z', 30, 'better_opportunity', false);


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES
  ('035ea7bd-ddf6-46bf-b383-3a7b70e2bc37', 'CASE-2026-1003', 'Resignation submitted', '2026-06-06T10:59:01.909793Z', 'Vikram Singh', 'employee');


INSERT INTO exit_cases (id, employee_id, employee_name, employee_email, employee_role, employee_dept, manager_id, manager_name, status, resignation_date, last_working_day, notice_period_days, exit_reason, escalated)
VALUES ('CASE-2026-1004', 'emp_1', 'Arjun Nair', 'arjun.nair@company.com', 'Sr. Developer', 'Engineering', 'u2', 'Rahul Mehta', 'pending_manager', '2026-06-08T10:59:01.909793Z', '2026-07-08T10:59:01.909793Z', 30, 'higher_studies', false);


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES
  ('36d9a83c-c277-45d3-a17f-5cb767d386cf', 'CASE-2026-1004', 'Resignation submitted', '2026-06-08T10:59:01.909793Z', 'Arjun Nair', 'employee');


INSERT INTO exit_cases (id, employee_id, employee_name, employee_email, employee_role, employee_dept, manager_id, manager_name, status, resignation_date, last_working_day, notice_period_days, exit_reason, escalated)
VALUES ('CASE-2026-1005', 'emp_10', 'Divya Reddy', 'divya.reddy@company.com', 'Marketing Specialist', 'Marketing', 'u11', 'Sunita Iyer', 'pending_manager', '2026-06-08T10:59:01.909793Z', '2026-07-08T10:59:01.909793Z', 30, 'personal', false);


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES
  ('ab0bf476-5fcd-4818-a939-3f222c1a667b', 'CASE-2026-1005', 'Resignation submitted', '2026-06-08T10:59:01.909793Z', 'Divya Reddy', 'employee');


INSERT INTO exit_cases (id, employee_id, employee_name, employee_email, employee_role, employee_dept, manager_id, manager_name, status, resignation_date, last_working_day, notice_period_days, exit_reason, escalated)
VALUES ('CASE-2026-1006', 'emp_3', 'Dev Anand', 'dev.anand@company.com', 'Product Manager', 'Product', 'u11', 'Sunita Iyer', 'cancelled', '2026-04-27T10:59:01.909793Z', '2026-05-27T10:59:01.909793Z', 30, 'relocation', false);


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES
  ('35321675-63ad-4ff5-92b4-51933f1a2931', 'CASE-2026-1006', 'Resignation submitted', '2026-04-27T10:59:01.909793Z', 'Dev Anand', 'employee');


INSERT INTO exit_cases (id, employee_id, employee_name, employee_email, employee_role, employee_dept, manager_id, manager_name, status, resignation_date, last_working_day, notice_period_days, exit_reason, escalated)
VALUES ('CASE-2026-1007', 'emp_6', 'Neha Gupta', 'neha.gupta@company.com', 'HR Executive', 'HR', 'u3', 'Anita Desai', 'pending_manager', '2026-06-06T10:59:01.909793Z', '2026-07-06T10:59:01.909793Z', 30, 'compensation', false);


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES
  ('af92a568-4a71-4d7b-9464-d835597b598c', 'CASE-2026-1007', 'Resignation submitted', '2026-06-06T10:59:01.909793Z', 'Neha Gupta', 'employee');


INSERT INTO exit_cases (id, employee_id, employee_name, employee_email, employee_role, employee_dept, manager_id, manager_name, status, resignation_date, last_working_day, notice_period_days, exit_reason, escalated)
VALUES ('CASE-2026-1008', 'emp_9', 'Amit Patel', 'amit.patel@company.com', 'Frontend Engineer', 'Engineering', 'u2', 'Rahul Mehta', 'in_clearance', '2026-06-02T10:59:01.909793Z', '2026-07-02T10:59:01.909793Z', 30, 'personal', true);


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES
  ('2901027e-aeff-49ee-a0cc-74abfddacb5d', 'CASE-2026-1008', 'Resignation submitted', '2026-06-02T10:59:01.909793Z', 'Amit Patel', 'employee');


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES
  ('57caaa85-c61a-4bdd-a874-3ee8569ee8bf', 'CASE-2026-1008', 'Manager approved', '2026-06-04T00:59:01.909793Z', 'Rahul Mehta', 'manager');


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('b49b48cc-2879-4109-8867-c349f136bc8a', 'CASE-2026-1008', 'manager', 'Manager Clearance', 'u2', 'Rahul Mehta', 'approved', 48, '2026-06-06T00:59:01.909793Z', '2026-06-04T00:59:01.909793Z', '2026-06-04T00:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('1ca50ed5-73c9-4ddc-992c-eefbab4a2860', 'b49b48cc-2879-4109-8867-c349f136bc8a', 'Standard check 1 completed', true, false, true, 1),
  ('5024f18c-ec5d-4a4d-a78f-42115be692b5', 'b49b48cc-2879-4109-8867-c349f136bc8a', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('864b1139-fa02-4f0d-a1d4-3d4a9a0c9e3a', 'CASE-2026-1008', 'it', 'IT', 'u4', 'Kiran Patel', 'overdue', 24, '2026-06-05T00:59:01.909793Z', '2026-06-04T07:59:01.909793Z', NULL);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('73329648-64e1-49ac-a856-65694f27e6f3', 'CASE-2026-1008', 'admin', 'Administration', 'u7', 'Admin Dept', 'in_progress', 24, '2026-06-05T00:59:01.909793Z', '2026-06-04T03:59:01.909793Z', NULL);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('678cafbc-d5de-4074-a47c-7e0b3c96eaea', 'CASE-2026-1008', 'finance', 'Finance', 'u5', 'Sunita Rao', 'pending', 48, '2026-06-06T00:59:01.909793Z', NULL, NULL);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('0bcb9e33-f303-4332-bde4-958249e6927f', 'CASE-2026-1008', 'procurement', 'Procurement', 'u8', 'Procurement', 'overdue', 48, '2026-06-06T00:59:01.909793Z', '2026-06-04T03:59:01.909793Z', NULL);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('f45db47f-9517-458d-83f1-6758d89b5fe1', 'CASE-2026-1008', 'infosec', 'Info Security', 'u9', 'InfoSec', 'in_progress', 24, '2026-06-05T00:59:01.909793Z', '2026-06-04T04:59:01.909793Z', NULL);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('a95553c8-bee3-45e5-a608-afa45a1d4812', 'CASE-2026-1008', 'hr', 'HR', 'u3', 'Anita Desai', 'pending', 72, '2026-06-07T00:59:01.909793Z', NULL, NULL);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('507190e7-c336-4d61-a910-26dced3b73c7', 'CASE-2026-1008', 'facilities', 'Facilities', 'u10', 'Facilities', 'pending', 24, '2026-06-05T00:59:01.909793Z', NULL, NULL);


INSERT INTO exit_cases (id, employee_id, employee_name, employee_email, employee_role, employee_dept, manager_id, manager_name, status, resignation_date, last_working_day, notice_period_days, exit_reason, escalated)
VALUES ('CASE-2026-1009', 'emp_7', 'Rohan Das', 'rohan.das@company.com', 'Financial Analyst', 'Finance', 'u5', 'Sunita Rao', 'cancelled', '2026-04-13T10:59:01.909793Z', '2026-05-13T10:59:01.909793Z', 30, 'relocation', false);


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES
  ('d06b3fcf-065c-4fd5-bf9a-22c6e16b2dc9', 'CASE-2026-1009', 'Resignation submitted', '2026-04-13T10:59:01.909793Z', 'Rohan Das', 'employee');


INSERT INTO exit_cases (id, employee_id, employee_name, employee_email, employee_role, employee_dept, manager_id, manager_name, status, resignation_date, last_working_day, notice_period_days, exit_reason, escalated)
VALUES ('CASE-2026-1010', 'emp_4', 'Sita Ram', 'sita.ram@company.com', 'UI/UX Designer', 'Design', 'u11', 'Sunita Iyer', 'completed', '2026-01-07T10:59:01.909793Z', '2026-02-06T10:59:01.909793Z', 30, 'health', false);


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES
  ('5e176233-52dc-464b-8e36-b181e7900038', 'CASE-2026-1010', 'Resignation submitted', '2026-01-07T10:59:01.909793Z', 'Sita Ram', 'employee');


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES
  ('9a36b5a3-ca50-4f47-b9b6-354903a6219c', 'CASE-2026-1010', 'Manager approved', '2026-01-09T04:59:01.909793Z', 'Sunita Iyer', 'manager');


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('d4ad6ca5-d138-4016-b581-99afb89f53b5', 'CASE-2026-1010', 'manager', 'Manager Clearance', 'u2', 'Rahul Mehta', 'approved', 48, '2026-01-11T04:59:01.909793Z', '2026-01-09T14:59:01.909793Z', '2026-01-09T16:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('0ec166dd-adf2-4d05-83ed-6b89de92bbd5', 'd4ad6ca5-d138-4016-b581-99afb89f53b5', 'Standard check 1 completed', true, false, true, 1),
  ('4ca87883-037b-4b04-a923-f243fb91347e', 'd4ad6ca5-d138-4016-b581-99afb89f53b5', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('fe6b334c-b292-4f5e-80ab-31ff442c55b4', 'CASE-2026-1010', 'it', 'IT', 'u4', 'Kiran Patel', 'approved', 24, '2026-01-10T04:59:01.909793Z', '2026-01-09T10:59:01.909793Z', '2026-01-10T20:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('2a39ed7d-2c29-4c5b-beb5-d3f4155a8ca2', 'fe6b334c-b292-4f5e-80ab-31ff442c55b4', 'Standard check 1 completed', true, false, true, 1),
  ('12ad8fb4-9b26-47b9-9992-991c9c7b72c0', 'fe6b334c-b292-4f5e-80ab-31ff442c55b4', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('3b075853-3f30-476b-8b8a-502b6a9dc1e6', 'CASE-2026-1010', 'admin', 'Administration', 'u7', 'Admin Dept', 'approved', 24, '2026-01-10T04:59:01.909793Z', '2026-01-09T09:59:01.909793Z', '2026-01-09T22:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('286c5a97-d8c6-4e14-bc56-722c2a4b6e00', '3b075853-3f30-476b-8b8a-502b6a9dc1e6', 'Standard check 1 completed', true, false, true, 1),
  ('0760b090-b8e1-42e3-a3ec-7034fbdfe754', '3b075853-3f30-476b-8b8a-502b6a9dc1e6', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('d86a8cf3-6f86-47e8-97f0-b94a85b17be4', 'CASE-2026-1010', 'finance', 'Finance', 'u5', 'Sunita Rao', 'approved', 48, '2026-01-11T04:59:01.909793Z', '2026-01-09T06:59:01.909793Z', '2026-01-09T21:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('d5f6387c-0338-4486-b9f2-6b1a7b52ea94', 'd86a8cf3-6f86-47e8-97f0-b94a85b17be4', 'Standard check 1 completed', true, false, true, 1),
  ('e29ed3ad-a973-44d6-8a4a-7acd7bb9a25f', 'd86a8cf3-6f86-47e8-97f0-b94a85b17be4', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('eeed1645-6948-4e48-8b06-13ab4b56a160', 'CASE-2026-1010', 'procurement', 'Procurement', 'u8', 'Procurement', 'approved', 48, '2026-01-11T04:59:01.909793Z', '2026-01-09T13:59:01.909793Z', '2026-01-10T00:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('c9bf856c-7458-4786-8d15-11b2907b84b8', 'eeed1645-6948-4e48-8b06-13ab4b56a160', 'Standard check 1 completed', true, false, true, 1),
  ('a5d26775-9437-46a5-b735-514f46457325', 'eeed1645-6948-4e48-8b06-13ab4b56a160', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('f80cf912-3d71-4dc7-b6ea-dff3b0a631f9', 'CASE-2026-1010', 'infosec', 'Info Security', 'u9', 'InfoSec', 'approved', 24, '2026-01-10T04:59:01.909793Z', '2026-01-09T05:59:01.909793Z', '2026-01-10T17:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('a96f5bd5-97dd-4c71-a4d4-d77e8a0ec580', 'f80cf912-3d71-4dc7-b6ea-dff3b0a631f9', 'Standard check 1 completed', true, false, true, 1),
  ('355ffaa9-8ab7-4c1d-a5d5-c8c2eefa9d85', 'f80cf912-3d71-4dc7-b6ea-dff3b0a631f9', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('6a90417c-a9a9-414e-bab4-033cb15da7ae', 'CASE-2026-1010', 'hr', 'HR', 'u3', 'Anita Desai', 'approved', 72, '2026-01-12T04:59:01.909793Z', '2026-01-09T05:59:01.909793Z', '2026-01-09T18:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('a9f3e0da-7c51-4bbd-9345-bccaff391b2d', '6a90417c-a9a9-414e-bab4-033cb15da7ae', 'Standard check 1 completed', true, false, true, 1),
  ('0132f43a-a31c-4e59-bf5e-5582da466691', '6a90417c-a9a9-414e-bab4-033cb15da7ae', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('c4bd22d6-87fb-4758-be20-5f72d9b23e22', 'CASE-2026-1010', 'facilities', 'Facilities', 'u10', 'Facilities', 'approved', 24, '2026-01-10T04:59:01.909793Z', '2026-01-09T11:59:01.909793Z', '2026-01-09T19:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('69fc5978-c33f-4403-9cd9-ffa1e19f1bb5', 'c4bd22d6-87fb-4758-be20-5f72d9b23e22', 'Standard check 1 completed', true, false, true, 1),
  ('bbafdb1c-7381-4991-82fc-5cc03450af21', 'c4bd22d6-87fb-4758-be20-5f72d9b23e22', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES ('41e0cb15-531a-4d72-aff0-0ec63904d5f4', 'CASE-2026-1010', 'Clearance completed', '2026-02-04T10:59:01.909793Z', 'System', 'system');


INSERT INTO exit_interviews (case_id, overall_rating, management_rating, culture_rating, reason, improvements, would_rejoin, comments, completed_at)
VALUES ('CASE-2026-1010', 5, 5, 3, 'health', 'Great environment', true, 'Enjoyed my time here.', '2026-02-01T10:59:01.909793Z');


INSERT INTO exit_cases (id, employee_id, employee_name, employee_email, employee_role, employee_dept, manager_id, manager_name, status, resignation_date, last_working_day, notice_period_days, exit_reason, escalated)
VALUES ('CASE-2026-1011', 'emp_9', 'Amit Patel', 'amit.patel@company.com', 'Frontend Engineer', 'Engineering', 'u2', 'Rahul Mehta', 'completed', '2026-02-22T10:59:01.909793Z', '2026-03-24T10:59:01.909793Z', 30, 'compensation', false);


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES
  ('ff74eb27-0ce9-4bc5-a1cd-c3362251a4ce', 'CASE-2026-1011', 'Resignation submitted', '2026-02-22T10:59:01.909793Z', 'Amit Patel', 'employee');


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES
  ('b5f0d111-fe4e-4c50-a3dc-c51579412f45', 'CASE-2026-1011', 'Manager approved', '2026-02-24T04:59:01.909793Z', 'Rahul Mehta', 'manager');


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('8717999f-390d-4f09-af1f-324788cdd7c7', 'CASE-2026-1011', 'manager', 'Manager Clearance', 'u2', 'Rahul Mehta', 'approved', 48, '2026-02-26T04:59:01.909793Z', '2026-02-24T07:59:01.909793Z', '2026-02-25T18:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('01ba40d3-0e22-4b5f-bf38-748b73b82bcc', '8717999f-390d-4f09-af1f-324788cdd7c7', 'Standard check 1 completed', true, false, true, 1),
  ('074ccb57-6b0a-4e3e-a08f-4361e5187c54', '8717999f-390d-4f09-af1f-324788cdd7c7', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('954a5317-55a8-4a57-b12d-69b2e9f640a4', 'CASE-2026-1011', 'it', 'IT', 'u4', 'Kiran Patel', 'approved', 24, '2026-02-25T04:59:01.909793Z', '2026-02-24T05:59:01.909793Z', '2026-02-25T06:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('ec60ec09-fa24-41ae-8b84-5c12916983b5', '954a5317-55a8-4a57-b12d-69b2e9f640a4', 'Standard check 1 completed', true, false, true, 1),
  ('e4405cad-6b7e-462f-b494-d984aa224bb2', '954a5317-55a8-4a57-b12d-69b2e9f640a4', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('80193bf8-63bb-4711-830f-dad3ee6471b3', 'CASE-2026-1011', 'admin', 'Administration', 'u7', 'Admin Dept', 'approved', 24, '2026-02-25T04:59:01.909793Z', '2026-02-24T13:59:01.909793Z', '2026-02-25T03:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('f071f304-cffc-4575-93c3-9339aa2139c5', '80193bf8-63bb-4711-830f-dad3ee6471b3', 'Standard check 1 completed', true, false, true, 1),
  ('1b5d34e1-9e7d-4c33-b322-209dfd79edfe', '80193bf8-63bb-4711-830f-dad3ee6471b3', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('399e22ca-046a-47a6-89ce-f640ff791a53', 'CASE-2026-1011', 'finance', 'Finance', 'u5', 'Sunita Rao', 'approved', 48, '2026-02-26T04:59:01.909793Z', '2026-02-24T12:59:01.909793Z', '2026-02-24T16:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('64c349c8-a836-462e-b91e-9e7c126e3371', '399e22ca-046a-47a6-89ce-f640ff791a53', 'Standard check 1 completed', true, false, true, 1),
  ('b96cc7fc-6ea3-44c7-b185-ab538dc67a42', '399e22ca-046a-47a6-89ce-f640ff791a53', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('b17fcd2a-bb33-4caa-898b-c4224bbf743c', 'CASE-2026-1011', 'procurement', 'Procurement', 'u8', 'Procurement', 'approved', 48, '2026-02-26T04:59:01.909793Z', '2026-02-24T10:59:01.909793Z', '2026-02-24T18:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('213a61b7-7413-44ee-8d64-cf43124d13e2', 'b17fcd2a-bb33-4caa-898b-c4224bbf743c', 'Standard check 1 completed', true, false, true, 1),
  ('25a3d70c-156f-481a-a4d0-bfdf895f3fd0', 'b17fcd2a-bb33-4caa-898b-c4224bbf743c', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('cf6d9573-3400-4926-be7a-a691250a1360', 'CASE-2026-1011', 'infosec', 'Info Security', 'u9', 'InfoSec', 'approved', 24, '2026-02-25T04:59:01.909793Z', '2026-02-24T09:59:01.909793Z', '2026-02-25T17:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('390ab9dc-ef3c-428e-bba5-6df5790448f8', 'cf6d9573-3400-4926-be7a-a691250a1360', 'Standard check 1 completed', true, false, true, 1),
  ('122f9808-95ce-41c7-b593-59c44b86ca37', 'cf6d9573-3400-4926-be7a-a691250a1360', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('7d363b38-44c6-45d0-9c25-f61eecb9761d', 'CASE-2026-1011', 'hr', 'HR', 'u3', 'Anita Desai', 'approved', 72, '2026-02-27T04:59:01.909793Z', '2026-02-24T12:59:01.909793Z', '2026-02-24T21:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('130b5d01-bd6e-4074-b43d-e3c61ea1238a', '7d363b38-44c6-45d0-9c25-f61eecb9761d', 'Standard check 1 completed', true, false, true, 1),
  ('8f8653d7-c6a9-40dc-9edb-a32dc9cbec55', '7d363b38-44c6-45d0-9c25-f61eecb9761d', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('79163d58-bd2e-4d39-a200-047274bce4cd', 'CASE-2026-1011', 'facilities', 'Facilities', 'u10', 'Facilities', 'approved', 24, '2026-02-25T04:59:01.909793Z', '2026-02-24T12:59:01.909793Z', '2026-02-25T06:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('439acbb2-f11d-420c-ae54-e3570eb20b1f', '79163d58-bd2e-4d39-a200-047274bce4cd', 'Standard check 1 completed', true, false, true, 1),
  ('200c2018-d3f0-4519-a273-4ec356c686e7', '79163d58-bd2e-4d39-a200-047274bce4cd', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES ('7828feb1-2fd7-4f2a-a3db-a966db232ba2', 'CASE-2026-1011', 'Clearance completed', '2026-03-22T10:59:01.909793Z', 'System', 'system');


INSERT INTO exit_interviews (case_id, overall_rating, management_rating, culture_rating, reason, improvements, would_rejoin, comments, completed_at)
VALUES ('CASE-2026-1011', 3, 4, 4, 'compensation', 'Great environment', true, 'Enjoyed my time here.', '2026-03-19T10:59:01.909793Z');


INSERT INTO exit_cases (id, employee_id, employee_name, employee_email, employee_role, employee_dept, manager_id, manager_name, status, resignation_date, last_working_day, notice_period_days, exit_reason, escalated)
VALUES ('CASE-2026-1012', 'emp_4', 'Sita Ram', 'sita.ram@company.com', 'UI/UX Designer', 'Design', 'u11', 'Sunita Iyer', 'pending_manager', '2026-06-07T10:59:01.909793Z', '2026-07-07T10:59:01.909793Z', 30, 'relocation', false);


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES
  ('fd91c515-6274-48e0-930b-5a3ea2d21805', 'CASE-2026-1012', 'Resignation submitted', '2026-06-07T10:59:01.909793Z', 'Sita Ram', 'employee');


INSERT INTO exit_cases (id, employee_id, employee_name, employee_email, employee_role, employee_dept, manager_id, manager_name, status, resignation_date, last_working_day, notice_period_days, exit_reason, escalated)
VALUES ('CASE-2026-1013', 'emp_2', 'Meera Krishnan', 'meera.krishnan@company.com', 'QA Engineer', 'Testing', 'u2', 'Rahul Mehta', 'completed', '2026-02-18T10:59:01.909793Z', '2026-03-20T10:59:01.909793Z', 30, 'relocation', false);


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES
  ('4aaa4f92-a675-41e2-8b9a-4b7ef1bc88af', 'CASE-2026-1013', 'Resignation submitted', '2026-02-18T10:59:01.909793Z', 'Meera Krishnan', 'employee');


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES
  ('be11528a-9fa3-4580-bc3d-6c1bea77cf4c', 'CASE-2026-1013', 'Manager approved', '2026-02-19T09:59:01.909793Z', 'Rahul Mehta', 'manager');


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('0f0b5950-30e3-4006-bddb-6df8c776f6c3', 'CASE-2026-1013', 'manager', 'Manager Clearance', 'u2', 'Rahul Mehta', 'approved', 48, '2026-02-21T09:59:01.909793Z', '2026-02-19T10:59:01.909793Z', '2026-02-20T13:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('ebc15e91-9037-44d3-95f6-075279203e9f', '0f0b5950-30e3-4006-bddb-6df8c776f6c3', 'Standard check 1 completed', true, false, true, 1),
  ('74750a6e-af5b-44b8-9dfc-783885f47181', '0f0b5950-30e3-4006-bddb-6df8c776f6c3', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('b1e9faf6-4a46-49af-a8c2-c8c91c187efb', 'CASE-2026-1013', 'it', 'IT', 'u4', 'Kiran Patel', 'approved', 24, '2026-02-20T09:59:01.909793Z', '2026-02-19T15:59:01.909793Z', '2026-02-20T01:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('6304c5fb-d61c-43cd-b7ff-149896ed9890', 'b1e9faf6-4a46-49af-a8c2-c8c91c187efb', 'Standard check 1 completed', true, false, true, 1),
  ('0ddeae3e-7e49-4aa2-b878-9137f5f64648', 'b1e9faf6-4a46-49af-a8c2-c8c91c187efb', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('be6195d3-4817-4add-8a19-ec83883239e7', 'CASE-2026-1013', 'admin', 'Administration', 'u7', 'Admin Dept', 'approved', 24, '2026-02-20T09:59:01.909793Z', '2026-02-19T19:59:01.909793Z', '2026-02-19T20:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('1f37681b-5fb3-472c-a0a0-159ef665c6da', 'be6195d3-4817-4add-8a19-ec83883239e7', 'Standard check 1 completed', true, false, true, 1),
  ('c94dd06d-64c4-4b80-bae5-48e48859f217', 'be6195d3-4817-4add-8a19-ec83883239e7', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('98e6ef9f-9a03-4530-8552-4056f86c57dd', 'CASE-2026-1013', 'finance', 'Finance', 'u5', 'Sunita Rao', 'approved', 48, '2026-02-21T09:59:01.909793Z', '2026-02-19T16:59:01.909793Z', '2026-02-20T18:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('d900b72a-a617-4389-9271-6fedc19a9339', '98e6ef9f-9a03-4530-8552-4056f86c57dd', 'Standard check 1 completed', true, false, true, 1),
  ('b59e5a51-6f8f-4215-a16b-85fa7161f261', '98e6ef9f-9a03-4530-8552-4056f86c57dd', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('13cfd771-3bcf-4570-985b-14b96c244d92', 'CASE-2026-1013', 'procurement', 'Procurement', 'u8', 'Procurement', 'approved', 48, '2026-02-21T09:59:01.909793Z', '2026-02-19T11:59:01.909793Z', '2026-02-21T00:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('b757c56a-beb4-4fa9-8669-35e720085918', '13cfd771-3bcf-4570-985b-14b96c244d92', 'Standard check 1 completed', true, false, true, 1),
  ('04c94c0d-8a77-4106-ab90-13ff42a7ffd8', '13cfd771-3bcf-4570-985b-14b96c244d92', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('3f30d17c-b6f6-408d-868b-6076be95bc2e', 'CASE-2026-1013', 'infosec', 'Info Security', 'u9', 'InfoSec', 'approved', 24, '2026-02-20T09:59:01.909793Z', '2026-02-19T12:59:01.909793Z', '2026-02-20T10:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('b9cf80c6-8285-4303-b1e9-b32699d46c08', '3f30d17c-b6f6-408d-868b-6076be95bc2e', 'Standard check 1 completed', true, false, true, 1),
  ('fc63ff01-15b2-4705-ad73-0a431fc168e2', '3f30d17c-b6f6-408d-868b-6076be95bc2e', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('f0235abf-a5a2-4884-9389-afc8216f10f5', 'CASE-2026-1013', 'hr', 'HR', 'u3', 'Anita Desai', 'approved', 72, '2026-02-22T09:59:01.909793Z', '2026-02-19T19:59:01.909793Z', '2026-02-20T21:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('068881a8-386c-48d6-a33c-6d240421ca82', 'f0235abf-a5a2-4884-9389-afc8216f10f5', 'Standard check 1 completed', true, false, true, 1),
  ('9a00ad07-2b41-4338-9fce-8b1925562077', 'f0235abf-a5a2-4884-9389-afc8216f10f5', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('c9197342-85eb-43f6-a940-19e24905324c', 'CASE-2026-1013', 'facilities', 'Facilities', 'u10', 'Facilities', 'approved', 24, '2026-02-20T09:59:01.909793Z', '2026-02-19T10:59:01.909793Z', '2026-02-20T10:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('0cbebeec-2f2d-4da3-ac79-7b15aad9586a', 'c9197342-85eb-43f6-a940-19e24905324c', 'Standard check 1 completed', true, false, true, 1),
  ('5194633f-0443-455f-a779-27aee8634173', 'c9197342-85eb-43f6-a940-19e24905324c', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES ('02fcd9a3-410c-4570-837f-ab7b0c8ca303', 'CASE-2026-1013', 'Clearance completed', '2026-03-18T10:59:01.909793Z', 'System', 'system');


INSERT INTO exit_interviews (case_id, overall_rating, management_rating, culture_rating, reason, improvements, would_rejoin, comments, completed_at)
VALUES ('CASE-2026-1013', 5, 3, 4, 'relocation', 'Great environment', true, 'Enjoyed my time here.', '2026-03-15T10:59:01.909793Z');


INSERT INTO exit_cases (id, employee_id, employee_name, employee_email, employee_role, employee_dept, manager_id, manager_name, status, resignation_date, last_working_day, notice_period_days, exit_reason, escalated)
VALUES ('CASE-2026-1014', 'emp_5', 'Vikram Singh', 'vikram.singh@company.com', 'DevOps Engineer', 'IT', 'u4', 'Kiran Patel', 'in_clearance', '2026-05-29T10:59:01.909793Z', '2026-06-28T10:59:01.909793Z', 30, 'health', false);


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES
  ('1b4374af-707a-4584-af55-61c0fb3cc4c1', 'CASE-2026-1014', 'Resignation submitted', '2026-05-29T10:59:01.909793Z', 'Vikram Singh', 'employee');


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES
  ('b015ef0a-e3f6-4846-babc-7a3801f05d24', 'CASE-2026-1014', 'Manager approved', '2026-05-29T14:59:01.909793Z', 'Kiran Patel', 'manager');


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('d4174e49-5531-481d-9936-21d1c7116576', 'CASE-2026-1014', 'manager', 'Manager Clearance', 'u2', 'Rahul Mehta', 'approved', 48, '2026-05-31T14:59:01.909793Z', '2026-05-29T14:59:01.909793Z', '2026-05-29T14:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('5a4dc10b-15f8-41e3-8904-74424fd73184', 'd4174e49-5531-481d-9936-21d1c7116576', 'Standard check 1 completed', true, false, true, 1),
  ('c9e12c57-7921-4093-b9af-ec85bd09e23f', 'd4174e49-5531-481d-9936-21d1c7116576', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('19659687-62a7-4154-9f17-cf9bc010b405', 'CASE-2026-1014', 'it', 'IT', 'u4', 'Kiran Patel', 'pending', 24, '2026-05-30T14:59:01.909793Z', NULL, NULL);


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES ('e5815023-e19c-4e17-b9b9-a973dcbdb3d7', 'CASE-2026-1014', 'Administration clearance approved', '2026-05-30T21:59:01.909793Z', 'Admin Dept', 'dept_approver');


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('37fd51f3-ef33-4558-8b44-9bceaba672a2', 'CASE-2026-1014', 'admin', 'Administration', 'u7', 'Admin Dept', 'approved', 24, '2026-05-30T14:59:01.909793Z', '2026-05-29T15:59:01.909793Z', '2026-05-30T21:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('30c12a1b-db0c-47e8-b04a-bced400132c5', '37fd51f3-ef33-4558-8b44-9bceaba672a2', 'Standard check 1 completed', true, false, true, 1),
  ('ef0d573f-3194-4f51-87c7-c65a7451138d', '37fd51f3-ef33-4558-8b44-9bceaba672a2', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('d0c2a74f-2acf-4ede-9655-8758e82a04e9', 'CASE-2026-1014', 'finance', 'Finance', 'u5', 'Sunita Rao', 'in_progress', 48, '2026-05-31T14:59:01.909793Z', '2026-05-29T19:59:01.909793Z', NULL);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('41ed7f0c-61d8-42c1-a7da-b8b5369406c6', 'CASE-2026-1014', 'procurement', 'Procurement', 'u8', 'Procurement', 'pending', 48, '2026-05-31T14:59:01.909793Z', NULL, NULL);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('2ef4e8cf-7ffd-4240-a7a0-5a5032f1ef8f', 'CASE-2026-1014', 'infosec', 'Info Security', 'u9', 'InfoSec', 'pending', 24, '2026-05-30T14:59:01.909793Z', NULL, NULL);


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES ('8b12ce5d-b4fe-415c-b78c-52dff432ea8d', 'CASE-2026-1014', 'HR clearance approved', '2026-05-30T17:59:01.909793Z', 'Anita Desai', 'dept_approver');


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('044963a2-fa75-4678-9d48-53804a7e7ad0', 'CASE-2026-1014', 'hr', 'HR', 'u3', 'Anita Desai', 'approved', 72, '2026-06-01T14:59:01.909793Z', '2026-05-29T20:59:01.909793Z', '2026-05-30T17:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('8e9729d6-119d-44a6-9089-36c654c392f0', '044963a2-fa75-4678-9d48-53804a7e7ad0', 'Standard check 1 completed', true, false, true, 1),
  ('a859b3e1-340b-43c5-bdc5-8f5a7a2fa312', '044963a2-fa75-4678-9d48-53804a7e7ad0', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES ('1b6392b5-6bbd-4e08-8009-75d78ba3759e', 'CASE-2026-1014', 'Facilities clearance approved', '2026-05-31T01:59:01.909793Z', 'Facilities', 'dept_approver');


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('a912f3f1-b8b7-46f4-91ae-4a628a13215f', 'CASE-2026-1014', 'facilities', 'Facilities', 'u10', 'Facilities', 'approved', 24, '2026-05-30T14:59:01.909793Z', '2026-05-29T15:59:01.909793Z', '2026-05-31T01:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('74c26be6-d3b4-4bcf-8527-189bb69b30d9', 'a912f3f1-b8b7-46f4-91ae-4a628a13215f', 'Standard check 1 completed', true, false, true, 1),
  ('9e3706a0-3f06-4f3e-8f38-c59c180ddc74', 'a912f3f1-b8b7-46f4-91ae-4a628a13215f', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO exit_cases (id, employee_id, employee_name, employee_email, employee_role, employee_dept, manager_id, manager_name, status, resignation_date, last_working_day, notice_period_days, exit_reason, escalated)
VALUES ('CASE-2026-1015', 'emp_7', 'Rohan Das', 'rohan.das@company.com', 'Financial Analyst', 'Finance', 'u5', 'Sunita Rao', 'in_clearance', '2026-05-20T10:59:01.909793Z', '2026-06-19T10:59:01.909793Z', 30, 'higher_studies', false);


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES
  ('0adb0231-4341-439e-96c0-65684f37c950', 'CASE-2026-1015', 'Resignation submitted', '2026-05-20T10:59:01.909793Z', 'Rohan Das', 'employee');


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES
  ('e41ea237-4628-4342-8696-9e01120cb3a2', 'CASE-2026-1015', 'Manager approved', '2026-05-22T06:59:01.909793Z', 'Sunita Rao', 'manager');


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('f07cac1c-a742-4922-bf2e-90f75e651e0b', 'CASE-2026-1015', 'manager', 'Manager Clearance', 'u2', 'Rahul Mehta', 'approved', 48, '2026-05-24T06:59:01.909793Z', '2026-05-22T06:59:01.909793Z', '2026-05-22T06:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('e86f726a-8f06-484e-8d56-ffc1e1105e6a', 'f07cac1c-a742-4922-bf2e-90f75e651e0b', 'Standard check 1 completed', true, false, true, 1),
  ('88789f2d-46f2-4ac7-86f4-efb1b25dba87', 'f07cac1c-a742-4922-bf2e-90f75e651e0b', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES ('232a928b-4d17-44e8-90eb-a5ddfbb3f752', 'CASE-2026-1015', 'IT clearance approved', '2026-05-23T09:59:01.909793Z', 'Kiran Patel', 'dept_approver');


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('c97c4c79-3ee9-4f11-986d-51dc5b12f07b', 'CASE-2026-1015', 'it', 'IT', 'u4', 'Kiran Patel', 'approved', 24, '2026-05-23T06:59:01.909793Z', '2026-05-22T12:59:01.909793Z', '2026-05-23T09:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('1fe43e48-f799-4f50-88eb-becae0b997b0', 'c97c4c79-3ee9-4f11-986d-51dc5b12f07b', 'Standard check 1 completed', true, false, true, 1),
  ('3afe7470-6231-4390-ad99-5cac64f1cfd8', 'c97c4c79-3ee9-4f11-986d-51dc5b12f07b', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('0b77aa97-46b9-4fee-9ef6-d63dd4cfe4f6', 'CASE-2026-1015', 'admin', 'Administration', 'u7', 'Admin Dept', 'in_progress', 24, '2026-05-23T06:59:01.909793Z', '2026-05-22T08:59:01.909793Z', NULL);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('2b511c54-b221-4436-a2c6-4919c410253c', 'CASE-2026-1015', 'finance', 'Finance', 'u5', 'Sunita Rao', 'in_progress', 48, '2026-05-24T06:59:01.909793Z', '2026-05-22T16:59:01.909793Z', NULL);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('1973ac71-0890-4bb6-a405-fda16a467ae5', 'CASE-2026-1015', 'procurement', 'Procurement', 'u8', 'Procurement', 'in_progress', 48, '2026-05-24T06:59:01.909793Z', '2026-05-22T09:59:01.909793Z', NULL);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('f7a21fae-18be-484a-b4e4-885b67f08742', 'CASE-2026-1015', 'infosec', 'Info Security', 'u9', 'InfoSec', 'pending', 24, '2026-05-23T06:59:01.909793Z', NULL, NULL);


INSERT INTO timeline_events (id, case_id, label, timestamp, actor, actor_role)
VALUES ('7e34eb86-a640-4e44-8948-571214517674', 'CASE-2026-1015', 'HR clearance approved', '2026-05-22T17:59:01.909793Z', 'Anita Desai', 'dept_approver');


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('5b108919-f149-42a6-86db-21af491a9161', 'CASE-2026-1015', 'hr', 'HR', 'u3', 'Anita Desai', 'approved', 72, '2026-05-25T06:59:01.909793Z', '2026-05-22T14:59:01.909793Z', '2026-05-22T17:59:01.909793Z');


INSERT INTO checklist_items (id, task_id, label, is_mandatory, has_input, checked, sort_order)
VALUES 
  ('14f5c1bb-1daa-4a5d-8c94-a189f93f7e1a', '5b108919-f149-42a6-86db-21af491a9161', 'Standard check 1 completed', true, false, true, 1),
  ('f01d2ef1-5830-490c-ac9c-8478e6adf690', '5b108919-f149-42a6-86db-21af491a9161', 'Standard check 2 completed', true, false, true, 2);


INSERT INTO clearance_tasks (id, case_id, dept_id, dept_label, assignee_id, assignee_name, status, sla_hours, sla_due_at, started_at, completed_at)
VALUES ('fb6242ab-3f34-4648-9068-254623888398', 'CASE-2026-1015', 'facilities', 'Facilities', 'u10', 'Facilities', 'overdue', 24, '2026-05-23T06:59:01.909793Z', '2026-05-22T12:59:01.909793Z', NULL);
