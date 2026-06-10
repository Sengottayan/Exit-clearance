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

  const { notes } = await req.json();
  const supabase = createServerSupabase();

  // 1. Update the task status to approved
  const { data: updatedTask, error: updateError } = await supabase
    .from("legacy_clearance_tasks")
    .update({
      status: "approved",
      completed_at: new Date().toISOString(),
      notes: notes || null,
    })
    .eq("case_id", caseId)
    .eq("dept_id", deptId)
    .select()
    .single();

  if (updateError || !updatedTask) {
    console.error("Approve task error:", updateError);
    return NextResponse.json({ error: "Failed to approve task or task not found" }, { status: 500 });
  }

  // 2. Add a timeline event
  const { data: user } = await supabase.from("users").select("name, role").eq("id", userId).single();
  const actorName = user?.name || "System";
  const actorRole = user?.role || "system";

  await supabase.from("timeline_events").insert({
    case_id: caseId,
    actor: actorName,
    actor_role: actorRole,
    label: `${updatedTask.dept_label} Clearance Approved`,
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
