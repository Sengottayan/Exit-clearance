import { useAuth } from "@/hooks/useAuth";
import { useCases } from "@/hooks/api/useCases";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaseTable } from "@/components/cases/CaseTable";
import { AlertCircle, CheckCircle2, Users, FileSignature, ClipboardList, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/lib/wouter";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UserAvatar } from "@/components/shared/UserAvatar";

export function ManagerDashboard() {
  const { user } = useAuth();
  const { data: cases = [] } = useCases();
  
  const teamCases = cases.filter(c => c.managerId === user?.id);
  const pendingApprovals = teamCases.filter(c => c.status === 'pending_manager');
  const myClearanceTasks = cases.flatMap(c => c.tasks.filter(t => t.deptId === 'manager' && c.status !== 'pending_manager').map(t => ({...t, caseId: c.id, employeeName: c.employeeName})));
  const pendingClearances = myClearanceTasks.filter(t => t.status === 'pending' || t.status === 'in_progress' || t.status === 'overdue');
  const hasNoActivity = teamCases.length === 0;

  return (
    <div className="space-y-8 animate-slide-up pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
        <p className="text-muted-foreground font-medium mt-1">{user?.dept} Department</p>
      </div>

      {hasNoActivity && (
        <Card className="border-dashed bg-muted/20 border-2 shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground opacity-40 mb-4" />
            <h3 className="text-lg font-semibold">No Team Exits</h3>
            <p className="text-muted-foreground mt-2 max-w-sm text-sm">
              None of your direct reports have an active exit process. Resignation requests will appear here for your approval.
            </p>
            <Link href="/cases">
              <Button variant="outline" className="mt-6">View Team Exits</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {(pendingApprovals.length > 0 || pendingClearances.length > 0) && (
        <Card className="border border-amber-200 dark:border-amber-500/30 bg-gradient-to-r from-amber-50 to-amber-50/30 dark:from-amber-500/10 dark:to-transparent shadow-sm">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-500/20 rounded-full mt-0.5 shadow-sm">
                <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-400 tracking-tight">Action Required</h3>
                <p className="text-sm text-amber-800/80 dark:text-amber-300/80 font-medium mt-1 max-w-2xl leading-relaxed">
                  {pendingApprovals.length > 0 && `${pendingApprovals.length} resignation${pendingApprovals.length > 1 ? 's' : ''} awaiting your approval. `}
                  {pendingClearances.length > 0 && `${pendingClearances.length} clearance task${pendingClearances.length > 1 ? 's' : ''} pending your completion.`}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
              {pendingApprovals.length > 0 && (
                <Link href={`/cases/${pendingApprovals[0].id}`}>
                  <Button size="sm" className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white shadow-sm font-semibold h-9 px-6 rounded-full">Review Resignation</Button>
                </Link>
              )}
              {pendingClearances.length > 0 && (
                <Link href={`/cases/${pendingClearances[0].caseId}`}>
                  <Button size="sm" variant="outline" className="w-full sm:w-auto border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-500/50 dark:text-amber-300 h-9 px-6 rounded-full font-semibold">Complete Clearance</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {teamCases.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <CardTitle className="text-lg font-bold">Exit Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: 'pending_manager', label: 'Pending Approval', cases: teamCases.filter(c => c.status === 'pending_manager'), color: 'border-amber-200 bg-amber-50/50 dark:bg-amber-500/5' },
                { key: 'in_clearance', label: 'In Clearance', cases: teamCases.filter(c => c.status === 'in_clearance'), color: 'border-blue-200 bg-blue-50/50 dark:bg-blue-500/5' },
                { key: 'completed', label: 'Completed', cases: teamCases.filter(c => c.status === 'completed'), color: 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-500/5' },
              ].map((col) => (
                <div key={col.key} className={`rounded-xl border p-4 min-h-[140px] ${col.color}`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{col.label}</p>
                    <Badge variant="secondary" className="font-mono">{col.cases.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {col.cases.slice(0, 3).map((c) => (
                      <Link key={c.id} href={`/cases/${c.id}`}>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-background/80 hover:bg-background border border-border/50 transition-colors cursor-pointer">
                          <UserAvatar name={c.employeeName} className="w-7 h-7" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{c.employeeName}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{c.id}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {col.cases.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">No cases</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="shadow-sm border-border/60 hover:border-primary/20 transition-colors">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Team Exits (Active)</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-bold tracking-tighter">{teamCases.filter(c => c.status !== 'completed' && c.status !== 'cancelled').length}</h3>
                </div>
              </div>
              <div className="w-10 h-10 rounded-md bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border/60 hover:border-primary/20 transition-colors">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Pending Approval</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-bold tracking-tighter text-amber-600 dark:text-amber-500">{pendingApprovals.length}</h3>
                </div>
              </div>
              <div className="w-10 h-10 rounded-md bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center border border-amber-100 dark:border-amber-500/20">
                <FileSignature className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border/60 hover:border-primary/20 transition-colors">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Clearance Tasks</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-bold tracking-tighter text-blue-600 dark:text-blue-500">{pendingClearances.length}</h3>
                </div>
              </div>
              <div className="w-10 h-10 rounded-md bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
                <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="shadow-sm h-full">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="text-lg font-bold">Team Exits Directory</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <CaseTable cases={teamCases} showSearch={false} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="shadow-sm h-full flex flex-col">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="text-lg font-bold flex items-center justify-between">
                My Clearance Tasks
                <Badge variant="secondary" className="font-mono">{myClearanceTasks.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y flex-1">
              {myClearanceTasks.length > 0 ? (
                myClearanceTasks.map(t => (
                  <div key={t.id} className="flex flex-col gap-3 p-5 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={t.employeeName} className="w-8 h-8" />
                        <div>
                          <p className="font-semibold text-sm leading-none">{t.employeeName}</p>
                          <p className="text-xs text-muted-foreground mt-1 font-mono">{t.caseId}</p>
                        </div>
                      </div>
                      <StatusBadge status={t.status} />
                    </div>
                    
                    <div className="flex items-center justify-end mt-2">
                      {t.status === 'approved' ? (
                        <div className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Completed
                        </div>
                      ) : (
                        <Link href={`/cases/${t.caseId}`}>
                          <Button size="sm" variant="secondary" className="h-8 text-xs font-semibold px-4 w-full">
                            Complete Task <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 flex flex-col items-center justify-center text-center text-muted-foreground h-full min-h-[300px]">
                  <ClipboardList className="w-10 h-10 mb-4 opacity-20" />
                  <p className="font-medium text-sm text-foreground">No tasks assigned</p>
                  <p className="text-xs mt-1">You have no pending manager clearances.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
