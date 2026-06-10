import { useQuery } from "@tanstack/react-query";

const keys = {
  all: ["admin_dashboard"] as const,
};

export function useAdminDashboard() {
  return useQuery({
    queryKey: keys.all,
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) throw new Error("Failed to fetch admin dashboard data");
      return res.json();
    },
    // Cache the dashboard data for 30 seconds
    staleTime: 30000,
  });
}
