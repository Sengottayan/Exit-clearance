import { NextRequest, NextResponse } from "next/server";
import { useExitStore } from "@/store/exitStore";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params;
  const exitCase = useExitStore.getState().cases.find((c) => c.id === caseId);
  if (!exitCase) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }
  useExitStore.getState().approveResignation(caseId, "Manager");
  const updated = useExitStore.getState().cases.find((c) => c.id === caseId);
  return NextResponse.json(updated);
}
