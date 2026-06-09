import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSettingsStore } from "@/store/settingsStore";
import type { Department, DeptId, ChecklistTemplate } from "@/lib/types";
import { mapKeys } from "@/lib/mappers";

const settingsKeys = {
  departments: ["settings", "departments"] as const,
  checklistTemplates: (deptId: string) => ["settings", "checklist-templates", deptId] as const,
  workflows: ["settings", "workflows"] as const,
};

export function useDepartments() {
  return useQuery({
    queryKey: settingsKeys.departments,
    queryFn: async () => {
      try {
        const res = await fetch("/api/departments");
        if (!res.ok) throw new Error("API unavailable");
        const data: Record<string, unknown>[] = await res.json();
        return data.map(mapKeys<Department>);
      } catch {
        return useSettingsStore.getState().departments;
      }
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: DeptId; updates: Partial<Department> }) => {
      try {
        const body = { ...updates };
        await fetch(`/api/departments/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch {
        useSettingsStore.getState().updateDepartment(id, updates);
      }
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
      try {
        await fetch("/api/departments/reset", { method: "POST" });
      } catch {
        useSettingsStore.getState().resetDepartments();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.departments });
    },
  });
}

export function useChecklistTemplates(deptId: string) {
  return useQuery({
    queryKey: settingsKeys.checklistTemplates(deptId),
    queryFn: async () => {
      try {
        const res = await fetch(`/api/departments/${deptId}/checklist-templates`);
        if (!res.ok) throw new Error("API unavailable");
        const data: Record<string, unknown>[] = await res.json();
        return data.map(mapKeys<ChecklistTemplate>);
      } catch {
        return useSettingsStore.getState().checklistTemplates[deptId] ?? [];
      }
    },
    enabled: !!deptId,
  });
}

export function useUpdateChecklistTemplates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ deptId, items }: { deptId: string; items: ChecklistTemplate[] }) => {
      try {
        await fetch(`/api/departments/${deptId}/checklist-templates`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });
      } catch {
        useSettingsStore.getState().updateChecklistForDept(deptId, items);
      }
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
      try {
        await fetch(`/api/departments/${deptId}/checklist-templates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
      } catch {
        useSettingsStore.getState().addChecklistItem(deptId, item);
      }
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
      try {
        await fetch(`/api/departments/${deptId}/checklist-templates/${itemId}`, {
          method: "DELETE",
        });
      } catch {
        useSettingsStore.getState().removeChecklistItem(deptId, itemId);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.checklistTemplates(variables.deptId) });
    },
  });
}

export function useWorkflowTemplates() {
  return useQuery({
    queryKey: settingsKeys.workflows,
    queryFn: async () => {
      try {
        const res = await fetch("/api/workflows");
        if (!res.ok) throw new Error("API unavailable");
        return await res.json();
      } catch {
        return useSettingsStore.getState().workflowTemplates;
      }
    },
  });
}

export function useUpdateWorkflowTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      try {
        await fetch(`/api/workflows/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
      } catch {
        useSettingsStore.getState().updateWorkflowTemplate(id, updates);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.workflows });
    },
  });
}

export function useWorkflowSettings() {
  return useQuery({
    queryKey: ["settings", "workflow"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error("API unavailable");
        return await res.json();
      } catch {
        return useSettingsStore.getState().workflow;
      }
    },
  });
}

export function useUpdateWorkflowSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      try {
        await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
      } catch {
        useSettingsStore.getState().updateWorkflow(updates as Parameters<ReturnType<typeof useSettingsStore.getState>["updateWorkflow"]>[0]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "workflow"] });
    },
  });
}
