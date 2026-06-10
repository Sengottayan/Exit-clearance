import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";

const MULTI_TENANT_ENABLED = false; // Toggle to true after full DB migration

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, orgId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  if (MULTI_TENANT_ENABLED && !orgId) {
    return NextResponse.json({ error: "Organization context required" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServerSupabase();

  let query = supabase
    .from("exit_cases")
    .select("*, clearance_tasks(*), timeline_events(*), exit_interviews(*), case_comments(*), documents(*)")
    .eq("id", id);

  if (MULTI_TENANT_ENABLED && orgId) {
    // In the future when querying org_exit_cases, we would add:
    // query = query.eq("organization_id", orgId);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }
    console.error("[GET /api/cases/[caseId]]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, orgId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  if (MULTI_TENANT_ENABLED && !orgId) {
    return NextResponse.json({ error: "Organization context required" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServerSupabase();
  const body = await request.json();

  const allowedFields = [
    "status",
    "last_working_day",
    "notice_period_days",
    "exit_reason",
    "escalated",
    "cancel_reason",
    "tags",
  ];

  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 },
    );
  }

  let query = supabase
    .from("exit_cases")
    .update(updateData)
    .eq("id", id);
    
  if (MULTI_TENANT_ENABLED && orgId) {
    // In the future when querying org_exit_cases, we would add:
    // query = query.eq("organization_id", orgId);
  }

  const { data, error } = await query.select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
