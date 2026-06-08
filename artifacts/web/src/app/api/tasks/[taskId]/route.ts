import { NextRequest, NextResponse } from "next/server";
import { useExitStore } from "@/store/exitStore";
import { resolveTaskStatus } from "@/lib/workflow";

export async function GET(
  _req: NextRequest,
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

  const task = exitCase.tasks.find((t) => t.deptId === deptId);
  if (!task) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  return NextResponse.json({
    ...task,
    caseId: exitCase.id,
    employeeName: exitCase.employeeName,
    employeeDept: exitCase.employeeDept,
    caseStatus: exitCase.status,
    resolvedStatus: resolveTaskStatus(task),
  });
}
