import { useAuth } from "@/hooks/useAuth";
import { useCases } from "@/hooks/api/useCases";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/wouter";
import { SLARiskChip } from "@/components/shared/SLARiskChip";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ClearanceProgressBar } from "@/components/shared/ClearanceProgressBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, CheckCircle2, Lock, ClipboardCheck, Clock, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DeptApproverDashboard() {
  const { user } = useAuth();
  const { data: cases = [] } = useCases();
  
  const myTasks = cases.flatMap(c => {
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
    <div className="space-y-8 animate-slide-up pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Task Inbox</h1>
          <p className="text-muted-foreground mt-1 font-medium">{user?.dept} Clearance Approver</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-primary border-primary shadow-md overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <ClipboardCheck className="w-24 h-24 text-primary-foreground" />
          </div>
          <CardContent className="p-6 relative z-10">
            <p className="text-primary-foreground/80 text-sm font-semibold tracking-wide uppercase mb-2">Action Required</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-5xl font-bold text-white tracking-tighter">{pendingTasks.length}</h3>
              <span className="text-primary-foreground/80 font-medium">pending tasks</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`shadow-sm transition-colors ${overdueCount > 0 ? "border-red-200 bg-red-50/50 dark:bg-red-500/10 dark:border-red-900/50" : "border-border/60"}`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-sm font-semibold tracking-wide uppercase mb-2 ${overdueCount > 0 ? 'text-red-800/80 dark:text-red-400/80' : 'text-muted-foreground'}`}>Overdue SLA</p>
                <div className="flex items-baseline gap-2">
                  <h3 className={`text-4xl font-bold tracking-tighter ${overdueCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>{overdueCount}</h3>
                  <span className="text-muted-foreground font-medium">tasks</span>
                </div>
              </div>
              <div className={`w-10 h-10 rounded-md flex items-center justify-center ${overdueCount > 0 ? 'bg-red-100 dark:bg-red-500/20' : 'bg-muted'}`}>
                <Clock className={`w-5 h-5 ${overdueCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold tracking-wide uppercase mb-2 text-muted-foreground">Completed Today</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-bold tracking-tighter">
                    {completedTasks.filter(t => t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString()).length}
                  </h3>
                  <span className="text-muted-foreground font-medium">tasks</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-md bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card shadow-sm border rounded-xl overflow-hidden">
        <Tabs defaultValue="pending" className="w-full">
          <div className="border-b bg-muted/20 px-4 pt-4">
            <TabsList className="bg-transparent h-auto p-0 space-x-6 border-b-0 w-full justify-start overflow-x-auto rounded-none">
              <TabsTrigger 
                value="pending" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-3 pt-2 font-semibold text-muted-foreground data-[state=active]:text-foreground"
              >
                Pending Queue <Badge variant="secondary" className="ml-2 rounded-full px-2 py-0 h-5 bg-muted text-foreground">{pendingTasks.length}</Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="locked" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-3 pt-2 font-semibold text-muted-foreground data-[state=active]:text-foreground"
              >
                Upcoming (Locked) <Badge variant="secondary" className="ml-2 rounded-full px-2 py-0 h-5 bg-muted text-foreground">{lockedTasks.length}</Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-3 pt-2 font-semibold text-muted-foreground data-[state=active]:text-foreground"
              >
                Completed <Badge variant="secondary" className="ml-2 rounded-full px-2 py-0 h-5 bg-muted text-foreground">{completedTasks.length}</Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6 bg-muted/5">
            <TabsContent value="pending" className="mt-0">
              {pendingTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground bg-background rounded-lg border border-dashed">
                  <CheckCircle2 className="w-16 h-16 mb-4 text-emerald-500/30" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">Inbox Zero</h3>
                  <p className="max-w-sm text-sm">You have no pending clearance tasks in your queue. Enjoy your day!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {pendingTasks.map(task => {
                    const checkedCount = task.checklist.filter(i => i.checked).length;
                    const totalCount = task.checklist.length;
                    const progress = (checkedCount / totalCount) * 100;
                    
                    return (
                      <Card key={task.id} className="flex flex-col shadow-sm hover:shadow-md transition-shadow border-border/80 group">
                        <CardContent className="p-6 flex-1">
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                              <UserAvatar name={task.employeeName} className="w-12 h-12 border shadow-sm" />
                              <div>
                                <p className="font-bold text-base leading-none mb-1.5">{task.employeeName}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-[10px] uppercase font-mono px-1.5 py-0">{task.caseId}</Badge>
                                  <span className="text-xs text-muted-foreground font-medium">{task.employeeRole}</span>
                                </div>
                              </div>
                            </div>
                            <SLARiskChip dueAt={task.slaDueAt} className="hidden sm:flex" />
                          </div>
                          
                          <div className="space-y-3 bg-secondary/30 rounded-lg p-4 border border-border/50">
                            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                              <span>Checklist Items</span>
                              <span className="text-foreground">{checkedCount}/{totalCount} Completed</span>
                            </div>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden shadow-inner">
                              <div 
                                className="bg-primary h-full transition-all duration-500 ease-out" 
                                style={{ width: `${progress}%` }} 
                              />
                            </div>
                          </div>
                        </CardContent>
                        <div className="p-4 bg-muted/30 border-t flex justify-between items-center mt-auto rounded-b-xl">
                          <StatusBadge status={task.status} className="shadow-none bg-background" />
                          <Link href={`/tasks/${task.caseId}__${task.deptId}`}>
                            <Button size="sm" className="font-semibold shadow-sm px-6 h-9 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                              Open Task <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="locked" className="mt-0">
              <div className="bg-background rounded-lg border shadow-sm">
                <div className="border-b p-4">
                  <h3 className="font-semibold text-sm">Awaiting Manager Approval</h3>
                  <p className="text-xs text-muted-foreground mt-1">These tasks will unlock once the manager approves the resignation.</p>
                </div>
                <div className="divide-y">
                  {lockedTasks.map(task => (
                    <div key={task.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10 opacity-70">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-secondary border flex items-center justify-center shrink-0">
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{task.employeeName}</p>
                          <p className="text-xs text-muted-foreground font-medium mt-1">{task.employeeRole} · {task.employeeDept}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono text-xs">{task.caseId}</Badge>
                        <StatusBadge status="pending_manager" className="bg-background" />
                      </div>
                    </div>
                  ))}
                  {lockedTasks.length === 0 && <div className="p-12 text-center text-muted-foreground text-sm font-medium">No upcoming tasks locked in the pipeline.</div>}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="completed" className="mt-0">
              <div className="bg-background rounded-lg border shadow-sm divide-y">
                {completedTasks.map(task => (
                  <div key={task.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <UserAvatar name={task.employeeName} className="w-10 h-10" />
                      <div>
                        <p className="font-semibold text-sm">{task.employeeName}</p>
                        <p className="text-xs text-muted-foreground font-medium mt-1 font-mono">Case: {task.caseId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                         <span className="text-xs text-muted-foreground font-medium hidden sm:inline-block">Completed on {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'N/A'}</span>
                         <StatusBadge status={task.status} className="bg-background" />
                      </div>
                      <Link href={`/tasks/${task.caseId}__${task.deptId}`}>
                        <Button variant="secondary" size="sm" className="h-8 font-semibold text-xs px-4">Review</Button>
                      </Link>
                    </div>
                  </div>
                ))}
                {completedTasks.length === 0 && <div className="p-12 text-center text-muted-foreground text-sm font-medium">No completed tasks in the system.</div>}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
