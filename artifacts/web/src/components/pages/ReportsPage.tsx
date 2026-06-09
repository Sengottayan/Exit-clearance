"use client";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "@/lib/wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { useCases } from "@/hooks/api/useCases";
import { toast } from "sonner";
import {
  Download, Calendar, TrendingUp, CheckCircle2, Activity,
  AlertTriangle, Clock, Filter, Users, BarChart2, PieChart,
  ExternalLink, ArrowUpRight, ChevronDown,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

// ── Static chart data ────────────────────────────────────────────────────────
const EXIT_TREND = [
  { date: "Mar 10-16", value: 8 },
  { date: "Mar 17-23", value: 14 },
  { date: "Mar 24-30", value: 12 },
  { date: "Mar 31-Apr 6", value: 10 },
  { date: "Apr 7-13", value: 18 },
  { date: "Apr 14-20", value: 22 },
  { date: "Apr 21-27", value: 16 },
  { date: "Apr 28-May 4", value: 20 },
  { date: "May 5-11", value: 28 },
  { date: "May 12-18", value: 35 },
];

const SLA_DATA = [
  { name: "Compliant", value: 122, pct: "94.8%", color: "#10b981" },
  { name: "At Risk",   value: 4,   pct: "3.1%",  color: "#f59e0b" },
  { name: "Breached",  value: 2,   pct: "2.1%",  color: "#ef4444" },
];

const REASONS_DATA = [
  { name: "Better Opportunity", value: 45, pct: "35.2%", color: "#10b981" },
  { name: "Relocation",         value: 28, pct: "21.9%", color: "#6366f1" },
  { name: "Higher Studies",     value: 20, pct: "15.6%", color: "#3b82f6" },
  { name: "Compensation",       value: 18, pct: "14.1%", color: "#f59e0b" },
  { name: "Personal Reasons",   value: 10, pct: "7.8%",  color: "#8b5cf6" },
  { name: "Health Reasons",     value: 7,  pct: "5.5%",  color: "#ec4899" },
];

const DEPT_DATA = [
  { dept: "Engineering", exits: 38 },
  { dept: "Product",     exits: 24 },
  { dept: "Sales",       exits: 18 },
  { dept: "Marketing",   exits: 14 },
  { dept: "Finance",     exits: 10 },
  { dept: "HR",          exits: 8 },
  { dept: "Operations",  exits: 6 },
];

const TABS = ["Overview", "SLA Performance", "Exit Volume", "Reasons Analysis", "Department Analysis", "Manager Performance"];

const KPI_CARDS = [
  {
    label: "Total Exits", value: "128", sub: "↑ 18.7% vs previous 90 days",
    subColor: "text-emerald-400", icon: Users, iconBg: "bg-slate-500/10 text-slate-400",
    border: "border-border/50",
  },
  {
    label: "Completed Exits", value: "89", sub: "69.5% completion rate",
    subColor: "text-emerald-400", icon: CheckCircle2, iconBg: "bg-emerald-500/10 text-emerald-400",
    border: "border-border/50",
  },
  {
    label: "In Clearance", value: "32", sub: "25.0% of total exits",
    subColor: "text-blue-400", icon: Activity, iconBg: "bg-blue-500/10 text-blue-400",
    border: "border-border/50",
  },
  {
    label: "Overdue Cases", value: "7", sub: "↑ 2 vs previous 90 days",
    subColor: "text-red-400", icon: AlertTriangle, iconBg: "bg-red-500/10 text-red-400",
    border: "border-red-500/20 bg-red-500/[0.02]", labelColor: "text-red-400", valueColor: "text-red-400",
  },
  {
    label: "Avg SLA Time", value: "2.6 Days", sub: "↓ 0.8 days improvement",
    subColor: "text-emerald-400", icon: Clock, iconBg: "bg-amber-500/10 text-amber-400",
    border: "border-border/50",
  },
];

// ── Custom tooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white shadow-xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-bold" style={{ color: p.color }}>{p.value} exits</p>
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

export default function ReportsPage() {
  const { isHR, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("Overview");
  const [dateRange, setDateRange] = useState("Last 90 Days");
  const [department, setDepartment] = useState("all");
  const [location, setLocation] = useState("all");
  const [exitReason, setExitReason] = useState("all");

  if (!isHR && !isAdmin) return <Redirect to="/dashboard" />;

  const handleExport = () => {
    toast.success("Report exported successfully");
  };

  const INSIGHTS = [
    {
      icon: TrendingUp, color: "text-emerald-400 bg-emerald-500/10",
      title: "Exit volume increased by 18.7%",
      sub: "Compared to previous 90 days",
    },
    {
      icon: Clock, color: "text-blue-400 bg-blue-500/10",
      title: "Average clearance time improved",
      sub: "By 0.8 days in last 90 days",
    },
    {
      icon: AlertTriangle, color: "text-red-400 bg-red-500/10",
      title: "7 cases breached SLA",
      sub: "Immediate attention required",
    },
  ];

  return (
    <div className="flex gap-0 -mx-4 md:-mx-6 -mt-4 md:-mt-6 min-h-[calc(100vh-4rem)]">
      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 px-4 md:px-6 pt-4 md:pt-6 pb-8 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">Reports & Analytics</h1>
            <p className="text-xs text-muted-foreground mt-1">Monitor exit process performance, SLA compliance, and operational insights.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 px-4 rounded-xl text-xs font-semibold border-border/60 bg-card gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {dateRange}
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
            <Button onClick={handleExport} className="h-9 px-4 rounded-xl text-xs font-bold bg-primary shadow-md shadow-primary/20 gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export Report
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-5 gap-3">
          {KPI_CARDS.map((card, i) => (
            <div key={i} className={`rounded-2xl border p-4 bg-card/60 backdrop-blur-sm shadow-soft ${card.border}`}>
              <div className="flex items-start justify-between mb-2">
                <p className={`text-[10px] font-bold uppercase tracking-wider ${card.labelColor ?? "text-muted-foreground"}`}>{card.label}</p>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                  <card.icon className="w-4 h-4" />
                </div>
              </div>
              <h3 className={`text-2xl font-extrabold tracking-tight ${card.valueColor ?? "text-foreground"}`}>{card.value}</h3>
              <p className={`text-[10px] font-semibold mt-1.5 ${card.subColor}`}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 border-b border-border/40">
          {TABS.map(tab => (
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
        <div className="grid grid-cols-5 gap-4">
          {/* Exit Trend — 3 cols */}
          <div className="col-span-3 bg-card border border-border/50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">Exit Trend</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Exit cases created over time</p>
              </div>
              <Button variant="outline" size="sm" className="h-7 px-3 rounded-lg text-[11px] font-semibold border-border/60 bg-background gap-1">
                Weekly <ChevronDown className="w-3 h-3" />
              </Button>
            </div>
            <div className="h-[200px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={EXIT_TREND} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
            </div>
          </div>

          {/* SLA Compliance — 2 cols */}
          <div className="col-span-2 bg-card border border-border/50 rounded-2xl p-5">
            <div className="mb-1">
              <h3 className="text-sm font-extrabold text-foreground">SLA Compliance Rate</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Overall SLA compliance status</p>
            </div>
            <div className="flex items-center gap-4 mt-4">
              {/* Donut */}
              <div className="relative w-32 h-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie data={SLA_DATA} cx="50%" cy="50%" innerRadius={42} outerRadius={60} dataKey="value" strokeWidth={0} startAngle={90} endAngle={-270}>
                      {SLA_DATA.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                    </Pie>
                  </RechartsPie>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-extrabold text-white">94.8%</span>
                  <span className="text-[9px] text-muted-foreground">Compliant</span>
                </div>
              </div>
              {/* Legend */}
              <div className="space-y-2.5 flex-1">
                {SLA_DATA.map(d => (
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
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-5 gap-4">
          {/* Exit Reasons Breakdown — 2 cols */}
          <div className="col-span-2 bg-card border border-border/50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">Exit Reasons Breakdown</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Distribution of exit reasons</p>
              </div>
              <Button variant="outline" size="sm" className="h-7 px-3 rounded-lg text-[11px] font-semibold border-border/60 bg-background">View Details</Button>
            </div>
            <div className="flex items-center gap-4 mt-4">
              {/* Donut */}
              <div className="relative w-28 h-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie data={REASONS_DATA} cx="50%" cy="50%" innerRadius={36} outerRadius={56} dataKey="value" strokeWidth={0} startAngle={90} endAngle={-270}>
                      {REASONS_DATA.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                    </Pie>
                  </RechartsPie>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-base font-extrabold text-white">128</span>
                  <span className="text-[8px] text-muted-foreground">Total Exits</span>
                </div>
              </div>
              {/* Legend */}
              <div className="space-y-2 flex-1">
                {REASONS_DATA.map(d => (
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
          </div>

          {/* Department-wise Exit Volume — 3 cols */}
          <div className="col-span-3 bg-card border border-border/50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">Department-wise Exit Volume</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Exit distribution by department</p>
              </div>
              <Button variant="outline" size="sm" className="h-7 px-3 rounded-lg text-[11px] font-semibold border-border/60 bg-background">View Details</Button>
            </div>
            <div className="h-[180px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DEPT_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis dataKey="dept" tick={{ fontSize: 9, fill: "#64748b" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#64748b" }} tickLine={false} axisLine={false} />
                  <Tooltip content={<BarTooltip />} />
                  <Bar dataKey="exits" fill="#6366f1" radius={[4, 4, 0, 0]}>
                    {DEPT_DATA.map((_, idx) => (
                      <Cell key={idx} fill={`hsl(${239 - idx * 5}, 80%, ${60 - idx * 3}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right sidebar ──────────────────────────────────────────────────── */}
      <div className="w-[240px] shrink-0 border-l border-border/40 pl-4 pr-4 pt-4 md:pt-6 pb-8 overflow-y-auto bg-card/20 space-y-6">
        {/* Quick Filters */}
        <div>
          <h3 className="text-sm font-extrabold text-foreground mb-4">Quick Filters</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="h-9 w-full rounded-xl text-xs font-semibold bg-background border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Last 30 Days" className="text-xs">Last 30 Days</SelectItem>
                  <SelectItem value="Last 90 Days" className="text-xs">Last 90 Days</SelectItem>
                  <SelectItem value="Last 6 Months" className="text-xs">Last 6 Months</SelectItem>
                  <SelectItem value="Last 12 Months" className="text-xs">Last 12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Department</label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="h-9 w-full rounded-xl text-xs font-semibold bg-background border-border/60">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Departments</SelectItem>
                  {DEPT_DATA.map(d => <SelectItem key={d.dept} value={d.dept.toLowerCase()} className="text-xs">{d.dept}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Location</label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="h-9 w-full rounded-xl text-xs font-semibold bg-background border-border/60">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Locations</SelectItem>
                  <SelectItem value="bengaluru" className="text-xs">Bengaluru</SelectItem>
                  <SelectItem value="mumbai" className="text-xs">Mumbai</SelectItem>
                  <SelectItem value="delhi" className="text-xs">Delhi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Exit Reason</label>
              <Select value={exitReason} onValueChange={setExitReason}>
                <SelectTrigger className="h-9 w-full rounded-xl text-xs font-semibold bg-background border-border/60">
                  <SelectValue placeholder="All Reasons" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Reasons</SelectItem>
                  {REASONS_DATA.map(r => <SelectItem key={r.name} value={r.name.toLowerCase().replace(" ", "_")} className="text-xs">{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full h-9 rounded-xl text-xs font-bold bg-primary shadow-md shadow-primary/20 gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Apply Filters
            </Button>
          </div>
        </div>

        {/* Key Insights */}
        <div>
          <h3 className="text-sm font-extrabold text-foreground mb-3">Key Insights</h3>
          <div className="space-y-3">
            {INSIGHTS.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${insight.color}`}>
                  <insight.icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-foreground leading-snug">{insight.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{insight.sub}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full flex items-center justify-between text-xs font-bold text-foreground border border-border/50 rounded-xl px-3 py-2.5 hover:bg-muted/30 transition-colors">
            View Full Analytics <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
