import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const supabase = createServerSupabase();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const assigneeId = searchParams.get("assigneeId");
  const caseId = searchParams.get("caseId");

  let query = supabase
    .from("legacy_clearance_tasks")
    .select("*, exit_cases:legacy_exit_cases!inner(*)")
    .order("sla_due_at", { ascending: true });

  if (status) query = query.eq("status", status);
  if (assigneeId) query = query.eq("assignee_id", assigneeId);
  if (caseId) query = query.eq("case_id", caseId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
