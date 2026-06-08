import { useState } from "react";
import { ExitCase } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Link } from "wouter";
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
import { MoreHorizontal, Eye, Search } from "lucide-react";

interface CaseTableProps {
  cases: ExitCase[];
  showSearch?: boolean;
}

export function CaseTable({ cases, showSearch = true }: CaseTableProps) {
  const [search, setSearch] = useState("");

  const filteredCases = cases.filter(c => 
    c.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase()) ||
    c.employeeDept.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full bg-card shadow-sm rounded-lg border border-border overflow-hidden">
      {showSearch && (
        <div className="flex items-center p-4 border-b border-border bg-muted/20">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, ID, or department..."
              className="pl-9 h-10 bg-background shadow-none border-border/60 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all rounded-md"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[120px] font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Case ID</TableHead>
              <TableHead className="font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Employee</TableHead>
              <TableHead className="font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">LWD</TableHead>
              <TableHead className="w-[200px] font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Clearance</TableHead>
              <TableHead className="w-[140px] font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">SLA Status</TableHead>
              <TableHead className="w-[140px] font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Status</TableHead>
              <TableHead className="w-[100px] text-right font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Search className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm font-medium">No cases found.</p>
                    <p className="text-xs">Adjust your search or filters.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCases.map((c) => (
                <TableRow key={c.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-[11px] font-medium text-muted-foreground">{c.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar name={c.employeeName} className="w-9 h-9 border border-border shadow-sm" />
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold tracking-tight text-foreground leading-none">{c.employeeName}</span>
                        <span className="text-[11px] text-muted-foreground mt-1 font-medium">{c.employeeDept}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{formatDate(c.lastWorkingDay)}</TableCell>
                  <TableCell>
                    <ClearanceProgressBar tasks={c.tasks} />
                  </TableCell>
                  <TableCell>
                    {c.status === 'in_clearance' && c.tasks.some(t => t.status !== 'approved') ? (
                      <SLARiskChip 
                        dueAt={c.tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').sort((a,b) => new Date(a.slaDueAt).getTime() - new Date(b.slaDueAt).getTime())[0]?.slaDueAt} 
                        showIcon={false}
                      />
                    ) : (
                      <span className="text-muted-foreground/50 text-sm font-medium">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                      <Link href={`/cases/${c.id}`}>
                        <Button variant="secondary" size="sm" className="h-8 px-2.5 text-xs font-medium">
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          View
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/cases/${c.id}`} className="cursor-pointer text-sm">View Details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-sm">Copy Link</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}