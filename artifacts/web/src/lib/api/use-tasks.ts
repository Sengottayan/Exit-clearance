import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";

export function useTasks(params?: {
  status?: string;
  assigneeId?: string;
  caseId?: string;
}) {
  const [data, setData] = useState<unknown[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const query = new URLSearchParams();
      if (params?.status) query.set("status", params.status);
      if (params?.assigneeId) query.set("assigneeId", params.assigneeId);
      if (params?.caseId) query.set("caseId", params.caseId);
      const qs = query.toString();
      const res = await axios.get(`/api/tasks${qs ? `?${qs}` : ""}`);
      setData(res.data);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to load tasks";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [params?.status, params?.assigneeId, params?.caseId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useUsers() {
  const [data, setData] = useState<unknown[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/users")
      .then((res) => setData(res.data))
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

export function useDepartments() {
  const [data, setData] = useState<unknown[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/departments")
      .then((res) => setData(res.data))
      .catch(() => toast.error("Failed to load departments"))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
