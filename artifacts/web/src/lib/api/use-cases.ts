import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";

export function useCases(params?: { status?: string; search?: string }) {
  const [data, setData] = useState<unknown[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const query = new URLSearchParams();
      if (params?.status) query.set("status", params.status);
      if (params?.search) query.set("search", params.search);
      const qs = query.toString();
      const res = await axios.get(`/api/cases${qs ? `?${qs}` : ""}`);
      setData(res.data);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to load cases";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [params?.status, params?.search]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useCase(caseId: string | undefined) {
  const [data, setData] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!caseId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`/api/cases/${caseId}`);
      setData(res.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError("Case not found");
      } else {
        const message =
          axios.isAxiosError(err) && err.response?.data?.error
            ? err.response.data.error
            : "Failed to load case";
        setError(message);
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useCreateCase() {
  const [loading, setLoading] = useState(false);

  const create = useCallback(async (caseData: Record<string, unknown>) => {
    try {
      setLoading(true);
      const res = await axios.post("/api/cases", caseData);
      toast.success("Exit case created successfully");
      return res.data;
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to create case";
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading };
}

export function useUpdateCase() {
  const [loading, setLoading] = useState(false);

  const update = useCallback(
    async (caseId: string, updates: Record<string, unknown>) => {
      try {
        setLoading(true);
        const res = await axios.patch(`/api/cases/${caseId}`, updates);
        toast.success("Case updated");
        return res.data;
      } catch (err) {
        const message =
          axios.isAxiosError(err) && err.response?.data?.error
            ? err.response.data.error
            : "Failed to update case";
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { update, loading };
}
