import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";
import { calculateWorkflowStage } from "@/lib/workflow-server";

const MULTI_TENANT_ENABLED = true; // Toggle to true after full DB migration

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
    .from("legacy_exit_cases")
    .select("*, clearance_tasks:legacy_clearance_tasks(*), timeline_events(*), exit_interviews:legacy_exit_interviews(*), case_comments:legacy_case_comments(*), documents:legacy_documents(*)")
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

  // Calculate backend workflow stage
  data.workflow_stage = calculateWorkflowStage(data.status, data.clearance_tasks || []);

  // --- VISIBILITY RULES ENFORCEMENT ---
  const { data: user } = await supabase.from("users").select("role").eq("id", userId).single();
  const isAdminOrHR = user?.role === "admin" || user?.role === "hr";

  if (user?.role === "employee" && data.employee_id !== userId) {
    return NextResponse.json({ error: "Forbidden: You do not have permission to view this case" }, { status: 403 });
  }

  if (!isAdminOrHR) {
    const { data: assignments } = await supabase
      .from("department_assignments")
      .select("department")
      .eq("user_id", userId);
    const userDeptAssignments = assignments?.map((a: any) => a.department) || [];

    // Redact internal notes from other departments
    if (data.clearance_tasks) {
      data.clearance_tasks = data.clearance_tasks.map((task: any) => {
        if (!userDeptAssignments.includes(task.dept_id)) {
          return { ...task, notes: null };
        }
        return task;
      });
    }
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

  const supabase = createServerSupabase();
  const { data: user } = await supabase.from("users").select("role").eq("id", userId).single();
  
  // Only Admin, HR, and Manager can update case fields directly
  if (!user || (user.role !== "admin" && user.role !== "hr" && user.role !== "manager")) {
    return NextResponse.json({ error: "Forbidden: Only Admin, HR, or Manager can update case details" }, { status: 403 });
  }

  const { id } = await params;
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
    .from("legacy_exit_cases")
    .update(updateData)
    .eq("id", id);
    
  if (MULTI_TENANT_ENABLED && orgId) {
    // In the future when querying org_exit_cases, we would add:
    // query = query.eq("organization_id", orgId);
  }

  const { data: updatedData, error: updateError } = await query.select().single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json(updatedData);
}
