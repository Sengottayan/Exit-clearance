import { useAuth } from "@/hooks/useAuth";
import { useCases } from "@/hooks/api/useCases";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SLARiskChip } from "@/components/shared/SLARiskChip";
import { CaseTimeline } from "@/components/cases/CaseTimeline";
import { formatDate, cn } from "@/lib/utils";
import { differenceInCalendarDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle2, Circle, AlertCircle, Clock, Lock, ShieldCheck, ExternalLink, FileSignature, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/wouter";
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
      <div className="space-y-6 animate-slide-up">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Good morning, {firstName}</h1>
          <p className="text-muted-foreground font-semibold mt-1.5 text-xs uppercase tracking-wider">{user?.role.replace('_', ' ')} · {user?.dept}</p>
        </div>
        <Card className="border-dashed bg-muted/10 border-2 shadow-none rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6 shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-muted-foreground/60" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">No Active Exit Process</h3>
            <p className="text-muted-foreground mt-2 max-w-sm text-xs font-semibold leading-relaxed">
              You do not have an active resignation or exit process. Your employment status is active and in good standing.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/resign">
                <Button size="lg" className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary hover:to-indigo-500 font-bold text-xs py-5 rounded-xl border-0 shadow-md">
                  <FileSignature className="w-4 h-4 mr-2" />
                  Start Resignation Process
                </Button>
              </Link>
              {latestCase && (
                <Link href={`/cases/${latestCase.id}`}>
                  <Button size="lg" variant="outline" className="font-bold text-xs py-5 rounded-xl transition-all duration-300">
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
      case 'approved': return <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/10"><CheckCircle2 className="w-4.5 h-4.5" /></div>;
      case 'rejected': return <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center shrink-0 border border-red-500/10 animate-pulse"><AlertCircle className="w-4.5 h-4.5" /></div>;
      case 'in_progress': return <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 border border-blue-500/10"><Clock className="w-4.5 h-4.5" /></div>;
      case 'overdue': return <div className="w-8 h-8 rounded-lg bg-red-500/15 text-red-600 border border-red-500/25 flex items-center justify-center shrink-0 animate-pulse"><AlertCircle className="w-4.5 h-4.5" /></div>;
      default: return <div className="w-8 h-8 rounded-lg bg-secondary/80 text-muted-foreground/60 flex items-center justify-center shrink-0"><Circle className="w-4.5 h-4.5 opacity-55" /></div>;
    }
  };

  return (
    <div className="space-y-8 animate-slide-up pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Good morning, {firstName}</h1>
          <p className="text-muted-foreground font-semibold mt-1.5 text-xs uppercase tracking-wider">{user?.dept} Department</p>
        </div>
        <Link href={`/cases/${myCase.id}`}>
          <Button variant="outline" size="sm" className="font-bold text-xs rounded-xl shadow-sm transition-all duration-300">
            <ExternalLink className="w-4 h-4 mr-2" />
            View Full Details
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Status Hero Card */}
          <Card className="overflow-hidden shadow-premium border-border/50 bg-card/50 backdrop-blur-sm rounded-2xl">
            <div className="h-2 w-full bg-gradient-to-r from-primary via-indigo-600 to-primary"></div>
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-border/40 pb-8">
                <div>
                  <div className="flex items-center gap-3 mb-3.5">
                    <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border/60">{myCase.id}</Badge>
                    <StatusBadge status={myCase.status} />
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight">Exit Process Active</h2>
                </div>
                
                <div className="flex items-center gap-6">
                  <ProgressRing
                    value={clearanceProgress}
                    label="Clearance"
                    sublabel={`${approvedCount}/${myCase.tasks.length}`}
                    size={100}
                    strokeWidth={7}
                  />
                  <div className="bg-secondary/45 rounded-xl p-4 border border-border/50 flex flex-col items-end min-w-[160px] shadow-sm">
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground/80 font-bold mb-1">Last Working Day</p>
                    <p className="text-xl font-extrabold text-foreground mb-2">{formatDate(myCase.lastWorkingDay)}</p>
                    {daysRemaining >= 0 && (
                      <Badge variant="secondary" className={cn("font-bold text-[9px] px-2 py-0.5 rounded-md border", daysRemaining < 7 ? 'bg-red-50 text-red-700 border-red-200/50' : daysRemaining < 20 ? 'bg-amber-50 text-amber-700 border-amber-200/50' : 'bg-primary/5 text-primary border-primary/20')}>
                        {daysRemaining} days remaining
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {nextPendingTask && myCase.status === 'in_clearance' && (
                <div className="mb-8 p-4.5 rounded-xl border border-primary/25 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-primary mb-1">Next Required Action</p>
                    <p className="text-xs font-semibold text-foreground">Waiting on <strong>{nextPendingTask.deptLabel}</strong> department clearance approval.</p>
                  </div>
                  <SLARiskChip dueAt={nextPendingTask.slaDueAt} />
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-2">
                <div>
                  <p className="text-[9px] font-extrabold tracking-widest text-muted-foreground/80 uppercase mb-1.5">Resignation Date</p>
                  <p className="font-bold text-xs text-foreground">{formatDate(myCase.resignationDate)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-extrabold tracking-widest text-muted-foreground/80 uppercase mb-1.5">Notice Period</p>
                  <p className="font-bold text-xs text-foreground">{myCase.noticePeriodDays} days</p>
                </div>
                <div>
                  <p className="text-[9px] font-extrabold tracking-widest text-muted-foreground/80 uppercase mb-1.5">Manager Approval</p>
                  <p className="font-bold text-xs text-foreground truncate">{myCase.managerName}</p>
                </div>
                <div>
                  <p className="text-[9px] font-extrabold tracking-widest text-muted-foreground/80 uppercase mb-1.5">Assigned Role</p>
                  <p className="font-bold text-xs text-foreground truncate">{user?.role.replace('_', ' ')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clearances Card */}
          <Card className="shadow-premium border-border/50 bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/10 border-b border-border/40 pb-4 px-6 pt-6">
              <CardTitle className="text-base font-extrabold tracking-tight">Clearance Checklist</CardTitle>
              <CardDescription className="text-xs font-semibold">Track your clearance progress across all enterprise departments.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 bg-card/5">
              <div className="divide-y divide-border/30">
                {myCase.tasks.map((task) => {
                  const displayStatus = resolveTaskStatus(task);
                  return (
                    <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-muted/10 transition-colors duration-200 gap-4">
                      <div className="flex items-center gap-4">
                        {getDeptIcon(displayStatus)}
                        <div>
                          <p className="font-bold text-xs text-foreground leading-none mb-1.5">{task.deptLabel}</p>
                          <div className="text-[10px] text-muted-foreground font-semibold flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span>Assigned Owner: <span className="text-foreground/80">{task.assigneeName}</span></span>
                            <a
                              href={`mailto:${task.assigneeName.toLowerCase().replace(/\s+/g, '.')}@company.com?subject=Clearance%20Query%20-%20${encodeURIComponent(task.deptLabel)}`}
                              className="inline-flex items-center gap-0.5 text-primary hover:text-primary/80 transition-colors font-bold"
                              title={`Contact ${task.assigneeName}`}
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Contact Owner</span>
                            </a>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:ml-auto pl-12 sm:pl-0">
                        {(['pending', 'in_progress', 'overdue'] as const).includes(displayStatus as 'pending' | 'in_progress' | 'overdue') && (
                          <SLARiskChip dueAt={task.slaDueAt} className="hidden sm:inline-flex" />
                        )}
                        <StatusBadge status={displayStatus} className="shadow-none rounded-md" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="shadow-premium border-border/50 bg-card/40 backdrop-blur-sm rounded-2xl">
            <CardHeader className="bg-muted/10 border-b border-border/40 pb-4 px-6 pt-6">
              <CardTitle className="text-base font-extrabold tracking-tight">My Documents</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Document Pipeline */}
              <div className="border border-border/50 bg-secondary/15 rounded-xl p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 mb-4">Relieving Document Pipeline</p>
                <div className="relative flex items-center justify-between">
                  {/* Background Line */}
                  <div className="absolute left-[10%] right-[10%] top-4.5 h-0.5 bg-border/40 rounded-full -z-10"></div>
                  
                  {/* Foreground progress line */}
                  <div 
                    className="absolute left-[10%] top-4.5 h-0.5 bg-gradient-to-r from-primary via-indigo-500 to-indigo-600 rounded-full -z-10 transition-all duration-700 ease-out"
                    style={{ width: clearanceProgress === 100 ? "80%" : "0%" }}
                  ></div>

                  {/* Step 1: NDA Sign-off */}
                  <div className="flex flex-col items-center text-center space-y-2 w-1/3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-primary text-primary shadow-sm bg-card">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold text-foreground">NDA Sign-off</p>
                      <p className="text-[8px] text-muted-foreground font-semibold">Completed</p>
                    </div>
                  </div>

                  {/* Step 2: Relieving Letter */}
                  <div className="flex flex-col items-center text-center space-y-2 w-1/3">
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm bg-card",
                      clearanceProgress === 100 
                        ? "border-primary text-primary" 
                        : "border-border/60 text-muted-foreground/50"
                    )}>
                      {clearanceProgress === 100 ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold text-foreground">Relieving Letter</p>
                      <p className="text-[8px] text-muted-foreground font-semibold">
                        {clearanceProgress === 100 ? "Ready to Download" : "Locked (Pending Clearance)"}
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Experience Certificate */}
                  <div className="flex flex-col items-center text-center space-y-2 w-1/3">
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm bg-card",
                      clearanceProgress === 100 
                        ? "border-primary text-primary" 
                        : "border-border/60 text-muted-foreground/50"
                    )}>
                      {clearanceProgress === 100 ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold text-foreground">Experience Certificate</p>
                      <p className="text-[8px] text-muted-foreground font-semibold">
                        {clearanceProgress === 100 ? "Ready to Download" : "Locked (Pending Clearance)"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-center justify-between p-4 border border-border/60 bg-card rounded-xl hover:border-primary/45 hover:shadow-soft transition-all duration-300 group">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 border border-primary/5">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground mb-0.5">Resignation Letter</p>
                      <p className="text-[10px] text-muted-foreground font-semibold">Uploaded {formatDate(myCase.resignationDate)}</p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" className="h-8 text-[10px] font-bold px-4 hover:bg-primary hover:text-white transition-all">Download</Button>
                </div>

                {clearanceProgress === 100 ? (
                  <div className="flex items-center justify-between p-4 border border-border/60 bg-card rounded-xl hover:border-primary/45 hover:shadow-soft transition-all duration-300 group">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 border border-primary/5">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground mb-0.5">Relieving Letter</p>
                        <p className="text-[10px] text-muted-foreground font-semibold">Generated automatically on clearance</p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" className="h-8 text-[10px] font-bold px-4 hover:bg-primary hover:text-white transition-all">Download</Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 border border-dashed border-border/80 rounded-xl bg-muted/20">
                    <div className="flex items-center gap-4 opacity-75">
                      <div className="w-9 h-9 bg-background rounded-lg flex items-center justify-center shrink-0 border shadow-sm">
                        <Lock className="w-4 h-4 text-muted-foreground/50" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground/70 mb-0.5">Relieving Letter</p>
                        <p className="text-[10px] text-muted-foreground font-semibold">Available after final HR approval clearance</p>
                      </div>
                    </div>
                    <ShieldCheck className="w-4.5 h-4.5 text-muted-foreground/35 mr-2" />
                  </div>
                )}

                {clearanceProgress === 100 ? (
                  <div className="flex items-center justify-between p-4 border border-border/60 bg-card rounded-xl hover:border-primary/45 hover:shadow-soft transition-all duration-300 group">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 border border-primary/5">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground mb-0.5">Experience Certificate</p>
                        <p className="text-[10px] text-muted-foreground font-semibold">Generated automatically on clearance</p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" className="h-8 text-[10px] font-bold px-4 hover:bg-primary hover:text-white transition-all">Download</Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 border border-dashed border-border/80 rounded-xl bg-muted/20">
                    <div className="flex items-center gap-4 opacity-75">
                      <div className="w-9 h-9 bg-background rounded-lg flex items-center justify-center shrink-0 border shadow-sm">
                        <Lock className="w-4 h-4 text-muted-foreground/50" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground/70 mb-0.5">Experience Certificate</p>
                        <p className="text-[10px] text-muted-foreground font-semibold">Available after final HR approval clearance</p>
                      </div>
                    </div>
                    <ShieldCheck className="w-4.5 h-4.5 text-muted-foreground/35 mr-2" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline column */}
        <div className="lg:col-span-1">
          <Card className="h-full shadow-premium border-border/50 bg-card/45 backdrop-blur-sm rounded-2xl">
            <CardHeader className="bg-muted/10 border-b border-border/40 pb-4 px-6 pt-6">
              <CardTitle className="text-base font-extrabold tracking-tight">Activity Timeline</CardTitle>
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
