import { useAuth } from "@/hooks/useAuth";
import { useExitStore } from "@/store/exitStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaseTable } from "@/components/cases/CaseTable";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { StatusBadge } from "@/components/shared/StatusBadge";

export function ManagerDashboard() {
  const { user } = useAuth();
  const cases = useExitStore(state => state.cases);
  
  const teamCases = cases.filter(c => c.managerId === user?.id);
  const pendingApprovals = teamCases.filter(c => c.status === 'pending_manager');
  const myClearanceTasks = cases.flatMap(c => c.tasks.filter(t => t.deptId === 'manager' && c.status !== 'pending_manager').map(t => ({...t, caseId: c.id, employeeName: c.employeeName})));
  const pendingClearances = myClearanceTasks.filter(t => t.status === 'pending' || t.status === 'in_progress' || t.status === 'overdue');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Manager · {user?.dept}</p>
      </div>

      {(pendingApprovals.length > 0 || pendingClearances.length > 0) && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-500/5">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-500">Action Required</p>
                <p className="text-sm text-amber-700/80 dark:text-amber-500/80">
                  {pendingApprovals.length > 0 && `${pendingApprovals.length} resignation(s) pending approval. `}
                  {pendingClearances.length > 0 && `${pendingClearances.length} clearance task(s) pending.`}
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {pendingApprovals.length > 0 && (
                <Link href={`/cases/${pendingApprovals[0].id}`}>
                  <Button size="sm" className="w-full sm:w-auto">Review Resignation</Button>
                </Link>
              )}
              {pendingClearances.length > 0 && (
                <Link href={`/cases/${pendingClearances[0].caseId}`}>
                  <Button size="sm" variant="outline" className="w-full sm:w-auto">Complete Clearance</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Team Exits (Active)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{teamCases.filter(c => c.status !== 'completed' && c.status !== 'cancelled').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending My Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingApprovals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Clearance Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingClearances.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Exits</CardTitle>
        </CardHeader>
        <CardContent>
          <CaseTable cases={teamCases} showSearch={false} />
        </CardContent>
      </Card>

      {myClearanceTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Clearance Checklist Tasks</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {myClearanceTasks.map(t => (
                <div key={t.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-sm">{t.employeeName}</p>
                    <p className="text-xs text-muted-foreground">Case {t.caseId}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={t.status} />
                    {t.status === 'approved' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Link href={`/cases/${t.caseId}`}>
                        <Button size="sm" variant="outline">Complete</Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
