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
  const { reason = "No reason provided", actor = "Manager" } = await request.json().catch(() => ({}));

  try {
    const { error: caseErr } = await supabase
      .from("legacy_exit_cases")
      .update({ escalated: true })
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
        label: `Escalated to HR: ${reason}`,
        actor,
        actor_role: "manager",
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
