import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const { caseId } = await params;
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("exit_cases")
    .select("*, clearance_tasks(*), timeline_events(*), exit_interviews(*), case_comments(*, author:users(name, avatar_url)), documents(*)")
    .eq("id", caseId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const { caseId } = await params;
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

  const { data, error } = await supabase
    .from("exit_cases")
    .update(updateData)
    .eq("id", caseId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
