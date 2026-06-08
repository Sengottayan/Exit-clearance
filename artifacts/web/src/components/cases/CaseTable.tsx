import { useState, useMemo } from "react";
import { ExitCase } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Link } from "@/lib/wouter";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { ClearanceProgressBar } from "@/components/shared/ClearanceProgressBar";
import { SLARiskChip } from "@/components/shared/SLARiskChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Search, ArrowUpDown, ChevronDown, Check, EyeOff } from "lucide-react";

interface CaseTableProps {
  cases: ExitCase[];
  showSearch?: boolean;
  onRowClick?: (caseId: string) => void;
}

export function CaseTable({ cases, showSearch = true, onRowClick }: CaseTableProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"name" | "lwd" | "status" | null>("lwd");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(["id", "employee", "lwd", "clearance", "sla", "status", "actions"]);

  // Column toggle list
  const columns = [
    { id: "id", label: "Case ID" },
    { id: "employee", label: "Employee Info" },
    { id: "lwd", label: "Last Working Day" },
    { id: "clearance", label: "Clearance Progress" },
    { id: "sla", label: "SLA Status" },
    { id: "status", label: "Workflow Status" },
  ];

  const handleSort = (field: "name" | "lwd" | "status") => {
    if (sortField === field) {
      setSortOrder(o => o === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const toggleColumn = (colId: string) => {
    setVisibleColumns(prev => 
      prev.includes(colId) ? prev.filter(c => c !== colId) : [...prev, colId]
    );
  };

  const filteredCases = useMemo(() => {
    return cases.filter(c => 
      c.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.employeeDept.toLowerCase().includes(search.toLowerCase())
    );
  }, [cases, search]);

  const sortedCases = useMemo(() => {
    if (!sortField) return filteredCases;
    return [...filteredCases].sort((a, b) => {
      let comparison = 0;
      if (sortField === "name") {
        comparison = a.employeeName.localeCompare(b.employeeName);
      } else if (sortField === "lwd") {
        comparison = new Date(a.lastWorkingDay).getTime() - new Date(b.lastWorkingDay).getTime();
      } else if (sortField === "status") {
        comparison = a.status.localeCompare(b.status);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [filteredCases, sortField, sortOrder]);

  return (
    <div className="w-full bg-card rounded-2xl overflow-hidden border border-border/60">
      {/* Sticky Table Options Bar */}
      {(showSearch || true) && (
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-border bg-muted/20 gap-3">
          {showSearch ? (
            <div className="relative flex-1 w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search cases..."
                className="pl-9 h-9 bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/50 rounded-lg text-xs font-semibold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          ) : (
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Exit Case Directory ({sortedCases.length})
            </div>
          )}

          {/* Columns dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs font-semibold border-border/60">
                  <Eye className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  <span>Columns</span>
                  <ChevronDown className="w-3 h-3 ml-1.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs">Toggle Visibility</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.map(col => (
                  <DropdownMenuItem
                    key={col.id}
                    className="cursor-pointer text-xs font-medium flex items-center justify-between"
                    onClick={() => toggleColumn(col.id)}
                  >
                    <span>{col.label}</span>
                    {visibleColumns.includes(col.id) && <Check className="w-3.5 h-3.5 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Main virtual container */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/50">
              {visibleColumns.includes("id") && (
                <TableHead className="w-[120px] font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Case ID</TableHead>
              )}
              {visibleColumns.includes("employee") && (
                <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                  <button onClick={() => handleSort("name")} className="flex items-center gap-1.5 hover:text-foreground">
                    <span>Employee</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
              )}
              {visibleColumns.includes("lwd") && (
                <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                  <button onClick={() => handleSort("lwd")} className="flex items-center gap-1.5 hover:text-foreground">
                    <span>Last Day</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
              )}
              {visibleColumns.includes("clearance") && (
                <TableHead className="w-[200px] font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Clearance Status</TableHead>
              )}
              {visibleColumns.includes("sla") && (
                <TableHead className="w-[140px] font-bold text-[10px] text-muted-foreground uppercase tracking-wider">SLA Risk</TableHead>
              )}
              {visibleColumns.includes("status") && (
                <TableHead className="w-[140px] font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                  <button onClick={() => handleSort("status")} className="flex items-center gap-1.5 hover:text-foreground">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
              )}
              {visibleColumns.includes("actions") && (
                <TableHead className="w-[80px] text-right font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-36 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground/80">
                    <Search className="w-8 h-8 mb-2 opacity-30 text-primary" />
                    <p className="text-xs font-bold text-foreground/80">No active cases found</p>
                    <p className="text-[10px] mt-0.5">Try resetting search string or active status tags.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedCases.map((c) => (
                <TableRow
                  key={c.id}
                  onClick={() => onRowClick && onRowClick(c.id)}
                  className="group hover:bg-muted/20 cursor-pointer border-b border-border/40 transition-colors"
                >
                  {visibleColumns.includes("id") && (
                    <TableCell className="font-mono text-[10px] font-semibold text-muted-foreground">{c.id}</TableCell>
                  )}
                  {visibleColumns.includes("employee") && (
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar name={c.employeeName} className="w-9 h-9 border border-border shadow-sm shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground tracking-tight leading-none group-hover:text-primary transition-colors">
                            {c.employeeName}
                          </span>
                          <span className="text-[10px] text-muted-foreground/85 mt-1 font-medium leading-none">
                            {c.employeeDept}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.includes("lwd") && (
                    <TableCell className="text-xs font-semibold text-foreground/90">
                      {formatDate(c.lastWorkingDay)}
                    </TableCell>
                  )}
                  {visibleColumns.includes("clearance") && (
                    <TableCell>
                      <ClearanceProgressBar tasks={c.tasks} />
                    </TableCell>
                  )}
                  {visibleColumns.includes("sla") && (
                    <TableCell>
                      {c.status === 'in_clearance' && c.tasks.some(t => t.status !== 'approved') ? (
                        <SLARiskChip 
                          dueAt={c.tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').sort((a,b) => new Date(a.slaDueAt).getTime() - new Date(b.slaDueAt).getTime())[0]?.slaDueAt} 
                          showIcon={true}
                        />
                      ) : (
                        <span className="text-muted-foreground/40 text-[10px] font-mono">—</span>
                      )}
                    </TableCell>
                  )}
                  {visibleColumns.includes("status") && (
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                  )}
                  {visibleColumns.includes("actions") && (
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onRowClick && onRowClick(c.id)}
                          className="h-7 px-2 text-[10px] font-bold rounded-md"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Open
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md">
                              <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuLabel className="text-[10px]">Operations</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onRowClick && onRowClick(c.id)} className="cursor-pointer text-xs font-semibold">
                              Inspect Sheet
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/cases/${c.id}`} className="cursor-pointer text-xs font-semibold">
                                Full Page View
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
