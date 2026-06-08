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
    <div className="w-full">
      {showSearch && (
        <div className="flex items-center p-4 border-b">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, ID, or department..."
              className="pl-9 bg-muted/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case ID</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>LWD</TableHead>
              <TableHead>Clearance</TableHead>
              <TableHead>SLA</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No cases found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCases.map((c) => (
                <TableRow key={c.id} className="group hover:bg-muted/30">
                  <TableCell className="font-mono text-xs font-medium text-muted-foreground">{c.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar name={c.employeeName} className="w-8 h-8" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium leading-none">{c.employeeName}</span>
                        <span className="text-xs text-muted-foreground mt-1">{c.employeeDept}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(c.lastWorkingDay)}</TableCell>
                  <TableCell className="w-[180px]">
                    <ClearanceProgressBar tasks={c.tasks} />
                  </TableCell>
                  <TableCell>
                    {c.status === 'in_clearance' && c.tasks.some(t => t.status !== 'approved') ? (
                      <SLARiskChip 
                        dueAt={c.tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').sort((a,b) => new Date(a.slaDueAt).getTime() - new Date(b.slaDueAt).getTime())[0]?.slaDueAt} 
                        showIcon={false}
                      />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/cases/${c.id}`}>
                        <Button variant="ghost" size="sm" className="h-8">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/cases/${c.id}`}>View Details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Copy Link</DropdownMenuItem>
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
