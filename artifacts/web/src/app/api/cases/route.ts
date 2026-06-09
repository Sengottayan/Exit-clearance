import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const supabase = createServerSupabase();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  let query = supabase
    .from("exit_cases")
    .select("*, clearance_tasks(*), timeline_events(*), exit_interviews(*)")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }
  if (search) {
    query = query.or(
      `employee_name.ilike.%${search}%,employee_email.ilike.%${search}%,employee_dept.ilike.%${search}%,id.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const supabase = createServerSupabase();
  const body = await request.json();

  const caseId = `CASE-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

  const { data, error } = await supabase
    .from("exit_cases")
    .insert({
      id: caseId,
      employee_id: body.employee_id,
      employee_name: body.employee_name,
      employee_email: body.employee_email,
      employee_role: body.employee_role ?? "",
      employee_dept: body.employee_dept,
      manager_id: body.manager_id,
      manager_name: body.manager_name ?? "",
      status: "pending_manager",
      resignation_date: body.resignation_date,
      last_working_day: body.last_working_day,
      notice_period_days: body.notice_period_days,
      exit_reason: body.exit_reason,
      tags: body.tags ?? [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
