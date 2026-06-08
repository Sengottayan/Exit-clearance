import { NextResponse } from "next/server";
import { useExitStore } from "@/store/exitStore";
import { computeTurnaround } from "@/lib/analytics";

export async function GET() {
  const cases = useExitStore.getState().cases;
  const data = computeTurnaround(cases);
  return NextResponse.json(data);
}
