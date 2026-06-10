import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;

  if (!taskId) {
    return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
  }

  const { assigneeId } = await req.json();
  if (!assigneeId) {
    return NextResponse.json(
      { error: "Bad Request", message: "assigneeId is required" },
      { status: 400 }
    );
  }

  const supabase = createServerSupabase();

  // Validate user exists in DB
  const { data: assignee, error: userError } = await supabase
    .from("users")
    .select("id, name")
    .eq("id", assigneeId)
    .single();

  if (userError || !assignee) {
    return NextResponse.json({ error: "Bad Request", message: "User not found" }, { status: 400 });
  }

  // Update task in DB
  const { data: updatedTask, error: updateError } = await supabase
    .from("legacy_clearance_tasks")
    .update({ 
      assignee_id: assignee.id,
      assignee_name: assignee.name
    })
    .eq("id", taskId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }

  return NextResponse.json(updatedTask);
}
