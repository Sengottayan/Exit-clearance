"use client";
import { useAuth } from "@/hooks/useAuth";
import { useCases } from "@/hooks/api/useCases";
import { useUserProfile } from "@/hooks/api/useProfile";
import { Redirect } from "@/lib/wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import { ArrowRight, ClipboardCheck, Clock, CheckCircle2, MoreVertical, RotateCw, Eye, Mail } from "lucide-react";
import { resolveTaskStatus } from "@/lib/workflow";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GlobalLoading } from "@/components/shared/GlobalLoading";
import { PaginationFooter } from "@/components/shared/PaginationFooter";
import { TASK_METADATA } from "@/lib/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { isPast, isToday, parseISO, differenceInDays } from "date-fns";
import { Link, useLocation } from "@/lib/wouter";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { useState } from "react";

export default function TasksPage() {
  const { user, isDeptApprover, isAdmin } = useAuth();
  const { data: cases = [], isLoading: casesLoading } = useCases();
  const { data: profile,    isLoading: profileLoading } = useUserProfile();
  const [, setLocation] = useLocation();

  // ── Pagination state ───────────────────────────────────────────────
  const [activeTabKey, setActiveTabKey] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [pageSize,     setPageSize]     = useState(10);
  const [currentPage,  setCurrentPage]  = useState(1);

  if (!isDeptApprover && !isAdmin) return <Redirect to="/dashboard" />;
  if (casesLoading || profileLoading) return <GlobalLoading />;

  // ── Department-based task query (not user-based) ───────────────────────────
  // Matches tasks by t.deptId ∈ assignedDeptIds so Primary + Backup approvers
  // see all department tasks without remapping task ownership.
  const departmentAssignments = profile?.departmentAssignments ?? [];
  const assignedDeptIds       = departmentAssignments.map(d => d.department);

  const myTasks = cases.flatMap(c => {
    // filter() — not find() — so multi-department approvers get all their tasks
    const tasks = c.tasks.filter(t => assignedDeptIds.includes(t.deptId));
    return tasks.map(task => ({
      ...task,
      caseId:       c.id,
      caseStatus:   c.status,
      employeeName: c.employeeName,
      employeeRole: c.employeeRole,
      employeeDept: c.employeeDept,
      employeeEmail: c.employeeEmail,
    }));
  });

  const withResolvedStatus = myTasks.map(t => ({ ...t, displayStatus: resolveTaskStatus(t) }));

  const pending    = withResolvedStatus.filter(t => t.displayStatus === 'pending' || t.displayStatus === 'overdue');
  const inProgress = withResolvedStatus.filter(t => t.displayStatus === 'in_progress');
  const completed  = withResolvedStatus.filter(t => ['approved', 'rejected'].includes(t.displayStatus));

  const completedToday = completed.filter(t => t.completedAt && isToday(parseISO(t.completedAt))).length;

  const { calcPerformance } = require('@/lib/workflow');
  const performance = calcPerformance(withResolvedStatus);

  // ── Tab task map (for pagination total) ───────────────────────────────────
  const tabTasksMap = {
    all:         withResolvedStatus,
    pending,
    in_progress: inProgress,
    completed,
  } as const;

  return (
    <div className="space-y-6 animate-slide-up pb-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Tasks</h1>
        <p className="text-muted-foreground text-sm">Track and manage your assigned clearance tasks.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending */}
        <Card className="bg-[#1C1C1E] border-border/20 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mb-3">
                <ClipboardCheck className="w-5 h-5 text-indigo-500" />
              </div>
              <p className="text-xs font-semibold tracking-wider text-indigo-500 mb-1">Pending</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-white">{pending.length}</h3>
                <span className="text-muted-foreground text-xs font-medium">tasks</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-indigo-500/5 rounded-full flex items-center justify-center opacity-50">
              <ClipboardCheck className="w-6 h-6 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card className="bg-[#1C1C1E] border-border/20 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 mb-3">
                <RotateCw className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-xs font-semibold tracking-wider text-orange-500 mb-1">In Progress</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-white">{inProgress.length}</h3>
                <span className="text-muted-foreground text-xs font-medium">tasks</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card className="bg-[#1C1C1E] border-border/20 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-xs font-semibold tracking-wider text-emerald-500 mb-1">Completed</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-white">{completed.length}</h3>
                <span className="text-muted-foreground text-xs font-medium">tasks</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg. Completion Time */}
        <Card className="bg-[#1C1C1E] border-border/20 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20 mb-3">
                <Clock className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-xs font-semibold tracking-wider text-purple-500 mb-1">Avg. Completion Time</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-white">{performance.avgCompletion}</h3>
              <span className="text-muted-foreground text-xs font-medium">days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Table Area */}
        <div className="xl:col-span-3 bg-card shadow-sm border border-border/40 rounded-xl overflow-hidden flex flex-col h-full">
          <Tabs
            defaultValue="all"
            className="w-full flex-1 flex flex-col"
            onValueChange={(v) => { setActiveTabKey(v as typeof activeTabKey); setCurrentPage(1); }}
          >
            <div className="border-b border-border/40 px-4 pt-3">
              <TabsList className="bg-transparent h-auto p-0 space-x-6 border-b-0 w-full justify-start overflow-x-auto rounded-none">
                {[
                  { value: 'all',         label: 'All',         count: withResolvedStatus.length },
                  { value: 'pending',     label: 'Pending',     count: pending.length            },
                  { value: 'in_progress', label: 'In Progress', count: inProgress.length         },
                  { value: 'completed',   label: 'Completed',   count: completed.length          },
                ].map(({ value, label, count }) => (
                  <TabsTrigger key={value} value={value} className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent px-2 pb-3 pt-2 font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:font-semibold text-sm whitespace-nowrap">
                    {label}
                    {count > 0 && <span className="ml-1.5 text-[10px] font-bold text-muted-foreground">({count})</span>}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1">
              {/* All tabs share the same table structure — only the data slice changes */}
              {([
                { value: 'all',         tasks: withResolvedStatus },
                { value: 'pending',     tasks: pending            },
                { value: 'in_progress', tasks: inProgress         },
                { value: 'completed',   tasks: completed          },
              ] as const).map(({ value, tasks }) => {
                const start  = (currentPage - 1) * pageSize;
                const paged  = tasks.slice(start, start + pageSize);
                return (
                <TabsContent key={value} value={value} className="m-0 h-full">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/40">
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-10">Exit Case</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-10">Employee</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-10">Task</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-10">Department</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-10">Priority</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-10">Due Date</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-10">Status</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-10">Progress</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-10">Last Updated</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-10 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map(task => {
                      const checkedCount = task.checklist.filter(i => i.checked).length;
                      const totalCount = task.checklist.length;
                      const progress = totalCount === 0 ? 0 : Math.round((checkedCount / totalCount) * 100);
                      
                      const meta = TASK_METADATA[task.deptId] || { title: task.deptLabel, description: '', priority: 'Low' };
                      const isOverdue = task.slaDueAt && isPast(parseISO(task.slaDueAt));
                      
                      let statusText = "Pending";
                      let statusClass = "text-indigo-500";
                      let progressBarClass = "bg-indigo-500";
                      let actionButton = <Button variant="outline" size="sm" className="h-7 text-[10px] px-3 border-indigo-500/50 text-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-500">Start</Button>;

                      if (task.displayStatus === 'in_progress') {
                        statusText = "In Progress";
                        statusClass = "text-orange-500";
                        progressBarClass = "bg-orange-500";
                        actionButton = <Button variant="outline" size="sm" className="h-7 text-[10px] px-3 border-indigo-500 text-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-500">Open</Button>;
                      } else if (task.displayStatus === 'approved') {
                        statusText = "Completed";
                        statusClass = "text-emerald-500";
                        progressBarClass = "bg-emerald-500";
                        actionButton = <Button variant="outline" size="sm" className="h-7 text-[10px] px-3 border-border/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground">View</Button>;
                      } else if (isOverdue) {
                        progressBarClass = "bg-red-500";
                        actionButton = <Button variant="outline" size="sm" className="h-7 text-[10px] px-3 border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-500">Open</Button>;
                      }

                      return (
                        <TableRow key={task.id} className="border-b border-border/40 hover:bg-muted/5">
                          <TableCell className="py-3">
                            <div className="font-mono text-[11px] font-medium">{task.caseId}</div>
                            <div className="text-[9px] text-muted-foreground mt-0.5">Resignation</div>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-2">
                              <UserAvatar name={task.employeeName} className="w-6 h-6 rounded-full bg-indigo-500 text-white text-[10px]" />
                              <div>
                                <div className="font-medium text-xs">{task.employeeName}</div>
                                <div className="text-[9px] text-muted-foreground">{task.employeeRole || task.employeeDept}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="font-medium text-xs text-foreground">{meta.title}</div>
                            <div className="text-[9px] text-muted-foreground truncate max-w-[120px]">{meta.description}</div>
                          </TableCell>
                          <TableCell className="py-3 text-[11px] text-muted-foreground">
                            {task.deptLabel}
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-1">
                              {meta.priority === 'High' && <ArrowRight className="w-3 h-3 text-red-500 -rotate-90" />}
                              {meta.priority === 'Medium' && <ArrowRight className="w-3 h-3 text-orange-500" />}
                              {meta.priority === 'Low' && <ArrowRight className="w-3 h-3 text-emerald-500 rotate-90" />}
                              <span className={`text-[11px] font-medium ${meta.priority === 'High' ? 'text-red-500' : meta.priority === 'Medium' ? 'text-orange-500' : 'text-emerald-500'}`}>
                                {meta.priority}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="text-[11px]">{task.slaDueAt ? new Date(task.slaDueAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</div>
                            <div className={`text-[9px] ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'} mt-0.5`}>
                              {isOverdue ? 'Overdue by 1 day' : 'Due today'}
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <span className={`text-[11px] font-medium ${statusClass}`}>
                              {statusText}
                            </span>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                                <div className={`h-full ${progressBarClass}`} style={{ width: `${progress}%` }} />
                              </div>
                              <span className="text-[10px] font-medium w-6">{progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 text-[10px] text-muted-foreground">
                            07 Jun 2026<br/>02:15 PM
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link href={`/tasks/${task.caseId}__${task.deptId}`}>
                                {actionButton}
                              </Link>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44 bg-[#11141c] border border-white/10 text-white">
                                  <DropdownMenuItem className="hover:bg-white/5 cursor-pointer text-xs" onClick={() => setLocation(`/tasks/${task.caseId}__${task.deptId}`)}>
                                    <Eye className="w-3.5 h-3.5 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="hover:bg-white/5 cursor-pointer text-xs" onClick={() => {
                                    navigator.clipboard.writeText(task.id || "");
                                    toast.success("Task ID copied to clipboard");
                                  }}>
                                    <ClipboardCheck className="w-3.5 h-3.5 mr-2" />
                                    Copy Task ID
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="hover:bg-white/5 cursor-pointer text-xs" onClick={() => {
                                    if (task.employeeEmail) {
                                      navigator.clipboard.writeText(task.employeeEmail);
                                      toast.success("Employee email copied to clipboard");
                                    } else {
                                      toast.error("Employee email not available");
                                    }
                                  }}>
                                    <Mail className="w-3.5 h-3.5 mr-2" />
                                    Copy Email
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {tasks.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                          No tasks found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
              );
              })}
            </div>
            <PaginationFooter
              total={tabTasksMap[activeTabKey].length}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
              showTimezone
            />
          </Tabs>
        </div>

        {/* Sidebar - Performance */}
        <div className="xl:col-span-1">
          <Card className="bg-[#1C1C1E] border-border/20 shadow-sm h-full">
            <CardContent className="p-5 flex flex-col h-full">
              <h3 className="text-sm font-semibold text-foreground mb-6">My Performance (This Month)</h3>
              
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <ProgressRing value={performance.onTime} size={140} strokeWidth={12} className="text-emerald-500" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1C1C1E]">
                    <span className="text-3xl font-bold text-emerald-500">{performance.onTime}%</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold mt-1 tracking-wider">On-time</span>
                  </div>
                  <svg width="140" height="140" className="absolute top-0 left-0 -rotate-90 pointer-events-none">
                    <circle cx="70" cy="70" r="64" fill="none" stroke="currentColor" strokeWidth="12" className="text-muted/20" />
                    <circle cx="70" cy="70" r="64" fill="none" stroke="currentColor" strokeWidth="12" strokeDasharray="402.1" strokeDashoffset={402.1 - (402.1 * performance.onTime / 100)} className="text-emerald-500 stroke-emerald-500 drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]" strokeLinecap="round" />
                    <circle cx="70" cy="70" r="64" fill="none" stroke="currentColor" strokeWidth="12" strokeDasharray="402.1" strokeDashoffset={402.1 - (402.1 * performance.atRisk / 100) + (402.1 * performance.onTime / 100)} className="text-orange-500" strokeLinecap="round" />
                    <circle cx="70" cy="70" r="64" fill="none" stroke="currentColor" strokeWidth="12" strokeDasharray="402.1" strokeDashoffset={402.1 - (402.1 * performance.overdue / 100) + (402.1 * (performance.onTime + performance.atRisk) / 100)} className="text-red-500" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /> <span className="text-muted-foreground font-medium">On Time</span></div>
                  <span className="font-semibold text-white">{performance.onTime}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500" /> <span className="text-muted-foreground font-medium">At Risk</span></div>
                  <span className="font-semibold text-white">{performance.atRisk}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" /> <span className="text-muted-foreground font-medium">Overdue</span></div>
                  <span className="font-semibold text-white">{performance.overdue}%</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-8 bg-black/20 p-3 rounded-lg border border-border/20">
                <div className="flex flex-col border-r border-border/20 pr-2">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Completed</span>
                  <span className="text-lg font-bold text-white">{performance.completedCount}</span>
                </div>
                <div className="flex flex-col border-r border-border/20 px-2">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Overdue</span>
                  <span className="text-lg font-bold text-red-500">{performance.overdueCount}</span>
                </div>
                <div className="flex flex-col pl-2">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Avg. SLA</span>
                  <span className="text-lg font-bold text-white">{performance.avgSla}%</span>
                </div>
              </div>

              <Link href="/reports" className="w-full mt-auto">
                <Button variant="ghost" className="w-full text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 text-xs font-semibold">
                  View Performance Report <ArrowRight className="w-3.5 h-3.5 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
