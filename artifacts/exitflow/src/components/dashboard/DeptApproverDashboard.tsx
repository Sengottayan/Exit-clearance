import { useAuth } from "@/hooks/useAuth";
import { useExitStore } from "@/store/exitStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { SLARiskChip } from "@/components/shared/SLARiskChip";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ClearanceProgressBar } from "@/components/shared/ClearanceProgressBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function DeptApproverDashboard() {
  const { user } = useAuth();
  const cases = useExitStore(state => state.cases);
  
  // Find all tasks assigned to this user's department
  const myTasks = cases.flatMap(c => {
    // Only include cases that are in_clearance or completed, or pending_manager but show them locked
    const task = c.tasks.find(t => t.assigneeId === user?.id || t.deptLabel === user?.dept);
    if (!task) return [];
    return [{
      ...task,
      caseId: c.id,
      caseStatus: c.status,
      employeeName: c.employeeName,
      employeeRole: c.employeeRole,
      employeeDept: c.employeeDept,
    }];
  });

  const pendingTasks = myTasks.filter(t => ['pending', 'in_progress', 'overdue'].includes(t.status) && t.caseStatus === 'in_clearance');
  const lockedTasks = myTasks.filter(t => t.caseStatus === 'pending_manager');
  const completedTasks = myTasks.filter(t => ['approved', 'rejected'].includes(t.status));
  const overdueCount = pendingTasks.filter(t => t.status === 'overdue').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">{user?.dept} Clearance Approver</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-6">
            <p className="text-primary-foreground/80 text-sm font-medium mb-1">Action Required</p>
            <h3 className="text-3xl font-bold">{pendingTasks.length}</h3>
          </CardContent>
        </Card>
        <Card className={overdueCount > 0 ? "border-red-200 bg-red-50 dark:bg-red-500/5 dark:border-red-900/50" : ""}>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-sm font-medium mb-1">Overdue</p>
            <h3 className={`text-3xl font-bold ${overdueCount > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>{overdueCount}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-sm font-medium mb-1">Completed Today</p>
            <h3 className="text-3xl font-bold">
              {completedTasks.filter(t => t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString()).length}
            </h3>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
          <TabsTrigger value="locked">Locked ({lockedTasks.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingTasks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mb-4 opacity-20" />
                <p>No pending clearance tasks. You're all caught up!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingTasks.map(task => {
                const checkedCount = task.checklist.filter(i => i.checked).length;
                const totalCount = task.checklist.length;
                
                return (
                  <Card key={task.id} className="flex flex-col">
                    <CardContent className="p-5 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={task.employeeName} />
                          <div>
                            <p className="font-medium text-sm">{task.employeeName}</p>
                            <p className="text-xs text-muted-foreground">{task.employeeRole}</p>
                          </div>
                        </div>
                        <SLARiskChip dueAt={task.slaDueAt} />
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Checklist Progress</span>
                          <span className="font-medium">{checkedCount}/{totalCount} completed</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-full transition-all" 
                            style={{ width: `${(checkedCount/totalCount)*100}%` }} 
                          />
                        </div>
                      </div>
                    </CardContent>
                    <div className="p-4 pt-0 border-t bg-muted/20 flex justify-between items-center mt-auto">
                      <span className="text-xs text-muted-foreground font-mono">{task.caseId}</span>
                      <Link href={`/tasks/${task.caseId}__${task.deptId}`}>
                        <Button size="sm">
                          Continue <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="locked">
          <Card>
            <CardHeader>
              <CardTitle>Locked Tasks</CardTitle>
              <CardDescription>Waiting for manager approval before clearance begins</CardDescription>
            </CardHeader>
            <CardContent className="p-0 divide-y">
              {lockedTasks.map(task => (
                <div key={task.id} className="p-4 flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={task.employeeName} />
                    <div>
                      <p className="font-medium text-sm">{task.employeeName}</p>
                      <p className="text-xs text-muted-foreground">{task.employeeRole} · {task.employeeDept}</p>
                    </div>
                  </div>
                  <StatusBadge status="pending_manager" />
                </div>
              ))}
              {lockedTasks.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No locked tasks.</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardContent className="p-0 divide-y">
              {completedTasks.map(task => (
                <div key={task.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={task.employeeName} />
                    <div>
                      <p className="font-medium text-sm">{task.employeeName}</p>
                      <p className="text-xs text-muted-foreground">Case: {task.caseId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={task.status} />
                    <Link href={`/tasks/${task.caseId}__${task.deptId}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
              {completedTasks.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No completed tasks.</div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
