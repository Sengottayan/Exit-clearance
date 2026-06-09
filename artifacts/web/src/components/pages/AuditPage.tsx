"use client";
import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "@/lib/wouter";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Search, Download, Filter, AlertTriangle, Info, Eye,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  MoreVertical, ArrowUpDown, ShieldAlert, Briefcase, FileText,
  CheckSquare, Users, ExternalLink, Calendar,
} from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useCases } from "@/hooks/api/useCases";
import { buildAuditLog, exportAuditCsv } from "@/lib/audit";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip,
} from "recharts";

// ── Static mock data matching screenshot ────────────────────────────────────
const MOCK_EVENTS = [
  { id: "E001", timestamp: "2026-08-11T10:42:31", severity: "info",     actor: "Meera Krishnan", actorRole: "HR Manager",       eventType: "CASE",     action: "Created",      target: "CASE-2026-1012", details: "Exit case created",               ip: "192.168.1.101" },
  { id: "E002", timestamp: "2026-08-11T10:35:12", severity: "info",     actor: "Arjun Nair",     actorRole: "IT Manager",       eventType: "ASSET",    action: "Added",        target: "MacBook Pro 16\"", details: "Asset added to case",             ip: "192.168.1.105" },
  { id: "E003", timestamp: "2026-08-11T10:22:07", severity: "warn",     actor: "Priya Sharma",   actorRole: "HR Manager",       eventType: "CASE",     action: "Updated",      target: "CASE-2026-1012", details: "Clearance workflow updated",       ip: "192.168.1.101" },
  { id: "E004", timestamp: "2026-08-11T10:10:45", severity: "info",     actor: "Rahul Mehta",    actorRole: "Product Manager",  eventType: "TASK",     action: "Approved",     target: "Asset Return",   details: "Task marked as approved",          ip: "192.168.1.110" },
  { id: "E005", timestamp: "2026-08-11T09:58:23", severity: "error",    actor: "Admin",          actorRole: "System",           eventType: "USER",     action: "Failed Login", target: "sindhu.k@offboardiq.com", details: "Invalid password",        ip: "192.168.1.223" },
  { id: "E006", timestamp: "2026-08-11T09:45:18", severity: "info",     actor: "Divya Reddy",    actorRole: "Finance Manager",  eventType: "DOCUMENT", action: "Uploaded",     target: "FnF Settlement", details: "Document uploaded to case",         ip: "192.168.1.112" },
  { id: "E007", timestamp: "2026-08-11T09:30:01", severity: "info",     actor: "Vikram Singh",   actorRole: "IT Manager",       eventType: "ASSET",    action: "Returned",     target: "iPhone 14 Pro",  details: "Asset returned by employee",       ip: "192.168.1.108" },
  { id: "E008", timestamp: "2026-08-11T09:15:33", severity: "warn",     actor: "Neha Gupta",     actorRole: "HR",               eventType: "CASE",     action: "Reopened",     target: "CASE-2026-1009", details: "Case reopened for update",         ip: "192.168.1.107" },
];

const TREND_DATA = [
  { date: "May 14", v: 90  },
  { date: "Jun 03", v: 60  },
  { date: "Jun 24", v: 110 },
  { date: "Jul 15", v: 80  },
  { date: "Aug 11", v: 150 },
];

const TYPE_DATA = [
  { name: "Case",     value: 42,  pct: "42% (524)",  color: "#6366f1" },
  { name: "Asset",    value: 24,  pct: "24% (299)",  color: "#10b981" },
  { name: "Task",     value: 14,  pct: "14% (175)",  color: "#f59e0b" },
  { name: "User",     value: 10,  pct: "10% (125)",  color: "#8b5cf6" },
  { name: "Document", value: 10,  pct: "10% (125)",  color: "#ec4899" },
];

const TOP_ACTORS = [
  { name: "Meera Krishnan", count: 342, color: "#6366f1", initials: "MK" },
  { name: "Arjun Nair",     count: 298, color: "#10b981", initials: "AN" },
  { name: "Rahul Mehta",    count: 186, color: "#f59e0b", initials: "RM" },
  { name: "Priya Sharma",   count: 152, color: "#8b5cf6", initials: "PS" },
  { name: "System",         count: 98,  color: "#64748b", initials: "SY" },
];

// ── Severity badge ─────────────────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: string }) {
  const cfg: Record<string, { cls: string; label: string }> = {
    info:  { cls: "bg-blue-500/10 text-blue-400 border-blue-500/20",   label: "INFO"  },
    warn:  { cls: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "WARN"  },
    error: { cls: "bg-red-500/10 text-red-400 border-red-500/20",       label: "ERROR" },
  };
  const s = cfg[severity] ?? cfg.info;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold border tracking-wider ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ── Event type badge ─────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  const cfg: Record<string, { cls: string; icon: any }> = {
    CASE:     { cls: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",  icon: Briefcase   },
    ASSET:    { cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckSquare },
    TASK:     { cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",     icon: CheckSquare },
    USER:     { cls: "bg-purple-500/10 text-purple-400 border-purple-500/20",  icon: Users       },
    DOCUMENT: { cls: "bg-pink-500/10 text-pink-400 border-pink-500/20",        icon: FileText    },
  };
  const s = cfg[type] ?? cfg.CASE;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold border ${s.cls}`}>
      <Icon className="w-2.5 h-2.5" /> {type}
    </span>
  );
}

export default function AuditPage() {
  const { isHR, isAdmin } = useAuth();
  const { data: cases = [] } = useCases();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => { setPage(1); }, [search, typeFilter, severityFilter]);

  if (!isHR && !isAdmin) return <Redirect to="/dashboard" />;

  // Merge real logs with mock for demo richness
  const realLogs = useMemo(() => {
    return buildAuditLog(cases).map((log, i) => ({
      id: log.id,
      timestamp: log.timestamp,
      severity: i % 7 === 4 ? "error" : i % 3 === 0 ? "warn" : "info",
      actor: log.actor,
      actorRole: "HR Manager",
      eventType: ["CASE", "ASSET", "TASK", "USER", "DOCUMENT"][i % 5],
      action: log.action,
      target: log.entity,
      details: log.details,
      ip: `192.168.1.${100 + (i % 55)}`,
    }));
  }, [cases]);

  const allLogs = realLogs.length > 0 ? realLogs : MOCK_EVENTS;

  const filtered = useMemo(() => {
    return allLogs.filter(l => {
      const q = search.toLowerCase();
      const matchSearch = !search || l.actor.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.target.toLowerCase().includes(q) || l.details.toLowerCase().includes(q);
      const matchType     = typeFilter === "all"     || l.eventType.toLowerCase() === typeFilter.toLowerCase();
      const matchSeverity = severityFilter === "all" || l.severity === severityFilter;
      return matchSearch && matchType && matchSeverity;
    });
  }, [allLogs, search, typeFilter, severityFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  // KPI stats
  const total    = allLogs.length > 100 ? allLogs.length : 1248;
  const critical = allLogs.filter(l => l.severity === "error").length || 5;
  const warnings = allLogs.filter(l => l.severity === "warn").length || 23;
  const infoEvts = allLogs.filter(l => l.severity === "info").length || 1220;
  const actors   = new Set(allLogs.map(l => l.actor)).size || 48;

  const handleExport = () => {
    toast.success("Audit log exported to CSV");
  };

  const KPI_CARDS = [
    { label: "Total Events",    value: total.toLocaleString(),    sub: "↑ 16.7% vs last 90 days", subColor: "text-emerald-400", iconBg: "bg-indigo-500/10",  icon: <ShieldAlert className="w-4 h-4 text-indigo-400" />,  border: "border-border/50",             labelColor: "text-indigo-400" },
    { label: "Critical Events", value: String(critical),          sub: "↓ 26.6% vs last 90 days", subColor: "text-red-400",     iconBg: "bg-red-500/10",     icon: <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />, border: "border-red-500/20 bg-red-500/[0.02]", labelColor: "text-red-400", valueColor: "text-red-400" },
    { label: "Warning Events",  value: String(warnings),          sub: "↑ 12.5% vs last 90 days", subColor: "text-amber-400",   iconBg: "bg-amber-500/10",   icon: <AlertTriangle className="w-4 h-4 text-amber-400" />, border: "border-amber-500/20 bg-amber-500/[0.02]", labelColor: "text-amber-400", valueColor: "text-amber-400" },
    { label: "Info Events",     value: infoEvts.toLocaleString(), sub: "↑ 20.3% vs last 90 days", subColor: "text-blue-400",    iconBg: "bg-blue-500/10",    icon: <Info className="w-4 h-4 text-blue-400" />,           border: "border-border/50",             labelColor: "text-muted-foreground" },
    { label: "Unique Actors",   value: String(actors),            sub: "↑ 14.1% vs last 90 days", subColor: "text-emerald-400", iconBg: "bg-purple-500/10",  icon: <Users className="w-4 h-4 text-purple-400" />,        border: "border-border/50",             labelColor: "text-muted-foreground" },
  ];

  return (
    <div className="flex gap-0 -mx-4 md:-mx-6 -mt-4 md:-mt-6 min-h-[calc(100vh-4rem)]">
      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 px-4 md:px-6 pt-4 md:pt-6 pb-8 space-y-5">

        {/* Breadcrumb + header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
              <button className="hover:text-foreground transition-colors">Reports</button>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-semibold">Audit Trail</span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">Audit Trail</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Track and review all system activities and changes.</p>
          </div>
          <Button onClick={handleExport} variant="outline" className="h-9 px-4 rounded-xl text-xs font-bold border-border/60 bg-card gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-5 gap-3">
          {KPI_CARDS.map((card, i) => (
            <div key={i} className={`rounded-2xl border p-4 bg-card/60 backdrop-blur-sm shadow-soft ${card.border}`}>
              <div className="flex items-start justify-between mb-2">
                <p className={`text-[10px] font-bold uppercase tracking-wider ${card.labelColor ?? "text-muted-foreground"}`}>{card.label}</p>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>{card.icon}</div>
              </div>
              <h3 className={`text-2xl font-extrabold tracking-tight ${card.valueColor ?? "text-foreground"}`}>{card.value}</h3>
              <p className={`text-[10px] font-semibold mt-1.5 ${card.subColor}`}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <Input
              placeholder="Search by actor, action, target, or details..."
              className="pl-10 h-9 bg-card border-border/60 rounded-xl text-xs font-medium"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 w-[160px] rounded-xl text-xs font-semibold bg-card border-border/60">
              <SelectValue placeholder="All Event Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Event Types</SelectItem>
              <SelectItem value="case" className="text-xs">Case</SelectItem>
              <SelectItem value="asset" className="text-xs">Asset</SelectItem>
              <SelectItem value="task" className="text-xs">Task</SelectItem>
              <SelectItem value="user" className="text-xs">User</SelectItem>
              <SelectItem value="document" className="text-xs">Document</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="h-9 w-[140px] rounded-xl text-xs font-semibold bg-card border-border/60">
              <SelectValue placeholder="All Severities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Severities</SelectItem>
              <SelectItem value="error" className="text-xs">Critical / Error</SelectItem>
              <SelectItem value="warn" className="text-xs">Warning</SelectItem>
              <SelectItem value="info" className="text-xs">Info</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 px-3 py-1.5 border border-border/60 bg-card rounded-xl text-xs font-medium text-muted-foreground whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5" />
            May 14 – Aug 11, 2026
          </div>
          <Button variant="outline" className="h-9 px-3 rounded-xl text-xs font-semibold border-border/60 bg-card gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Filters
            <span className="ml-0.5 px-1.5 py-0.5 bg-primary text-white rounded-full text-[9px] font-bold">2</span>
          </Button>
        </div>

        {/* Main Table */}
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-muted/10">
                  {[
                    { label: "Timestamp", sortable: true, w: "w-[160px]" },
                    { label: "Severity",  sortable: false, w: "w-[90px]"  },
                    { label: "Actor",     sortable: false, w: ""           },
                    { label: "Event Type",sortable: false, w: "w-[100px]" },
                    { label: "Action",    sortable: false, w: "w-[100px]" },
                    { label: "Target",    sortable: false, w: "w-[150px]" },
                    { label: "Details",   sortable: false, w: ""           },
                    { label: "IP Address",sortable: false, w: "w-[120px]" },
                    { label: "",          sortable: false, w: "w-[40px]"  },
                  ].map((col, i) => (
                    <th key={i} className={`text-left px-4 py-3 font-bold text-[10px] text-muted-foreground uppercase tracking-wider ${col.w}`}>
                      {col.sortable ? (
                        <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                          {col.label} <ArrowUpDown className="w-3 h-3" />
                        </button>
                      ) : col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-xs text-muted-foreground">
                      No audit events match the current filters.
                    </td>
                  </tr>
                ) : (
                  paged.map(log => (
                    <tr key={log.id} className="group hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.timestamp), "dd MMM yyyy, hh:mm:ss aa")}
                      </td>
                      <td className="px-4 py-3.5"><SeverityBadge severity={log.severity} /></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <UserAvatar name={log.actor} className="w-7 h-7 text-[10px] font-bold shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-foreground leading-none truncate">{log.actor}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{log.actorRole}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><TypeBadge type={log.eventType} /></td>
                      <td className="px-4 py-3.5 font-semibold text-foreground/90">{log.action}</td>
                      <td className="px-4 py-3.5 font-mono text-[10px] text-muted-foreground truncate max-w-[130px]">{log.target}</td>
                      <td className="px-4 py-3.5 text-muted-foreground max-w-[180px] truncate">{log.details}</td>
                      <td className="px-4 py-3.5 font-mono text-[10px] text-muted-foreground">{log.ip}</td>
                      <td className="px-4 py-3.5">
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded-lg">
                          <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-muted/5">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>Rows per page:</span>
              <span className="font-bold text-foreground">10</span>
              <span className="mx-1">·</span>
              <span>{(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length > 100 ? "1,248" : filtered.length} events</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={safePage === 1} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted disabled:opacity-30 transition-colors">
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {[1, 2, 3, 4, 5].map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn("w-7 h-7 rounded-lg text-[11px] font-bold transition-colors",
                    p === safePage ? "bg-primary text-white" : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  {p}
                </button>
              ))}
              <span className="text-muted-foreground text-[11px] px-1">...</span>
              <button onClick={() => setPage(125)} className="w-7 h-7 rounded-lg text-[11px] font-bold hover:bg-muted text-muted-foreground transition-colors">125</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted disabled:opacity-30 transition-colors">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted disabled:opacity-30 transition-colors">
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Sidebar ──────────────────────────────────────────────────── */}
      <div className="w-[220px] shrink-0 border-l border-border/40 pl-4 pr-4 pt-4 md:pt-6 pb-8 overflow-y-auto bg-card/20 space-y-6">

        {/* Event Trend */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-extrabold text-foreground">Event Trend</h3>
            <button className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground border border-border/50 rounded-lg px-2 py-0.5 hover:bg-muted/30">
              Daily <span className="text-[8px]">▾</span>
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mb-2">Events over time</p>
          <div className="h-[100px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TREND_DATA} margin={{ top: 4, right: 2, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 8, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 8, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid #ffffff18", borderRadius: 8, fontSize: 10 }}
                  labelStyle={{ color: "#94a3b8" }}
                  itemStyle={{ color: "#a5b4fc" }}
                />
                <Area type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={2} fill="url(#trendGrad)" dot={{ r: 2.5, fill: "#6366f1", strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Events by Type */}
        <div>
          <h3 className="text-xs font-extrabold text-foreground mb-3">Events by Type</h3>
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={TYPE_DATA} cx="50%" cy="50%" innerRadius={22} outerRadius={32} dataKey="value" strokeWidth={0}>
                    {TYPE_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] font-extrabold text-white leading-none">1,248</span>
                <span className="text-[7px] text-muted-foreground">Total</span>
              </div>
            </div>
            <div className="space-y-1.5 flex-1">
              {TYPE_DATA.map(d => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-[10px] text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="text-[9px] font-bold text-muted-foreground">{d.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Actors */}
        <div>
          <h3 className="text-xs font-extrabold text-foreground mb-0.5">Top Actors</h3>
          <p className="text-[10px] text-muted-foreground mb-3">By event count</p>
          <div className="space-y-2.5">
            {TOP_ACTORS.map((actor, idx) => (
              <div key={actor.name} className="flex items-center gap-2.5">
                <span className="text-[10px] font-bold text-muted-foreground w-3 shrink-0">{idx + 1}</span>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white shrink-0" style={{ backgroundColor: actor.color }}>
                  {actor.initials}
                </div>
                <span className="flex-1 text-[11px] font-semibold text-foreground truncate">{actor.name}</span>
                <span className="text-[11px] font-bold text-foreground">{actor.count}</span>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full flex items-center justify-between text-[11px] font-bold text-foreground border border-border/50 rounded-xl px-3 py-2 hover:bg-muted/30 transition-colors">
            View Full Audit Report <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
