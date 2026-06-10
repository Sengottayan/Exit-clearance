"use client";
import { useAuth } from "@/hooks/useAuth";
import { useCases, useCaseMetrics, useAddComment } from "@/hooks/api/useCases";
import { useExitStore } from "@/store/exitStore";
import { useUploadAttachment } from "@/hooks/api/useDocuments";
import { Redirect, Link } from "@/lib/wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { buildAuditLog } from "@/lib/audit";
import { resolveTaskStatus } from "@/lib/workflow";
import { getActiveEmployeeCase, getLatestEmployeeCase } from "@/lib/employee-case";
import type { CaseAttachment } from "@/lib/types";
import { EXIT_REASONS } from "@/lib/constants";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import {
  PlusCircle, Search, Users, Clock, Activity, AlertTriangle, CheckCircle2,
  ArrowUpDown, Eye, MoreHorizontal, Filter, Download, Mail, Upload,
  FileText, Clipboard, Monitor, Landmark, User, ShieldCheck, Send,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Tiny SVG Sparkline ───────────────────────────────────────────────────────
function Sparkline({ color, path }: { color: string; path: string }) {
  return (
    <svg viewBox="0 0 80 28" className="w-full h-7 mt-2" fill="none" strokeWidth={1.8}>
      <path d={path} stroke={color} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── SLA status chip ──────────────────────────────────────────────────────────
function SLAChip({ status }: { status: "on_track" | "at_risk" | "overdue" | "none" }) {
  if (status === "none") return <span className="text-muted-foreground/40 text-[10px] font-mono">—</span>;
  const styles = {
    on_track: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    at_risk:  "bg-amber-500/10  text-amber-400  border-amber-500/20",
    overdue:  "bg-red-500/10    text-red-400    border-red-500/20",
  } as const;
  const labels = { on_track: "On Track", at_risk: "At Risk ↑", overdue: "Overdue" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// ── Progress cell ────────────────────────────────────────────────────────────
function ProgressCell({ tasks }: { tasks: { status: string }[] }) {
  const total = tasks.length;
  const done = tasks.filter(t => t.status === "approved").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const color = pct === 100 ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : pct >= 25 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2.5 min-w-[130px]">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function CasesPage() {
  const { user, isHR, isAdmin, isManager, isEmployee } = useAuth();
  const isManagerOnly = isManager && !isHR && !isAdmin;

  const { data: dbCases = [], isLoading, isError, refetch } = useCases();
  const { data: metrics } = useCaseMetrics(isManagerOnly && user ? { manager_id: user.id } : undefined);
  const fallbackCases = useExitStore(s => s.cases);
  
  const isDemoMode = !isLoading && !isError && dbCases.length === 0;
  const cases = isDemoMode ? fallbackCases : dbCases;

  const { mutate: addComment } = useAddComment();
  const { mutate: uploadAttachment } = useUploadAttachment();

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [slaFilter, setSlaFilter] = useState("all");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<"workflow" | "documents" | "comments" | "audit">("workflow");
  const [newCommentText, setNewCommentText] = useState("");
  const [sortField, setSortField] = useState<"id" | "employee" | "lwd" | "status" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const baseCases = isManagerOnly ? cases.filter(c => c.managerId === user?.id) : cases;
  const activeCase = getActiveEmployeeCase(cases, user);
  const latestCase = getLatestEmployeeCase(cases, user);

  // KPI Metrics
  const totalCount       = metrics?.totalCases ?? 0;
  const pendingCount     = metrics?.pendingManager ?? 0;
  const inClearanceCount = metrics?.inClearance ?? 0;
  const overdueCount     = metrics?.overdue ?? 0;
  const completedCount   = metrics?.completed ?? 0;

  const activeDepartmentsList = useMemo(() => {
    const set = new Set(cases.map(c => c.employeeDept).filter(Boolean));
    return Array.from(set);
  }, [cases]);

  const getSLAStatus = (c: typeof cases[0]): "on_track" | "at_risk" | "overdue" | "none" => {
    if (c.status === "completed" || c.status === "cancelled") return "none";
    if (c.tasks.some(t => resolveTaskStatus(t) === "overdue")) return "overdue";
    if (c.status === "in_clearance") return "at_risk";
    return "on_track";
  };

  const filteredCases = useMemo(() => {
    return baseCases.filter(c => {
      const matchesSearch = !search ||
        c.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase()) ||
        c.employeeDept.toLowerCase().includes(search.toLowerCase());
      let matchesTab = true;
      if (filter === "pending")   matchesTab = c.status === "pending_manager";
      if (filter === "clearance") matchesTab = c.status === "in_clearance";
      if (filter === "overdue")   matchesTab = c.tasks.some(t => resolveTaskStatus(t) === "overdue");
      if (filter === "completed") matchesTab = c.status === "completed";
      const matchesDept   = deptFilter === "all"   || c.employeeDept === deptFilter;
      const matchesReason = reasonFilter === "all" || c.exitReason === reasonFilter;
      let matchesSLA = true;
      if (slaFilter === "overdue")  matchesSLA = c.tasks.some(t => resolveTaskStatus(t) === "overdue");
      if (slaFilter === "at_risk")  matchesSLA = getSLAStatus(c) === "at_risk";
      if (slaFilter === "on_track") matchesSLA = getSLAStatus(c) === "on_track";
      return matchesSearch && matchesTab && matchesDept && matchesReason && matchesSLA;
    });
  }, [baseCases, filter, search, deptFilter, reasonFilter, slaFilter]);

  const sortedCases = useMemo(() => {
    if (!sortField) return filteredCases;
    return [...filteredCases].sort((a, b) => {
      let v = 0;
      if (sortField === "employee") v = a.employeeName.localeCompare(b.employeeName);
      if (sortField === "lwd")      v = new Date(a.lastWorkingDay).getTime() - new Date(b.lastWorkingDay).getTime();
      if (sortField === "status")   v = a.status.localeCompare(b.status);
      if (sortField === "id")       v = a.id.localeCompare(b.id);
      return sortOrder === "asc" ? v : -v;
    });
  }, [filteredCases, sortField, sortOrder]);

  const totalPages   = Math.max(1, Math.ceil(sortedCases.length / rowsPerPage));
  const pagedCases   = sortedCases.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const selectedCase = useMemo(() => cases.find(c => c.id === selectedCaseId), [cases, selectedCaseId]);
  const progression  = useMemo(() => {
    if (!selectedCase) return 0;
    const total = selectedCase.tasks.length;
    const done  = selectedCase.tasks.filter(t => t.status === "approved").length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [selectedCase]);
  const caseAuditLogs = useMemo(() => {
    if (!selectedCaseId) return [];
    return buildAuditLog(cases).filter(l => l.entity === selectedCaseId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [cases, selectedCaseId]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortOrder("asc"); }
  };

  const handleAddComment = () => {
    if (!selectedCaseId || !newCommentText.trim() || !user) return;
    addComment({ caseId: selectedCaseId, comment: { authorId: user.id, authorName: user.name, authorRole: user.role, message: newCommentText, visibility: "all" } });
    setNewCommentText(""); toast.success("Comment posted");
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCaseId || !e.target.files?.length || !user) return;
    uploadAttachment({ caseId: selectedCaseId, fileName: e.target.files[0].name, actor: user.name });
    toast.success(`Uploaded: ${e.target.files[0].name}`);
  };

  if (isEmployee) {
    if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
    if (activeCase) return <Redirect to={`/cases/${activeCase.id}`} />;
    if (latestCase) return <Redirect to={`/cases/${latestCase.id}`} />;
    return <Redirect to="/resign" />;
  }
  if (!isHR && !isAdmin && !isManager) return <Redirect to="/dashboard" />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mb-2">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Unable to Load Cases</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">There was a problem communicating with the server. Please try again.</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="mt-4 rounded-xl px-6">Retry Connection</Button>
      </div>
    );
  }

  const SortBtn = ({ field, label }: { field: typeof sortField; label: string }) => (
    <button onClick={() => handleSort(field)} className="flex items-center gap-1 hover:text-foreground transition-colors">
      {label}<ArrowUpDown className="w-3 h-3 shrink-0" />
    </button>
  );

  return (
    <div className="animate-slide-up space-y-5 pb-12">
      {isDemoMode && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-5 py-4 rounded-2xl flex items-start gap-4 animate-in fade-in duration-500 shadow-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-extrabold text-sm uppercase tracking-wider mb-1">⚠ Demo Mode</h4>
            <p className="text-xs font-medium opacity-90 leading-relaxed">Showing sample exit cases because this organization has no records yet. Create your first exit case to begin tracking real employee exits.</p>
          </div>
        </div>
      )}
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            {isManagerOnly ? "Team Exits" : "Exit Cases"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            {isManagerOnly ? "View and manage exit processes for your direct reports." : "Manage case lifecycles, assign checklists, and track offboard compliance."}
          </p>
        </div>
        {!isManagerOnly && (
          <Link href="/cases/new">
            <Button className="bg-primary hover:bg-primary/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20">
              <PlusCircle className="w-4 h-4" />
              Create Exit Case
            </Button>
          </Link>
        )}
      </div>

      {/* ── KPI Stat Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Cases",       value: totalCount,       icon: <Users className="w-4 h-4" />,         iconBg: "bg-slate-500/10 text-slate-400",         border: "border-border/50", path: "M5 22 L15 18 L25 20 L35 12 L45 16 L55 10 L65 14 L75 8",  stroke: "#64748b" },
          { label: "Pending Manager",   value: pendingCount,     icon: <Clock className="w-4 h-4" />,         iconBg: "bg-amber-500/10 text-amber-400",          border: "border-border/50", path: "M5 20 L15 16 L25 18 L35 10 L45 14 L55 18 L65 12 L75 16", stroke: "#f59e0b" },
          { label: "In Clearance",      value: inClearanceCount, icon: <Activity className="w-4 h-4" />,      iconBg: "bg-blue-500/10 text-blue-400",            border: "border-border/50", path: "M5 24 L15 20 L25 22 L35 14 L45 18 L55 12 L65 10 L75 8",  stroke: "#3b82f6" },
          { label: "SLA Overdue",       value: overdueCount,     icon: <AlertTriangle className="w-4 h-4" />, iconBg: "bg-red-500/10 text-red-400",              border: "border-red-500/20 bg-red-500/[0.02]", labelColor: "text-red-400", valueColor: "text-red-400", path: "M5 8 L15 12 L25 16 L35 14 L45 20 L55 22 L65 18 L75 22",  stroke: "#ef4444" },
          { label: "Completed",         value: completedCount,   icon: <CheckCircle2 className="w-4 h-4" />,  iconBg: "bg-emerald-500/10 text-emerald-400",      border: "border-border/50", path: "M5 26 L15 22 L25 20 L35 16 L45 14 L55 12 L65 8 L75 5",  stroke: "#10b981" },
        ].map((card, i) => (
          <div key={i} className={`rounded-2xl border p-4 bg-card/60 backdrop-blur-sm shadow-soft ${card.border} flex flex-col ${i === 3 ? "col-span-1" : ""}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${(card as any).labelColor ?? "text-muted-foreground"}`}>{card.label}</p>
                <h3 className={`text-3xl font-extrabold tracking-tight mt-1 ${(card as any).valueColor ?? "text-foreground"}`}>{card.value}</h3>
              </div>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>{card.icon}</div>
            </div>
            <Sparkline color={card.stroke} path={card.path} />
          </div>
        ))}
      </div>

      {/* ── Tab Filter Bar ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-border/40 pb-0">
        {[
          { value: "all",       label: "All Exits" },
          { value: "pending",   label: "Resignation Approvals" },
          { value: "clearance", label: "In Clearance" },
          { value: "overdue",   label: "SLA Overdue", danger: true },
          { value: "completed", label: "Completed" },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => { setFilter(tab.value); setPage(1); }}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg border-b-2 transition-all ${
              filter === tab.value
                ? tab.danger
                  ? "border-red-500 text-red-400 bg-red-500/5"
                  : "border-primary text-primary bg-primary/5"
                : tab.danger
                  ? "border-transparent text-red-400/60 hover:text-red-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Smart Filter Bar ────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70" />
          <Input
            placeholder="Search by name, ID, or department..."
            className="pl-10 h-9 w-full bg-card border-border/60 focus-visible:ring-1 focus-visible:ring-primary/25 rounded-xl text-xs font-medium"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={deptFilter} onValueChange={v => { setDeptFilter(v); setPage(1); }}>
            <SelectTrigger className="h-9 w-[150px] rounded-xl text-xs font-semibold bg-card border-border/60">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {activeDepartmentsList.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={reasonFilter} onValueChange={v => { setReasonFilter(v); setPage(1); }}>
            <SelectTrigger className="h-9 w-[130px] rounded-xl text-xs font-semibold bg-card border-border/60">
              <SelectValue placeholder="All Reasons" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reasons</SelectItem>
              {EXIT_REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={slaFilter} onValueChange={v => { setSlaFilter(v); setPage(1); }}>
            <SelectTrigger className="h-9 w-[140px] rounded-xl text-xs font-semibold bg-card border-border/60">
              <SelectValue placeholder="Any SLA Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any SLA Status</SelectItem>
              <SelectItem value="on_track">On Track</SelectItem>
              <SelectItem value="at_risk">At Risk</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9 px-3 rounded-xl text-xs font-semibold border-border/60 bg-card">
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            Filters
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border/60 bg-card shrink-0">
            <Download className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Cases Table ─────────────────────────────────────────────────── */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                <th className="text-left px-4 py-3 font-bold text-[10px] text-muted-foreground uppercase tracking-wider w-[130px]">
                  <SortBtn field="id" label="Case ID" />
                </th>
                <th className="text-left px-4 py-3 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                  <SortBtn field="employee" label="Employee" />
                </th>
                <th className="text-left px-4 py-3 font-bold text-[10px] text-muted-foreground uppercase tracking-wider w-[120px]">Department</th>
                <th className="text-left px-4 py-3 font-bold text-[10px] text-muted-foreground uppercase tracking-wider w-[130px]">
                  <SortBtn field="lwd" label="Last Working Day" />
                </th>
                <th className="text-left px-4 py-3 font-bold text-[10px] text-muted-foreground uppercase tracking-wider w-[170px]">Progress</th>
                <th className="text-left px-4 py-3 font-bold text-[10px] text-muted-foreground uppercase tracking-wider w-[110px]">
                  <SortBtn field="status" label="SLA Status" />
                </th>
                <th className="text-left px-4 py-3 font-bold text-[10px] text-muted-foreground uppercase tracking-wider w-[140px]">Status</th>
                <th className="text-right px-4 py-3 font-bold text-[10px] text-muted-foreground uppercase tracking-wider w-[80px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : pagedCases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Search className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm font-bold text-foreground/60">No cases found</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Try adjusting your filters or search term.</p>
                  </td>
                </tr>
              ) : (
                pagedCases.map(c => {
                  const sla = getSLAStatus(c);
                  const total = c.tasks.length;
                  const done  = c.tasks.filter(t => t.status === "approved").length;
                  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => { setSelectedCaseId(c.id); setDrawerTab("workflow"); }}
                      className="group hover:bg-muted/20 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3.5 font-mono text-[10px] text-muted-foreground">{c.id}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar name={c.employeeName} className="w-8 h-8 shrink-0 text-[11px] font-bold" />
                          <div>
                            <p className="font-bold text-foreground group-hover:text-primary transition-colors leading-none">{c.employeeName}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium leading-none">{c.employeeId || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-foreground/80 font-medium">{c.employeeDept}</td>
                      <td className="px-4 py-3.5 text-foreground/80 font-medium whitespace-nowrap">
                        {c.lastWorkingDay ? format(new Date(c.lastWorkingDay), "dd MMM yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-muted-foreground w-6 text-right">{done}/{total}</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : pct >= 25 ? "bg-amber-500" : "bg-red-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-foreground/60 w-8">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><SLAChip status={sla} /></td>
                      <td className="px-4 py-3.5"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 rounded-lg hover:bg-muted"
                            onClick={() => { setSelectedCaseId(c.id); setDrawerTab("workflow"); }}
                          >
                            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-muted">
                                <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => { setSelectedCaseId(c.id); setDrawerTab("workflow"); }} className="text-xs font-semibold cursor-pointer">
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/cases/${c.id}`} className="text-xs font-semibold cursor-pointer">Full Page View</Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-xs font-semibold cursor-pointer text-red-500">
                                Cancel Case
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-muted/10">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
            <span>Rows per page:</span>
            <span className="font-bold text-foreground">{rowsPerPage}</span>
            <span className="mx-2">·</span>
            <span>{(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, sortedCases.length)} of {sortedCases.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setPage(1)} disabled={page === 1}>
              <ChevronsLeft className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-7 w-7 rounded-lg text-[11px] font-bold transition-colors ${p === page ? "bg-primary text-white" : "hover:bg-muted text-muted-foreground"}`}
                >
                  {p}
                </button>
              );
            })}
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setPage(totalPages)} disabled={page === totalPages}>
              <ChevronsRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Case Detail Drawer ──────────────────────────────────────────── */}
      <Sheet open={!!selectedCaseId} onOpenChange={open => !open && setSelectedCaseId(null)}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto p-0 flex flex-col h-full bg-card border-l border-border/80 shadow-2xl">
          {/* Visually hidden title required by Radix Dialog for screen reader accessibility */}
          <SheetTitle className="sr-only">
            {selectedCase ? `Case Detail – ${selectedCase.employeeName}` : "Case Detail"}
          </SheetTitle>
          {selectedCase && (
            <>
              {/* Drawer Header */}
              <div className="p-6 border-b border-border/40 bg-muted/20 relative">
                <div className="flex justify-between items-start gap-4 mb-4 pr-6">
                  <div className="flex items-center gap-4">
                    <UserAvatar name={selectedCase.employeeName} className="w-14 h-14 border border-border shadow-md text-xl font-bold" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-extrabold tracking-tight text-foreground">{selectedCase.employeeName}</h3>
                        <Badge variant="outline" className="text-[9px] uppercase font-mono bg-muted border-border/60">{selectedCase.id}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-semibold mt-1">{selectedCase.employeeRole} · {selectedCase.employeeDept}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1.5 font-medium">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{selectedCase.employeeEmail}</span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={selectedCase.status} />
                </div>
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <span>Clearance Progression</span>
                    <span className="text-primary">{progression}%</span>
                  </div>
                  <Progress value={progression} className="h-2 rounded-full" />
                </div>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-border/40 px-6 bg-muted/10 shrink-0">
                {(["workflow", "documents", "comments", "audit"] as const).map(tab => {
                  const labels: Record<string, string> = {
                    workflow: "Clearance Pipeline",
                    documents: "Documents & Assets",
                    comments: `Comments (${selectedCase.comments?.length ?? 0})`,
                    audit: `Compliance Trail (${caseAuditLogs.length})`,
                  };
                  return (
                    <button
                      key={tab}
                      onClick={() => setDrawerTab(tab)}
                      className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${drawerTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    >
                      {labels[tab]}
                    </button>
                  );
                })}
              </div>

              {/* Drawer Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                {drawerTab === "workflow" && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-widest">Department Approvals Status</h4>
                    {selectedCase.tasks.map(task => {
                      const isOverdue  = resolveTaskStatus(task) === "overdue";
                      const isApproved = task.status === "approved";
                      return (
                        <div key={task.id} className={`p-4 border rounded-xl flex items-center justify-between ${isApproved ? "border-emerald-500/20 bg-emerald-500/[0.01]" : isOverdue ? "border-red-500/20 bg-red-500/[0.01]" : "border-border/60 bg-background/50"}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${isApproved ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : isOverdue ? "bg-red-500/10 border-red-500/20 text-red-500 animate-pulse-soft" : "bg-muted border-border/50 text-muted-foreground"}`}>
                              {task.deptId === "manager" ? <User className="w-4 h-4" /> : task.deptId === "it" ? <Monitor className="w-4 h-4" /> : task.deptId === "finance" ? <Landmark className="w-4 h-4" /> : task.deptId === "infosec" ? <ShieldCheck className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground">{task.deptLabel}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">Assignee: {task.assigneeName}{isOverdue && <span className="text-red-500 font-bold ml-1">· SLA BREACHED</span>}</p>
                            </div>
                          </div>
                          <Badge className={`text-[9px] uppercase font-bold ${isApproved ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : isOverdue ? "bg-red-500/10 border-red-500/20 text-red-500 animate-pulse-soft" : "bg-muted border-border/60 text-muted-foreground"}`}>
                            {isApproved ? "Approved" : isOverdue ? "Overdue" : "Pending"}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}

                {drawerTab === "documents" && (
                  <div className="space-y-6">
                    <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-widest">Exit Records & Letter Files</h4>
                    <div className="border border-dashed border-border/80 rounded-xl p-6 text-center hover:border-primary/50 transition-all bg-background/50 relative">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground opacity-50 mb-2" />
                      <p className="text-xs font-semibold">Upload return clearance forms or exit files</p>
                      <p className="text-[10px] text-muted-foreground/85 mt-0.5">PDF, DOCX, JPEG formats (up to 10MB)</p>
                      <input type="file" onChange={handleUploadFile} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                    </div>
                    <div className="space-y-2">
                      {selectedCase.documents.attachments?.map((file: CaseAttachment) => (
                        <div key={file.id} className="p-3 border border-border/60 bg-background/60 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-4 h-4 text-primary shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-foreground">{file.name}</p>
                              <p className="text-[9px] text-muted-foreground font-mono mt-0.5">By {file.uploadedBy} on {format(new Date(file.uploadedAt), "d MMM yyyy, HH:mm")}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg"><Download className="w-3.5 h-3.5 text-muted-foreground" /></Button>
                        </div>
                      ))}
                      {(!selectedCase.documents.attachments || selectedCase.documents.attachments.length === 0) && (
                        <p className="text-center text-xs text-muted-foreground py-6 border border-border/40 rounded-xl bg-background/20">No files attached.</p>
                      )}
                    </div>
                  </div>
                )}

                {drawerTab === "comments" && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-widest">Post Case Update Note</h4>
                      <div className="flex gap-2">
                        <Input placeholder="Add comments or notify HR..." className="h-10 text-xs rounded-xl border-border/60" value={newCommentText} onChange={e => setNewCommentText(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddComment()} />
                        <Button onClick={handleAddComment} size="icon" className="h-10 w-10 shrink-0 bg-primary hover:bg-primary/95 rounded-xl shadow-md shadow-primary/10"><Send className="w-3.5 h-3.5 text-white" /></Button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {selectedCase.comments?.map(comment => (
                        <div key={comment.id} className="p-4 bg-background border border-border/50 rounded-xl shadow-soft">
                          <div className="flex items-center gap-2 mb-2">
                            <UserAvatar name={comment.authorName} className="w-6 h-6 border shadow-sm text-[10px]" />
                            <span className="text-xs font-bold text-foreground">{comment.authorName}</span>
                            <span className="text-[9px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md border border-border/50 ml-0.5">{comment.authorRole}</span>
                            <span className="text-[10px] text-muted-foreground font-mono ml-auto">{format(new Date(comment.timestamp), "d MMM, HH:mm")}</span>
                          </div>
                          <p className="text-xs text-muted-foreground pl-8 leading-relaxed font-medium">{comment.message}</p>
                        </div>
                      ))}
                      {(!selectedCase.comments || selectedCase.comments.length === 0) && (
                        <p className="text-center text-xs text-muted-foreground py-8 border border-border/40 rounded-xl bg-background/20">No notes yet. Leave a note above.</p>
                      )}
                    </div>
                  </div>
                )}

                {drawerTab === "audit" && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-widest">Audit Trail Ledgers</h4>
                    <div className="relative pl-3 border-l border-border space-y-4">
                      {caseAuditLogs.map(log => (
                        <div key={log.id} className="relative">
                          <span className="absolute -left-[16.5px] top-1.5 w-2 h-2 rounded-full bg-primary border border-background shadow-sm" />
                          <div className="space-y-0.5 pl-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-foreground">{log.actor}</span>
                              <span className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground/85">{log.action}</span>
                              <span className="text-[10px] text-muted-foreground font-mono ml-auto">{format(new Date(log.timestamp), "d MMM, HH:mm:ss")}</span>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">{log.details}</p>
                          </div>
                        </div>
                      ))}
                      {caseAuditLogs.length === 0 && (
                        <p className="text-center text-xs text-muted-foreground py-8 border border-border/40 rounded-xl bg-background/20">No audit recordings available.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
