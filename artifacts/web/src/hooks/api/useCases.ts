import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useExitStore } from "@/store/exitStore";
import { useAuthStore } from "@/store/authStore";
import { ExitCase, CaseComment, ExitInterview } from "@/lib/types";
import { buildClearanceTasks, getManagerForEmployee } from "@/lib/workflow";
import { DEPARTMENTS } from "@/lib/constants";

const casesKeys = {
  all: ["cases"] as const,
  list: (filters?: Record<string, string>) => ["cases", "list", filters] as const,
  detail: (id: string) => ["cases", "detail", id] as const,
  tasks: (caseId: string) => ["cases", "tasks", caseId] as const,
  comments: (caseId: string) => ["cases", "comments", caseId] as const,
};

function filterCases(cases: ExitCase[], filters?: Record<string, string>): ExitCase[] {
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
    queryFn: () => filterCases(useExitStore.getState().cases, filters),
  });
}

export function useCase(caseId: string) {
  return useQuery({
    queryKey: casesKeys.detail(caseId),
    queryFn: () => useExitStore.getState().cases.find((c) => c.id === caseId) ?? null,
    enabled: !!caseId,
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      employeeId: string;
      employeeName: string;
      employeeEmail: string;
      employeeRole: string;
      employeeDept: string;
      resignationDate: string;
      lastWorkingDay: string;
      noticePeriodDays: number;
      exitReason: string;
    }) => {
      const manager = getManagerForEmployee(input.employeeDept);
      const tasks = buildClearanceTasks(DEPARTMENTS.map((d) => d.id), new Date(input.resignationDate));
      const newCase: Omit<ExitCase, "id"> = {
        ...input,
        managerId: manager.id,
        managerName: manager.name,
        status: "pending_manager",
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
      useExitStore.getState().addCase(newCase);
      return useExitStore.getState().cases[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: casesKeys.all });
    },
  });
}

export function useApproveResignation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ caseId, actor }: { caseId: string; actor: string }) => {
      useExitStore.getState().approveResignation(caseId, actor);
      return useExitStore.getState().cases.find((c) => c.id === caseId)!;
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
      useExitStore.getState().cancelCase(caseId, reason, actor);
      return useExitStore.getState().cases.find((c) => c.id === caseId)!;
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
      useExitStore.getState().extendLastWorkingDay(caseId, newDate, actor);
      return useExitStore.getState().cases.find((c) => c.id === caseId)!;
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
      useExitStore.getState().escalateCase(caseId, reason, actor);
      return useExitStore.getState().cases.find((c) => c.id === caseId)!;
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
    queryFn: () => useExitStore.getState().cases.find((c) => c.id === caseId)?.comments ?? [],
    enabled: !!caseId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ caseId, comment }: { caseId: string; comment: Omit<CaseComment, "id" | "timestamp"> }) => {
      useExitStore.getState().addComment(caseId, comment);
      return useExitStore.getState().cases.find((c) => c.id === caseId)?.comments;
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
      useExitStore.getState().saveExitInterview(caseId, interview);
      return useExitStore.getState().cases.find((c) => c.id === caseId)?.exitInterview ?? null;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: casesKeys.detail(variables.caseId) });
    },
  });
}
