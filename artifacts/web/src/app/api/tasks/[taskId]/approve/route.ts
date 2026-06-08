import { NextRequest, NextResponse } from "next/server";
import { useExitStore } from "@/store/exitStore";

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

  const { notes } = await req.json();
  useExitStore.getState().approveTask(caseId, deptId, notes);
  const updated = useExitStore.getState().cases.find((c) => c.id === caseId);
  const task = updated?.tasks.find((t) => t.deptId === deptId);
  return NextResponse.json(task);
}
