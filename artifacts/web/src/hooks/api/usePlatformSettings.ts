import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface PlatformSettings {
  sla_warning_hours: number;
  escalation_hours: number;
  default_workflow_template_id: string;
}

const keys = {
  all: ["settings"] as const,
};

export function usePlatformSettings() {
  return useQuery({
    queryKey: keys.all,
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      // Coerce parsed string JSONB values into proper types
      const data = await res.json();
      return {
        sla_warning_hours: parseInt(data.sla_warning_hours || "24", 10),
        escalation_hours: parseInt(data.escalation_hours || "48", 10),
        default_workflow_template_id: (data.default_workflow_template_id || "standard").replace(/"/g, ''),
      } as PlatformSettings;
    },
  });
}

export function useUpdatePlatformSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<PlatformSettings>) => {
      // The DB values are JSONB, so strings represent JSON strings
      const payload: any = {};
      if (updates.sla_warning_hours !== undefined) payload.sla_warning_hours = updates.sla_warning_hours.toString();
      if (updates.escalation_hours !== undefined) payload.escalation_hours = updates.escalation_hours.toString();
      if (updates.default_workflow_template_id !== undefined) payload.default_workflow_template_id = `"${updates.default_workflow_template_id}"`;

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
    },
  });
}
