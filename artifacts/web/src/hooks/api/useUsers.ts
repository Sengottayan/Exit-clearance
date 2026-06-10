import { useQuery } from "@tanstack/react-query";

const userKeys = {
  all: ["users"] as const,
  list: (filters: any) => [...userKeys.all, "list", filters] as const,
};

export function useUsers(filters?: Record<string, string | number>) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const res = await fetch(`/api/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });
}
