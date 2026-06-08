import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSettingsStore } from "@/store/settingsStore";
import { Department, DeptId, ChecklistTemplate } from "@/lib/types";

const settingsKeys = {
  departments: ["settings", "departments"] as const,
  checklistTemplates: (deptId: string) => ["settings", "checklist-templates", deptId] as const,
  workflows: ["settings", "workflows"] as const,
};

export function useDepartments() {
  return useQuery({
    queryKey: settingsKeys.departments,
    queryFn: () => useSettingsStore.getState().departments,
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: DeptId; updates: Partial<Department> }) => {
      useSettingsStore.getState().updateDepartment(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.departments });
    },
  });
}

export function useResetDepartments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      useSettingsStore.getState().resetDepartments();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.departments });
    },
  });
}

export function useChecklistTemplates(deptId: string) {
  return useQuery({
    queryKey: settingsKeys.checklistTemplates(deptId),
    queryFn: () => useSettingsStore.getState().checklistTemplates[deptId] ?? [],
    enabled: !!deptId,
  });
}

export function useUpdateChecklistTemplates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ deptId, items }: { deptId: string; items: ChecklistTemplate[] }) => {
      useSettingsStore.getState().updateChecklistForDept(deptId, items);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.checklistTemplates(variables.deptId) });
    },
  });
}

export function useAddChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ deptId, item }: { deptId: string; item: ChecklistTemplate }) => {
      useSettingsStore.getState().addChecklistItem(deptId, item);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.checklistTemplates(variables.deptId) });
    },
  });
}

export function useRemoveChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ deptId, itemId }: { deptId: string; itemId: string }) => {
      useSettingsStore.getState().removeChecklistItem(deptId, itemId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.checklistTemplates(variables.deptId) });
    },
  });
}

export function useWorkflowTemplates() {
  return useQuery({
    queryKey: settingsKeys.workflows,
    queryFn: () => useSettingsStore.getState().workflowTemplates,
  });
}

export function useUpdateWorkflowTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      useSettingsStore.getState().updateWorkflowTemplate(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.workflows });
    },
  });
}

export function useWorkflowSettings() {
  return useQuery({
    queryKey: ["settings", "workflow"],
    queryFn: () => useSettingsStore.getState().workflow,
  });
}

export function useUpdateWorkflowSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      useSettingsStore.getState().updateWorkflow(updates as Parameters<ReturnType<typeof useSettingsStore.getState>["updateWorkflow"]>[0]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "workflow"] });
    },
  });
}
