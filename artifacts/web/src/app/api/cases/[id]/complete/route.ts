import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";

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
  
  // 1. Validate Caller Role (Admin or HR)
  const { data: user } = await supabase.from("users").select("role").eq("id", userId).single();
  const isHR = user?.role === "admin" || user?.role === "hr";
  
  if (!isHR) {
    return NextResponse.json({ error: "Forbidden: Only Admin or HR can complete an exit case" }, { status: 403 });
  }

  // 2. Pre-flight check: Legal Hold and Payroll Status
  let caseQuery = supabase
    .from("legacy_exit_cases")
    .select("legal_hold, payroll_status")
    .eq("id", caseId);
    
  if (MULTI_TENANT_ENABLED && orgId) {
    caseQuery = caseQuery.eq("organization_id", orgId);
  }
  
  const { data: caseMeta, error: metaErr } = await caseQuery.single();
  
  if (metaErr || !caseMeta) {
    return NextResponse.json({ error: "Case not found or permission denied" }, { status: 404 });
  }
  
  if (caseMeta.legal_hold) {
    return NextResponse.json({ error: "Cannot complete case: Active Legal Hold" }, { status: 400 });
  }
  
  if (caseMeta.payroll_status !== 'settled') {
    return NextResponse.json({ error: "Cannot complete case: Payroll F&F is not settled" }, { status: 400 });
  }

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
    // 3. Insert/Upsert into legacy_exit_interviews
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

    // 4. Fetch clearance tasks to see if they are all completed/approved
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

    // 5. If all clearance tasks are done (and we passed legal/payroll checks), complete it.
    if (allCompleted) {
      let updateQ = supabase
        .from("legacy_exit_cases")
        .update({ status: "completed" })
        .eq("id", caseId);
        
      if (MULTI_TENANT_ENABLED && orgId) {
        updateQ = updateQ.eq("organization_id", orgId);
      }
      
      await updateQ;
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
