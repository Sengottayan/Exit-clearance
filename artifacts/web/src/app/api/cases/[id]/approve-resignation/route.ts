import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";
import { resolveDbOrgId } from "@/lib/organization";

const MULTI_TENANT_ENABLED = true;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, orgId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  if (MULTI_TENANT_ENABLED && !orgId) {
    return NextResponse.json({ error: "Organization context required" }, { status: 403 });
  }

  const { id: caseId } = await params;
  const supabase = createServerSupabase();
  const dbOrgId = await resolveDbOrgId(supabase, orgId);
  
  // 1. Validate Caller Role (Admin, HR, or Manager)
  const { data: user } = await supabase.from("users").select("role").eq("id", userId).single();
  const isAdminOrManager = user?.role === "admin" || user?.role === "hr" || user?.role === "manager";
  
  if (!isAdminOrManager) {
    return NextResponse.json({ error: "Forbidden: Only Admin, HR, or Manager can approve resignations" }, { status: 403 });
  }

  const { actor = "Manager" } = await request.json().catch(() => ({}));

  try {
    // 2. Update legacy_exit_cases status to 'in_clearance' with Tenant Isolation and Authorization
    let caseUpdateQuery = supabase
      .from("legacy_exit_cases")
      .update({ status: "in_clearance" })
      .eq("id", caseId);
      
    if (user?.role === "manager") {
      caseUpdateQuery = caseUpdateQuery.eq("manager_id", userId);
    }
      
    if (MULTI_TENANT_ENABLED && orgId) {
      caseUpdateQuery = caseUpdateQuery.eq("organization_id", dbOrgId);
    }
      
    const { data: updateCaseRes, error: caseErr } = await caseUpdateQuery.select().single();

    if (caseErr) {
      console.error("[POST approve-resignation] Exit case update error:", caseErr.message);
      return NextResponse.json({ error: "Exit case not found or forbidden" }, { status: 403 });
    }

    // 2b. Insert immutable audit record
    if (MULTI_TENANT_ENABLED && orgId) {
      await supabase.from("manager_approval_history").insert({
        organization_id: dbOrgId,
        case_id: caseId,
        manager_id: userId,
        action: "approved",
        comments: "Approved via approve-resignation endpoint",
      });
    }

    // 3. Fetch all clearance tasks for this case
    const { data: tasks, error: tasksFetchErr } = await supabase
      .from("legacy_clearance_tasks")
      .select("id, dept_id, sla_hours")
      .eq("case_id", caseId);

    if (tasksFetchErr) {
      console.error("[POST approve-resignation] Tasks fetch error:", tasksFetchErr.message);
      return NextResponse.json({ error: tasksFetchErr.message }, { status: 500 });
    }

    // 4. Update tasks: manager task is 'approved', others are 'pending' with calculated sla_due_at
    const now = new Date();
    if (tasks && tasks.length > 0) {
      for (const t of tasks) {
        if (t.dept_id === "manager") {
          let taskUpdate = supabase
            .from("legacy_clearance_tasks")
            .update({
              status: "approved",
              completed_at: now.toISOString(),
            })
            .eq("id", t.id);
            
          if (MULTI_TENANT_ENABLED && orgId) {
            taskUpdate = taskUpdate.eq("organization_id", dbOrgId);
          }
          await taskUpdate;
        } else {
          const slaHours = t.sla_hours || 24;
          const slaDueAt = new Date(now.getTime() + slaHours * 60 * 60 * 1000);
          
          let taskUpdate = supabase
            .from("legacy_clearance_tasks")
            .update({
              status: "pending",
              sla_due_at: slaDueAt.toISOString(),
            })
            .eq("id", t.id);
            
          if (MULTI_TENANT_ENABLED && orgId) {
            taskUpdate = taskUpdate.eq("organization_id", dbOrgId);
          }
          await taskUpdate;
        }
      }
    }

    // 4. Create timeline event
    const eventId = `evt-${Date.now()}`;
    const { error: timelineErr } = await supabase
      .from("timeline_events")
      .insert({
        id: eventId,
        case_id: caseId,
        label: "Manager approved resignation",
        actor: actor,
        actor_role: "manager",
        is_pending: false,
        timestamp: now.toISOString(),
      });

    if (timelineErr) {
      console.warn("[POST approve-resignation] Timeline event insert failed:", timelineErr.message);
    }

    // 5. Fetch updated case to return (with clearance tasks joined)
    const { data: updatedCase, error: fetchCaseErr } = await supabase
      .from("legacy_exit_cases")
      .select("*, clearance_tasks:legacy_clearance_tasks(*), timeline_events(*), exit_interviews:legacy_exit_interviews(*), case_comments:legacy_case_comments(*), documents:legacy_documents(*)")
      .eq("id", caseId)
      .single();

    if (fetchCaseErr) {
      console.error("[POST approve-resignation] Fetch case error:", fetchCaseErr.message);
      return NextResponse.json({ error: fetchCaseErr.message }, { status: 500 });
    }

    return NextResponse.json(updatedCase);
  } catch (err: any) {
    console.error("[POST approve-resignation] Exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
