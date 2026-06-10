import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

// ⚠️  ONE-TIME USE ROUTE — Delete this file after running.
// Call: GET /api/run-migrations to seed all manager synthetic data.
// NOTE: Database views (00016) must be applied via Supabase Studio SQL editor.

export async function GET() {
  const supabase = createServerSupabase();
  const results: Record<string, any> = {};

  // ── 1. Seed Users ──────────────────────────────────────────────────────────
  const { error: usersErr } = await supabase.from("users").upsert([
    { id: "usr_mgr_004", email: "aryan.kapoor@offboardiq.com",   role: "manager",  name: "Aryan Kapoor",    dept: "Sales",       employee_id: "MGR-2004", manager_id: null },
    { id: "usr_emp_101", email: "deepa.rajan@offboardiq.com",    role: "employee", name: "Deepa Rajan",     dept: "Sales",       employee_id: "EMP-3001", manager_id: "usr_mgr_004" },
    { id: "usr_emp_102", email: "sameer.khan@offboardiq.com",    role: "employee", name: "Sameer Khan",     dept: "Sales",       employee_id: "EMP-3002", manager_id: "usr_mgr_004" },
    { id: "usr_emp_103", email: "lakshmi.nair@offboardiq.com",   role: "employee", name: "Lakshmi Nair",    dept: "Sales",       employee_id: "EMP-3003", manager_id: "usr_mgr_004" },
    { id: "usr_emp_104", email: "abhishek.jain@offboardiq.com",  role: "employee", name: "Abhishek Jain",   dept: "Sales",       employee_id: "EMP-3004", manager_id: "usr_mgr_004" },
    { id: "usr_emp_105", email: "pooja.verma@offboardiq.com",    role: "employee", name: "Pooja Verma",     dept: "Marketing",   employee_id: "EMP-3005", manager_id: "usr_mgr_004" },
    { id: "usr_emp_106", email: "nikhil.chandra@offboardiq.com", role: "employee", name: "Nikhil Chandra",  dept: "Engineering", employee_id: "EMP-3006", manager_id: "usr_mgr_004" },
    { id: "usr_emp_107", email: "ritu.menon@offboardiq.com",     role: "employee", name: "Ritu Menon",      dept: "Design",      employee_id: "EMP-3007", manager_id: "usr_mgr_004" },
    { id: "usr_emp_108", email: "girish.pai@offboardiq.com",     role: "employee", name: "Girish Pai",      dept: "Product",     employee_id: "EMP-3008", manager_id: "usr_mgr_004" },
    { id: "usr_emp_109", email: "swetha.rao@offboardiq.com",     role: "employee", name: "Swetha Rao",      dept: "Sales",       employee_id: "EMP-3009", manager_id: "usr_mgr_004" },
    { id: "usr_emp_110", email: "vijay.kumar@offboardiq.com",    role: "employee", name: "Vijay Kumar",     dept: "Sales",       employee_id: "EMP-3010", manager_id: "usr_mgr_004" },
    { id: "usr_emp_111", email: "meena.iyer@offboardiq.com",     role: "employee", name: "Meena Iyer",      dept: "Operations",  employee_id: "EMP-3011", manager_id: "usr_mgr_004" },
    { id: "usr_emp_112", email: "praveen.das@offboardiq.com",    role: "employee", name: "Praveen Das",     dept: "Finance",     employee_id: "EMP-3012", manager_id: "usr_mgr_004" },
  ], { onConflict: "id" });
  results.users = usersErr ? { error: usersErr.message } : { ok: true };

  // ── 2. Seed Exit Cases ─────────────────────────────────────────────────────
  const now = new Date();
  const ago  = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();
  const ahead = (n: number) => new Date(now.getTime() + n * 86400000).toISOString();

  const { error: casesErr } = await supabase.from("legacy_exit_cases").upsert([
    { id: "EXIT-MGR-2001", employee_id: "usr_emp_101", employee_name: "Deepa Rajan",    employee_email: "deepa.rajan@offboardiq.com",    employee_role: "Sales Executive",     employee_dept: "Sales",       manager_id: "usr_mgr_004", manager_name: "Aryan Kapoor", manager_email: "aryan.kapoor@offboardiq.com", status: "pending_manager", resignation_date: ago(2),  last_working_day: ahead(28), notice_period_days: 30, exit_reason: "better_opportunity" },
    { id: "EXIT-MGR-2002", employee_id: "usr_emp_102", employee_name: "Sameer Khan",    employee_email: "sameer.khan@offboardiq.com",    employee_role: "Account Manager",     employee_dept: "Sales",       manager_id: "usr_mgr_004", manager_name: "Aryan Kapoor", manager_email: "aryan.kapoor@offboardiq.com", status: "pending_manager", resignation_date: ago(4),  last_working_day: ahead(26), notice_period_days: 30, exit_reason: "compensation" },
    { id: "EXIT-MGR-2003", employee_id: "usr_emp_110", employee_name: "Vijay Kumar",    employee_email: "vijay.kumar@offboardiq.com",    employee_role: "Sales Coordinator",   employee_dept: "Sales",       manager_id: "usr_mgr_004", manager_name: "Aryan Kapoor", manager_email: "aryan.kapoor@offboardiq.com", status: "pending_manager", resignation_date: ago(6),  last_working_day: ahead(24), notice_period_days: 30, exit_reason: "work_environment" },
    { id: "EXIT-MGR-2004", employee_id: "usr_emp_103", employee_name: "Lakshmi Nair",   employee_email: "lakshmi.nair@offboardiq.com",   employee_role: "Senior Sales Exec",   employee_dept: "Sales",       manager_id: "usr_mgr_004", manager_name: "Aryan Kapoor", manager_email: "aryan.kapoor@offboardiq.com", status: "in_clearance",    resignation_date: ago(20), last_working_day: ahead(10), notice_period_days: 30, exit_reason: "relocation" },
    { id: "EXIT-MGR-2005", employee_id: "usr_emp_104", employee_name: "Abhishek Jain",  employee_email: "abhishek.jain@offboardiq.com",  employee_role: "Sales Manager",       employee_dept: "Sales",       manager_id: "usr_mgr_004", manager_name: "Aryan Kapoor", manager_email: "aryan.kapoor@offboardiq.com", status: "in_clearance",    resignation_date: ago(25), last_working_day: ahead(5),  notice_period_days: 30, exit_reason: "personal" },
    { id: "EXIT-MGR-2006", employee_id: "usr_emp_105", employee_name: "Pooja Verma",    employee_email: "pooja.verma@offboardiq.com",    employee_role: "Marketing Executive", employee_dept: "Marketing",   manager_id: "usr_mgr_004", manager_name: "Aryan Kapoor", manager_email: "aryan.kapoor@offboardiq.com", status: "in_clearance",    resignation_date: ago(30), last_working_day: ahead(2),  notice_period_days: 32, exit_reason: "higher_studies" },
    { id: "EXIT-MGR-2007", employee_id: "usr_emp_106", employee_name: "Nikhil Chandra", employee_email: "nikhil.chandra@offboardiq.com", employee_role: "Software Engineer",   employee_dept: "Engineering", manager_id: "usr_mgr_004", manager_name: "Aryan Kapoor", manager_email: "aryan.kapoor@offboardiq.com", status: "in_clearance",    resignation_date: ago(35), last_working_day: ago(1),    notice_period_days: 34, exit_reason: "better_opportunity" },
    { id: "EXIT-MGR-2008", employee_id: "usr_emp_107", employee_name: "Ritu Menon",     employee_email: "ritu.menon@offboardiq.com",     employee_role: "UI Designer",         employee_dept: "Design",      manager_id: "usr_mgr_004", manager_name: "Aryan Kapoor", manager_email: "aryan.kapoor@offboardiq.com", status: "cancelled",       resignation_date: ago(45), last_working_day: ago(15),   notice_period_days: 30, exit_reason: "personal" },
    { id: "EXIT-MGR-2009", employee_id: "usr_emp_108", employee_name: "Girish Pai",     employee_email: "girish.pai@offboardiq.com",     employee_role: "Product Manager",     employee_dept: "Product",     manager_id: "usr_mgr_004", manager_name: "Aryan Kapoor", manager_email: "aryan.kapoor@offboardiq.com", status: "completed",       resignation_date: ago(60), last_working_day: ago(30),   notice_period_days: 30, exit_reason: "compensation" },
    { id: "EXIT-MGR-2010", employee_id: "usr_emp_109", employee_name: "Swetha Rao",     employee_email: "swetha.rao@offboardiq.com",     employee_role: "Sales Lead",          employee_dept: "Sales",       manager_id: "usr_mgr_004", manager_name: "Aryan Kapoor", manager_email: "aryan.kapoor@offboardiq.com", status: "completed",       resignation_date: ago(75), last_working_day: ago(45),   notice_period_days: 30, exit_reason: "relocation" },
    { id: "EXIT-MGR-2011", employee_id: "usr_emp_111", employee_name: "Meena Iyer",     employee_email: "meena.iyer@offboardiq.com",     employee_role: "Operations Analyst",  employee_dept: "Operations",  manager_id: "usr_mgr_004", manager_name: "Aryan Kapoor", manager_email: "aryan.kapoor@offboardiq.com", status: "completed",       resignation_date: ago(85), last_working_day: ago(55),   notice_period_days: 30, exit_reason: "better_opportunity" },
    { id: "EXIT-MGR-2012", employee_id: "usr_emp_112", employee_name: "Praveen Das",    employee_email: "praveen.das@offboardiq.com",    employee_role: "Finance Analyst",     employee_dept: "Finance",     manager_id: "usr_mgr_004", manager_name: "Aryan Kapoor", manager_email: "aryan.kapoor@offboardiq.com", status: "completed",       resignation_date: ago(95), last_working_day: ago(65),   notice_period_days: 30, exit_reason: "higher_studies" },
  ], { onConflict: "id" });
  results.cases = casesErr ? { error: casesErr.message } : { ok: true };

  // ── 3. Seed Clearance Tasks ────────────────────────────────────────────────
  const { error: tasksErr } = await supabase.from("legacy_clearance_tasks").upsert([
    // EXIT-MGR-2004 — on track
    { id: "ct-2004-mgr", case_id: "EXIT-MGR-2004", dept_id: "manager", dept_label: "Manager Clearance", assignee_id: "usr_mgr_004", assignee_name: "Aryan Kapoor", status: "approved", sla_hours: 48, sla_due_at: ago(17),  completed_at: ago(16) },
    { id: "ct-2004-it",  case_id: "EXIT-MGR-2004", dept_id: "it",      dept_label: "IT",                assignee_id: "usr_it_001",  assignee_name: "Kiran Patel",  status: "approved", sla_hours: 24, sla_due_at: ago(15),  completed_at: ago(14) },
    { id: "ct-2004-fin", case_id: "EXIT-MGR-2004", dept_id: "finance",  dept_label: "Finance",           assignee_id: "usr_fin_001", assignee_name: "Sunita Rao",   status: "pending",  sla_hours: 48, sla_due_at: ahead(5), completed_at: null },
    { id: "ct-2004-hr",  case_id: "EXIT-MGR-2004", dept_id: "hr",       dept_label: "HR",                assignee_id: "usr_hr_001",  assignee_name: "Anita Desai",  status: "pending",  sla_hours: 72, sla_due_at: ahead(8), completed_at: null },
    // EXIT-MGR-2006 — 1 overdue
    { id: "ct-2006-mgr", case_id: "EXIT-MGR-2006", dept_id: "manager", dept_label: "Manager Clearance", assignee_id: "usr_mgr_004", assignee_name: "Aryan Kapoor", status: "approved", sla_hours: 48, sla_due_at: ago(27),  completed_at: ago(26) },
    { id: "ct-2006-it",  case_id: "EXIT-MGR-2006", dept_id: "it",      dept_label: "IT",                assignee_id: "usr_it_001",  assignee_name: "Kiran Patel",  status: "approved", sla_hours: 24, sla_due_at: ago(24),  completed_at: ago(23) },
    { id: "ct-2006-fin", case_id: "EXIT-MGR-2006", dept_id: "finance",  dept_label: "Finance",           assignee_id: "usr_fin_001", assignee_name: "Sunita Rao",   status: "pending",  sla_hours: 48, sla_due_at: ago(5),   completed_at: null },
    { id: "ct-2006-hr",  case_id: "EXIT-MGR-2006", dept_id: "hr",       dept_label: "HR",                assignee_id: "usr_hr_001",  assignee_name: "Anita Desai",  status: "pending",  sla_hours: 72, sla_due_at: ahead(3), completed_at: null },
    // EXIT-MGR-2007 — multiple overdue
    { id: "ct-2007-mgr", case_id: "EXIT-MGR-2007", dept_id: "manager", dept_label: "Manager Clearance", assignee_id: "usr_mgr_004", assignee_name: "Aryan Kapoor", status: "approved", sla_hours: 48, sla_due_at: ago(32),  completed_at: ago(30) },
    { id: "ct-2007-it",  case_id: "EXIT-MGR-2007", dept_id: "it",      dept_label: "IT",                assignee_id: "usr_it_001",  assignee_name: "Kiran Patel",  status: "pending",  sla_hours: 24, sla_due_at: ago(10),  completed_at: null },
    { id: "ct-2007-fin", case_id: "EXIT-MGR-2007", dept_id: "finance",  dept_label: "Finance",           assignee_id: "usr_fin_001", assignee_name: "Sunita Rao",   status: "pending",  sla_hours: 48, sla_due_at: ago(8),   completed_at: null },
    { id: "ct-2007-hr",  case_id: "EXIT-MGR-2007", dept_id: "hr",       dept_label: "HR",                assignee_id: "usr_hr_001",  assignee_name: "Anita Desai",  status: "pending",  sla_hours: 72, sla_due_at: ago(3),   completed_at: null },
    // EXIT-MGR-2009 — completed
    { id: "ct-2009-mgr", case_id: "EXIT-MGR-2009", dept_id: "manager", dept_label: "Manager Clearance", assignee_id: "usr_mgr_004", assignee_name: "Aryan Kapoor", status: "approved", sla_hours: 48, sla_due_at: ago(57),  completed_at: ago(56) },
    { id: "ct-2009-it",  case_id: "EXIT-MGR-2009", dept_id: "it",      dept_label: "IT",                assignee_id: "usr_it_001",  assignee_name: "Kiran Patel",  status: "approved", sla_hours: 24, sla_due_at: ago(55),  completed_at: ago(54) },
    { id: "ct-2009-fin", case_id: "EXIT-MGR-2009", dept_id: "finance",  dept_label: "Finance",           assignee_id: "usr_fin_001", assignee_name: "Sunita Rao",   status: "approved", sla_hours: 48, sla_due_at: ago(50),  completed_at: ago(49) },
    { id: "ct-2009-hr",  case_id: "EXIT-MGR-2009", dept_id: "hr",       dept_label: "HR",                assignee_id: "usr_hr_001",  assignee_name: "Anita Desai",  status: "approved", sla_hours: 72, sla_due_at: ago(45),  completed_at: ago(44) },
  ], { onConflict: "id" });
  results.tasks = tasksErr ? { error: tasksErr.message } : { ok: true };

  // ── 4. Seed Timeline Events ────────────────────────────────────────────────
  const { error: timelineErr } = await supabase.from("timeline_events").insert([
    { id: "te-mgr-01", case_id: "EXIT-MGR-2001", actor: "Deepa Rajan",  actor_role: "employee",      label: "Resignation Submitted",          is_pending: true,  timestamp: ago(2) },
    { id: "te-mgr-02", case_id: "EXIT-MGR-2002", actor: "Sameer Khan",  actor_role: "employee",      label: "Resignation Submitted",          is_pending: true,  timestamp: ago(4) },
    { id: "te-mgr-03", case_id: "EXIT-MGR-2003", actor: "Vijay Kumar",  actor_role: "employee",      label: "Resignation Submitted",          is_pending: true,  timestamp: ago(6) },
    { id: "te-mgr-04", case_id: "EXIT-MGR-2004", actor: "Lakshmi Nair", actor_role: "employee",      label: "Resignation Submitted",          is_pending: false, timestamp: ago(20) },
    { id: "te-mgr-05", case_id: "EXIT-MGR-2004", actor: "Aryan Kapoor", actor_role: "manager",       label: "Resignation Approved",           is_pending: false, timestamp: ago(19) },
    { id: "te-mgr-06", case_id: "EXIT-MGR-2004", actor: "Kiran Patel",  actor_role: "dept_approver", label: "IT Clearance Completed",         is_pending: false, timestamp: ago(14) },
    { id: "te-mgr-07", case_id: "EXIT-MGR-2004", actor: "Sunita Rao",   actor_role: "dept_approver", label: "Finance Clearance Pending",      is_pending: true,  timestamp: ago(1) },
    { id: "te-mgr-08", case_id: "EXIT-MGR-2006", actor: "Pooja Verma",  actor_role: "employee",      label: "Resignation Submitted",          is_pending: false, timestamp: ago(30) },
    { id: "te-mgr-09", case_id: "EXIT-MGR-2006", actor: "Aryan Kapoor", actor_role: "manager",       label: "Resignation Approved",           is_pending: false, timestamp: ago(29) },
    { id: "te-mgr-10", case_id: "EXIT-MGR-2006", actor: "Kiran Patel",  actor_role: "dept_approver", label: "IT Clearance Completed",         is_pending: false, timestamp: ago(23) },
    { id: "te-mgr-11", case_id: "EXIT-MGR-2006", actor: "Sunita Rao",   actor_role: "dept_approver", label: "Finance Clearance SLA BREACHED", is_pending: true,  timestamp: ago(5) },
    { id: "te-mgr-12", case_id: "EXIT-MGR-2009", actor: "Girish Pai",   actor_role: "employee",      label: "Resignation Submitted",          is_pending: false, timestamp: ago(60) },
    { id: "te-mgr-13", case_id: "EXIT-MGR-2009", actor: "Aryan Kapoor", actor_role: "manager",       label: "Resignation Approved",           is_pending: false, timestamp: ago(59) },
    { id: "te-mgr-14", case_id: "EXIT-MGR-2009", actor: "Kiran Patel",  actor_role: "dept_approver", label: "IT Clearance Completed",         is_pending: false, timestamp: ago(54) },
    { id: "te-mgr-15", case_id: "EXIT-MGR-2009", actor: "Sunita Rao",   actor_role: "dept_approver", label: "Finance Clearance Completed",    is_pending: false, timestamp: ago(49) },
    { id: "te-mgr-16", case_id: "EXIT-MGR-2009", actor: "Anita Desai",  actor_role: "hr",            label: "HR Clearance Completed",         is_pending: false, timestamp: ago(44) },
    { id: "te-mgr-17", case_id: "EXIT-MGR-2009", actor: "Anita Desai",  actor_role: "hr",            label: "Relieving Letter Issued",        is_pending: false, timestamp: ago(30) },
  ]);
  results.timeline = timelineErr ? { error: timelineErr.message } : { ok: true };

  return NextResponse.json({
    message: "Seed migration complete! Also apply 00016_manager_dashboard_views.sql via Supabase Studio.",
    results,
  });
}
