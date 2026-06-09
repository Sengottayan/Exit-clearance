import { useAuth } from "@/hooks/useAuth";
import { useCases } from "@/hooks/api/useCases";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SLARiskChip } from "@/components/shared/SLARiskChip";
import { CaseTimeline } from "@/components/cases/CaseTimeline";
import { formatDate } from "@/lib/utils";
import { differenceInCalendarDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle2, Circle, AlertCircle, Clock, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/wouter";
import { ExternalLink } from "lucide-react";
import { FileSignature } from "lucide-react";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { resolveTaskStatus } from "@/lib/workflow";
import { getActiveEmployeeCase, getLatestEmployeeCase } from "@/lib/employee-case";

export function EmployeeDashboard() {
  const { user } = useAuth();
  const { data: cases = [] } = useCases();
  const activeCase = getActiveEmployeeCase(cases, user);
  const latestCase = getLatestEmployeeCase(cases, user);
  const firstName = user?.name?.split(" ")[0] ?? "there";

  if (!activeCase) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Good morning, {firstName}</h1>
          <p className="text-muted-foreground font-medium mt-1">{user?.role.replace('_', ' ')} · {user?.dept}</p>
        </div>
        <Card className="border-dashed bg-muted/20 border-2 shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-xl font-semibold">No Active Exit Process</h3>
            <p className="text-muted-foreground mt-2 max-w-sm text-sm">
              You do not have an active resignation or exit process. Your employment status is active.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/resign">
                <Button size="lg">
                  <FileSignature className="w-4 h-4 mr-2" />
                  Start Resignation Process
                </Button>
              </Link>
              {latestCase && (
                <Link href={`/cases/${latestCase.id}`}>
                  <Button size="lg" variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Previous Case
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const myCase = activeCase;
  const lwd = new Date(myCase.lastWorkingDay);
  const daysRemaining = differenceInCalendarDays(lwd, new Date());
  const approvedCount = myCase.tasks.filter((t) => resolveTaskStatus(t) === 'approved').length;
  const clearanceProgress = myCase.tasks.length > 0 ? (approvedCount / myCase.tasks.length) * 100 : 0;
  const nextPendingTask = myCase.tasks.find((t) => !['approved', 'rejected'].includes(resolveTaskStatus(t)));
  
  const getDeptIcon = (status: string) => {
    switch(status) {
      case 'approved': return <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div>;
      case 'rejected': return <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0"><AlertCircle className="w-4 h-4 text-red-600" /></div>;
      case 'in_progress': return <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0"><Clock className="w-4 h-4 text-blue-600" /></div>;
      case 'overdue': return <div className="w-8 h-8 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0"><AlertCircle className="w-4 h-4 text-red-600 animate-pulse" /></div>;
      default: return <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0"><Circle className="w-4 h-4 text-muted-foreground opacity-50" /></div>;
    }
  };

  return (
    <div className="space-y-8 animate-slide-up pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Good morning, {firstName}</h1>
          <p className="text-muted-foreground font-medium mt-1">{user?.dept} Department</p>
        </div>
        <Link href={`/cases/${myCase.id}`}>
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            View Full Details
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Status Hero Card */}
          <Card className="overflow-hidden shadow-sm border-border/80">
            <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-500 to-primary"></div>
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-border/50 pb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="font-mono text-xs text-muted-foreground px-2">{myCase.id}</Badge>
                    <StatusBadge status={myCase.status} />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">Exit Process Active</h2>
                </div>
                
                <div className="flex items-center gap-6">
                  <ProgressRing
                    value={clearanceProgress}
                    label="Clearance"
                    sublabel={`${approvedCount}/${myCase.tasks.length}`}
                    size={100}
                    strokeWidth={7}
                  />
                  <div className="bg-secondary/50 rounded-xl p-4 border border-border/50 flex flex-col items-end min-w-[160px]">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Last Working Day</p>
                    <p className="text-2xl font-bold text-foreground mb-2">{formatDate(myCase.lastWorkingDay)}</p>
                    {daysRemaining >= 0 && (
                      <Badge variant="secondary" className={daysRemaining < 7 ? 'bg-red-100 text-red-800' : daysRemaining < 20 ? 'bg-amber-100 text-amber-800' : 'bg-primary/10 text-primary'}>
                        {daysRemaining} days remaining
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {nextPendingTask && myCase.status === 'in_clearance' && (
                <div className="mb-8 p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Next Step</p>
                    <p className="text-sm font-medium">Waiting on <strong>{nextPendingTask.deptLabel}</strong> clearance</p>
                  </div>
                  <SLARiskChip dueAt={nextPendingTask.slaDueAt} />
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-1.5">Resignation</p>
                  <p className="font-medium text-sm">{formatDate(myCase.resignationDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-1.5">Notice Period</p>
                  <p className="font-medium text-sm">{myCase.noticePeriodDays} days</p>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-1.5">Manager</p>
                  <p className="font-medium text-sm">{myCase.managerName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-1.5">Role</p>
                  <p className="font-medium text-sm truncate">{user?.role.replace('_', ' ')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clearances Card */}
          <Card className="shadow-sm border-border/80">
            <CardHeader className="bg-muted/20 border-b pb-4 px-6 pt-6">
              <CardTitle className="text-lg font-bold">Clearance Checklist</CardTitle>
              <CardDescription className="text-sm">Track your clearance progress across all departments.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {myCase.tasks.map((task) => {
                  const displayStatus = resolveTaskStatus(task);
                  return (
                  <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-muted/10 transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      {getDeptIcon(displayStatus)}
                      <div>
                        <p className="font-semibold text-sm leading-none mb-1.5">{task.deptLabel}</p>
                        <p className="text-xs text-muted-foreground font-medium">Assigned to: <span className="text-foreground/80">{task.assigneeName}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:ml-auto pl-12 sm:pl-0">
                      {(['pending', 'in_progress', 'overdue'] as const).includes(displayStatus as 'pending' | 'in_progress' | 'overdue') && (
                        <SLARiskChip dueAt={task.slaDueAt} className="hidden sm:inline-flex" />
                      )}
                      <StatusBadge status={displayStatus} className="shadow-none" />
                    </div>
                  </div>
                );})}
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="shadow-sm border-border/80">
            <CardHeader className="bg-muted/20 border-b pb-4 px-6 pt-6">
              <CardTitle className="text-lg font-bold">My Documents</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-border/60 rounded-xl hover:border-primary/30 hover:bg-muted/20 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-0.5">Resignation Letter</p>
                      <p className="text-xs text-muted-foreground font-medium">Uploaded {formatDate(myCase.resignationDate)}</p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" className="h-8 text-xs font-semibold px-4 opacity-0 group-hover:opacity-100 transition-opacity">Download</Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-dashed border-border rounded-xl bg-muted/30">
                  <div className="flex items-center gap-4 opacity-60">
                    <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center shrink-0 border shadow-sm">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-0.5">Relieving Letter</p>
                      <p className="text-xs text-muted-foreground font-medium">Available after final HR clearance</p>
                    </div>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-muted-foreground/40 mr-2" />
                </div>

                <div className="flex items-center justify-between p-4 border border-dashed border-border rounded-xl bg-muted/30">
                  <div className="flex items-center gap-4 opacity-60">
                    <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center shrink-0 border shadow-sm">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-0.5">Experience Certificate</p>
                      <p className="text-xs text-muted-foreground font-medium">Available after final HR clearance</p>
                    </div>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-muted-foreground/40 mr-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="h-full shadow-sm">
            <CardHeader className="bg-muted/20 border-b pb-4 px-6 pt-6">
              <CardTitle className="text-lg font-bold">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <CaseTimeline events={myCase.timeline} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
