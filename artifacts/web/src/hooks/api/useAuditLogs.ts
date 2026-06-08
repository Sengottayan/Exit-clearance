import { useQuery } from "@tanstack/react-query";
import { useExitStore } from "@/store/exitStore";
import { useAuthStore } from "@/store/authStore";
import { buildAuditLog, AuditLogEntry } from "@/lib/audit";

const PAGE_SIZE = 50;

interface AuditLogFilters {
  page?: number;
  pageSize?: number;
  type?: string;
  action?: string;
  actor?: string;
  caseId?: string;
  from?: string;
  to?: string;
}

interface PaginatedResult {
  data: AuditLogEntry[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

function filterLogs(logs: AuditLogEntry[], filters?: AuditLogFilters): AuditLogEntry[] {
  if (!filters) return logs;
  let result = [...logs];
  if (filters.type) result = result.filter((l) => l.type === filters.type);
  if (filters.action) result = result.filter((l) => l.action === filters.action);
  if (filters.actor) result = result.filter((l) => l.actor.toLowerCase().includes(filters.actor!.toLowerCase()));
  if (filters.caseId) result = result.filter((l) => l.caseId === filters.caseId);
  if (filters.from) result = result.filter((l) => new Date(l.timestamp) >= new Date(filters.from!));
  if (filters.to) result = result.filter((l) => new Date(l.timestamp) <= new Date(filters.to!));
  return result;
}

export function useAuditLogs(filters?: AuditLogFilters) {
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? PAGE_SIZE;

  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: (): PaginatedResult => {
      const allLogs = filterLogs(buildAuditLog(useExitStore.getState().cases), filters);
      const total = allLogs.length;
      const totalPages = Math.ceil(total / pageSize);
      const start = (page - 1) * pageSize;
      const data = allLogs.slice(start, start + pageSize);
      return { data, meta: { page, pageSize, total, totalPages } };
    },
  });
}
