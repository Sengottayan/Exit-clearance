import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";
import { differenceInCalendarDays } from "date-fns";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const { id: caseId } = await params;
  const supabase = createServerSupabase();
  const { new_date, actor = "HR" } = await request.json().catch(() => ({}));

  if (!new_date) {
    return NextResponse.json({ error: "Missing new_date" }, { status: 400 });
  }

  try {
    // Fetch case resignation date to compute notice period
    const { data: caseRow, error: fetchErr } = await supabase
      .from("legacy_exit_cases")
      .select("resignation_date")
      .eq("id", caseId)
      .single();

    if (fetchErr || !caseRow) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const noticePeriodDays = differenceInCalendarDays(new Date(new_date), new Date(caseRow.resignation_date));

    const { error: caseErr } = await supabase
      .from("legacy_exit_cases")
      .update({
        last_working_day: new_date,
        notice_period_days: noticePeriodDays,
      })
      .eq("id", caseId);

    if (caseErr) {
      return NextResponse.json({ error: caseErr.message }, { status: 500 });
    }

    // Insert timeline event
    const eventId = `evt-${Date.now()}`;
    const formattedDate = new Date(new_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    await supabase
      .from("timeline_events")
      .insert({
        id: eventId,
        case_id: caseId,
        label: `Last working day extended to ${formattedDate}`,
        actor,
        actor_role: "hr",
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
