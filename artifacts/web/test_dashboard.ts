import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const managerId = 'user_3EvjlH615m5ps3OGMpuc7iHXi5h'; // user ID from the URL

  console.log('Fetching user role...');
  const { data: userRowAuth, error: authErr } = await supabase.from("users").select("role").eq("id", managerId).single();
  console.log('Auth query result:', { data: userRowAuth, error: authErr });

  console.log('\nFetching cases...');
  let casesQuery = supabase
      .from("legacy_exit_cases")
      .select("id, status, created_at, last_working_day, clearance_tasks:legacy_clearance_tasks(id, status, sla_due_at, completed_at, dept_label)")
      .eq("manager_id", managerId)
      .order("created_at", { ascending: false });

  // Assume orgId exists. Let's just run without orgId filter to test base query.
  const { data: cases, error: casesErr } = await casesQuery;
  console.log('Cases query error:', casesErr);
  
  if (!casesErr && cases) {
    console.log(`Cases retrieved successfully: ${cases.length}`);
  }

  console.log('\nFetching pending...');
  let pendingQuery = supabase
      .from("legacy_exit_cases")
      .select("id, employee_name, employee_dept, employee_role, created_at")
      .eq("manager_id", managerId)
      .eq("status", "pending_manager")
      .order("created_at", { ascending: false })
      .limit(5);

  const { data: pendingCases, error: pendingErr } = await pendingQuery;
  console.log('Pending query error:', pendingErr);
}

run().catch(console.error);
