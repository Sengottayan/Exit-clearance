"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCases } from "@/hooks/api/useCases";
import { useUserProfile } from "@/hooks/api/useProfile";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/wouter";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowUp, ArrowDown, ArrowRight, CheckCircle2, ClipboardCheck, Clock,
  MoreVertical, List, ChevronDown, Grid3X3, AlertCircle, Eye, Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobalLoading } from "@/components/shared/GlobalLoading";
import { PaginationFooter } from "@/components/shared/PaginationFooter";
import { TASK_METADATA } from "@/lib/constants";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { isPast, isToday, isThisWeek, parseISO, differenceInDays } from "date-fns";

import { calcPerformance } from "@/lib/workflow";
const PRIORITY_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

// ── Task-level SLA helpers ─────────────────────────────────────────────────────
function getTaskSlaInfo(task: any) {
  const isOverdue  = task.slaDueAt && isPast(parseISO(task.slaDueAt));
  const isDueToday = task.slaDueAt && isToday(parseISO(task.slaDueAt)) && !isPast(parseISO(task.slaDueAt));
  const daysLeft   = task.slaDueAt
    ? Math.ceil((new Date(task.slaDueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  if (isOverdue)  return { text: "Overdue",   cls: "text-red-500 border-red-500/20 bg-red-500/10",         dateCls: "text-red-500",    dateSub: "Overdue",      isOverdue: true,  isDueToday: false };
  if (isDueToday) return { text: "Due Today",  cls: "text-orange-500 border-orange-500/20 bg-orange-500/10", dateCls: "text-orange-500", dateSub: "Due today",    isOverdue: false, isDueToday: true  };
  return           { text: "On Track",  cls: "text-emerald-500 border-emerald-500/20 bg-emerald-500/10", dateCls: "text-muted-foreground", dateSub: daysLeft != null ? `${Math.max(0, daysLeft)} days left` : "", isOverdue: false, isDueToday: false };
}

function getProgress(task: any) {
  const total   = task.checklist?.length ?? 0;
  const checked = task.checklist?.filter((i: any) => i.checked).length ?? 0;
  return total === 0 ? 0 : Math.round((checked / total) * 100);
}

// ── Shared table row ───────────────────────────────────────────────────────────
function TaskRow({ task }: { task: any }) {
  const meta     = TASK_METADATA[task.deptId] || { title: task.deptLabel, description: "", priority: "Low" };
  const sla      = getTaskSlaInfo(task);
  const progress = getProgress(task);

  return (
    <TableRow key={`${task.caseId}-${task.id}`} className="border-b border-border/40 hover:bg-muted/5 group">
      <TableCell className="py-4">
        <div className="font-mono text-xs font-medium">{task.caseId}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">Resignation</div>
      </TableCell>
      <TableCell className="py-4">
        <div className="flex items-center gap-2.5">
          <UserAvatar name={task.employeeName} className="w-8 h-8 rounded-full bg-indigo-500 text-white text-xs" />
          <div>
            <div className="font-medium text-sm">{task.employeeName}</div>
            <div className="text-[10px] text-muted-foreground">{task.employeeRole || task.employeeDept}</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="py-4">
        <div className="flex items-start gap-2">
          <ClipboardCheck className="w-4 h-4 text-muted-foreground mt-0.5 opacity-70 shrink-0" />
          <div>
            <div className="font-medium text-sm text-foreground">{meta.title}</div>
            <div className="text-[10px] text-muted-foreground">{task.deptLabel} Clearance</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="py-4">
        <div className="flex items-center gap-1.5">
          {meta.priority === "High"   && <ArrowUp    className="w-3.5 h-3.5 text-red-500"     />}
          {meta.priority === "Medium" && <ArrowRight className="w-3.5 h-3.5 text-orange-500"  />}
          {meta.priority === "Low"    && <ArrowDown  className="w-3.5 h-3.5 text-emerald-500" />}
          <span className={`text-xs font-medium ${meta.priority === "High" ? "text-red-500" : meta.priority === "Medium" ? "text-orange-500" : "text-emerald-500"}`}>
            {meta.priority}
          </span>
        </div>
      </TableCell>
      <TableCell className="py-4">
        <div className="text-xs">
          {task.slaDueAt ? new Date(task.slaDueAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}
        </div>
        <div className={`text-[10px] ${sla.dateCls} mt-0.5 font-medium`}>{sla.dateSub}</div>
      </TableCell>
      <TableCell className="py-4">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sla.cls}`}>{sla.text}</span>
      </TableCell>
      <TableCell className="py-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${progress === 100 ? "bg-emerald-500" : sla.isOverdue ? "bg-red-500" : "bg-orange-500"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-medium w-8">{progress}%</span>
        </div>
      </TableCell>
      <TableCell className="py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem asChild>
                <Link href={`/tasks/${task.caseId}__${task.deptId}`} className="flex items-center gap-2 cursor-pointer">
                  <Eye className="w-3.5 h-3.5" />
                  View Task
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-2 text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ── Shared card (grid view) ────────────────────────────────────────────────────
function TaskCard({ task }: { task: any }) {
  const meta     = TASK_METADATA[task.deptId] || { title: task.deptLabel, description: "", priority: "Low" };
  const sla      = getTaskSlaInfo(task);
  const progress = getProgress(task);

  return (
    <Card className="bg-card border-border/40 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <CardContent className="p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <UserAvatar name={task.employeeName} className="w-8 h-8 rounded-full bg-indigo-500 text-white text-xs" />
            <div>
              <div className="font-medium text-sm leading-tight">{task.employeeName}</div>
              <div className="text-[10px] text-muted-foreground font-mono">{task.caseId}</div>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${sla.cls}`}>
            {sla.text}
          </span>
        </div>
        {/* Task info */}
        <div>
          <div className="font-medium text-sm text-foreground">{meta.title}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{task.deptLabel} Clearance</div>
        </div>
        {/* Meta row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className={sla.dateCls}>
            {task.slaDueAt ? new Date(task.slaDueAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "N/A"}
          </span>
          <div className="flex items-center gap-1">
            {meta.priority === "High"   && <ArrowUp    className="w-3 h-3 text-red-500"     />}
            {meta.priority === "Medium" && <ArrowRight className="w-3 h-3 text-orange-500"  />}
            {meta.priority === "Low"    && <ArrowDown  className="w-3 h-3 text-emerald-500" />}
            <span className={`text-[10px] font-medium ${meta.priority === "High" ? "text-red-500" : meta.priority === "Medium" ? "text-orange-500" : "text-emerald-500"}`}>
              {meta.priority}
            </span>
          </div>
        </div>
        {/* Progress */}
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>Progress</span>
            <span className="font-medium text-foreground">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? "bg-emerald-500" : sla.isOverdue ? "bg-red-500" : "bg-indigo-500"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link href={`/tasks/${task.caseId}__${task.deptId}`} className="flex-1">
            <Button size="sm" variant="outline" className="w-full h-8 text-xs rounded-md border-border/50 gap-1.5 hover:bg-muted/50">
              <Eye className="w-3.5 h-3.5" />
              View
            </Button>
          </Link>
          <Button size="sm" variant="ghost" className="h-8 px-2.5 text-xs rounded-md text-red-500 hover:bg-red-500/10 hover:text-red-500 gap-1.5">
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState({ colSpan, message = "No tasks found." }: { colSpan?: number; message?: string }) {
  if (colSpan) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="h-32 text-center text-muted-foreground text-sm">
          {message}
        </TableCell>
      </TableRow>
    );
  }
  return (
    <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
      {message}
    </div>
  );
}

// ── Table / Grid renderer ──────────────────────────────────────────────────────
function TaskListView({ tasks }: { tasks: any[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent border-b border-border/40">
          {["Exit Case", "Employee", "Department Task", "Priority", "Due Date", "SLA Status", "Progress", "Actions"].map((h) => (
            <TableHead key={h} className={`text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-10${h === "Actions" ? " text-right" : ""}`}>
              {h}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.length === 0
          ? <EmptyState colSpan={8} message="No pending tasks found." />
          : tasks.map((task) => <TaskRow key={`${task.caseId}-${task.id}`} task={task} />)}
      </TableBody>
    </Table>
  );
}

function TaskGridView({ tasks }: { tasks: any[] }) {
  if (tasks.length === 0) return <EmptyState message="No pending tasks found." />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
      {tasks.map((task) => <TaskCard key={`${task.caseId}-${task.id}`} task={task} />)}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function DeptApproverDashboard() {
  const { user } = useAuth();
  const { data: cases = [],   isLoading: casesLoading   } = useCases();
  const { data: profile,      isLoading: profileLoading } = useUserProfile();

  const [viewMode,     setViewMode]     = useState<"list" | "grid">("list");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [sortBy,       setSortBy]       = useState<"due_date" | "priority" | "progress">("due_date");

  // ── Pagination state ───────────────────────────────────────────────────────
  const [activeTab,    setActiveTab]    = useState<"all" | "overdue" | "today" | "week">("all");
  const [pageSize,     setPageSize]     = useState(10);
  const [currentPage,  setCurrentPage]  = useState(1);

  if (casesLoading || profileLoading) return <GlobalLoading />;

  // ── Department assignments from profile (production-safe, dept-based not user-based) ──
  const departmentAssignments = profile?.departmentAssignments ?? [];
  const assignedDeptIds       = departmentAssignments.map((d) => d.department);

  // ── Build task list: filter by department ownership, not by assigneeId ─────────
  // This allows Primary + Backup approver models without changing task ownership.
  const myTasks = cases.flatMap((c) => {
    const tasks = c.tasks.filter((t) => assignedDeptIds.includes(t.deptId));
    return tasks.map((task) => ({
      ...task,
      caseId:       c.id,
      caseStatus:   c.status,
      employeeName: c.employeeName,
      employeeRole: c.employeeRole,
      employeeDept: c.employeeDept,
    }));
  });

  // ── For KPI calculations, include ALL statuses (completed + active) ───────────
  const allMyTasksForKPI = cases.flatMap((c) =>
    c.tasks.filter((t) => assignedDeptIds.includes(t.deptId)).map((task) => ({
      ...task, caseId: c.id,
    })),
  );

  // ── Pending (action inbox) ─────────────────────────────────────────────────
  const pendingTasks     = myTasks.filter((t) => ["pending", "in_progress", "overdue"].includes(t.status) && t.caseStatus === "in_clearance");
  const completedTasks   = allMyTasksForKPI.filter((t) => ["approved", "rejected"].includes(t.status));
  const overdueTasks     = pendingTasks.filter((t) => t.slaDueAt && isPast(parseISO(t.slaDueAt)));
  const dueTodayTasks    = pendingTasks.filter((t) => t.slaDueAt && isToday(parseISO(t.slaDueAt)) && !isPast(parseISO(t.slaDueAt)));
  const dueThisWeekTasks = pendingTasks.filter((t) => t.slaDueAt && isThisWeek(parseISO(t.slaDueAt)));

  const perf = calcPerformance(allMyTasksForKPI);

  // ── Apply dept filter + sort ───────────────────────────────────────────────
  function applyFilterSort(tasks: any[]) {
    return [...tasks]
      .filter((t) => selectedDept === "all" || t.deptId === selectedDept)
      .sort((a, b) => {
        if (sortBy === "due_date") {
          if (!a.slaDueAt) return 1;
          if (!b.slaDueAt) return -1;
          return new Date(a.slaDueAt).getTime() - new Date(b.slaDueAt).getTime();
        }
        if (sortBy === "priority") {
          const pa = PRIORITY_ORDER[(TASK_METADATA[a.deptId]?.priority) ?? "Low"] ?? 2;
          const pb = PRIORITY_ORDER[(TASK_METADATA[b.deptId]?.priority) ?? "Low"] ?? 2;
          return pa - pb;
        }
        if (sortBy === "progress") {
          return getProgress(a) - getProgress(b);
        }
        return 0;
      });
  }

  const tabTasks = {
    all:     applyFilterSort(pendingTasks),
    overdue: applyFilterSort(overdueTasks),
    today:   applyFilterSort(dueTodayTasks),
    week:    applyFilterSort(dueThisWeekTasks),
  } as const;

  const sortLabel = sortBy === "due_date" ? "Due Date" : sortBy === "priority" ? "Priority" : "Progress";
  const deptLabel = selectedDept === "all"
    ? "All Departments"
    : (departmentAssignments.find((d) => d.department === selectedDept)?.deptLabel ?? selectedDept);

  // ── No assignments guard ───────────────────────────────────────────────────
  if (assignedDeptIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center animate-slide-up">
        <div className="w-14 h-14 rounded-full bg-muted/40 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">No Department Assignments</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            You haven&apos;t been assigned to any departments yet. Please contact your HR administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up pb-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Task Inbox</h1>
          <ClipboardCheck className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm">
          Review and complete clearance tasks assigned to your department
          {assignedDeptIds.length > 0 && (
            <span className="text-muted-foreground/60">
              {" "}({departmentAssignments.map((d) => d.deptLabel).join(", ")})
            </span>
          )}.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Action Required */}
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 border-none shadow-md overflow-hidden relative col-span-1">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <ClipboardCheck className="w-32 h-32 text-white" />
          </div>
          <CardContent className="p-5 relative z-10 h-full flex flex-col justify-between">
            <p className="text-white/80 text-xs font-bold tracking-wider uppercase mb-2">Action Required</p>
            <div className="flex items-baseline gap-2 mt-auto">
              <h3 className="text-4xl font-bold text-white">{pendingTasks.length}</h3>
              <span className="text-white/80 text-sm font-medium">pending tasks</span>
            </div>
          </CardContent>
        </Card>

        {/* Overdue SLA */}
        <Card className="bg-[#1C1C1E] border-border/20 shadow-sm relative overflow-hidden">
          <CardContent className="p-5 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Overdue SLA</p>
              <div className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <Clock className="w-3.5 h-3.5 text-red-500" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2 mb-1">
                <h3 className="text-3xl font-bold text-red-500">{overdueTasks.length}</h3>
                <span className="text-red-500/80 text-sm font-medium">tasks</span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                Requires immediate attention
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Completed Today */}
        <Card className="bg-[#1C1C1E] border-border/20 shadow-sm relative overflow-hidden">
          <CardContent className="p-5 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Completed Today</p>
              <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2 mb-1">
                <h3 className="text-3xl font-bold text-white">
                  {completedTasks.filter((t) => t.completedAt && isToday(parseISO(t.completedAt))).length}
                </h3>
                <span className="text-emerald-500/80 text-sm font-medium">tasks</span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Great job! Keep it up.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Avg SLA Compliance – dynamic KPI */}
        <Card className="bg-[#1C1C1E] border-border/20 shadow-sm relative overflow-hidden">
          <CardContent className="p-5 h-full flex flex-col justify-between">
            <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground mb-3">Avg SLA Compliance (This Month)</p>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0">
                <ProgressRing value={perf.onTime} size={64} strokeWidth={6} className="text-emerald-500" />
                <div className="absolute inset-0 flex items-center justify-center bg-[#1C1C1E]">
                  <span className="text-lg font-bold text-emerald-500">{perf.onTime}%</span>
                </div>
                <svg width="64" height="64" className="absolute top-0 left-0 -rotate-90 pointer-events-none">
                  <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/20" />
                  <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="182.2" strokeDashoffset={182.2 - 182.2 * perf.onTime / 100} className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" strokeLinecap="round" />
                  <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="182.2" strokeDashoffset={182.2 - 182.2 * perf.atRisk / 100 + 182.2 * perf.onTime / 100} className="text-orange-500" strokeLinecap="round" />
                  <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="182.2" strokeDashoffset={182.2 - 182.2 * perf.overdue / 100 + 182.2 * (perf.onTime + perf.atRisk) / 100} className="text-red-500" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                {[
                  { label: "On Time", value: perf.onTime, color: "bg-emerald-500" },
                  { label: "At Risk", value: perf.atRisk, color: "bg-orange-500" },
                  { label: "Overdue", value: perf.overdue, color: "bg-red-500" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
                      <span className="text-muted-foreground">{label}</span>
                    </div>
                    <span className="font-medium text-white">{value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Table / Grid */}
      <div className="bg-card shadow-sm border border-border/40 rounded-xl overflow-hidden">
        <Tabs
          defaultValue="all"
          className="w-full"
          onValueChange={(v) => { setActiveTab(v as typeof activeTab); setCurrentPage(1); }}
        >
          {/* Tab bar + controls */}
          <div className="border-b border-border/40 bg-muted/10 px-4 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="bg-transparent h-auto p-0 space-x-6 border-b-0 justify-start overflow-x-auto rounded-none">
              {[
                { value: "all",     label: "All Tasks",      count: tabTasks.all.length,     badgeCls: "bg-indigo-500 text-white"              },
                { value: "overdue", label: "Overdue",        count: overdueTasks.length,     badgeCls: "bg-red-500/20 text-red-500"            },
                { value: "today",   label: "Due Today",      count: dueTodayTasks.length,    badgeCls: "bg-orange-500/20 text-orange-500"      },
                { value: "week",    label: "Due This Week",  count: dueThisWeekTasks.length, badgeCls: "bg-indigo-500/20 text-indigo-400"     },
              ].map(({ value, label, count, badgeCls }) => (
                <TabsTrigger
                  key={value} value={value}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent px-1 pb-3 pt-2 font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:font-semibold text-sm whitespace-nowrap"
                >
                  {label}
                  <Badge variant="secondary" className={`ml-2 rounded-md px-1.5 py-0 h-5 border-none ${badgeCls}`}>
                    {count}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex items-center gap-3 pb-3 sm:pb-0 shrink-0">
              {/* Department filter — sourced from department_assignments, never hardcoded */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 border-border/40 bg-transparent text-xs font-normal max-w-[160px] truncate">
                    <span className="truncate">{deptLabel}</span>
                    <ChevronDown className="w-3.5 h-3.5 ml-2 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setSelectedDept("all"); setCurrentPage(1); }}>All Departments</DropdownMenuItem>
                  {departmentAssignments.map((d) => (
                    <DropdownMenuItem key={d.department} onClick={() => { setSelectedDept(d.department); setCurrentPage(1); }}>
                      {d.deptLabel}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 border-border/40 bg-transparent text-xs font-normal">
                    Sort: {sortLabel} <ChevronDown className="w-3.5 h-3.5 ml-2 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setSortBy("due_date"); setCurrentPage(1); }}>Due Date (Earliest)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy("priority"); setCurrentPage(1); }}>Priority (High → Low)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy("progress"); setCurrentPage(1); }}>Progress (Low → High)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* List / Grid toggle */}
              <div className="flex items-center gap-0.5 border border-border/40 rounded-md p-0.5">
                <Button
                  variant="ghost" size="icon"
                  className={`h-6 w-6 rounded transition-colors ${viewMode === "list" ? "bg-muted/70 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setViewMode("list")}
                  title="List view"
                >
                  <List className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  className={`h-6 w-6 rounded transition-colors ${viewMode === "grid" ? "bg-muted/70 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setViewMode("grid")}
                  title="Grid view"
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tab content — shared renderer, paginated data slice */}
          <div className="p-0">
            {(["all", "overdue", "today", "week"] as const).map((tab) => {
              const start = (currentPage - 1) * pageSize;
              const paged = tabTasks[tab].slice(start, start + pageSize);
              return (
                <TabsContent key={tab} value={tab} className="m-0 border-none">
                  {viewMode === "list"
                    ? <TaskListView tasks={paged} />
                    : <TaskGridView tasks={paged} />}
                </TabsContent>
              );
            })}
          </div>

          <PaginationFooter
            total={tabTasks[activeTab].length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            showTimezone
          />
        </Tabs>
      </div>
    </div>
  );
}
