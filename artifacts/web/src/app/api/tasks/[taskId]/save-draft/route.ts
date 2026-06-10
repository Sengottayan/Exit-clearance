import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized, forbidden, verifyTaskAccess } from "@/lib/api-auth";
import { ChecklistItem } from "@/lib/types";

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

  const { checklist } = await req.json();
  const supabase = createServerSupabase();

  const { data: updatedTask, error: updateError } = await supabase
    .from("legacy_clearance_tasks")
    .update({ checklist })
    .eq("case_id", caseId)
    .eq("dept_id", deptId)
    .select()
    .single();

  if (updateError || !updatedTask) {
    console.error("Save draft error:", updateError);
    return NextResponse.json({ error: "Failed to save draft or task not found" }, { status: 500 });
  }

  return NextResponse.json(updatedTask);
}
