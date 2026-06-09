/**
 * TEMPORARY ONE-SHOT MIGRATION RUNNER
 * GET /api/admin/run-migration
 *
 * Runs migration 00003 (add manager_id to users, drop FK constraints on exit_cases).
 * DELETE THIS FILE after running once.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const MIGRATION_STATEMENTS = [
  // Add columns to users table
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id TEXT REFERENCES users(id) ON DELETE SET NULL`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_name TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS hire_date DATE`,

  // Drop FK constraints on exit_cases so Clerk user IDs work without pre-existing rows
  `ALTER TABLE exit_cases DROP CONSTRAINT IF EXISTS exit_cases_employee_id_fkey`,
  `ALTER TABLE exit_cases DROP CONSTRAINT IF EXISTS exit_cases_manager_id_fkey`,

  // Make manager_id nullable
  `ALTER TABLE exit_cases ALTER COLUMN manager_id DROP NOT NULL`,

  // Drop FK on clearance_tasks.assignee_id
  `ALTER TABLE clearance_tasks DROP CONSTRAINT IF EXISTS clearance_tasks_assignee_id_fkey`,

  // Seed the system-manager sentinel row (safe to run multiple times)
  `INSERT INTO users (id, email, role, name, dept, employee_id, job_title)
   VALUES ('system-manager', 'manager@exitflow.system', 'manager', 'HR Manager (System)', 'HR', 'SYS-MGR-001', 'HR Manager')
   ON CONFLICT (id) DO NOTHING`,
];

export async function GET() {
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const results: { sql: string; ok: boolean; error?: string }[] = [];

  for (const sql of MIGRATION_STATEMENTS) {
    const { error } = await supabase.rpc("exec_migration_sql", { sql_text: sql }).single();
    // Fallback: try raw query via the custom function if it exists
    if (error && error.message.includes("exec_migration_sql")) {
      // The RPC function doesn't exist — we'll create it first
      results.push({ sql: sql.substring(0, 60), ok: false, error: "Need exec_migration_sql function" });
    } else if (error) {
      results.push({ sql: sql.substring(0, 60), ok: false, error: error.message });
    } else {
      results.push({ sql: sql.substring(0, 60), ok: true });
    }
  }

  const allOk = results.every((r) => r.ok);

  if (!allOk) {
    // Try creating the helper function first, then retry
    const createFnSql = `
      CREATE OR REPLACE FUNCTION exec_migration_sql(sql_text TEXT)
      RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
      BEGIN EXECUTE sql_text; END; $$;
    `;

    // Since we can't run raw SQL easily, return instructions
    return NextResponse.json({
      message: "Run this SQL in your Supabase SQL editor",
      supabaseUrl: "https://supabase.com/dashboard/project/duerhsrukxpivauakggp/sql/new",
      sql: MIGRATION_STATEMENTS.join(";\n\n") + ";",
      results,
    });
  }

  return NextResponse.json({ success: true, results });
}
