import { useExitStore } from "@/store/exitStore";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SLARiskChip } from "@/components/shared/SLARiskChip";
import { CaseTimeline } from "@/components/cases/CaseTimeline";
import { formatDate } from "@/lib/utils";
import { differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle2, Circle, AlertCircle, Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmployeeDashboard() {
  const { user } = useAuth();
  const cases = useExitStore(state => state.cases);
  const myCase = cases.find(c => c.employeeId === user?.employeeId);

  if (!myCase) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Good morning, {user?.name}</h1>
          <p className="text-muted-foreground">{user?.role.replace('_', ' ')} · {user?.dept}</p>
        </div>
        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-medium">No Active Exit Process</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">
              You do not have an active resignation or exit process. 
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lwd = new Date(myCase.lastWorkingDay);
  const daysRemaining = differenceInDays(lwd, new Date());
  
  const getDeptIcon = (status: string) => {
    switch(status) {
      case 'approved': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'rejected': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'overdue': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Good morning, {user?.name.split(' ')[0]}</h1>
        <p className="text-muted-foreground">Employee · {user?.dept}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="font-mono">{myCase.id}</Badge>
                  <StatusBadge status={myCase.status} />
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground font-medium">Last Working Day</p>
                  <div className="flex items-center gap-3">
                    <p className="text-2xl font-bold">{formatDate(myCase.lastWorkingDay)}</p>
                    {daysRemaining >= 0 && (
                      <Badge variant="outline" className={daysRemaining < 7 ? 'bg-red-50 text-red-700 border-red-200' : daysRemaining < 20 ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}>
                        {daysRemaining} days left
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Resignation Date</p>
                  <p className="font-medium text-sm">{formatDate(myCase.resignationDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Notice Period</p>
                  <p className="font-medium text-sm">{myCase.noticePeriodDays} days</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Manager</p>
                  <p className="font-medium text-sm">{myCase.managerName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Department</p>
                  <p className="font-medium text-sm">{myCase.employeeDept}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Department Clearances</CardTitle>
              <CardDescription>Track your clearance progress across departments</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {myCase.tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      {getDeptIcon(task.status)}
                      <div>
                        <p className="font-medium text-sm">{task.deptLabel}</p>
                        <p className="text-xs text-muted-foreground">Assignee: {task.assigneeName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {(task.status === 'pending' || task.status === 'in_progress') && (
                        <SLARiskChip dueAt={task.slaDueAt} className="hidden sm:flex" />
                      )}
                      <StatusBadge status={task.status} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Resignation Letter</p>
                      <p className="text-xs text-muted-foreground">Uploaded {formatDate(myCase.resignationDate)}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">View</Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Relieving Letter</p>
                      <p className="text-xs text-muted-foreground">Available after all clearances</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Experience Certificate</p>
                      <p className="text-xs text-muted-foreground">Available after all clearances</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <CaseTimeline events={myCase.timeline} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
