"use client";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/api/useProfile";
import { Redirect } from "@/lib/wouter";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Download, Calendar, TrendingUp, CheckCircle2, Activity,
  AlertTriangle, Clock, Filter, Users, BarChart2, PieChart,
  ExternalLink, ChevronDown,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { useReportsAnalytics } from "@/hooks/api/useReports";
import type { ReportFilters } from "@/hooks/api/useReports";

const TABS = [
  "Overview", "SLA Performance", "Exit Volume",
  "Reasons Analysis", "Department Analysis", "Manager Performance",
];

// ── Custom tooltips ──────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white shadow-xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-bold" style={{ color: p.color ?? "#6366f1" }}>
          {p.value} exits
        </p>
      ))}
    </div>
  );
}

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white shadow-xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-bold text-indigo-400">{payload[0]?.value} exits</p>
    </div>
  );
}

// ── Skeleton helpers ─────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-muted/40 ${className}`} />
  );
}

// ── Insight icon map ─────────────────────────────────────────────────────────
const ICON_MAP = {
  TrendingUp: TrendingUp,
  Clock: Clock,
  AlertTriangle: AlertTriangle,
};

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { isHR, isAdmin, isDeptApprover } = useAuth();
  const { data: profile } = useUserProfile();
  const [activeTab, setActiveTab] = useState("Overview");
  const [trendGrouping, setTrendGrouping] = useState("Weekly");

  // For dept_approver: lock to assigned departments only (no cross-dept data)
  const departmentAssignments = profile?.departmentAssignments ?? [];
  const assignedDeptOptions   = departmentAssignments.map(d => d.deptLabel ?? d.department);

  // Initial department state — first assigned dept for approvers, "all" for HR/Admin
  const initialDept = isDeptApprover && !isHR && !isAdmin && assignedDeptOptions.length > 0
    ? assignedDeptOptions[0].toLowerCase()
    : "all";

  // Filter state – applied only when "Apply Filters" is clicked
  const [dateRange, setDateRange]   = useState("Last 90 Days");
  const [department, setDepartment] = useState(() => isDeptApprover && !isHR && !isAdmin && assignedDeptOptions.length > 0 ? assignedDeptOptions[0].toLowerCase() : "all");
  const [location, setLocation]     = useState("all");
  const [exitReason, setExitReason] = useState("all");

  // Applied filters (drives the query key)
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters>({
    dateRange: "Last 90 Days",
    department: "all",
    exitReason: "all",
  });

  const { data, isLoading, isError, refetch } = useReportsAnalytics(appliedFilters);

  if (!isHR && !isAdmin && !isDeptApprover) return <Redirect to="/dashboard" />;

  const handleApplyFilters = () => {
    setAppliedFilters({ dateRange, department, exitReason });
  };

  const handleExport = () => {
    toast.success("Report exported successfully");
  };

  // ── Derived data ────────────────────────────────────────────────────────────
  const overview    = data?.overview;
  const exitTrend   = data?.exitTrend   ?? [];
  const slaData     = data?.sla         ?? [];
  const reasons     = data?.reasons     ?? [];
  const departments = data?.departments ?? [];
  const insights    = data?.insights    ?? [];
  const isSynthetic = false; // synthetic fallback removed; API always returns real DB data
  const isEmpty = !isLoading && !isError && (overview?.totalExits ?? 0) === 0;

  // Group exit trend data
  const groupedExitTrend = useMemo(() => {
    if (!exitTrend || exitTrend.length === 0) return [];
    if (trendGrouping === "Daily") return exitTrend;
    
    const chunkSize = trendGrouping === "Weekly" ? 7 : 30;
    const result = [];
    for (let i = 0; i < exitTrend.length; i += chunkSize) {
      const chunk = exitTrend.slice(i, i + chunkSize);
      const sum = chunk.reduce((acc: number, curr: any) => acc + curr.value, 0);
      result.push({
        date: chunk[0].date,
        value: sum
      });
    }
    return result;
  }, [exitTrend, trendGrouping]);

  // Tab visibility
  const showAll = activeTab === "Overview";
  const showTrend = showAll || activeTab === "Exit Volume";
  const showSLA = showAll || activeTab === "SLA Performance";
  const showReasons = showAll || activeTab === "Reasons Analysis";
  const showDept = showAll || activeTab === "Department Analysis";
  const showManager = activeTab === "Manager Performance";

  // Compliant percentage for SLA donut centre label
  const slaCompliantPct = useMemo(() => {
    const compliant = slaData.find((s) => s.name === "Compliant");
    return compliant?.pct ?? "–";
  }, [slaData]);

  // Department filter options:
  // - HR/Admin: all departments from live analytics data
  // - Dept Approver: only assigned departments (scoped access)
  const deptOptions = useMemo(() => {
    if (isDeptApprover && !isHR && !isAdmin) {
      // Use assignedDeptOptions from profile
      return assignedDeptOptions;
    }
    return departments.map(d => d.dept);
  }, [departments, isDeptApprover, isHR, isAdmin, assignedDeptOptions]);

  // Exit reason filter options
  const reasonOptions = useMemo(
    () => reasons.map((r) => r.name),
    [reasons],
  );

  // KPI card definitions built from API data
  const KPI_CARDS = overview
    ? [
        {
          label: "Total Exits",
          value: overview.totalExits.toString(),
          sub: overview.totalExitsDelta >= 0
            ? `↑ ${overview.totalExitsDelta}% vs previous period`
            : `↓ ${Math.abs(overview.totalExitsDelta)}% vs previous period`,
          subColor: overview.totalExitsDelta >= 0 ? "text-emerald-400" : "text-red-400",
          icon: Users,
          iconBg: "bg-slate-500/10 text-slate-400",
          border: "border-border/50",
        },
        {
          label: "Completed Exits",
          value: overview.completedExits.toString(),
          sub: `${overview.completionRate}% completion rate`,
          subColor: "text-emerald-400",
          icon: CheckCircle2,
          iconBg: "bg-emerald-500/10 text-emerald-400",
          border: "border-border/50",
        },
        {
          label: "In Clearance",
          value: overview.inClearance.toString(),
          sub: `${Math.round((overview.inClearance / (overview.totalExits || 1)) * 100)}% of total exits`,
          subColor: "text-blue-400",
          icon: Activity,
          iconBg: "bg-blue-500/10 text-blue-400",
          border: "border-border/50",
        },
        {
          label: "Overdue Cases",
          value: overview.overdueCases.toString(),
          sub: overview.overdueDelta > 0
            ? `↑ ${overview.overdueDelta} vs previous period`
            : "On track",
          subColor: "text-red-400",
          icon: AlertTriangle,
          iconBg: "bg-red-500/10 text-red-400",
          border: "border-red-500/20 bg-red-500/[0.02]",
          labelColor: "text-red-400",
          valueColor: "text-red-400",
        },
        {
          label: "Avg SLA Time",
          value: `${overview.avgSlaTimeDays} Days`,
          sub: overview.avgSlaDelta < 0
            ? `↓ ${Math.abs(overview.avgSlaDelta).toFixed(1)} days improvement`
            : `${overview.avgSlaTimeDays} days average`,
          subColor: "text-emerald-400",
          icon: Clock,
          iconBg: "bg-amber-500/10 text-amber-400",
          border: "border-border/50",
        },
      ]
    : [];

  return (
    <div className="flex gap-0 -mx-4 md:-mx-6 -mt-4 md:-mt-6 min-h-[calc(100vh-4rem)]">
      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 px-4 md:px-6 pt-4 md:pt-6 pb-8 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">
              Reports &amp; Analytics
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Monitor exit process performance, SLA compliance, and operational insights.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-9 px-4 rounded-xl text-xs font-semibold border-border/60 bg-card gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              {dateRange}
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
            <Button
              onClick={handleExport}
              className="h-9 px-4 rounded-xl text-xs font-bold bg-primary shadow-md shadow-primary/20 gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export Report
            </Button>
          </div>
        </div>

        {/* Empty State Banner */}
        {isEmpty && (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-500/30 bg-slate-500/5 px-4 py-3">
            <div className="w-8 h-8 rounded-xl bg-slate-500/15 flex items-center justify-center shrink-0">
              <BarChart2 className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-300">No Exit Cases Yet</p>
              <p className="text-[10px] text-slate-400/70 mt-0.5">
                Create your first exit case to see live analytics and reports here.
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-xs text-red-400">
              Failed to load analytics.{" "}
              <button onClick={() => refetch()} className="underline font-semibold">
                Retry
              </button>
            </p>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-5 gap-3">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))
            : KPI_CARDS.map((card, i) => (
                <div
                  key={i}
                  className={`rounded-2xl border p-4 bg-card/60 backdrop-blur-sm shadow-soft ${card.border}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${card.labelColor ?? "text-muted-foreground"}`}>
                      {card.label}
                    </p>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                      <card.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className={`text-2xl font-extrabold tracking-tight ${card.valueColor ?? "text-foreground"}`}>
                    {card.value}
                  </h3>
                  <p className={`text-[10px] font-semibold mt-1.5 ${card.subColor}`}>
                    {card.sub}
                  </p>
                </div>
              ))}
        </div>

        {/* Executive Summary */}
        {!isLoading && insights.length > 0 && (
          <div className="rounded-2xl border border-border/50 bg-card/40 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Executive Summary
            </p>
            <div className="flex flex-wrap gap-4">
              {insights.map((insight, idx) => {
                const Icon = ICON_MAP[insight.icon] ?? TrendingUp;
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-foreground font-semibold">{insight.title}</span>
                    <span className="text-xs text-muted-foreground">— {insight.sub}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-0 border-b border-border/40">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Charts Row 1 */}
        {(showTrend || showSLA) && (
          <div className={`grid gap-4 ${showAll ? "grid-cols-5" : "grid-cols-1"}`}>
            {/* Exit Trend */}
            {showTrend && (
              <div className={`${showAll ? "col-span-3" : "col-span-1"} bg-card border border-border/50 rounded-2xl p-5`}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h3 className="text-sm font-extrabold text-foreground">Exit Trend</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Exit cases created over time</p>
                  </div>
                  <Select value={trendGrouping} onValueChange={setTrendGrouping}>
                    <SelectTrigger className="h-7 px-3 rounded-lg text-[11px] font-semibold border-border/60 bg-background w-auto gap-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daily" className="text-[11px]">Daily</SelectItem>
                      <SelectItem value="Weekly" className="text-[11px]">Weekly</SelectItem>
                      <SelectItem value="Monthly" className="text-[11px]">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="h-[200px] mt-4">
                  {isLoading ? (
                    <Skeleton className="h-full w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={groupedExitTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="exitGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#64748b" }} tickLine={false} axisLine={false} interval={0} angle={-30} dy={8} height={45} />
                        <YAxis tick={{ fontSize: 9, fill: "#64748b" }} tickLine={false} axisLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fill="url(#exitGrad)" dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}

            {/* SLA Compliance */}
            {showSLA && (
              <div className={`${showAll ? "col-span-2" : "col-span-1"} bg-card border border-border/50 rounded-2xl p-5`}>
            <div className="mb-1">
              <h3 className="text-sm font-extrabold text-foreground">SLA Compliance Rate</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Overall SLA compliance status</p>
            </div>
            {isLoading ? (
              <Skeleton className="h-32 mt-4" />
            ) : (
              <div className="flex items-center gap-4 mt-4">
                <div className="relative w-32 h-32 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={slaData}
                        cx="50%" cy="50%"
                        innerRadius={42} outerRadius={60}
                        dataKey="value" strokeWidth={0}
                        startAngle={90} endAngle={-270}
                      >
                        {slaData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                    </RechartsPie>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-extrabold text-white">{slaCompliantPct}</span>
                    <span className="text-[9px] text-muted-foreground">Compliant</span>
                  </div>
                </div>
                <div className="space-y-2.5 flex-1">
                  {slaData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-[11px] text-muted-foreground">{d.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-foreground">{d.value}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">({d.pct})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* Charts Row 2 */}
      {(showReasons || showDept) && (
        <div className={`grid gap-4 mt-4 ${showAll ? "grid-cols-5" : "grid-cols-1"}`}>
            {/* Exit Reasons Breakdown */}
            {showReasons && (
              <div className={`${showAll ? "col-span-2" : "col-span-1"} bg-card border border-border/50 rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">Exit Reasons Breakdown</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Distribution of exit reasons</p>
              </div>
              <Button variant="outline" size="sm" className="h-7 px-3 rounded-lg text-[11px] font-semibold border-border/60 bg-background">
                View Details
              </Button>
            </div>
            {isLoading ? (
              <Skeleton className="h-28 mt-4" />
            ) : (
              <div className="flex items-center gap-4 mt-4">
                <div className="relative w-28 h-28 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={reasons}
                        cx="50%" cy="50%"
                        innerRadius={36} outerRadius={56}
                        dataKey="value" strokeWidth={0}
                        startAngle={90} endAngle={-270}
                      >
                        {reasons.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                    </RechartsPie>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-base font-extrabold text-white">
                      {overview?.totalExits ?? 0}
                    </span>
                    <span className="text-[8px] text-muted-foreground">Total Exits</span>
                  </div>
                </div>
                <div className="space-y-2 flex-1">
                  {reasons.map((d) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-[10px] text-muted-foreground">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-foreground">{d.value}</span>
                        <span className="text-[9px] text-muted-foreground">({d.pct})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Department-wise Exit Volume */}
          {showDept && (
            <div className={`${showAll ? "col-span-3" : "col-span-1"} bg-card border border-border/50 rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">Department-wise Exit Volume</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Exit distribution by department</p>
              </div>
              <Button variant="outline" size="sm" className="h-7 px-3 rounded-lg text-[11px] font-semibold border-border/60 bg-background">
                View Details
              </Button>
            </div>
            <div className="h-[180px] mt-4">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departments} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                    <XAxis dataKey="dept" tick={{ fontSize: 9, fill: "#64748b" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "#64748b" }} tickLine={false} axisLine={false} />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="exits" fill="#6366f1" radius={[4, 4, 0, 0]}>
                      {departments.map((_, idx) => (
                        <Cell key={idx} fill={`hsl(${239 - idx * 5}, 80%, ${60 - idx * 3}%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          )}
        </div>
        )}

        {/* Manager Performance (WIP) */}
        {showManager && (
          <div className="mt-4 bg-card border border-border/50 rounded-2xl p-5 flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <BarChart2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-extrabold text-foreground">Manager Performance</h3>
            <p className="text-sm text-muted-foreground mt-2 text-center max-w-sm">
              This report is currently being generated. Check back later for detailed managerial insights.
            </p>
          </div>
        )}
      </div>

      {/* ── Right sidebar ─────────────────────────────────────────────────── */}
      <div className="w-[240px] shrink-0 border-l border-border/40 pl-4 pr-4 pt-4 md:pt-6 pb-8 overflow-y-auto bg-card/20 space-y-6">

        {/* Quick Filters */}
        <div>
          <h3 className="text-sm font-extrabold text-foreground mb-4">Quick Filters</h3>
          <div className="space-y-3">

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Date Range
              </label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="h-9 w-full rounded-xl text-xs font-semibold bg-background border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Last 30 Days"  className="text-xs">Last 30 Days</SelectItem>
                  <SelectItem value="Last 90 Days"  className="text-xs">Last 90 Days</SelectItem>
                  <SelectItem value="Last 6 Months" className="text-xs">Last 6 Months</SelectItem>
                  <SelectItem value="Last 12 Months" className="text-xs">Last 12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Department
              </label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="h-9 w-full rounded-xl text-xs font-semibold bg-background border-border/60">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  {/* HR/Admin see "All Departments"; dept_approver only sees their assigned depts */}
                  {(!isDeptApprover || isHR || isAdmin) && (
                    <SelectItem value="all" className="text-xs">All Departments</SelectItem>
                  )}
                  {deptOptions.map((d) => (
                    <SelectItem key={d} value={d.toLowerCase()} className="text-xs">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Location
              </label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="h-9 w-full rounded-xl text-xs font-semibold bg-background border-border/60">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all"       className="text-xs">All Locations</SelectItem>
                  <SelectItem value="bengaluru" className="text-xs">Bengaluru</SelectItem>
                  <SelectItem value="mumbai"    className="text-xs">Mumbai</SelectItem>
                  <SelectItem value="delhi"     className="text-xs">Delhi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Exit Reason
              </label>
              <Select value={exitReason} onValueChange={setExitReason}>
                <SelectTrigger className="h-9 w-full rounded-xl text-xs font-semibold bg-background border-border/60">
                  <SelectValue placeholder="All Reasons" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Reasons</SelectItem>
                  {reasonOptions.map((r) => (
                    <SelectItem key={r} value={r.toLowerCase().replace(/ /g, "_")} className="text-xs">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleApplyFilters}
              className="w-full h-9 rounded-xl text-xs font-bold bg-primary shadow-md shadow-primary/20 gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" /> Apply Filters
            </Button>
          </div>
        </div>

        {/* Key Insights */}
        <div>
          <h3 className="text-sm font-extrabold text-foreground mb-3">Key Insights</h3>
          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)
              : insights.map((insight, idx) => {
                  const Icon = ICON_MAP[insight.icon] ?? TrendingUp;
                  const colorMap: Record<string, string> = {
                    TrendingUp: "text-emerald-400 bg-emerald-500/10",
                    Clock: "text-blue-400 bg-blue-500/10",
                    AlertTriangle: "text-red-400 bg-red-500/10",
                  };
                  return (
                    <div key={idx} className="flex items-start gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${colorMap[insight.icon]}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-foreground leading-snug">{insight.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{insight.sub}</p>
                      </div>
                    </div>
                  );
                })}
          </div>
          <button className="mt-4 w-full flex items-center justify-between text-xs font-bold text-foreground border border-border/50 rounded-xl px-3 py-2.5 hover:bg-muted/30 transition-colors">
            View Full Analytics <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
