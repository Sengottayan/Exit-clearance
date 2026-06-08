import { useExitStore } from "@/store/exitStore";
import { useAuth } from "@/hooks/useAuth";
import { Redirect, Link } from "wouter";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SLARiskChip } from "@/components/shared/SLARiskChip";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { resolveTaskStatus } from "@/lib/workflow";

export default function TasksPage() {
  const { user, isDeptApprover, isAdmin } = useAuth();
  const cases = useExitStore(state => state.cases);

  if (!isDeptApprover && !isAdmin) return <Redirect to="/dashboard" />;

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

  const withResolvedStatus = myTasks.map(t => ({ ...t, displayStatus: resolveTaskStatus(t) }));

  const sortByUrgency = (tasks: typeof withResolvedStatus) =>
    [...tasks].sort((a, b) => new Date(a.slaDueAt).getTime() - new Date(b.slaDueAt).getTime());

  const pending = sortByUrgency(
    withResolvedStatus.filter(t => ['pending', 'in_progress', 'overdue'].includes(t.displayStatus) && t.caseStatus === 'in_clearance')
  );
  const inProgress = sortByUrgency(withResolvedStatus.filter(t => t.displayStatus === 'in_progress'));
  const completed = withResolvedStatus.filter(t => ['approved', 'rejected'].includes(t.displayStatus));

  const TaskCard = ({ task }: { task: any }) => {
    const checkedCount = task.checklist.filter((i: any) => i.checked).length;
    const totalCount = task.checklist.length;
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-5 flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <UserAvatar name={task.employeeName} />
              <div>
                <p className="font-medium text-sm">{task.employeeName}</p>
                <p className="text-xs text-muted-foreground">{task.employeeRole} · {task.employeeDept}</p>
              </div>
            </div>
            {!['approved', 'rejected'].includes(task.displayStatus) && (
              <SLARiskChip dueAt={task.slaDueAt} />
            )}
          </div>
          
          <div className="space-y-3 mb-6 flex-1">
            <div className="flex justify-between items-center">
              <StatusBadge status={task.displayStatus} />
              <span className="text-xs text-muted-foreground font-mono">{task.caseId}</span>
            </div>
            
            {task.caseStatus === 'pending_manager' ? (
              <div className="text-sm p-3 bg-amber-50 text-amber-800 rounded-md border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                Waiting for manager approval
              </div>
            ) : (
              <>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Checklist Progress</span>
                  <span className="font-medium">{checkedCount}/{totalCount} completed</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all" 
                    style={{ width: `${totalCount > 0 ? (checkedCount/totalCount)*100 : 0}%` }} 
                  />
                </div>
              </>
            )}
          </div>

          <Link href={`/tasks/${task.caseId}__${task.deptId}`}>
            <Button className="w-full" variant={task.displayStatus === 'approved' ? "outline" : "default"}>
              {task.displayStatus === 'approved' ? 'View Details' : 'Continue Clearance'} 
              {!['approved','rejected'].includes(task.displayStatus) && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader 
        title="My Tasks" 
        action={<div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">{pending.length} pending</div>}
      />

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({inProgress.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="m-0">
          {pending.length === 0 ? (
            <EmptyState 
              icon={ClipboardCheck} 
              title="All Caught Up" 
              description="You have no pending clearance tasks." 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pending.map(t => <TaskCard key={t.id} task={t} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="m-0">
          {inProgress.length === 0 ? (
            <EmptyState 
              icon={ClipboardCheck} 
              title="No tasks in progress" 
              description="Tasks you start working on will appear here." 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inProgress.map(t => <TaskCard key={t.id} task={t} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="m-0">
          {completed.length === 0 ? (
            <EmptyState 
              icon={ClipboardCheck} 
              title="No completed tasks" 
              description="Your completed clearance tasks will appear here." 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completed.map(t => <TaskCard key={t.id} task={t} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTasks.map(t => <TaskCard key={t.id} task={t} />)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
