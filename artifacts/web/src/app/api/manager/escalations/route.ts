import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { differenceInDays } from "date-fns";

const MULTI_TENANT_ENABLED = true;

// This endpoint is intended to be hit by a cron job periodically.
// In a real production setup, it would be protected by a cron secret.
export async function POST(request: NextRequest) {
  try {
    // Basic protection: typically you'd verify an Authorization header matching process.env.CRON_SECRET
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerSupabase();

    // 1. Fetch all pending manager approvals
    const { data: pendingCases, error: fetchErr } = await supabase
      .from("legacy_exit_cases")
      .select("id, manager_id, created_at, organization_id")
      .eq("status", "pending_manager");

    if (fetchErr) {
      console.error("[Manager Escalation Job] Failed to fetch pending cases:", fetchErr.message);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    const now = new Date();
    const escalationsToInsert = [];
    const escalationsSummary = { reminders: 0, hrEscalations: 0, deptHeadEscalations: 0 };

    for (const exitCase of pendingCases || []) {
      const pendingDays = differenceInDays(now, new Date(exitCase.created_at));
      
      let newLevel = 0;
      if (pendingDays >= 7) newLevel = 3; // Escalate to Dept Head
      else if (pendingDays >= 5) newLevel = 2; // Escalate to HR
      else if (pendingDays >= 3) newLevel = 1; // Reminder

      if (newLevel > 0) {
        // Check if this specific escalation level was already recorded to avoid duplicate spam
        const { data: existing } = await supabase
          .from("approval_escalations")
          .select("id")
          .eq("case_id", exitCase.id)
          .eq("escalation_level", newLevel)
          .single();

        if (!existing) {
          escalationsToInsert.push({
            organization_id: exitCase.organization_id,
            case_id: exitCase.id,
            manager_id: exitCase.manager_id,
            escalation_level: newLevel,
          });

          if (newLevel === 1) escalationsSummary.reminders++;
          if (newLevel === 2) escalationsSummary.hrEscalations++;
          if (newLevel === 3) escalationsSummary.deptHeadEscalations++;
        }
      }
    }

    if (escalationsToInsert.length > 0) {
      const { error: insertErr } = await supabase
        .from("approval_escalations")
        .insert(escalationsToInsert);

      if (insertErr) {
        console.error("[Manager Escalation Job] Failed to insert escalations:", insertErr.message);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      processed: (pendingCases || []).length,
      escalations: escalationsSummary,
    });
  } catch (err: any) {
    console.error("[Manager Escalation Job] Unhandled error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
