import { createServerSupabase } from "@/lib/supabase-server";

type AuditEventType = "Case" | "Task" | "Document" | "Comment" | "System";

export async function logAuditAndTimeline(params: {
  caseId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  type: AuditEventType;
  action: string;
  details: string;
}) {
  const supabase = createServerSupabase();
  const { caseId, actorName, actorRole, type, action, details } = params;

  // 1. Insert into audit_logs table
  await supabase.from("audit_logs").insert({
    case_id: caseId,
    actor: actorName,
    role: actorRole,
    type: type,
    action: action,
    entity: caseId,
    details: details,
  });

  // 2. Insert into timeline_events table for UI rendering
  // Timeline events typically reflect state progression rather than pure audit history
  await supabase.from("timeline_events").insert({
    case_id: caseId,
    actor: actorName,
    actor_role: actorRole,
    label: details,
    status: action === "COMPLETED" || action === "APPROVED" ? "completed" : "pending",
  });
}
