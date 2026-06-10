import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Department } from "@/lib/types";

const keys = {
  all: ["departments"] as const,
};

export function useDepartments() {
  return useQuery({
    queryKey: keys.all,
    queryFn: async () => {
      const res = await fetch("/api/departments");
      if (!res.ok) throw new Error("Failed to fetch departments");
      const data = await res.json();
      return data.map((d: any) => ({
        id: d.id,
        label: d.label,
        icon: d.icon,
        isMandatory: d.is_mandatory,
        slaHours: d.sla_hours,
        defaultAssignee: d.default_assignee,
      })) as Department[];
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Department> }) => {
      const res = await fetch(`/api/departments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update department");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
    },
  });
}
