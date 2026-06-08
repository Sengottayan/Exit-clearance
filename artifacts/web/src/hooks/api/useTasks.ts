import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useExitStore } from "@/store/exitStore";
import { useAuthStore } from "@/store/authStore";
import { ClearanceTask, ChecklistItem } from "@/lib/types";

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

function findAllTasks(): (ClearanceTask & { caseId: string; employeeName: string })[] {
  const cases = useExitStore.getState().cases;
  const tasks: (ClearanceTask & { caseId: string; employeeName: string })[] = [];
  for (const c of cases) {
    for (const t of c.tasks) {
      tasks.push({ ...t, caseId: c.id, employeeName: c.employeeName });
    }
  }
  return tasks;
}

function filterTasks(tasks: ReturnType<typeof findAllTasks>, filters?: Record<string, string>) {
  if (!filters) return tasks;
  let result = [...tasks];
  if (filters.status) result = result.filter((t) => t.status === filters.status);
  if (filters.assigneeId) result = result.filter((t) => t.assigneeId === filters.assigneeId);
  if (filters.caseId) result = result.filter((t) => t.caseId === filters.caseId);
  return result;
}

export function useTasks(filters?: Record<string, string | undefined>) {
  const user = useAuthStore((s) => s.user);
  const effectiveFilters: Record<string, string> = {
    ...filters as Record<string, string>,
    ...(filters?.assigneeId ?? user?.id ? { assigneeId: filters?.assigneeId ?? user?.id ?? "" } : {}),
  };

  return useQuery({
    queryKey: tasksKeys.list(effectiveFilters as unknown as Record<string, string>),
    queryFn: () => filterTasks(findAllTasks(), effectiveFilters),
    enabled: !!user,
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: tasksKeys.detail(taskId),
    queryFn: () => {
      if (!taskId) return null;
      const { caseId, deptId } = parseTaskId(taskId);
      const c = useExitStore.getState().cases.find((c) => c.id === caseId);
      if (!c) return null;
      const task = c.tasks.find((t) => t.deptId === deptId);
      if (!task) return null;
      return { ...task, caseId: c.id, employeeName: c.employeeName, case: c };
    },
    enabled: !!taskId,
  });
}

export function useApproveTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, notes }: { taskId: string; notes?: string }) => {
      const { caseId, deptId } = parseTaskId(taskId);
      useExitStore.getState().approveTask(caseId, deptId, notes);
      return { caseId, deptId };
    },
    onSuccess: (result) => {
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
      useExitStore.getState().rejectTask(caseId, deptId, reason);
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
      useExitStore.getState().saveTaskDraft(caseId, deptId, checklist);
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
      useExitStore.getState().checkItem(caseId, deptId, itemId, checked);
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
      useExitStore.getState().setItemInput(caseId, deptId, itemId, inputValue);
      return { caseId, deptId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.detail(deriveTaskId(result.caseId, result.deptId)) });
    },
  });
}
