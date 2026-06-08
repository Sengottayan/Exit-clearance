import { NextRequest, NextResponse } from "next/server";
import { useExitStore } from "@/store/exitStore";
import { computeSLAPerformance } from "@/lib/analytics";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const months = parseInt(searchParams.get("months") ?? "6", 10);
  const cases = useExitStore.getState().cases;
  const data = computeSLAPerformance(cases, months);
  return NextResponse.json(data);
}
