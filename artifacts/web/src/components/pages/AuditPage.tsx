"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "@/lib/wouter";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Search, Download, Filter, AlertTriangle, Info,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  MoreVertical, ArrowUpDown, ShieldAlert, Briefcase, FileText,
  CheckSquare, Users, ExternalLink, Calendar, Sparkles, RefreshCw,
  ClipboardList, Eye,
} from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip,
} from "recharts";
import {
  useAuditLogs,
  useSeedSyntheticAudit,
  useArchiveSyntheticAudit,
  type AuditDelta,
} from "@/hooks/api/useAuditLogs";

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-muted/40 ${className}`} />;
}

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

// ── Event type badge ──────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  const cfg: Record<string, { cls: string; icon: any }> = {
    CASE:     { cls: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",   icon: Briefcase   },
    ASSET:    { cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckSquare },
    TASK:     { cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",      icon: CheckSquare },
    USER:     { cls: "bg-purple-500/10 text-purple-400 border-purple-500/20",   icon: Users       },
    DOCUMENT: { cls: "bg-pink-500/10 text-pink-400 border-pink-500/20",         icon: FileText    },
  };
  const s = cfg[type] ?? cfg.CASE;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold border ${s.cls}`}>
      <Icon className="w-2.5 h-2.5" /> {type}
    </span>
  );
}

// ── Delta renderer ─────────────────────────────────────────────────────────────
function renderDelta(delta: AuditDelta, positiveIsGood: boolean): { text: string; color: string } {
  if (delta === "new") return { text: "New Activity", color: "text-emerald-400" };
  if (delta === 0)     return { text: "No change",    color: "text-muted-foreground" };
  const pct  = Math.abs(delta);
  const up   = delta > 0;
  const good = positiveIsGood ? up : !up;
  return {
    text:  `${up ? "↑" : "↓"} ${pct}% vs last 90 days`,
    color: good ? "text-emerald-400" : "text-red-400",
  };
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyAuditState({
  onSeed, seeding,
}: { onSeed: () => void; seeding: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-5">
      <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center">
        <ClipboardList className="w-8 h-8 text-muted-foreground/40" />
      </div>
      <div>
        <p className="text-sm font-bold text-foreground mb-1">No Audit Activity Yet</p>
        <p className="text-xs text-muted-foreground max-w-[300px] leading-relaxed">
          Your audit trail is empty. Generate sample events to see how the trail works,
          or start using the system to generate real activity.
        </p>
      </div>
      <Button
        onClick={onSeed}
        disabled={seeding}
        className="h-9 px-5 rounded-xl text-xs font-bold bg-primary shadow-md shadow-primary/20 gap-2"
      >
        {seeding ? (
          <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating…</>
        ) : (
          <><Sparkles className="w-3.5 h-3.5" /> Generate Sample Activity</>
        )}
      </Button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AuditPage() {
  const { isHR, isAdmin } = useAuth();

  // Filter state
  const [search,         setSearch]         = useState("");
  const [typeFilter,     setTypeFilter]     = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [page,           setPage]           = useState(1);
  const [trendGranularity, setTrendGranularity] = useState("daily");
  const [selectedLog,    setSelectedLog]    = useState<any | null>(null);
  const PAGE_SIZE = 10;

  const filters = {
    page,
    limit:    PAGE_SIZE,
    type:     typeFilter,
    severity: severityFilter,
    search,
    from:     "",
    to:       "",
  };

  const { data, isLoading, isError, refetch } = useAuditLogs(filters);
  const { mutate: seedSynthetic, isPending: seeding } = useSeedSyntheticAudit();
  const { mutate: archiveSynthetic, isPending: archiving } = useArchiveSyntheticAudit();

  if (!isHR && !isAdmin) return <Redirect to="/dashboard" />;

  const isEmpty     = data?.source === "empty";
  const isSynthetic = data?.source === "synthetic";
  const stats       = data?.stats;
  const items       = data?.items ?? [];
  const totalPages  = data?.totalPages ?? 0;
  const trendData   = data?.eventTrend ?? [];
  const typeData    = data?.typeBreakdown ?? [];
  const topActors   = data?.topActors ?? [];

  // Slice/group trendData by granularity
  const slicedTrend = (() => {
    if (!trendData.length) return trendData;
    switch (trendGranularity) {
      case "hourly":  return trendData.slice(-Math.min(24, trendData.length));
      case "weekly":  return trendData.slice(-Math.min(7, trendData.length));
      case "monthly": return trendData.slice(-Math.min(2, trendData.length));
      default:        return trendData; // daily = all buckets
    }
  })();

  const handleExport = () => {
    const params = new URLSearchParams({
      ...filters,
      page: "1",
      limit: "10000",
      format: "csv",
    } as any);
    window.open(`/api/audit-logs?${params.toString()}`, "_blank");
    toast.success("Audit log CSV download started");
  };

  const handleSeed = () => {
    seedSynthetic(undefined, {
      onSuccess: (res) => toast.success(`Generated ${res.count} sample audit events`),
      onError: (err: any) => toast.error(err.message),
    });
  };

  const handleArchive = () => {
    archiveSynthetic(undefined, {
      onSuccess: (res) => toast.success(`Archived ${res.archived} synthetic events`),
      onError: (err: any) => toast.error(err.message),
    });
  };

  // KPI card definitions from live stats
  const KPI_CARDS = stats
    ? [
        {
          label: "Total Events",
          value: stats.totalEvents.toLocaleString(),
          ...renderDelta(stats.totalEventsDelta, true),
          iconBg: "bg-indigo-500/10",
          icon: <ShieldAlert className="w-4 h-4 text-indigo-400" />,
          border: "border-border/50",
          labelColor: "text-indigo-400",
        },
        {
          label: "Critical Events",
          value: String(stats.criticalEvents),
          ...renderDelta(stats.criticalDelta, false),
          iconBg: "bg-red-500/10",
          icon: <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />,
          border: "border-red-500/20 bg-red-500/[0.02]",
          labelColor: "text-red-400",
          valueColor: "text-red-400",
        },
        {
          label: "Warning Events",
          value: String(stats.warningEvents),
          ...renderDelta(stats.warningDelta, false),
          iconBg: "bg-amber-500/10",
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          border: "border-amber-500/20 bg-amber-500/[0.02]",
          labelColor: "text-amber-400",
          valueColor: "text-amber-400",
        },
        {
          label: "Info Events",
          value: stats.infoEvents.toLocaleString(),
          text: "Standard activity",
          color: "text-blue-400",
          iconBg: "bg-blue-500/10",
          icon: <Info className="w-4 h-4 text-blue-400" />,
          border: "border-border/50",
          labelColor: "text-muted-foreground",
        },
        {
          label: "Unique Actors",
          value: String(stats.uniqueActors),
          text: "Active in last 90 days",
          color: "text-emerald-400",
          iconBg: "bg-purple-500/10",
          icon: <Users className="w-4 h-4 text-purple-400" />,
          border: "border-border/50",
          labelColor: "text-muted-foreground",
        },
      ]
    : [];

  return (
    <div className="flex gap-0 -mx-4 md:-mx-6 -mt-4 md:-mt-6 min-h-[calc(100vh-4rem)]">
      {/* ── Main content ─────────────────────────────────────────────────── */}
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
          <Button
            onClick={handleExport}
            variant="outline"
            className="h-9 px-4 rounded-xl text-xs font-bold border-border/60 bg-card gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>

        {/* Synthetic banner */}
        {isSynthetic && !isLoading && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-300">Simulated Audit Activity</p>
                <p className="text-[10px] text-amber-400/70 mt-0.5">
                  These 200 events are synthetic placeholders. Real events will appear as your team uses the system.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchive}
              disabled={archiving}
              className="h-7 px-3 rounded-lg text-[11px] font-semibold border-amber-500/30 text-amber-400 hover:bg-amber-500/10 shrink-0 gap-1.5"
            >
              {archiving ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
              Archive synthetic data
            </Button>
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-xs text-red-400">
              Failed to load audit logs.{" "}
              <button onClick={() => refetch()} className="underline font-semibold">Retry</button>
            </p>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-5 gap-3">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
            : KPI_CARDS.map((card, i) => (
                <div key={i} className={`rounded-2xl border p-4 bg-card/60 backdrop-blur-sm shadow-soft ${card.border}`}>
                  <div className="flex items-start justify-between mb-2">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${card.labelColor ?? "text-muted-foreground"}`}>
                      {card.label}
                    </p>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                      {card.icon}
                    </div>
                  </div>
                  <h3 className={`text-2xl font-extrabold tracking-tight ${"valueColor" in card ? card.valueColor : "text-foreground"}`}>
                    {card.value}
                  </h3>
                  <p className={`text-[10px] font-semibold mt-1.5 ${card.color}`}>{card.text}</p>
                </div>
              ))}
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <Input
              placeholder="Search by actor, action, target, IP address, session ID..."
              className="pl-10 h-9 bg-card border-border/60 rounded-xl text-xs font-medium"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="h-9 w-[160px] rounded-xl text-xs font-semibold bg-card border-border/60">
              <SelectValue placeholder="All Event Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all"      className="text-xs">All Event Types</SelectItem>
              <SelectItem value="case"     className="text-xs">Case</SelectItem>
              <SelectItem value="asset"    className="text-xs">Asset</SelectItem>
              <SelectItem value="task"     className="text-xs">Task</SelectItem>
              <SelectItem value="user"     className="text-xs">User</SelectItem>
              <SelectItem value="document" className="text-xs">Document</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={v => { setSeverityFilter(v); setPage(1); }}>
            <SelectTrigger className="h-9 w-[140px] rounded-xl text-xs font-semibold bg-card border-border/60">
              <SelectValue placeholder="All Severities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all"   className="text-xs">All Severities</SelectItem>
              <SelectItem value="error" className="text-xs">Critical / Error</SelectItem>
              <SelectItem value="warn"  className="text-xs">Warning</SelectItem>
              <SelectItem value="info"  className="text-xs">Info</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 px-3 py-1.5 border border-border/60 bg-card rounded-xl text-xs font-medium text-muted-foreground whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5" />
            Last 90 days
          </div>
          <Button variant="outline" className="h-9 px-3 rounded-xl text-xs font-semibold border-border/60 bg-card gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Filters
          </Button>
        </div>

        {/* Main Table */}
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-muted/10">
                  {[
                    { label: "Timestamp",   sortable: true,  w: "w-[160px]" },
                    { label: "Severity",    sortable: false, w: "w-[90px]"  },
                    { label: "Actor",       sortable: false, w: ""           },
                    { label: "Event Type",  sortable: false, w: "w-[100px]" },
                    { label: "Action",      sortable: false, w: "w-[100px]" },
                    { label: "Target",      sortable: false, w: "w-[150px]" },
                    { label: "Details",     sortable: false, w: ""           },
                    { label: "IP Address",  sortable: false, w: "w-[120px]" },
                    { label: "",            sortable: false, w: "w-[40px]"  },
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
                {isLoading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-4">
                          <Skeleton className="h-3 rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : isEmpty ? (
                  <tr>
                    <td colSpan={9}>
                      <EmptyAuditState onSeed={handleSeed} seeding={seeding} />
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-xs text-muted-foreground">
                      No audit events match the current filters.
                    </td>
                  </tr>
                ) : (
                  items.map(log => (
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded-lg">
                              <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 bg-[#11141c] border border-white/10 text-white">
                            <DropdownMenuItem className="hover:bg-white/5 cursor-pointer text-xs" onClick={() => setSelectedLog(log)}>
                              <Eye className="w-3.5 h-3.5 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-white/5 cursor-pointer text-xs" onClick={() => {
                              navigator.clipboard.writeText(log.details || "");
                              toast.success("Details copied to clipboard");
                            }}>
                              <FileText className="w-3.5 h-3.5 mr-2" />
                              Copy Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-white/5 cursor-pointer text-xs" onClick={() => {
                              navigator.clipboard.writeText(log.ip || "");
                              toast.success("IP address copied to clipboard");
                            }}>
                              <Users className="w-3.5 h-3.5 mr-2" />
                              Copy IP Address
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isEmpty && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-muted/5">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>Rows per page:</span>
                <span className="font-bold text-foreground">{PAGE_SIZE}</span>
                <span className="mx-1">·</span>
                <span>
                  {!isLoading && `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, data?.total ?? 0)} of ${data?.total?.toLocaleString() ?? 0} events`}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(1)} disabled={page === 1} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted disabled:opacity-30 transition-colors">
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted disabled:opacity-30 transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {/* Dynamic page numbers around current page */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        "w-7 h-7 rounded-lg text-[11px] font-bold transition-colors",
                        p === page ? "bg-primary text-white" : "hover:bg-muted text-muted-foreground",
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
                {totalPages > 5 && page < totalPages - 3 && (
                  <span className="text-muted-foreground text-[11px] px-1">…</span>
                )}
                {totalPages > 5 && page < totalPages - 2 && (
                  <button onClick={() => setPage(totalPages)} className="w-7 h-7 rounded-lg text-[11px] font-bold hover:bg-muted text-muted-foreground transition-colors">
                    {totalPages}
                  </button>
                )}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted disabled:opacity-30 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted disabled:opacity-30 transition-colors">
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right Sidebar ─────────────────────────────────────────────────── */}
      <div className="w-[220px] shrink-0 border-l border-border/40 pl-4 pr-4 pt-4 md:pt-6 pb-8 overflow-y-auto bg-card/20 space-y-6">

        {/* Event Trend */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-extrabold text-foreground">Event Trend</h3>
            <Select value={trendGranularity} onValueChange={setTrendGranularity}>
              <SelectTrigger className="h-6 w-[80px] rounded-lg text-[10px] font-semibold bg-muted/30 border-border/50 px-2 gap-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="left" align="start">
                <SelectItem value="hourly"  className="text-[10px]">Hourly</SelectItem>
                <SelectItem value="daily"   className="text-[10px]">Daily</SelectItem>
                <SelectItem value="weekly"  className="text-[10px]">Weekly</SelectItem>
                <SelectItem value="monthly" className="text-[10px]">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-[10px] text-muted-foreground mb-2">Events over time</p>
          <div className="h-[100px]">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={slicedTrend} margin={{ top: 4, right: 2, left: -24, bottom: 0 }}>
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
            )}
          </div>
        </div>

        {/* Events by Type */}
        <div>
          <h3 className="text-xs font-extrabold text-foreground mb-3">Events by Type</h3>
          {isLoading ? (
            <Skeleton className="h-20" />
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" innerRadius={22} outerRadius={32} dataKey="value" strokeWidth={0}>
                      {typeData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-extrabold text-white leading-none">{stats?.totalEvents.toLocaleString() ?? "–"}</span>
                  <span className="text-[7px] text-muted-foreground">Total</span>
                </div>
              </div>
              <div className="space-y-1.5 flex-1">
                {typeData.map(d => (
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
          )}
        </div>

        {/* Top Actors */}
        <div>
          <h3 className="text-xs font-extrabold text-foreground mb-0.5">Top Actors</h3>
          <p className="text-[10px] text-muted-foreground mb-3">By event count</p>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6" />)}
            </div>
          ) : (
            <div className="space-y-2.5">
              {topActors.map((actor, idx) => (
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
          )}
          <button className="mt-4 w-full flex items-center justify-between text-[11px] font-bold text-foreground border border-border/50 rounded-xl px-3 py-2 hover:bg-muted/30 transition-colors">
            View Full Audit Report <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {selectedLog && (
        <Dialog open={selectedLog !== null} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <DialogContent className="max-w-md bg-[#11141c] border border-white/10 rounded-2xl p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-400" />
                Audit Event Details
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Full technical parameters and context for this system event.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-white/5">
                <span className="text-muted-foreground font-semibold">Timestamp</span>
                <span className="col-span-2 font-mono text-[11px] text-zinc-300">
                  {format(new Date(selectedLog.timestamp), "dd MMM yyyy, hh:mm:ss aa")}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-white/5">
                <span className="text-muted-foreground font-semibold">Severity</span>
                <span className="col-span-2">
                  <SeverityBadge severity={selectedLog.severity} />
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-white/5">
                <span className="text-muted-foreground font-semibold">Actor</span>
                <span className="col-span-2 text-zinc-200 font-bold">
                  {selectedLog.actor} ({selectedLog.actorRole})
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-white/5">
                <span className="text-muted-foreground font-semibold">Event Type</span>
                <span className="col-span-2">
                  <TypeBadge type={selectedLog.eventType} />
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-white/5">
                <span className="text-muted-foreground font-semibold">Action</span>
                <span className="col-span-2 text-zinc-200 font-semibold">
                  {selectedLog.action}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-white/5">
                <span className="text-muted-foreground font-semibold">Target</span>
                <span className="col-span-2 font-mono text-zinc-300">
                  {selectedLog.target}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-white/5">
                <span className="text-muted-foreground font-semibold">IP Address</span>
                <span className="col-span-2 font-mono text-zinc-300">
                  {selectedLog.ip}
                </span>
              </div>

              {selectedLog.sessionId && (
                <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-white/5">
                  <span className="text-muted-foreground font-semibold">Session ID</span>
                  <span className="col-span-2 font-mono text-[10px] text-zinc-400">
                    {selectedLog.sessionId}
                  </span>
                </div>
              )}

              <div className="space-y-1.5 pt-2">
                <span className="text-muted-foreground font-semibold block">Details &amp; Metadata</span>
                <div className="bg-black/30 border border-white/5 rounded-xl p-3 font-mono text-[10px] text-zinc-300 overflow-x-auto max-h-[160px] whitespace-pre-wrap">
                  {(() => {
                    try {
                      const parsed = JSON.parse(selectedLog.details);
                      return JSON.stringify(parsed, null, 2);
                    } catch {
                      return selectedLog.details;
                    }
                  })()}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLog(null)}
                className="h-8 rounded-xl text-xs font-bold border-white/10 hover:bg-white/5 text-zinc-300"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
