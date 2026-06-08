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
  const { newDate } = await req.json();
  if (!newDate) {
    return NextResponse.json(
      { error: "Bad Request", message: "newDate is required" },
      { status: 400 }
    );
  }
  useExitStore.getState().extendLastWorkingDay(caseId, newDate, "HR");
  const updated = useExitStore.getState().cases.find((c) => c.id === caseId);
  return NextResponse.json(updated);
}
