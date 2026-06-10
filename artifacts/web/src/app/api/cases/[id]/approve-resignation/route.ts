import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const { id: caseId } = await params;
  const supabase = createServerSupabase();
  const { actor = "Manager" } = await request.json().catch(() => ({}));

  try {
    // 1. Update legacy_exit_cases status to 'in_clearance'
    const { error: caseErr } = await supabase
      .from("legacy_exit_cases")
      .update({ status: "in_clearance" })
      .eq("id", caseId);

    if (caseErr) {
      console.error("[POST approve-resignation] Exit case update error:", caseErr.message);
      return NextResponse.json({ error: caseErr.message }, { status: 500 });
    }

    // 2. Fetch all clearance tasks for this case
    const { data: tasks, error: tasksFetchErr } = await supabase
      .from("legacy_clearance_tasks")
      .select("id, dept_id, sla_hours")
      .eq("case_id", caseId);

    if (tasksFetchErr) {
      console.error("[POST approve-resignation] Tasks fetch error:", tasksFetchErr.message);
      return NextResponse.json({ error: tasksFetchErr.message }, { status: 500 });
    }

    // 3. Update tasks: manager task is 'approved', others are 'pending' with calculated sla_due_at
    const now = new Date();
    if (tasks && tasks.length > 0) {
      for (const t of tasks) {
        if (t.dept_id === "manager") {
          await supabase
            .from("legacy_clearance_tasks")
            .update({
              status: "approved",
              completed_at: now.toISOString(),
            })
            .eq("id", t.id);
        } else {
          const slaHours = t.sla_hours || 24;
          const slaDueAt = new Date(now.getTime() + slaHours * 60 * 60 * 1000);
          await supabase
            .from("legacy_clearance_tasks")
            .update({
              status: "pending",
              sla_due_at: slaDueAt.toISOString(),
            })
            .eq("id", t.id);
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
