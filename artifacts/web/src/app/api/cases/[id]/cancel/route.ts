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
  const { reason = "No reason provided", actor = "HR" } = await request.json().catch(() => ({}));

  try {
    const { data: existingCase } = await supabase.from("legacy_exit_cases").select("employee_id, employee_name, status").eq("id", caseId).single();
    
    if (!existingCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const { data: userRow } = await supabase.from("users").select("role").eq("id", userId).single();
    const role = userRow?.role || "employee";

    if (role === "employee") {
      if (existingCase.employee_id !== userId) {
        return NextResponse.json({ error: "Forbidden: You do not own this case" }, { status: 403 });
      }
      if (existingCase.status !== "pending_manager") {
        return NextResponse.json({ error: "Cannot withdraw resignation after it has been approved" }, { status: 400 });
      }
    }

    const { error: caseErr } = await supabase
      .from("legacy_exit_cases")
      .update({
        status: "cancelled",
        cancel_reason: reason,
      })
      .eq("id", caseId);

    if (caseErr) {
      return NextResponse.json({ error: caseErr.message }, { status: 500 });
    }

    // Insert timeline event
    const eventId = `evt-${Date.now()}`;
    await supabase
      .from("timeline_events")
      .insert({
        id: eventId,
        case_id: caseId,
        label: `Case cancelled: ${reason}`,
        actor: role === "employee" ? existingCase.employee_name || actor : actor,
        actor_role: role,
        is_pending: false,
        timestamp: new Date().toISOString(),
      });

    // Fetch updated case
    const { data: updatedCase, error: fetchCaseErr } = await supabase
      .from("legacy_exit_cases")
      .select("*, clearance_tasks:legacy_clearance_tasks(*), timeline_events(*), exit_interviews:legacy_exit_interviews(*), case_comments:legacy_case_comments(*), documents:legacy_documents(*)")
      .eq("id", caseId)
      .single();

    if (fetchCaseErr) {
      return NextResponse.json({ error: fetchCaseErr.message }, { status: 500 });
    }

    return NextResponse.json(updatedCase);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
