import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChecklistTemplate } from "@/lib/types";

const keys = {
  all: ["checklists"] as const,
  byDept: (deptId: string) => [...keys.all, deptId] as const,
};

export function useChecklists(deptId: string) {
  return useQuery({
    queryKey: keys.byDept(deptId),
    queryFn: async () => {
      const res = await fetch(`/api/checklists/${deptId}`);
      if (!res.ok) throw new Error("Failed to fetch checklists");
      return res.json();
    },
    enabled: !!deptId,
  });
}

export function useUpdateChecklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ deptId, items }: { deptId: string; items: ChecklistTemplate[] }) => {
      const res = await fetch(`/api/checklists/${deptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error("Failed to update checklists");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: keys.byDept(variables.deptId) });
    },
  });
}
