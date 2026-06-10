import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AuditFilters {
  page:     number;
  limit:    number;
  type:     string;
  severity: string;
  search:   string;
  from:     string;
  to:       string;
}

export interface AuditLogRow {
  id:          string;
  timestamp:   string;
  severity:    "info" | "warn" | "error";
  actor:       string;
  actorRole:   string;
  eventType:   string;
  action:      string;
  target:      string;
  details:     string;
  ip:          string;
  sessionId:   string;
  isSynthetic: boolean;
}

export type AuditDelta = number | "new";

export interface AuditStats {
  totalEvents:      number;
  criticalEvents:   number;
  warningEvents:    number;
  infoEvents:       number;
  uniqueActors:     number;
  totalEventsDelta: AuditDelta;
  criticalDelta:    AuditDelta;
  warningDelta:     AuditDelta;
}

export interface AuditResponse {
  source:        "real" | "synthetic" | "legacy" | "empty";
  items:         AuditLogRow[];
  total:         number;
  page:          number;
  totalPages:    number;
  stats:         AuditStats;
  eventTrend:    { date: string; v: number }[];
  typeBreakdown: { name: string; value: number; pct: string; color: string }[];
  topActors:     { name: string; count: number; initials: string; color: string }[];
}

// ── Query Keys ─────────────────────────────────────────────────────────────────
export const auditKeys = {
  all:  ["audit"] as const,
  list: (filters: AuditFilters) => ["audit", "list", filters] as const,
};

// ── Internal debounce hook ─────────────────────────────────────────────────────
function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

// ── Main List Hook ─────────────────────────────────────────────────────────────
export function useAuditLogs(rawFilters: AuditFilters) {
  const debouncedSearch = useDebounced(rawFilters.search, 300);
  const filters = { ...rawFilters, search: debouncedSearch };

  return useQuery<AuditResponse>({
    queryKey: auditKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams({
        page:     String(filters.page),
        limit:    String(filters.limit),
        type:     filters.type,
        severity: filters.severity,
        search:   filters.search,
        from:     filters.from,
        to:       filters.to,
      });
      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to fetch audit logs");
      }
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
}

// ── Seed Mutation ─────────────────────────────────────────────────────────────
export function useSeedSyntheticAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/audit-logs/seed-synthetic", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to seed audit data");
      }
      return res.json() as Promise<{ seeded: boolean; count: number }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: auditKeys.all });
    },
  });
}

// ── Archive Mutation ──────────────────────────────────────────────────────────
export function useArchiveSyntheticAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/audit-logs/archive-synthetic", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to archive synthetic data");
      }
      return res.json() as Promise<{ archived: number }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: auditKeys.all });
    },
  });
}
