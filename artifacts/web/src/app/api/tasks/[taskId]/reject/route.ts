import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized, forbidden, verifyTaskAccess } from "@/lib/api-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const { taskId } = await params;
  const [caseId, deptId] = taskId.split("__");

  if (!caseId || !deptId) {
    return NextResponse.json({ error: "Invalid task ID format" }, { status: 400 });
  }

  const hasAccess = await verifyTaskAccess(userId, deptId);
  if (!hasAccess) return forbidden();

  const { reason } = await req.json();
  if (!reason) {
    return NextResponse.json(
      { error: "Bad Request", message: "reason is required" },
      { status: 400 }
    );
  }

  const supabase = createServerSupabase();

  // 1. Update the task status to rejected
  const { data: updatedTask, error: updateError } = await supabase
    .from("legacy_clearance_tasks")
    .update({
      status: "rejected",
      rejection_reason: reason,
      completed_at: new Date().toISOString(),
    })
    .eq("case_id", caseId)
    .eq("dept_id", deptId)
    .select()
    .single();

  if (updateError || !updatedTask) {
    console.error("Reject task error:", updateError);
    return NextResponse.json({ error: "Failed to reject task or task not found" }, { status: 500 });
  }

  // 2. Add a timeline event
  const { data: user } = await supabase.from("users").select("name, role").eq("id", userId).single();
  const actorName = user?.name || "System";
  const actorRole = user?.role || "system";

  await supabase.from("timeline_events").insert({
    case_id: caseId,
    actor: actorName,
    actor_role: actorRole,
    label: `${updatedTask.dept_label} Clearance Rejected`,
    is_pending: false,
    timestamp: new Date().toISOString(),
  });

  // 3. Update the case's updated_at timestamp
  await supabase
    .from("legacy_exit_cases")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", caseId);

  return NextResponse.json(updatedTask);
}
