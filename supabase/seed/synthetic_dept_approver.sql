-- =============================================================================
-- Seed: synthetic_dept_approver.sql
-- Purpose:
--   Assign the real Clerk user "Sengo Dep" (sengottayan2003@gmail.com) as
--   primary department approver for all 6 clearance departments.
--
-- Architecture notes:
--   • This is SEED data only — NOT a schema migration.
--   • We do NOT modify users.dept (legacy column, not used by new architecture).
--   • We do NOT reassign existing clearance tasks (preserves realistic ownership).
--   • The frontend queries tasks by department_id (t.deptId ∈ assignedDeptIds),
--     NOT by assignee_id, so Sengo Dep sees all tasks across their departments.
--
-- KPI Definitions (implemented in DeptApproverDashboard & TasksPage):
--   SLA On-Time %    = completed tasks where completedAt ≤ slaDueAt  / total completed
--   Overdue %        = active tasks where slaDueAt < now()           / total active+completed
--   At Risk %        = 100 - onTime% - overdue%  (min 0)
--   Avg Completion   = mean of (completedAt − startedAt) in days
--   Overdue Count    = active tasks where slaDueAt < now()
-- =============================================================================

-- Sengo Dep's Clerk user ID (from live DB snapshot, 2026-06-10)
-- Email: sengottayan2003@gmail.com
-- Role:  dept_approver

INSERT INTO department_assignments (user_id, department, dept_label, authority, is_active)
VALUES
  ('user_3EsJXdzoKPi9Zef4tejTlhvZJes', 'it',          'IT',             'primary', true),
  ('user_3EsJXdzoKPi9Zef4tejTlhvZJes', 'finance',     'Finance',        'primary', true),
  ('user_3EsJXdzoKPi9Zef4tejTlhvZJes', 'admin',       'Administration', 'primary', true),
  ('user_3EsJXdzoKPi9Zef4tejTlhvZJes', 'infosec',     'Info Security',  'primary', true),
  ('user_3EsJXdzoKPi9Zef4tejTlhvZJes', 'procurement', 'Procurement',    'primary', true),
  ('user_3EsJXdzoKPi9Zef4tejTlhvZJes', 'facilities',  'Facilities',     'primary', true)
ON CONFLICT (user_id, department) DO NOTHING;
