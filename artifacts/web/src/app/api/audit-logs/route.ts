import { NextRequest, NextResponse } from "next/server";
import { useExitStore } from "@/store/exitStore";
import { buildAuditLog, AuditLogEntry } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const type = searchParams.get("type");
  const caseId = searchParams.get("caseId");
  const actor = searchParams.get("actor");

  const cases = useExitStore.getState().cases;
  let logs = buildAuditLog(cases);

  if (type) {
    logs = logs.filter((l) => l.type === type);
  }
  if (caseId) {
    logs = logs.filter((l) => l.caseId === caseId);
  }
  if (actor) {
    logs = logs.filter((l) => l.actor.toLowerCase().includes(actor.toLowerCase()));
  }

  const total = logs.length;
  const start = (page - 1) * limit;
  const items = logs.slice(start, start + limit);

  return NextResponse.json({ items, total, page, limit });
}
