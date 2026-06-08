import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "wouter";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Search, Download, Filter } from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useExitStore } from "@/store/exitStore";
import { buildAuditLog, exportAuditCsv } from "@/lib/audit";
import { toast } from "sonner";

export default function AuditPage() {
  const { isHR, isAdmin } = useAuth();
  const cases = useExitStore((s) => s.cases);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  if (!isHR && !isAdmin) return <Redirect to="/dashboard" />;

  const allLogs = useMemo(() => buildAuditLog(cases), [cases]);

  const filteredLogs = allLogs.filter((log) => {
    const matchesSearch =
      !search ||
      log.actor.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.entity.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === "all" || log.type.toLowerCase() === typeFilter;

    return matchesSearch && matchesType;
  });

  const handleExport = () => {
    const csv = exportAuditCsv(filteredLogs);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exitflow-audit-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log exported");
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <PageHeader
        title="Audit Trail"
        description={`${allLogs.length} events from live case activity`}
        breadcrumbs={[{ label: "Reports", href: "/reports" }, { label: "Audit Log" }]}
        action={
          <Button variant="outline" onClick={handleExport} disabled={filteredLogs.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center bg-muted/20">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search actor, action, or case ID..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="case">Case Lifecycle</SelectItem>
                  <SelectItem value="task">Clearance Tasks</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="comment">Comments</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target Entity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No audit events match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                        {format(new Date(log.timestamp), "dd MMM yyyy, HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserAvatar name={log.actor} className="w-6 h-6" />
                          <span className="text-sm font-medium">{log.actor}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-secondary text-secondary-foreground">
                          {log.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{log.action}</TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">{log.entity}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[240px] truncate" title={log.details}>
                        {log.details}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
