import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useExitStore } from "@/store/exitStore";
import { useAuthStore } from "@/store/authStore";
import type { ClearanceTask, ChecklistItem } from "@/lib/types";
import { toClearanceTask, toExitCase, mapKeys } from "@/lib/mappers";

const tasksKeys = {
  all: ["tasks"] as const,
  list: (filters?: Record<string, string>) => ["tasks", "list", filters] as const,
  detail: (id: string) => ["tasks", "detail", id] as const,
  forCase: (caseId: string) => ["tasks", "forCase", caseId] as const,
};

function deriveTaskId(caseId: string, deptId: string): string {
  return `${caseId}__${deptId}`;
}

function parseTaskId(taskId: string): { caseId: string; deptId: string } {
  const [caseId, deptId] = taskId.split("__");
  return { caseId, deptId };
}

function findAllTasksFromStore(): (ClearanceTask & { caseId: string; employeeName: string })[] {
  const cases = useExitStore.getState().cases;
  const tasks: (ClearanceTask & { caseId: string; employeeName: string })[] = [];
  for (const c of cases) {
    for (const t of c.tasks) {
      tasks.push({ ...t, caseId: c.id, employeeName: c.employeeName });
    }
  }
  return tasks;
}

export function useTasks(filters?: Record<string, string | undefined>) {
  const user = useAuthStore((s) => s.user);
  const effectiveFilters: Record<string, string> = {
    ...filters as Record<string, string>,
    ...(filters?.assigneeId ?? user?.id ? { assigneeId: filters?.assigneeId ?? user?.id ?? "" } : {}),
  };

  return useQuery({
    queryKey: tasksKeys.list(effectiveFilters as unknown as Record<string, string>),
    queryFn: async () => {
      try {
        const params = new URLSearchParams(effectiveFilters);
        const qs = params.toString();
        const res = await fetch(`/api/tasks${qs ? `?${qs}` : ""}`);
        if (!res.ok) throw new Error("API unavailable");
        const data: Record<string, unknown>[] = await res.json();
        return data.map((d) => {
          const task = toClearanceTask(d);
          const exitCase = d.exit_cases as Record<string, unknown> | undefined;
          return {
            ...task,
            caseId: d.case_id as string,
            employeeName: (exitCase?.employee_name as string) ?? "",
          };
        });
      } catch {
        const allTasks = findAllTasksFromStore();
        if (!effectiveFilters) return allTasks;
        let result = [...allTasks];
        if (effectiveFilters.status) result = result.filter((t) => t.status === effectiveFilters.status);
        if (effectiveFilters.assigneeId) result = result.filter((t) => t.assigneeId === effectiveFilters.assigneeId);
        if (effectiveFilters.caseId) result = result.filter((t) => t.caseId === effectiveFilters.caseId);
        return result;
      }
    },
    enabled: !!user,
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: tasksKeys.detail(taskId),
    queryFn: async () => {
      if (!taskId) return null;
      try {
        const { caseId, deptId } = parseTaskId(taskId);
        const params = new URLSearchParams({ caseId });
        const res = await fetch(`/api/tasks?${params.toString()}`);
        if (!res.ok) throw new Error("API unavailable");
        const data: Record<string, unknown>[] = await res.json();
        const dbTask = data.find((t) => t.dept_id === deptId);
        if (!dbTask) return null;
        const task = toClearanceTask(dbTask);
        const exitCase = dbTask.exit_cases as Record<string, unknown> | undefined;
        const fullCase = exitCase ? toExitCase(exitCase) : undefined;
        return {
          ...task,
          caseId: dbTask.case_id as string,
          employeeName: (exitCase?.employee_name as string) ?? "",
          case: fullCase,
        };
      } catch {
        const { caseId, deptId } = parseTaskId(taskId);
        const c = useExitStore.getState().cases.find((c) => c.id === caseId);
        if (!c) return null;
        const task = c.tasks.find((t) => t.deptId === deptId);
        if (!task) return null;
        return { ...task, caseId: c.id, employeeName: c.employeeName, case: c };
      }
    },
    enabled: !!taskId,
  });
}

export function useApproveTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, notes }: { taskId: string; notes?: string }) => {
      const { caseId, deptId } = parseTaskId(taskId);
      const res = await fetch(`/api/tasks/${taskId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to approve task");
      }
      return { caseId, deptId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.all });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}

export function useRejectTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, reason }: { taskId: string; reason: string }) => {
      const { caseId, deptId } = parseTaskId(taskId);
      const res = await fetch(`/api/tasks/${taskId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to reject task");
      }
      return { caseId, deptId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.all });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}

export function useSaveTaskDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, checklist }: { taskId: string; checklist: ChecklistItem[] }) => {
      const { caseId, deptId } = parseTaskId(taskId);
      const res = await fetch(`/api/tasks/${taskId}/save-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklist }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save draft");
      }
      return { caseId, deptId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.detail(deriveTaskId(result.caseId, result.deptId)) });
    },
  });
}

export function useCheckItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ caseId, deptId, itemId, checked }: { caseId: string; deptId: string; itemId: string; checked: boolean }) => {
      const res = await fetch(`/api/tasks/${deriveTaskId(caseId, deptId)}/check-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, checked }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update checklist item");
      }
      return { caseId, deptId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.detail(deriveTaskId(result.caseId, result.deptId)) });
    },
  });
}

export function useSetItemInput() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ caseId, deptId, itemId, inputValue }: { caseId: string; deptId: string; itemId: string; inputValue: string }) => {
      const res = await fetch(`/api/tasks/${deriveTaskId(caseId, deptId)}/set-item-input`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, inputValue }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update input value");
      }
      return { caseId, deptId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.detail(deriveTaskId(result.caseId, result.deptId)) });
    },
  });
}


