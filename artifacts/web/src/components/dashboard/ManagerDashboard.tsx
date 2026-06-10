"use client";

import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Users, Clock, Activity, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { Link } from "@/lib/wouter";

// ── Types ──────────────────────────────────────────────────────────────────────
interface DashboardData {
  metrics: {
    totalCases: number;
    pendingApproval: number;
    inClearance: number;
    slaOverdue: number;
    completed: number;
  };
  sla: { onTrack: number; atRisk: number; overdue: number; total: number };
  trend: { date: string; total: number; completed: number; overdue: number }[];
  recentPending: {
    caseId: string;
    employeeName: string;
    employeeDept: string;
    submittedAt: string;
  }[];
}

// ── Data hook ─────────────────────────────────────────────────────────────────
function useManagerDashboard(userId: string | undefined) {
  return useQuery<DashboardData>({
    queryKey: ["manager-dashboard", userId],
    queryFn: async () => {
      const qs = userId ? `?manager_id=${userId}` : "";
      const res = await fetch(`/api/manager/dashboard${qs}`);
      if (!res.ok) throw new Error("Failed to load dashboard data");
      return res.json();
    },
    enabled: !!userId,
    refetchInterval: 60_000, // Auto-refresh every 60s
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────
function KPICard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  sub,
  subColor,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  sub: string;
  subColor: string;
  loading: boolean;
}) {
  return (
    <div className="bg-[#121622] border border-[#1e2536] rounded-xl p-4 flex flex-col justify-between min-h-[100px]">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[#8e9bb0] text-xs font-semibold leading-tight">{label}</span>
        <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>
      <div>
        {loading ? (
          <div className="h-8 w-12 bg-[#1e2536] animate-pulse rounded" />
        ) : (
          <h2 className="text-3xl font-bold text-white">{value}</h2>
        )}
        <p className={`text-xs font-medium mt-1 ${subColor}`}>{sub}</p>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function ManagerDashboard() {
  const { user } = useAuth();
  const { data, isLoading, error } = useManagerDashboard(user?.id);

  const metrics = data?.metrics;
  const sla = data?.sla;
  const trend = data?.trend ?? [];
  const recentPending = data?.recentPending ?? [];

  const slaChartData = sla
    ? [
        { name: "On Track", value: sla.onTrack, color: "#10b981" },
        { name: "At Risk",  value: sla.atRisk,  color: "#f59e0b" },
        { name: "Overdue",  value: sla.overdue,  color: "#ef4444" },
      ]
    : [];

  return (
    <div className="space-y-6 animate-slide-up pb-8 text-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Manager Dashboard</h1>
          <p className="text-[#8e9bb0] text-sm mt-1">Overview of your team exit management.</p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-[#8e9bb0] text-xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
          </div>
        )}
        {error && (
          <span className="text-xs text-red-400 bg-red-500/10 px-3 py-1 rounded border border-red-500/20">
            Failed to load dashboard data
          </span>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <KPICard label="Total Cases"               value={metrics?.totalCases ?? 0}     icon={Users}         iconBg="bg-[#1e2b4d]" iconColor="text-[#60a5fa]" sub="All team exits"              subColor="text-[#8e9bb0]"  loading={isLoading} />
        <KPICard label="Pending Manager Approval"  value={metrics?.pendingApproval ?? 0} icon={Clock}         iconBg="bg-[#362719]" iconColor="text-[#fbbf24]" sub="Requires your action"       subColor="text-[#fbbf24]"  loading={isLoading} />
        <KPICard label="In Clearance"              value={metrics?.inClearance ?? 0}     icon={Activity}      iconBg="bg-[#1e2b4d]" iconColor="text-[#60a5fa]" sub="In progress"               subColor="text-[#60a5fa]"  loading={isLoading} />
        <KPICard label="SLA Overdue"               value={metrics?.slaOverdue ?? 0}      icon={AlertTriangle} iconBg="bg-[#3f191f]" iconColor="text-[#f87171]" sub="Requires immediate action"  subColor="text-[#f87171]"  loading={isLoading} />
        <KPICard label="Completed"                 value={metrics?.completed ?? 0}       icon={CheckCircle2}  iconBg="bg-[#143224]" iconColor="text-[#34d399]" sub="Successfully closed"        subColor="text-[#10b981]"  loading={isLoading} />
      </div>

      {/* Charts & Pending List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Line Chart — Exit Cases Trend */}
        <div className="lg:col-span-5 bg-[#121622] border border-[#1e2536] rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">Exit Cases Trend</h3>
            <p className="text-xs text-[#8e9bb0]">Last 30 days</p>
          </div>
          {isLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-[#3b82f6] animate-spin" />
            </div>
          ) : (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2536" vertical={false} />
                  <XAxis dataKey="date" stroke="#8e9bb0" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} minTickGap={30} />
                  <YAxis stroke="#8e9bb0" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#121622", borderColor: "#1e2536", borderRadius: "8px", fontSize: "12px" }} itemStyle={{ color: "#fff" }} />
                  <Line type="monotone" dataKey="total"     name="Total Cases" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="completed" name="Completed"   stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="overdue"   name="SLA Overdue" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#3b82f6]" /><span className="text-[10px] text-[#8e9bb0]">Total Cases</span></div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#10b981]" /><span className="text-[10px] text-[#8e9bb0]">Completed</span></div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#ef4444]" /><span className="text-[10px] text-[#8e9bb0]">SLA Overdue</span></div>
          </div>
        </div>

        {/* Donut Chart — SLA Status Overview */}
        <div className="lg:col-span-4 bg-[#121622] border border-[#1e2536] rounded-xl p-5 flex flex-col">
          <h3 className="text-sm font-semibold text-white mb-4">SLA Status Overview</h3>
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-[#3b82f6] animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex-1 flex items-center justify-center relative">
                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                  <span className="text-2xl font-bold text-white">{sla?.total ?? 0}</span>
                  <span className="text-[10px] text-[#8e9bb0]">Active Cases</span>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={slaChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={75} stroke="none" dataKey="value">
                      {slaChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#121622", borderColor: "#1e2536", borderRadius: "8px", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2 mt-2 w-[80%] mx-auto">
                {slaChartData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-white">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-white font-medium w-4 text-right">{item.value}</span>
                      <span className="text-[#8e9bb0] text-[10px] w-10 text-right">
                        {sla && sla.total > 0 ? ((item.value / sla.total) * 100).toFixed(1) : "0.0"}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Recent Pending Approvals */}
        <div className="lg:col-span-3 bg-[#121622] border border-[#1e2536] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-semibold text-white">Recent Pending Approvals</h3>
              <Link href="/cases" className="text-xs text-[#60a5fa] hover:underline">View All</Link>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-[#1e2536] animate-pulse rounded" />
                ))}
              </div>
            ) : recentPending.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-8 h-8 text-[#10b981] mx-auto mb-2" />
                <p className="text-[#8e9bb0] text-xs">No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-5">
                {recentPending.map((item) => (
                  <Link key={item.caseId} href={`/cases/${item.caseId}`} className="flex justify-between items-center group">
                    <div>
                      <p className="text-sm font-medium text-white group-hover:text-[#60a5fa] transition-colors">{item.employeeName}</p>
                      <p className="text-[10px] text-[#8e9bb0]">{item.caseId}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-2 py-0.5 rounded border border-[#fbbf24]/30 bg-[#fbbf24]/10 text-[#fbbf24] text-[10px] font-medium">
                        Pending
                      </span>
                      <span className="text-[10px] text-[#8e9bb0] w-12 text-right">
                        {formatDistanceToNow(new Date(item.submittedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <Link href="/cases" className="text-xs text-[#60a5fa] hover:underline flex items-center justify-center gap-1 font-medium">
              Go to Team Exits <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
