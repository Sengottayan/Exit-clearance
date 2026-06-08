import { NextRequest, NextResponse } from "next/server";
import { useExitStore } from "@/store/exitStore";
import { MOCK_USERS } from "@/lib/constants";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const [caseId, deptId] = taskId.split("__");

  if (!caseId || !deptId) {
    return NextResponse.json({ error: "Invalid task ID format" }, { status: 400 });
  }

  const exitCase = useExitStore.getState().cases.find((c) => c.id === caseId);
  if (!exitCase) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const { assigneeId } = await req.json();
  if (!assigneeId) {
    return NextResponse.json(
      { error: "Bad Request", message: "assigneeId is required" },
      { status: 400 }
    );
  }

  const assignee = MOCK_USERS.find((u) => u.id === assigneeId);
  if (!assignee) {
    return NextResponse.json({ error: "Bad Request", message: "User not found" }, { status: 400 });
  }

  useExitStore.getState().saveTaskDraft(caseId, deptId, exitCase.tasks.find((t) => t.deptId === deptId)?.checklist ?? []);
  const updated = useExitStore.getState().cases.find((c) => c.id === caseId);
  const task = updated?.tasks.find((t) => t.deptId === deptId);
  return NextResponse.json(task);
}
