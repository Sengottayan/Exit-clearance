import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const keys = {
  all: ["workflows"] as const,
};

export function useWorkflows() {
  return useQuery({
    queryKey: keys.all,
    queryFn: async () => {
      const res = await fetch("/api/workflows");
      if (!res.ok) throw new Error("Failed to fetch workflows");
      return res.json();
    },
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await fetch(`/api/workflows/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update workflow");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      // We also invalidate settings since workflow patch can update global settings
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
