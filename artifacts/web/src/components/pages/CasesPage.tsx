"use client";
import { useAuth } from "@/hooks/useAuth";
import { useCases } from "@/hooks/api/useCases";
import { useState, useMemo, useCallback } from "react";
import {
  Search, Filter, Download, Eye, MoreHorizontal,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  X, Loader2, AlertCircle,
} from "lucide-react";
import { format, differenceInHours } from "date-fns";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { EXIT_REASONS } from "@/lib/constants";
import CaseDetailPage from "@/components/pages/CaseDetailPage";
import { CaseActionsMenu } from "@/components/cases/CaseActionsMenu";

// ── SLA helpers ────────────────────────────────────────────────────────────────
type SLAStatus = "on_track" | "at_risk" | "overdue" | "none";

function computeSLA(c: any): SLAStatus {
  if (c.status === "completed" || c.status === "cancelled") return "none";
  const tasks: any[] = c.tasks ?? [];
  const now = new Date();
  for (const t of tasks) {
    if (t.status === "approved" || t.status === "completed") continue;
    const due = t.slaDueAt ? new Date(t.slaDueAt) : null;
    if (!due) continue;
    if (due < now) return "overdue";
    if (differenceInHours(due, now) <= 24) return "at_risk";
  }
  return c.status === "in_clearance" ? "at_risk" : "on_track";
}

function computeProgress(c: any): number {
  if (c.status === "completed") return 100;
  const tasks: any[] = c.tasks ?? [];
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "approved" || t.status === "completed").length;
  return Math.round((done / tasks.length) * 100);
}

// ── UI chips ───────────────────────────────────────────────────────────────────
function SLAChip({ status }: { status: SLAStatus }) {
  if (status === "none") return <span className="text-[#8e9bb0] text-[10px]">—</span>;
  const cfg = {
    on_track: { cls: "text-[#34d399]",                                   label: "On Track" },
    at_risk:  { cls: "bg-[#f59e0b]/10 text-[#fbbf24] px-2 py-0.5 rounded", label: "At Risk"  },
    overdue:  { cls: "bg-[#ef4444]/10 text-[#f87171] px-2 py-0.5 rounded", label: "Overdue"  },
  }[status];
  return <span className={`inline-flex items-center text-[10px] font-medium ${cfg.cls}`}>{cfg.label}</span>;
}

function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { cls: string; label: string }> = {
    pending_manager: { cls: "bg-[#f59e0b]/10 text-[#fbbf24] border-[#f59e0b]/20",  label: "Pending Approval" },
    in_clearance:    { cls: "bg-[#3b82f6]/10 text-[#60a5fa] border-[#3b82f6]/20",  label: "In Clearance"     },
    completed:       { cls: "bg-[#10b981]/10 text-[#34d399] border-[#10b981]/20",  label: "Completed"        },
    cancelled:       { cls: "bg-gray-500/10  text-gray-400  border-gray-500/20",    label: "Cancelled"        },
  };
  const c = cfg[status] ?? cfg.in_clearance;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-medium border ${c.cls}`}>{c.label}</span>;
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CasesPage() {
  const { user, isManager, isHR, isAdmin } = useAuth();
  const isManagerOnly = isManager && !isHR && !isAdmin;
  const { data: dbCases = [], isLoading } = useCases(
    isManagerOnly && user?.id ? { manager_id: user.id } : undefined
  );

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [tabFilter,    setTabFilter]    = useState("all");
  const [search,       setSearch]       = useState("");
  const [deptFilter,   setDeptFilter]   = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [slaFilter,    setSlaFilter]    = useState("all");
  const [page,         setPage]         = useState(1);
  const [sortCol,      setSortCol]      = useState<string>("created_at");
  const [sortDir,      setSortDir]      = useState<"asc" | "desc">("desc");
  const [exporting,    setExporting]    = useState(false);

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const rowsPerPage = 10;

  // Manager can see cases by their Clerk ID OR their email (handles pre-remap synthetic data)
  const managerCasePredicate = (c: any) =>
    c.managerId === user?.id ||
    (user?.email && c.managerEmail === user?.email);

  // ── Derived department list from real data ────────────────────────────────────
  const departments = useMemo(() => {
    const depts = Array.from(new Set(dbCases.map((c) => c.employeeDept).filter(Boolean)));
    return depts.sort();
  }, [dbCases]);

  // ── Filtered + sorted cases ───────────────────────────────────────────────────
  const filteredCases = useMemo(() => {
    let result = isManagerOnly ? dbCases.filter(managerCasePredicate) : dbCases;

    // Tab filter
    if (tabFilter === "pending")   result = result.filter((c) => c.status === "pending_manager");
    if (tabFilter === "clearance") result = result.filter((c) => c.status === "in_clearance");
    if (tabFilter === "completed") result = result.filter((c) => c.status === "completed");
    if (tabFilter === "overdue")   result = result.filter((c) => computeSLA(c) === "overdue");

    // Dropdown filters
    if (deptFilter !== "all")   result = result.filter((c) => c.employeeDept === deptFilter);
    if (reasonFilter !== "all") result = result.filter((c) => c.exitReason === reasonFilter);
    if (slaFilter !== "all")    result = result.filter((c) => computeSLA(c) === slaFilter);

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.employeeName.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.employeeDept.toLowerCase().includes(q) ||
          c.employeeEmail?.toLowerCase().includes(q)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      let av: any, bv: any;
      if (sortCol === "employee_name")  { av = a.employeeName; bv = b.employeeName; }
      else if (sortCol === "last_working_day") { av = a.lastWorkingDay; bv = b.lastWorkingDay; }
      else if (sortCol === "status")    { av = a.status; bv = b.status; }
      else                              { av = a.id; bv = b.id; }
      if (av < bv) return sortDir === "asc" ? -1 :  1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    });

    return result;
  }, [dbCases, tabFilter, deptFilter, reasonFilter, slaFilter, search, sortCol, sortDir, isManagerOnly, user?.id]);

  // ── Metrics Calculation ────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const baseCases = isManagerOnly ? dbCases.filter(managerCasePredicate) : dbCases;
    let total = baseCases.length;
    let pending = 0;
    let inClearance = 0;
    let overdue = 0;

    for (const c of baseCases) {
      if (c.status === "pending_manager") pending++;
      else if (c.status === "in_clearance") inClearance++;
      
      if (computeSLA(c) === "overdue" || computeSLA(c) === "at_risk") {
        overdue++;
      }
    }

    return { total, pending, inClearance, overdue };
  }, [dbCases, isManagerOnly, user?.id]);

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / rowsPerPage));
  const pagedCases = filteredCases.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const hasActiveFilters = deptFilter !== "all" || reasonFilter !== "all" || slaFilter !== "all" || search !== "";

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleSort = useCallback((col: string) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  }, [sortCol]);

  const resetFilters = useCallback(() => {
    setSearch("");
    setDeptFilter("all");
    setReasonFilter("all");
    setSlaFilter("all");
    setPage(1);
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (isManagerOnly && user?.id) params.set("manager_id", user.id);
      if (tabFilter !== "all") params.set("status", tabFilter === "pending" ? "pending_manager" : tabFilter === "clearance" ? "in_clearance" : tabFilter);
      if (deptFilter !== "all") params.set("department", deptFilter);
      if (reasonFilter !== "all") params.set("reason", reasonFilter);
      if (search) params.set("search", search);
      params.set("format", "csv");

      const res = await fetch(`/api/cases/export?${params.toString()}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `team-exits-${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  }, [isManagerOnly, user?.id, tabFilter, deptFilter, reasonFilter, search]);

  // ── Sort indicator ────────────────────────────────────────────────────────────
  const SortIcon = ({ col }: { col: string }) => (
    <span className="ml-1 text-[#8e9bb0]">{sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}</span>
  );

  if (selectedCaseId) {
    return <CaseDetailPage caseId={selectedCaseId} onBack={() => setSelectedCaseId(null)} />;
  }

  return (
    <div className="animate-slide-up pb-12 text-white min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {isManagerOnly ? "Team Exits" : "Exit Cases"}
        </h1>
        <p className="text-[#8e9bb0] text-sm mt-1">
          {isManagerOnly
            ? "View and manage exit processes for your direct reports."
            : "Manage case lifecycles, assign checklists, and track offboard compliance."}
        </p>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-[#121622] to-[#0f111a] border border-[#1e2536] rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Search className="w-16 h-16 text-white" />
          </div>
          <p className="text-xs font-medium text-[#8e9bb0] mb-2 uppercase tracking-wider">Total Exits</p>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-white leading-none">{metrics.total}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#121622] to-[#0f111a] border border-[#f59e0b]/20 rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <AlertCircle className="w-16 h-16 text-[#fbbf24]" />
          </div>
          <p className="text-xs font-medium text-[#fbbf24] mb-2 uppercase tracking-wider">Pending Approval</p>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-white leading-none">{metrics.pending}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#121622] to-[#0f111a] border border-[#3b82f6]/20 rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Loader2 className="w-16 h-16 text-[#60a5fa]" />
          </div>
          <p className="text-xs font-medium text-[#60a5fa] mb-2 uppercase tracking-wider">In Clearance</p>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-white leading-none">{metrics.inClearance}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#121622] to-[#0f111a] border border-[#ef4444]/20 rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <AlertCircle className="w-16 h-16 text-[#f87171]" />
          </div>
          <p className="text-xs font-medium text-[#f87171] mb-2 uppercase tracking-wider">At Risk / Overdue</p>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-white leading-none">{metrics.overdue}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-[#1e2536] mb-6">
        {[
          { value: "all",       label: "All Exits"        },
          { value: "pending",   label: "Pending Approval" },
          { value: "clearance", label: "In Clearance"     },
          { value: "overdue",   label: "SLA Overdue"      },
          { value: "completed", label: "Completed"        },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setTabFilter(tab.value); setPage(1); }}
            className={`pb-3 text-xs font-semibold border-b-2 transition-all ${
              tabFilter === tab.value
                ? "border-[#3b82f6] text-white"
                : "border-transparent text-[#8e9bb0] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-[#121622] rounded-xl border border-[#1e2536] p-4 flex flex-col lg:flex-row gap-4 items-center mb-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8e9bb0]" />
          <input
            type="text"
            placeholder="Search by name, ID, or department…"
            className="w-full bg-transparent border-none focus:outline-none text-sm text-white pl-9 placeholder-[#8e9bb0]"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e9bb0] hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-5 bg-[#1e2536]" />

        {/* Dropdowns */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Department */}
          <select
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
            className="bg-[#0f1420] border border-[#1e2536] text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#3b82f6] cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Exit Reason */}
          <select
            value={reasonFilter}
            onChange={(e) => { setReasonFilter(e.target.value); setPage(1); }}
            className="bg-[#0f1420] border border-[#1e2536] text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#3b82f6] cursor-pointer"
          >
            <option value="all">All Reasons</option>
            {EXIT_REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          {/* SLA Status */}
          <select
            value={slaFilter}
            onChange={(e) => { setSlaFilter(e.target.value); setPage(1); }}
            className="bg-[#0f1420] border border-[#1e2536] text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#3b82f6] cursor-pointer"
          >
            <option value="all">All SLA Status</option>
            <option value="on_track">On Track</option>
            <option value="at_risk">At Risk</option>
            <option value="overdue">Overdue</option>
          </select>

          {/* Reset filters */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-xs font-medium text-[#f87171] hover:text-white px-3 py-1.5 rounded-lg border border-[#f87171]/20 bg-[#f87171]/10 hover:bg-[#f87171]/20 transition-colors"
            >
              <X className="w-3 h-3" /> Reset
            </button>
          )}

          {/* Export CSV */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1e2536] hover:bg-[#2a344a] transition-colors disabled:opacity-50"
            title="Export to CSV"
          >
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Results count */}
      {hasActiveFilters && (
        <p className="text-xs text-[#8e9bb0] mb-3">
          Showing <span className="text-white font-medium">{filteredCases.length}</span> result{filteredCases.length !== 1 ? "s" : ""} matching your filters
        </p>
      )}

      {/* Table */}
      <div className="bg-[#121622] rounded-xl border border-[#1e2536] overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="border-b border-[#1e2536] bg-[#0f111a]/50">
            <tr>
              <th className="px-5 py-4 font-semibold text-[#8e9bb0] w-[135px]">Case ID</th>
              <th className="px-5 py-4 font-semibold text-[#8e9bb0] cursor-pointer select-none" onClick={() => handleSort("employee_name")}>
                Employee <SortIcon col="employee_name" />
              </th>
              <th className="px-5 py-4 font-semibold text-[#8e9bb0] w-[120px]">Department</th>
              <th className="px-5 py-4 font-semibold text-[#8e9bb0] w-[135px] cursor-pointer select-none" onClick={() => handleSort("last_working_day")}>
                Last Working Day <SortIcon col="last_working_day" />
              </th>
              <th className="px-5 py-4 font-semibold text-[#8e9bb0] w-[160px]">Progress</th>
              <th className="px-5 py-4 font-semibold text-[#8e9bb0] w-[100px]">SLA Status</th>
              <th className="px-5 py-4 font-semibold text-[#8e9bb0] w-[130px] cursor-pointer select-none" onClick={() => handleSort("status")}>
                Status <SortIcon col="status" />
              </th>
              <th className="px-5 py-4 font-semibold text-[#8e9bb0] w-[80px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2536]">
            {/* Loading skeleton */}
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 8 }).map((_, j) => (
                  <td key={j} className="px-5 py-4">
                    <div className="h-4 bg-[#1e2536] rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                  </td>
                ))}
              </tr>
            ))}

            {/* Empty state */}
            {!isLoading && pagedCases.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-16 text-center">
                  <AlertCircle className="w-8 h-8 text-[#8e9bb0] mx-auto mb-3" />
                  <p className="text-white font-medium text-sm mb-1">No cases found</p>
                  <p className="text-[#8e9bb0] text-xs">
                    {hasActiveFilters
                      ? "Try adjusting or resetting your filters."
                      : "No exit cases exist for your team yet."}
                  </p>
                  {hasActiveFilters && (
                    <button onClick={resetFilters} className="mt-3 text-xs text-[#3b82f6] hover:underline">
                      Reset Filters
                    </button>
                  )}
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!isLoading && pagedCases.map((c) => {
              const sla = computeSLA(c);
              const pct = computeProgress(c);
              return (
                <tr key={c.id} className="hover:bg-[#1a202f] transition-colors cursor-pointer" onClick={() => setSelectedCaseId(c.id)}>
                  <td className="px-5 py-4 font-mono text-[#8e9bb0] text-[11px]">{c.id}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={c.employeeName} className="w-7 h-7 text-[10px] shrink-0" />
                      <div>
                        <p className="font-semibold text-white">{c.employeeName}</p>
                        <p className="text-[#8e9bb0] text-[10px]">{c.employeeRole}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#8e9bb0]">{c.employeeDept}</td>
                  <td className="px-5 py-4 text-[#8e9bb0]">
                    {c.lastWorkingDay ? format(new Date(c.lastWorkingDay), "dd MMM yyyy") : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-1 h-1.5 bg-[#1e2536] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct === 100 ? "bg-[#10b981]" : sla === "overdue" ? "bg-[#ef4444]" : "bg-[#3b82f6]"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-[#8e9bb0] w-7">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4"><SLAChip status={sla} /></td>
                  <td className="px-5 py-4"><StatusPill status={c.status} /></td>
                  <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <button
                        className="text-[#8e9bb0] hover:text-white transition-colors"
                        onClick={() => setSelectedCaseId(c.id)}
                        title="View case"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <CaseActionsMenu exitCase={c} iconOnly />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {!isLoading && filteredCases.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#1e2536] bg-[#0f111a]/50">
            <div className="text-[11px] text-[#8e9bb0]">
              Showing{" "}
              <span className="text-white">{(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, filteredCases.length)}</span>
              {" "}of{" "}
              <span className="text-white">{filteredCases.length}</span> results
            </div>
            <div className="flex items-center gap-1.5">
              <button className="w-6 h-6 flex items-center justify-center text-[#8e9bb0] hover:text-white disabled:opacity-30" onClick={() => setPage(1)} disabled={page === 1}>
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button className="w-6 h-6 flex items-center justify-center text-[#8e9bb0] hover:text-white disabled:opacity-30" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button className="w-6 h-6 rounded bg-[#3b82f6] text-white text-[11px] font-medium">{page}</button>
              <button className="w-6 h-6 flex items-center justify-center text-[#8e9bb0] hover:text-white disabled:opacity-30" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button className="w-6 h-6 flex items-center justify-center text-[#8e9bb0] hover:text-white disabled:opacity-30" onClick={() => setPage(totalPages)} disabled={page === totalPages}>
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
