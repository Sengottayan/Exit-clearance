import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "wouter";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format, subHours, subDays } from "date-fns";
import { Search, Download, Filter } from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";

const MOCK_AUDIT = Array.from({ length: 25 }).map((_, i) => {
  const types = ['Case', 'Task', 'Document', 'User', 'System'];
  const actions = ['Created', 'Approved', 'Rejected', 'Generated', 'Updated'];
  const now = new Date();
  
  return {
    id: `aud-${1000 + i}`,
    timestamp: subHours(now, i * 3.5).toISOString(),
    actor: i % 3 === 0 ? 'Anita Desai' : i % 5 === 0 ? 'Rahul Mehta' : 'System Admin',
    role: i % 3 === 0 ? 'hr' : i % 5 === 0 ? 'manager' : 'admin',
    type: types[i % types.length],
    action: actions[i % actions.length],
    entity: i % 2 === 0 ? 'CASE-2024-001' : 'Task t-it-001',
    details: `Performed ${actions[i % actions.length].toLowerCase()} on ${types[i % types.length].toLowerCase()} record.`
  };
});

export default function AuditPage() {
  const { isHR, isAdmin } = useAuth();

  if (!isHR && !isAdmin) return <Redirect to="/dashboard" />;

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <PageHeader 
        title="Audit Trail" 
        breadcrumbs={[{ label: "Reports", href: "/reports" }, { label: "Audit Log" }]}
        action={
          <Button variant="outline">
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
              <Input placeholder="Search actor, action, or case ID..." className="pl-9" />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Select defaultValue="all">
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="case">Case Lifecycle</SelectItem>
                  <SelectItem value="task">Clearance Tasks</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
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
                {MOCK_AUDIT.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {format(new Date(log.timestamp), 'dd MMM yyyy, HH:mm:ss')}
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
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={log.details}>
                      {log.details}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
