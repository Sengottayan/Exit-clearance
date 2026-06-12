"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "@/lib/wouter";
import {
  PlusCircle,
  Clock,
  AlertTriangle,
  Users,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Sparkles,
  Zap,
  FileSpreadsheet,
  History,
  Activity,
  ChevronDown,
  ChevronUp,
  FileText,
  Package,
  Shield,
  Settings,
  BarChart2,
  FolderOpen,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import { ExitTrendChart } from "@/components/charts/ExitTrendChart";
import { useHRDashboard } from "@/lib/api/use-hr-dashboard";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface AttentionItemProps {
  id: number;
  icon: any;
  iconColor: string;
  iconBg: string;
  title: string;
  desc: string;
  action: string;
  actionVariant: string;
  href: string;
}

const actionVariantStyles: Record<string, string> = {
  red: "border-red-500/40 text-red-400 hover:bg-red-500/10",
  amber: "border-amber-500/40 text-amber-400 hover:bg-amber-500/10",
  blue: "border-blue-500/40 text-blue-400 hover:bg-blue-500/10",
  orange: "border-orange-500/40 text-orange-400 hover:bg-orange-500/10",
  purple: "border-purple-500/40 text-purple-400 hover:bg-purple-500/10",
};

function NeedsAttentionDropdown({ items }: { items?: { title: string; value: number; description: string }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const mappedItems: AttentionItemProps[] = (items ?? []).map((item, idx) => {
    let icon = AlertCircle;
    let iconColor = "text-red-400";
    let iconBg = "bg-red-500/20";
    let action = "View";
    let actionVariant = "red";
    let href = "/cases";

    const titleLower = item.title.toLowerCase();
    if (titleLower.includes("approval") || titleLower.includes("manager")) {
      icon = Clock;
      iconColor = "text-amber-400";
      iconBg = "bg-amber-500/20";
      action = "Review";
      actionVariant = "amber";
    } else if (titleLower.includes("asset") || titleLower.includes("unreturned")) {
      icon = Package;
      iconColor = "text-orange-400";
      iconBg = "bg-orange-500/20";
      action = "Follow Up";
      actionVariant = "orange";
    } else if (titleLower.includes("document") || titleLower.includes("missing")) {
      icon = FileText;
      iconColor = "text-blue-400";
      iconBg = "bg-blue-500/20";
      action = "Manage";
      actionVariant = "blue";
    } else if (titleLower.includes("compliance") || titleLower.includes("issue")) {
      icon = Shield;
      iconColor = "text-purple-400";
      iconBg = "bg-purple-500/20";
      action = "Resolve";
      actionVariant = "purple";
    }

    return {
      id: idx + 1,
      icon,
      iconColor,
      iconBg,
      title: item.title,
      desc: item.description,
      action,
      actionVariant,
      href
    };
  });

  const totalCount = items?.length ?? 0;

  return (
    <div ref={ref} className="relative">
      {/* Header button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#1a0a0a] border border-red-900/60 rounded-xl hover:bg-[#220d0d] transition-colors group"
      >
        <div className="flex items-center gap-2.5">
          <Zap className="w-4 h-4 text-red-500 animate-pulse" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-red-400">
            Needs Attention
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-red-400 bg-red-500/20 border border-red-500/30 rounded-full px-2 py-0.5">
            {totalCount}
          </span>
          {open ? (
            <ChevronUp className="w-3.5 h-3.5 text-red-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-red-400" />
          )}
        </div>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-red-900/50 bg-[#120808] overflow-hidden shadow-2xl shadow-black/80 animate-enter z-50">
          {mappedItems.length > 0 ? (
            <div className="divide-y divide-red-900/30">
              {mappedItems.slice(0, 5).map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-red-500/5 transition-colors"
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.iconBg}`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${item.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white leading-none mb-0.5">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-red-300/70 font-medium truncate">
                        {item.desc}
                      </p>
                    </div>
                    <button
                      onClick={() => setLocation(item.href)}
                      className={`text-[10px] font-bold border rounded-md px-2 py-1 shrink-0 transition-colors ${actionVariantStyles[item.actionVariant]}`}
                    >
                      {item.action}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-xs text-red-300/50 font-medium bg-[#120808]">
              🎉 All caught up! No critical items.
            </div>
          )}
          <div className="px-4 py-2.5 border-t border-red-900/30 bg-[#0e0606]">
            <button
              onClick={() => setLocation("/cases")}
              className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors"
            >
              View all alerts
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SLA Donut Chart ───────────────────────────────────────────────────────────

interface SLADonutChartProps {
  data?: { name: string; value: number }[];
}

function SLADonutChart({ data }: SLADonutChartProps) {
  const chartData = data && data.length > 0 ? data.map(item => {
    let color = "#22c55e"; // Within SLA / Compliant
    if (item.name.toLowerCase().includes("risk")) color = "#f59e0b";
    if (item.name.toLowerCase().includes("breached")) color = "#ef4444";
    return {
      name: item.name,
      value: item.value,
      color
    };
  }) : [
    { name: "Within SLA", value: 0, color: "#22c55e" },
    { name: "At Risk", value: 0, color: "#f59e0b" },
    { name: "Breached", value: 0, color: "#ef4444" },
  ];

  const total = chartData.reduce((s, d) => s + d.value, 0);
  const compliant = chartData.find(d => d.name.toLowerCase().includes("compliant") || d.name.toLowerCase().includes("within"))?.value ?? 0;
  const pct = total > 0 ? Math.round((compliant / total) * 100) : 100;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-40 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={68}
              dataKey="value"
              strokeWidth={0}
              startAngle={90}
              endAngle={-270}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white shadow-xl">
                      <p className="font-bold">{d.name}</p>
                      <p className="text-muted-foreground">{d.value} cases</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-extrabold text-white">{pct}%</span>
          <span className="text-[10px] text-slate-400 font-semibold">Compliant</span>
        </div>
      </div>
      {/* Legend */}
      <div className="space-y-1.5 w-full">
        {chartData.map((d) => (
          <div key={d.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-[11px] text-slate-400 font-medium">{d.name}</span>
            </div>
            <span className="text-[11px] font-bold text-white">{d.value}</span>
          </div>
        ))}
      </div>
      <div className="w-full text-center">
        <span className="text-[10px] text-emerald-400 font-bold">
          Target: 90%{" "}
          <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded ml-1">
            On Track
          </span>
        </span>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export function HRDashboard() {
  const { data, loading: apiLoading, error } = useHRDashboard();
  const [, setLocation] = useLocation();
  const [showSkeleton, setShowSkeleton] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), 650);
    return () => clearTimeout(timer);
  }, []);

  const loading = showSkeleton || apiLoading;

  const overview = data?.overview;
  const exitTrend = data?.exitTrend ?? [];

  // Sparkline paths
  const sparklineDataActive = "M 5 25 L 15 22 L 25 28 L 35 15 L 45 18 L 55 10 L 65 15 L 75 8";
  const sparklineDataPending = "M 5 15 L 15 18 L 25 10 L 35 22 L 45 25 L 55 18 L 65 12 L 75 16";
  const sparklineDataOverdue = "M 5 8 L 15 10 L 25 15 L 35 12 L 45 22 L 55 25 L 65 18 L 75 22";
  const sparklineDataCompleted = "M 5 28 L 15 25 L 25 22 L 35 18 L 45 15 L 55 12 L 65 10 L 75 5";

  if (loading) {
    return (
      <div className="space-y-6 pb-8 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded-xl animate-shimmer" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted border border-border/50 rounded-xl animate-shimmer" />
          ))}
        </div>
        <div className="h-24 w-full bg-muted rounded-xl animate-shimmer" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="h-48 bg-muted border border-border/50 rounded-xl animate-shimmer" />
            <div className="h-72 bg-muted border border-border/50 rounded-xl animate-shimmer" />
          </div>
          <div className="space-y-6">
            <div className="h-72 bg-muted border border-border/50 rounded-xl animate-shimmer" />
            <div className="h-48 bg-muted border border-border/50 rounded-xl animate-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-bold">Failed to load dashboard</h2>
        <p className="text-muted-foreground text-sm max-w-md">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'Sengottayan';

  return (
    <div className="flex gap-0 -mx-4 md:-mx-6 -mt-4 md:-mt-6 min-h-[calc(100vh-4rem)]">
      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-6 px-4 md:px-6 pb-8 pt-4 md:pt-6 animate-slide-up">
        {/* Greeting Row */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Good morning, {firstName}{" "}
              <span className="inline-block origin-[70%_70%] animate-[wave_2.5s_infinite]">👋</span>
            </h1>
            <p className="text-[13px] text-muted-foreground mt-1 font-medium">
              Here's what's happening with your offboarding process today.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground font-semibold bg-card/50 border border-border/40 px-3 py-1.5 rounded-lg">
            <Calendar className="w-3.5 h-3.5" />
            {format(new Date(), "EEEE, d MMM yyyy")}
          </div>
        </div>

        {/* Recently Submitted Exits */}
        {data?.recentCases && data.recentCases.length > 0 && (
          <div className="bg-[#121622] border border-orange-500/20 rounded-2xl p-4 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">Recent Resignations Submitted</h4>
                <p className="text-xs text-[#8e9bb0] mt-0.5 font-medium">
                  The following exit cases were recently submitted and require clearance workflows setup/review:
                </p>
                <div className="flex flex-wrap gap-3 mt-3">
                  {data.recentCases.map((c) => (
                    <Link
                      key={c.id}
                      href={`/cases/${c.id}`}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all text-xs font-semibold text-white group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      <span>{c.employeeName} ({c.employeeDept})</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{c.id}</span>
                      <span className="text-primary group-hover:translate-x-0.5 transition-transform">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 4 Stat Cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Cases */}
          <Card className="border-border/60 bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden hover:border-blue-500/30 transition-colors group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Active Cases
              </p>
              <h3 className="text-3xl font-extrabold text-foreground tracking-tight group-hover:text-blue-400 transition-colors">
                {overview?.activeCases ?? 11}
              </h3>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
                <div className="flex items-center gap-1 text-emerald-400 text-[11px] font-bold">
                  <TrendingUp className="w-3 h-3" />
                  <span>+12% vs last 7 days</span>
                </div>
              </div>
              <svg className="w-full h-8 mt-2 stroke-blue-500 fill-none" strokeWidth="1.5" viewBox="0 0 80 32">
                <path d={sparklineDataActive} />
              </svg>
            </CardContent>
          </Card>

          {/* Pending Manager */}
          <Card className="border-border/60 bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden hover:border-amber-500/30 transition-colors group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Pending Manager
              </p>
              <h3 className="text-3xl font-extrabold text-foreground tracking-tight group-hover:text-amber-400 transition-colors">
                {overview?.pendingApprovals ?? 7}
              </h3>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
                <div className="flex items-center gap-1 text-emerald-400 text-[11px] font-bold">
                  <TrendingUp className="w-3 h-3" />
                  <span>+5% vs last 7 days</span>
                </div>
              </div>
              <svg className="w-full h-8 mt-2 stroke-amber-500 fill-none" strokeWidth="1.5" viewBox="0 0 80 32">
                <path d={sparklineDataPending} />
              </svg>
            </CardContent>
          </Card>

          {/* Overdue Actions */}
          <Card className="border-red-500/20 bg-red-500/[0.03] rounded-2xl overflow-hidden hover:border-red-500/40 transition-colors group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center animate-pulse-soft">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-1">
                Overdue Actions
              </p>
              <h3 className="text-3xl font-extrabold text-red-400 tracking-tight">
                {overview?.overdueTasks ?? 5}
              </h3>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-red-500/20">
                <div className="flex items-center gap-1 text-red-400 text-[11px] font-bold">
                  <TrendingUp className="w-3 h-3" />
                  <span>+25% vs last 7 days</span>
                </div>
              </div>
              <svg className="w-full h-8 mt-2 stroke-red-500 fill-none" strokeWidth="1.5" viewBox="0 0 80 32">
                <path d={sparklineDataOverdue} />
              </svg>
            </CardContent>
          </Card>

          {/* Completed Exits */}
          <Card className="border-border/60 bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-colors group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Completed Exits
              </p>
              <h3 className="text-3xl font-extrabold text-foreground tracking-tight group-hover:text-emerald-400 transition-colors">
                {overview?.completedThisMonth ?? 3}
              </h3>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
                <div className="flex items-center gap-1 text-emerald-400 text-[11px] font-bold">
                  <TrendingUp className="w-3 h-3" />
                  <span>+18% vs last 7 days</span>
                </div>
              </div>
              <svg className="w-full h-8 mt-2 stroke-emerald-500 fill-none" strokeWidth="1.5" viewBox="0 0 80 32">
                <path d={sparklineDataCompleted} />
              </svg>
            </CardContent>
          </Card>
        </div>

        {/* ── HR Control Center Banner ───────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-[#0d1524] to-slate-950 border border-slate-800/70 px-6 py-5 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/8 rounded-full blur-3xl -translate-y-8 translate-x-8 pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[9px] font-extrabold text-primary tracking-widest uppercase bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                System Insights
              </span>
              <h2 className="text-xl font-extrabold text-white mt-2 tracking-tight">
                HR Control Center
              </h2>
              <p className="text-[12px] text-slate-300 mt-1 font-medium leading-relaxed">
                You have{" "}
                <span className="text-orange-400 font-extrabold underline decoration-orange-400/50 decoration-2 underline-offset-2">
                  {overview?.overdueTasks ?? 5} clearance tasks
                </span>{" "}
                requiring immediate attention.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Button
                onClick={() => setLocation("/cases/new")}
                className="bg-primary hover:bg-primary/90 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 border-0 shadow-lg shadow-primary/20"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Initiate Exit Case
              </Button>
              <Button
                onClick={() => setLocation("/cases")}
                variant="outline"
                className="bg-white/5 border-slate-700 hover:bg-white/10 text-slate-200 text-xs px-4 py-2 rounded-xl font-bold"
              >
                <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                View Case Directory
              </Button>
            </div>
          </div>
        </div>

        {/* ── Quick Action Hub + Needs Attention ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Quick Action Hub (spans 3 cols) */}
          <Card className="lg:col-span-3 border-border/60 bg-card/50 backdrop-blur-sm shadow-premium rounded-2xl overflow-hidden">
            <CardHeader className="py-3.5 border-b border-border/40 px-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <CardTitle className="text-[10px] font-extrabold uppercase tracking-widest text-foreground/80">
                  Quick Action Hub
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-background/20">
              {/* Initiate Exit Case */}
              <Link
                href="/cases/new"
                className="group p-4 bg-card border border-border/60 hover:border-primary/45 rounded-xl transition-all duration-300 hover:shadow-soft flex flex-col justify-between min-h-[110px] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl pointer-events-none group-hover:bg-primary/10 transition-colors" />
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center transition-all group-hover:scale-105 group-hover:bg-primary group-hover:text-white">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div className="mt-3 relative z-10">
                  <p className="text-[11px] font-bold text-foreground group-hover:text-primary transition-colors">
                    Initiate Exit Case
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                    Add a new exit case
                  </p>
                </div>
                <ArrowUpRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary transition-colors self-end mt-1" />
              </Link>

              {/* Analytics Report */}
              <Link
                href="/reports"
                className="group p-4 bg-card border border-border/60 hover:border-emerald-500/45 rounded-xl transition-all duration-300 hover:shadow-soft flex flex-col justify-between min-h-[110px] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center transition-all group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-white">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="mt-3 relative z-10">
                  <p className="text-[11px] font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                    Analytics Report
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                    Run SLA and exit metrics
                  </p>
                </div>
                <ArrowUpRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-emerald-500 transition-colors self-end mt-1" />
              </Link>

              {/* Compliance Trail */}
              <Link
                href="/reports/audit"
                className="group p-4 bg-card border border-border/60 hover:border-indigo-500/45 rounded-xl transition-all duration-300 hover:shadow-soft flex flex-col justify-between min-h-[110px] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center transition-all group-hover:scale-105 group-hover:bg-indigo-500 group-hover:text-white">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="mt-3 relative z-10">
                  <p className="text-[11px] font-bold text-foreground group-hover:text-indigo-400 transition-colors">
                    Compliance Trail
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                    Verify system actions
                  </p>
                </div>
                <ArrowUpRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-indigo-400 transition-colors self-end mt-1" />
              </Link>
            </CardContent>
          </Card>

          {/* Needs Attention Dropdown (spans 2 cols) */}
          <div className="lg:col-span-2">
            <NeedsAttentionDropdown items={data?.attentionItems} />
          </div>
        </div>

        {/* ── Charts Row ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Exit Volume Trend */}
          <Card className="border-border/50 bg-card/40 backdrop-blur-sm shadow-premium rounded-2xl">
            <CardHeader className="py-3.5 border-b border-border/40 flex flex-row items-center justify-between px-5">
              <div>
                <CardTitle className="text-[10px] font-extrabold uppercase tracking-widest text-foreground/80">
                  Exit Volume Trend
                </CardTitle>
                <CardDescription className="text-[10px] mt-0.5 font-semibold">
                  Exits recorded by month
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground bg-card border border-border/40 px-2 py-1 rounded-lg font-semibold">
                  Last 6 Months ▾
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 px-4 pb-4">
              <ExitTrendChart data={exitTrend} />
            </CardContent>
          </Card>

          {/* SLA Compliance Rate */}
          <Card className="border-border/50 bg-card/40 backdrop-blur-sm shadow-premium rounded-2xl">
            <CardHeader className="py-3.5 border-b border-border/40 flex flex-row items-center justify-between px-5">
              <div>
                <CardTitle className="text-[10px] font-extrabold uppercase tracking-widest text-foreground/80">
                  SLA Compliance Rate
                </CardTitle>
                <CardDescription className="text-[10px] mt-0.5 font-semibold">
                  Performance index
                </CardDescription>
              </div>
              <Activity className="w-4 h-4 text-muted-foreground/60" />
            </CardHeader>
            <CardContent className="pt-5 px-5 pb-5 flex items-center justify-center">
              <SLADonutChart data={data?.slaAggregate} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Right Sidebar ─────────────────────────────────────────────────── */}
      <div className="w-[260px] shrink-0 border-l border-border/40 pl-5 pr-4 pt-4 md:pt-6 pb-8 space-y-6 overflow-y-auto bg-card/20">
        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-foreground/70">
              Recent Activity
            </h3>
            <button
              onClick={() => setLocation("/cases")}
              className="text-[10px] text-primary font-bold hover:text-primary/80 transition-colors"
            >
              View all
            </button>
          </div>
          <div className="relative pl-4 border-l border-border/40 space-y-5">
            {data?.timelineEvents && data.timelineEvents.length > 0 ? (
              data.timelineEvents.map((t) => {
                const dot = t.type === "approval" ? "bg-amber-500" : t.type === "task_completed" ? "bg-emerald-500" : "bg-blue-500";
                const timeStr = format(new Date(t.timestamp), "MMM d, h:mm a");
                return (
                  <div key={t.id} className="relative group">
                    <span
                      className={`absolute -left-[20px] top-1 w-3 h-3 rounded-full border-2 border-background ${dot} flex items-center justify-center shadow-sm`}
                    />
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-muted-foreground font-medium">{timeStr}</p>
                      <p className="text-[11px] font-bold text-foreground">{t.actor || "System"}</p>
                      <p className="text-[10px] text-muted-foreground/80 font-medium leading-snug">
                        {t.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground/50 font-mono">{t.employee_name || t.case_id}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground/50 font-medium">
                No recent activity
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div>
          <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-foreground/70 mb-3">
            Upcoming Deadlines
          </h3>
          <div className="space-y-2.5">
            {[
              { label: "3 cases due today", color: "text-red-400" },
              { label: "2 cases due tomorrow", color: "text-amber-400" },
              { label: "5 cases due this week", color: "text-blue-400" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className={`w-3.5 h-3.5 shrink-0 ${item.color}`} />
                  <span className="text-[11px] text-foreground/80 font-medium">{item.label}</span>
                </div>
                <button
                  onClick={() => setLocation("/cases")}
                  className="text-[10px] text-primary font-bold hover:text-primary/80 transition-colors"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Shortcuts */}
        <div>
          <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-foreground/70 mb-3">
            Shortcuts
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Case Directory", icon: FolderOpen, href: "/cases", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
              { label: "Reports", icon: BarChart2, href: "/reports", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
              { label: "Audit Trail", icon: History, href: "/reports/audit", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
              { label: "Settings", icon: Settings, href: "/settings", color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
            ].map((shortcut) => {
              const Icon = shortcut.icon;
              return (
                <button
                  key={shortcut.label}
                  onClick={() => setLocation(shortcut.href)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all group-hover:scale-105 ${shortcut.color}`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[9px] text-muted-foreground text-center leading-tight font-semibold group-hover:text-foreground transition-colors">
                    {shortcut.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
