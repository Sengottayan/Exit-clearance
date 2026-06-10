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
  const body = await request.json().catch(() => ({}));

  const {
    overall_rating,
    management_rating,
    culture_rating,
    reason = "",
    improvements = "",
    would_rejoin = false,
    comments = "",
  } = body;

  try {
    // 1. Insert/Upsert into legacy_exit_interviews
    const { error: interviewErr } = await supabase
      .from("legacy_exit_interviews")
      .upsert({
        case_id: caseId,
        overall_rating,
        management_rating,
        culture_rating,
        reason,
        improvements,
        would_rejoin,
        comments,
        completed_at: new Date().toISOString(),
      }, { onConflict: "case_id" });

    if (interviewErr) {
      console.error("[POST complete] Interview error:", interviewErr.message);
      return NextResponse.json({ error: interviewErr.message }, { status: 500 });
    }

    // 2. Fetch clearance tasks to see if they are all completed/approved
    const { data: tasks, error: tasksErr } = await supabase
      .from("legacy_clearance_tasks")
      .select("status")
      .eq("case_id", caseId);

    let allCompleted = true;
    if (tasksErr || !tasks) {
      allCompleted = false;
    } else {
      allCompleted = tasks.every(t => t.status === "approved" || t.status === "completed");
    }

    // 3. If all clearance tasks are done, update case status to 'completed'
    if (allCompleted) {
      await supabase
        .from("legacy_exit_cases")
        .update({ status: "completed" })
        .eq("id", caseId);
    }

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
