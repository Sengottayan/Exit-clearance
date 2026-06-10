import { useQuery } from "@tanstack/react-query";
import type {
  SlaSegment,
  ReasonSegment,
  DepartmentPoint,
  TrendPoint,
  Insight,
  SyntheticOverview,
} from "@/lib/analytics/synthetic-analytics";

// ── Filters ──────────────────────────────────────────────────────────────────
export interface ReportFilters {
  dateRange: string;
  department: string;
  exitReason: string;
}

// ── API Response ─────────────────────────────────────────────────────────────
export interface AnalyticsResponse {
  source: "database" | "synthetic";
  overview: SyntheticOverview;
  exitTrend: TrendPoint[];
  sla: SlaSegment[];
  reasons: ReasonSegment[];
  departments: DepartmentPoint[];
  insights: Insight[];
}

// ── Query Keys ────────────────────────────────────────────────────────────────
export const reportKeys = {
  all: ["reports"] as const,
  analytics: (filters: ReportFilters) => ["reports", "analytics", filters] as const,
};

// ── Main Hook ──────────────────────────────────────────────────────────────────
export function useReportsAnalytics(filters: ReportFilters) {
  return useQuery<AnalyticsResponse>({
    queryKey: reportKeys.analytics(filters),
    queryFn: async () => {
      const params = new URLSearchParams({
        dateRange: filters.dateRange,
        department: filters.department,
        exitReason: filters.exitReason,
      });

      const res = await fetch(`/api/reports/analytics?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to fetch analytics");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

// ── Legacy individual hooks (kept for backwards compatibility) ────────────────
import { useExitStore } from "@/store/exitStore";
import {
  computeExitTrend,
  computeExitReasons,
  computeTurnaround,
  computeSLAPerformance,
} from "@/lib/analytics";

export function useExitTrends(months = 12) {
  return useQuery({
    queryKey: ["reports", "exit-trends", months],
    queryFn: () => computeExitTrend(useExitStore.getState().cases, months),
  });
}

export function useExitReasons() {
  return useQuery({
    queryKey: ["reports", "exit-reasons"],
    queryFn: () => computeExitReasons(useExitStore.getState().cases),
  });
}

export function useTurnaround() {
  return useQuery({
    queryKey: ["reports", "turnaround"],
    queryFn: () => computeTurnaround(useExitStore.getState().cases),
  });
}

export function useSLAPerformance(months = 6) {
  return useQuery({
    queryKey: ["reports", "sla-performance", months],
    queryFn: () => computeSLAPerformance(useExitStore.getState().cases, months),
  });
}
