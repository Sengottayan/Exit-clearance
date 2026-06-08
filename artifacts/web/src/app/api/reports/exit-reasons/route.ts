import { NextResponse } from "next/server";
import { useExitStore } from "@/store/exitStore";
import { computeExitReasons } from "@/lib/analytics";

export async function GET() {
  const cases = useExitStore.getState().cases;
  const data = computeExitReasons(cases);
  return NextResponse.json(data);
}
