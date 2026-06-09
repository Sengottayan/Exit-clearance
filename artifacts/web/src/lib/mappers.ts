import type { ExitCase, ClearanceTask, TimelineEvent, ChecklistItem, CaseComment, ExitInterview } from "@/lib/types";

function toCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export function mapKeys<T = unknown>(obj: unknown): T {
  if (obj === null || obj === undefined) return obj as T;
  if (Array.isArray(obj)) return obj.map((item) => mapKeys(item)) as unknown as T;
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[toCamel(key)] = mapKeys(value);
    }
    return result as T;
  }
  return obj as T;
}

export function toExitCase(dbCase: Record<string, unknown>): ExitCase {
  const base = mapKeys<Partial<ExitCase>>(dbCase);
  return {
    ...base,
    tasks: (dbCase.clearance_tasks as Record<string, unknown>[] | undefined)?.map(toClearanceTask) ?? [],
    timeline: (dbCase.timeline_events as Record<string, unknown>[] | undefined)?.map(toTimelineEvent) ?? [],
    exitInterview: dbCase.exit_interviews
      ? toExitInterview(
          Array.isArray(dbCase.exit_interviews)
            ? (dbCase.exit_interviews as Record<string, unknown>[])[0]
            : (dbCase.exit_interviews as Record<string, unknown>),
        )
      : undefined,
    comments: (dbCase.case_comments as Record<string, unknown>[] | undefined)?.map(toCaseComment) ?? [],
    documents: {
      attachments: (dbCase.documents as Record<string, unknown>[] | undefined)?.map((d: Record<string, unknown>) => ({
        id: d.id as string,
        name: d.file_name as string ?? '',
        uploadedAt: d.uploaded_at as string ?? '',
        uploadedBy: d.uploaded_by as string ?? '',
      })) ?? [],
    },
  } as ExitCase;
}

export function toClearanceTask(dbTask: Record<string, unknown>): ClearanceTask {
  return {
    ...mapKeys(dbTask),
    checklist: (dbTask.checklist as Record<string, unknown>[] | undefined)?.map(mapKeys<ChecklistItem>) ?? [],
  } as ClearanceTask;
}

function toTimelineEvent(dbEvent: Record<string, unknown>): TimelineEvent {
  return mapKeys<TimelineEvent>(dbEvent);
}

function toCaseComment(dbComment: Record<string, unknown>): CaseComment {
  return mapKeys<CaseComment>(dbComment);
}

function toExitInterview(dbInterview: Record<string, unknown> | undefined): ExitInterview | undefined {
  if (!dbInterview) return undefined;
  return mapKeys<ExitInterview>(dbInterview);
}
