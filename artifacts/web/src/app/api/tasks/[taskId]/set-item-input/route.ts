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

  const { itemId, inputValue } = await req.json();
  const supabase = createServerSupabase();

  // 1. Fetch current checklist
  const { data: task, error: fetchError } = await supabase
    .from("legacy_clearance_tasks")
    .select("checklist")
    .eq("case_id", caseId)
    .eq("dept_id", deptId)
    .single();

  if (fetchError || !task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // 2. Update item
  const checklist = (task.checklist as ChecklistItem[] | null) ?? [];
  const updatedChecklist = checklist.map((item) =>
    item.id === itemId ? { ...item, inputValue } : item
  );

  // 3. Save to database
  const { data: updatedTask, error: updateError } = await supabase
    .from("legacy_clearance_tasks")
    .update({ checklist: updatedChecklist })
    .eq("case_id", caseId)
    .eq("dept_id", deptId)
    .select()
    .single();

  if (updateError || !updatedTask) {
    console.error("Set item input error:", updateError);
    return NextResponse.json({ error: "Failed to update item input" }, { status: 500 });
  }

  return NextResponse.json(updatedTask);
}
