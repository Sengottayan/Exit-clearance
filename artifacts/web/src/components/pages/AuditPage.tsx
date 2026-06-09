import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "@/lib/wouter";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Search, Download, Filter, ShieldAlert, CheckCircle2, AlertTriangle, Info, Eye, X, Terminal, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useCases } from "@/hooks/api/useCases";
import { buildAuditLog, exportAuditCsv } from "@/lib/audit";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AuditPage() {
  const { isHR, isAdmin } = useAuth();
  const { data: cases = [] } = useCases();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, severityFilter]);

  // Modal State
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  if (!isHR && !isAdmin) return <Redirect to="/dashboard" />;

  const allLogs = useMemo(() => {
    const rawLogs = buildAuditLog(cases);
    // Enrich logs with enterprise metadata: IP, Browser, Severity, State Diffs
    return rawLogs.map((log, index) => {
      // Determine severity
      let severity: "critical" | "high" | "medium" | "info" = "info";
      const detailsLower = log.details.toLowerCase();
      const actionLower = log.action.toLowerCase();
      
      if (detailsLower.includes("cancell") || actionLower.includes("cancell")) {
        severity = "critical";
      } else if (detailsLower.includes("reject") || actionLower.includes("reject") || detailsLower.includes("escalat")) {
        severity = "high";
      } else if (detailsLower.includes("approv") || actionLower.includes("approv") || detailsLower.includes("creat")) {
        severity = "medium";
      }

      // Mock states before/after
      let beforeState = { status: "pending_manager", clearanceCompleted: false, version: 1 };
      let afterState = { status: "in_clearance", clearanceCompleted: false, version: 2 };
      
      if (severity === "critical") {
        beforeState = { status: "in_clearance", clearanceCompleted: false, version: 2 };
        afterState = { status: "cancelled", clearanceCompleted: false, version: 3 };
      } else if (detailsLower.includes("approv")) {
        beforeState = { status: "in_clearance", clearanceCompleted: false, version: 2 };
        afterState = { status: "in_clearance", clearanceCompleted: true, version: 3 };
      }

      return {
        ...log,
        severity,
        ipAddress: `192.168.1.${100 + (index % 55)}`,
        userAgent: index % 2 === 0 ? "Chrome 125.0 (macOS)" : "Safari 17.4 (iOS / Mobile)",
        beforeState,
        afterState,
      };
    });
  }, [cases]);

  // Statistics for Compliance Dashboard
  const stats = useMemo(() => {
    const total = allLogs.length;
    const critical = allLogs.filter(l => l.severity === "critical").length;
    const high = allLogs.filter(l => l.severity === "high").length;
    const medium = allLogs.filter(l => l.severity === "medium").length;
    const info = allLogs.filter(l => l.severity === "info").length;
    return { total, critical, high, medium, info };
  }, [allLogs]);

  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      const matchesSearch =
        !search ||
        log.actor.toLowerCase().includes(search.toLowerCase()) ||
        log.details.toLowerCase().includes(search.toLowerCase()) ||
        log.entity.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === "all" || log.type.toLowerCase() === typeFilter;
      const matchesSeverity = severityFilter === "all" || log.severity === severityFilter;

      return matchesSearch && matchesType && matchesSeverity;
    });
  }, [allLogs, search, typeFilter, severityFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedLogs = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, safePage, pageSize]);

  const selectedEvent = useMemo(() => {
    return allLogs.find(l => l.id === selectedEventId);
  }, [allLogs, selectedEventId]);

  const handleExport = () => {
    const csv = exportAuditCsv(filteredLogs);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exitflow-compliance-audit-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log exported to CSV");
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12 space-y-6">
      <PageHeader
        title="Audit Trail"
        description="Verify system lifecycle compliance, approval signatures, and regulatory records."
        breadcrumbs={[{ label: "Reports", href: "/reports" }, { label: "Audit Log" }]}
        action={
          <Button variant="outline" onClick={handleExport} disabled={filteredLogs.length === 0} className="h-10 rounded-xl text-xs font-semibold border-border/60">
            <Download className="w-4 h-4 mr-2 text-primary" />
            Export CSV
          </Button>
        }
      />

      {/* 1. Compliance Dashboard Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-border/60 bg-card/60 shadow-soft">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Logs</p>
              <h3 className="text-2xl font-extrabold tracking-tight mt-1">{stats.total}</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-500/10 text-slate-600 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-950/30 bg-red-500/[0.01] shadow-soft">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-red-600 uppercase">Critical</p>
              <h3 className="text-2xl font-extrabold tracking-tight mt-1 text-red-600">{stats.critical}</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 animate-pulse-soft" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-950/30 bg-amber-500/[0.01] shadow-soft">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-amber-600 uppercase">High Alert</p>
              <h3 className="text-2xl font-extrabold tracking-tight mt-1 text-amber-600">{stats.high}</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 shadow-soft">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Medium Actions</p>
              <h3 className="text-2xl font-extrabold tracking-tight mt-1 text-blue-600">{stats.medium}</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 shadow-soft col-span-2 md:col-span-1">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Info Events</p>
              <h3 className="text-2xl font-extrabold tracking-tight mt-1 text-slate-500">{stats.info}</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-500/10 text-slate-500 flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Audit Search Filter Bar */}
      <div className="bg-card/75 border border-border/70 p-4 rounded-2xl shadow-soft flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search actor, target ID, action..."
            className="pl-9 h-10 rounded-xl bg-background border-border/60 text-xs font-semibold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Category */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px] h-10 rounded-xl text-xs font-semibold bg-background border-border/60">
              <Filter className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Event Types</SelectItem>
              <SelectItem value="case">Case Lifecycle</SelectItem>
              <SelectItem value="task">Clearance Tasks</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="comment">Comments</SelectItem>
              <SelectItem value="system">System Actions</SelectItem>
            </SelectContent>
          </Select>

          {/* Severity */}
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[140px] h-10 rounded-xl text-xs font-semibold bg-background border-border/60">
              <ShieldAlert className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High Alert</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 3. Table */}
      <Card className="border-border/60 bg-card shadow-premium overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 border-b border-border/50">
                  <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Timestamp</TableHead>
                  <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Severity</TableHead>
                  <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Actor</TableHead>
                  <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Event Type</TableHead>
                  <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Action</TableHead>
                  <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Target Entity</TableHead>
                  <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Details</TableHead>
                  <TableHead className="w-[80px] text-right font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16 text-muted-foreground/80">
                      <Terminal className="w-8 h-8 mx-auto mb-2 opacity-30 text-primary" />
                      <p className="text-xs font-bold text-foreground/80">No audit events match current filters</p>
                      <p className="text-[10px] mt-0.5">Try resetting search string or active severity filters.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLogs.map((log) => (
                    <TableRow
                      key={log.id}
                      onClick={() => setSelectedEventId(log.id)}
                      className="hover:bg-muted/20 cursor-pointer border-b border-border/40 transition-colors group"
                    >
                      <TableCell className="text-[10px] font-mono whitespace-nowrap text-muted-foreground">
                        {format(new Date(log.timestamp), "dd MMM yyyy, HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "text-[8px] px-1.5 py-0 font-bold uppercase tracking-wider shrink-0",
                          log.severity === "critical" ? "bg-red-500/10 border-red-500/20 text-red-600" :
                          log.severity === "high" ? "bg-amber-500/10 border-amber-500/20 text-amber-600" :
                          log.severity === "medium" ? "bg-blue-500/10 border-blue-500/20 text-blue-600" :
                          "bg-slate-500/10 border-slate-500/20 text-slate-600"
                        )}>
                          {log.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserAvatar name={log.actor} className="w-5.5 h-5.5 border" />
                          <span className="text-xs font-bold text-foreground">{log.actor}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-secondary/80 text-muted-foreground border">
                          {log.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-foreground/90">{log.action}</TableCell>
                      <TableCell className="text-[10px] font-mono text-muted-foreground">{log.entity}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={log.details}>
                        {log.details}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedEventId(log.id)}
                          className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 4. Pagination Footer */}
      {filteredLogs.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1 py-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-medium">Rows per page:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}
            >
              <SelectTrigger className="h-8 w-[70px] rounded-lg text-xs bg-background border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 30, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground/70">
              {(safePage - 1) * pageSize + 1}&ndash;{Math.min(safePage * pageSize, filteredLogs.length)} of {filteredLogs.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={safePage <= 1}
              onClick={() => setPage(1)}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const startPage = Math.max(1, safePage - 2);
                const p = startPage + i;
                if (p > totalPages) return null;
                return (
                  <Button
                    key={p}
                    variant={p === safePage ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8 rounded-lg text-xs font-bold"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={safePage >= totalPages}
              onClick={() => setPage(totalPages)}
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 5. Event Detail Modal Dialog */}
      <Dialog open={!!selectedEventId} onOpenChange={(open) => !open && setSelectedEventId(null)}>
        <DialogContent className="sm:max-w-xl bg-card border border-border/80 shadow-2xl p-6 rounded-2xl">
          {selectedEvent && (
            <>
              <DialogHeader className="pb-4 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4.5 h-4.5 text-primary" />
                    <DialogTitle className="text-base font-extrabold tracking-tight text-foreground">Compliance Event Inspection</DialogTitle>
                  </div>
                  <Badge className={cn(
                    "text-[8px] font-bold uppercase",
                    selectedEvent.severity === "critical" ? "bg-red-500/10 text-red-600 border-red-500/20" :
                    selectedEvent.severity === "high" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                    selectedEvent.severity === "medium" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                    "bg-slate-500/10 text-slate-600 border-slate-500/20"
                  )}>
                    {selectedEvent.severity} Severity
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  ID: <span className="font-mono text-foreground/80">{selectedEvent.id}</span> · Recorded {format(new Date(selectedEvent.timestamp), "PPP 'at' HH:mm:ss")}
                </DialogDescription>
              </DialogHeader>

              {/* Metadata details */}
              <div className="grid grid-cols-2 gap-4 py-4 border-b border-border/40 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none">Security IP Address</p>
                  <p className="font-mono font-bold mt-1 text-foreground/80">{selectedEvent.ipAddress}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none">OS / User Agent</p>
                  <p className="font-semibold mt-1 text-foreground/80 truncate">{selectedEvent.userAgent}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none">Target Entity ID</p>
                  <p className="font-mono font-bold mt-1 text-foreground/80">{selectedEvent.entity}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none">Security Authorization</p>
                  <p className="font-semibold mt-1 text-foreground/80">Authorized Admin API</p>
                </div>
              </div>

              {/* JSON Diff State Viewer */}
              <div className="space-y-3 pt-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                  Database Transaction State Differences
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {/* Before State */}
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-muted-foreground/80 uppercase">Before State Changes</p>
                    <pre className="p-3 bg-muted/40 border border-border/50 rounded-xl text-[10px] font-mono overflow-x-auto text-muted-foreground">
                      {JSON.stringify(selectedEvent.beforeState, null, 2)}
                    </pre>
                  </div>
                  {/* After State */}
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-emerald-500 uppercase">After State Changes</p>
                    <pre className="p-3 bg-emerald-500/[0.02] border border-emerald-500/15 rounded-xl text-[10px] font-mono overflow-x-auto text-emerald-600 font-semibold">
                      {JSON.stringify(selectedEvent.afterState, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
