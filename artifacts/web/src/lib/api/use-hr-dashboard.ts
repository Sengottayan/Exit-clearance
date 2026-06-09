import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";

export interface DashboardOverview {
  activeCases: number;
  pendingApprovals: number;
  inClearance: number;
  overdueTasks: number;
  completedThisMonth: number;
  totalCases: number;
}

export interface DashboardData {
  overview: DashboardOverview;
  trends: {
    activeCasesPercentage: number;
  };
  slaAggregate: Array<{ name: string; value: number }>;
  attentionItems: Array<{ title: string; value: number; description: string }>;
  deadlines: Array<{ label: string; count: number; color: string }>;
  priorityAlerts: Array<{ severity: string; message: string }>;
  timelineEvents: Array<{
    id: string;
    type: string;
    label: string;
    timestamp: string;
    actor: string;
    actor_role: string;
    case_id: string;
    employee_name: string;
  }>;
  exitTrend: Array<{ name: string; exits: number }>;
  hasMoreTimeline: boolean;
}

export function useHRDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get<DashboardData>("/api/hr/dashboard");
      setData(res.data);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to load dashboard data";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
