import { NextRequest, NextResponse } from "next/server";
import { useExitStore } from "@/store/exitStore";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params;
  const exitCase = useExitStore.getState().cases.find((c) => c.id === caseId);
  if (!exitCase) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }
  const { reason } = await req.json();
  useExitStore.getState().cancelCase(caseId, reason ?? "Cancelled", "HR");
  const updated = useExitStore.getState().cases.find((c) => c.id === caseId);
  return NextResponse.json(updated);
}
