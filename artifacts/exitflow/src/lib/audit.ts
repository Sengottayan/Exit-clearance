import { ExitCase } from './types';

export type AuditEventType = 'Case' | 'Task' | 'Document' | 'Comment' | 'System';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  type: AuditEventType;
  action: string;
  entity: string;
  details: string;
  caseId: string;
}

function inferType(label: string): AuditEventType {
  const lower = label.toLowerCase();
  if (lower.includes('document') || lower.includes('letter') || lower.includes('certificate') || lower.includes('uploaded') || lower.includes('attachment')) return 'Document';
  if (lower.includes('clearance') || lower.includes('approved') || lower.includes('rejected') || lower.includes('started')) return 'Task';
  if (lower.includes('cancelled') || lower.includes('resignation') || lower.includes('escalat') || lower.includes('extended') || lower.includes('completed')) return 'Case';
  if (lower.includes('comment')) return 'Comment';
  return 'System';
}

function inferAction(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes('submitted') || lower.includes('created')) return 'Created';
  if (lower.includes('approved')) return 'Approved';
  if (lower.includes('rejected')) return 'Rejected';
  if (lower.includes('generated') || lower.includes('issued')) return 'Generated';
  if (lower.includes('uploaded')) return 'Uploaded';
  if (lower.includes('cancelled')) return 'Cancelled';
  if (lower.includes('escalat')) return 'Escalated';
  if (lower.includes('extended')) return 'Updated';
  if (lower.includes('completed')) return 'Completed';
  return 'Updated';
}

export function buildAuditLog(cases: ExitCase[]): AuditLogEntry[] {
  const logs: AuditLogEntry[] = [];

  cases.forEach((c) => {
    c.timeline.forEach((evt) => {
      logs.push({
        id: evt.id,
        timestamp: evt.timestamp,
        actor: evt.actor,
        role: evt.actorRole,
        type: inferType(evt.label),
        action: inferAction(evt.label),
        entity: c.id,
        details: evt.label,
        caseId: c.id,
      });
    });

    (c.comments ?? []).forEach((comment) => {
      logs.push({
        id: comment.id,
        timestamp: comment.timestamp,
        actor: comment.authorName,
        role: comment.authorRole,
        type: 'Comment',
        action: 'Posted',
        entity: c.id,
        details: comment.message,
        caseId: c.id,
      });
    });
  });

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function exportAuditCsv(logs: AuditLogEntry[]): string {
  const header = 'Timestamp,Actor,Role,Type,Action,Entity,Details';
  const rows = logs.map((l) =>
    [l.timestamp, l.actor, l.role, l.type, l.action, l.entity, `"${l.details.replace(/"/g, '""')}"`].join(','),
  );
  return [header, ...rows].join('\n');
}
