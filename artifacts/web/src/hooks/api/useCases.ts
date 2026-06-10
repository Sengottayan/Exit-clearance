import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useExitStore } from "@/store/exitStore";
import type { ExitCase, CaseComment, ExitInterview } from "@/lib/types";
import { toExitCase, mapKeys } from "@/lib/mappers";
import { buildClearanceTasks, getManagerForEmployee } from "@/lib/workflow";
import { DEPARTMENTS } from "@/lib/constants";

interface ApiCaseComment {
  id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  message: string;
  timestamp: string;
  visibility: string;
}

const casesKeys = {
  all: ["cases"] as const,
  list: (filters?: Record<string, string>) => ["cases", "list", filters] as const,
  detail: (id: string) => ["cases", "detail", id] as const,
  tasks: (caseId: string) => ["cases", "tasks", caseId] as const,
  comments: (caseId: string) => ["cases", "comments", caseId] as const,
  metrics: () => ["cases", "metrics"] as const,
};

function getFallbackCases(filters?: Record<string, string>): ExitCase[] {
  const cases = useExitStore.getState().cases;
  if (!filters) return cases;
  let result = [...cases];
  if (filters.status) result = result.filter((c) => c.status === filters.status);
  if (filters.employeeId) result = result.filter((c) => c.employeeId === filters.employeeId);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (c) =>
        c.employeeName.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.employeeDept.toLowerCase().includes(q),
    );
  }
  return result;
}

export function useCases(filters?: Record<string, string>) {
  return useQuery({
    queryKey: casesKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.search) params.set("search", filters.search);
      const qs = params.toString();
      const res = await fetch(`/api/cases${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("API unavailable");
      const data: Record<string, unknown>[] = await res.json();
      return data.map(toExitCase);
    },
  });
}

export function useCaseMetrics(filters?: Record<string, string>) {
  return useQuery({
    queryKey: [...casesKeys.metrics(), filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.manager_id) params.set("manager_id", filters.manager_id);
      const qs = params.toString();
      const res = await fetch(`/api/cases/metrics${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("API unavailable");
      return res.json();
    },
  });
}

export function useCase(caseId: string) {
  return useQuery({
    queryKey: casesKeys.detail(caseId),
    queryFn: async () => {
      // First try the local store — covers cases created in this session before refetch completes
      const localCase = useExitStore.getState().cases.find((c) => c.id === caseId);

      try {
        const res = await fetch(`/api/cases/${caseId}`);
        if (!res.ok) {
          if (res.status === 404) return localCase ?? null;
          throw new Error("API unavailable");
        }
        const data: Record<string, unknown> = await res.json();
        const apiCase = toExitCase(data);

        // Sync the API result back into the local store so future fallbacks work
        const store = useExitStore.getState();
        const existsInStore = store.cases.some((c) => c.id === caseId);
        if (!existsInStore && apiCase) {
          // Add to store without going through the store's addCase (which assigns a new id)
          store.cases = [apiCase, ...store.cases];
        }

        return apiCase;
      } catch {
        // Fallback to local store (covers offline / API down scenarios)
        return localCase ?? null;
      }
    },
    enabled: !!caseId,
    // Retry once after a short delay to handle race conditions after creation
    retry: 1,
    retryDelay: 800,
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      userId: string;         // Clerk user ID — used as employee_id FK
      employeeId: string;     // HR system number — stored as employee_name label
      employeeName: string;
      employeeEmail: string;
      employeeRole: string;
      employeeDept: string;
      resignationDate: string;
      lastWorkingDay: string;
      noticePeriodDays: number;
      exitReason: string;
    }) => {
      // Resolve manager — try DB first, fall back to mock constant
      let resolvedManagerId = "system-manager";
      let resolvedManagerName = "HR Manager (System)";

      try {
        const mgRes = await fetch(`/api/employee/profile?dept=${encodeURIComponent(input.employeeDept)}`);
        if (mgRes.ok) {
          const mgData = await mgRes.json();
          if (mgData?.managerId) {
            resolvedManagerId = mgData.managerId;
            resolvedManagerName = mgData.managerName ?? resolvedManagerName;
          }
        }
      } catch {
        // Fall back to mock lookup
        const mockManager = getManagerForEmployee(input.employeeDept);
        resolvedManagerId = mockManager.id;
        resolvedManagerName = mockManager.name;
      }

      try {
        const body = {
          // employee_id in body is the HR number; the API uses the Clerk userId from the session
          employee_id: input.employeeId,
          employee_name: input.employeeName,
          employee_email: input.employeeEmail,
          employee_role: input.employeeRole,
          employee_dept: input.employeeDept,
          manager_id: resolvedManagerId,
          manager_name: resolvedManagerName,
          resignation_date: input.resignationDate,
          last_working_day: input.lastWorkingDay,
          notice_period_days: input.noticePeriodDays,
          exit_reason: input.exitReason,
        };
        const res = await fetch("/api/cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("API unavailable");
        const data: Record<string, unknown> = await res.json();
        const createdCase = toExitCase(data);

        // Immediately seed both local store and query cache
        const store = useExitStore.getState();
        if (!store.cases.some((c) => c.id === createdCase.id)) {
          const tasks = buildClearanceTasks(DEPARTMENTS.map((d) => d.id), new Date(input.resignationDate));
          const localCase: ExitCase = {
            ...createdCase,
            managerId: resolvedManagerId,
            managerName: resolvedManagerName,
            tasks,
            timeline: [
              {
                id: `evt-${Date.now()}`,
                label: "Resignation submitted",
                timestamp: new Date().toISOString(),
                actor: input.employeeName,
                actorRole: "employee",
              },
            ],
            documents: {},
          };
          useExitStore.getState().addCase(localCase);
        }

        return createdCase;
      } catch {
        // Full offline fallback
        const tasks = buildClearanceTasks(DEPARTMENTS.map((d) => d.id), new Date(input.resignationDate));
        const newCase: Omit<ExitCase, "id"> = {
          employeeId: input.employeeId,
          employeeName: input.employeeName,
          employeeEmail: input.employeeEmail,
          employeeRole: input.employeeRole,
          employeeDept: input.employeeDept,
          managerId: resolvedManagerId,
          managerName: resolvedManagerName,
          status: "pending_manager",
          resignationDate: input.resignationDate,
          lastWorkingDay: input.lastWorkingDay,
          noticePeriodDays: input.noticePeriodDays,
          exitReason: input.exitReason,
          tasks,
          timeline: [
            {
              id: `evt-${Date.now()}`,
              label: "Resignation submitted",
              timestamp: new Date().toISOString(),
              actor: input.employeeName,
              actorRole: "employee",
            },
          ],
          documents: {},
        };
        useExitStore.getState().addCase(newCase as ExitCase);
        return useExitStore.getState().cases[0];
      }
    },
    onSuccess: (data) => {
      if (!data?.id) return;
      queryClient.setQueryData(casesKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: casesKeys.list() });
    },
  });
}

export function useApproveResignation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ caseId, actor }: { caseId: string; actor: string }) => {
      try {
        const res = await fetch(`/api/cases/${caseId}/approve-resignation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actor }),
        });
        if (!res.ok) throw new Error("API unavailable");
        const data = await res.json();
        return data;
      } catch {
        useExitStore.getState().approveResignation(caseId, actor);
        return useExitStore.getState().cases.find((c) => c.id === caseId)!;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(casesKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: casesKeys.list() });
    },
  });
}

export function useCancelCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ caseId, reason, actor }: { caseId: string; reason: string; actor: string }) => {
      try {
        const res = await fetch(`/api/cases/${caseId}/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason, actor }),
        });
        if (!res.ok) throw new Error("API unavailable");
        return await res.json();
      } catch {
        useExitStore.getState().cancelCase(caseId, reason, actor);
        return useExitStore.getState().cases.find((c) => c.id === caseId)!;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(casesKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: casesKeys.list() });
    },
  });
}

export function useExtendLastWorkingDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ caseId, newDate, actor }: { caseId: string; newDate: string; actor: string }) => {
      try {
        const res = await fetch(`/api/cases/${caseId}/extend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ new_date: newDate, actor }),
        });
        if (!res.ok) throw new Error("API unavailable");
        return await res.json();
      } catch {
        useExitStore.getState().extendLastWorkingDay(caseId, newDate, actor);
        return useExitStore.getState().cases.find((c) => c.id === caseId)!;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(casesKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: casesKeys.list() });
    },
  });
}

export function useEscalateCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ caseId, reason, actor }: { caseId: string; reason: string; actor: string }) => {
      try {
        const res = await fetch(`/api/cases/${caseId}/escalate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason, actor }),
        });
        if (!res.ok) throw new Error("API unavailable");
        return await res.json();
      } catch {
        useExitStore.getState().escalateCase(caseId, reason, actor);
        return useExitStore.getState().cases.find((c) => c.id === caseId)!;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(casesKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: casesKeys.list() });
    },
  });
}

export function useCaseComments(caseId: string) {
  return useQuery({
    queryKey: casesKeys.comments(caseId),
    queryFn: async () => {
      try {
        const res = await fetch(`/api/cases/${caseId}/comments`);
        if (!res.ok) throw new Error("API unavailable");
        const data: Record<string, unknown>[] = await res.json();
        return data.map(mapKeys<CaseComment>);
      } catch {
        return useExitStore.getState().cases.find((c) => c.id === caseId)?.comments ?? [];
      }
    },
    enabled: !!caseId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ caseId, comment }: { caseId: string; comment: Omit<CaseComment, "id" | "timestamp"> }) => {
      try {
        const body = {
          author_id: comment.authorId,
          author_name: comment.authorName,
          author_role: comment.authorRole,
          message: comment.message,
          visibility: comment.visibility,
        };
        const res = await fetch(`/api/cases/${caseId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("API unavailable");
        return await res.json();
      } catch {
        useExitStore.getState().addComment(caseId, comment);
        return useExitStore.getState().cases.find((c) => c.id === caseId)?.comments;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: casesKeys.comments(variables.caseId) });
    },
  });
}

export function useSaveExitInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ caseId, interview }: { caseId: string; interview: ExitInterview }) => {
      try {
        const body = {
          overall_rating: interview.overallRating,
          management_rating: interview.managementRating,
          culture_rating: interview.cultureRating,
          reason: interview.reason,
          improvements: interview.improvements,
          would_rejoin: interview.wouldRejoin,
          comments: interview.comments,
        };
        const res = await fetch(`/api/cases/${caseId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("API unavailable");
        return await res.json();
      } catch {
        useExitStore.getState().saveExitInterview(caseId, interview);
        return useExitStore.getState().cases.find((c) => c.id === caseId)?.exitInterview ?? null;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: casesKeys.detail(variables.caseId) });
    },
  });
}
