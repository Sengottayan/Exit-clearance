import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";
import { resolveDbOrgId } from "@/lib/organization";

const MULTI_TENANT_ENABLED = true;

export async function GET(request: NextRequest) {
  const { userId, orgId } = await getOptionalAuth();
  if (!userId) return unauthorized();
  
  if (MULTI_TENANT_ENABLED && !orgId) {
    return NextResponse.json({ error: "Organization context required" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const dbOrgId = await resolveDbOrgId(supabase, orgId);
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const assigneeId = searchParams.get("assigneeId");
  const caseId = searchParams.get("caseId");

  let query = supabase
    .from("legacy_clearance_tasks")
    .select("*, exit_cases:legacy_exit_cases!inner(*)")
    .order("sla_due_at", { ascending: true });

  if (MULTI_TENANT_ENABLED && orgId) {
    query = query.eq("organization_id", dbOrgId);
  }

  if (status) query = query.eq("status", status);
  if (assigneeId) query = query.eq("assignee_id", assigneeId);
  if (caseId) query = query.eq("case_id", caseId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
