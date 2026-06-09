"use client";

import { useAuth } from "@/hooks/useAuth";
import { useCases } from "@/hooks/api/useCases";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SLARiskChip } from "@/components/shared/SLARiskChip";
import { CaseTimeline } from "@/components/cases/CaseTimeline";
import { formatDate, cn } from "@/lib/utils";
import { differenceInCalendarDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  FileText, CheckCircle2, Circle, AlertCircle, Clock, Lock, ShieldCheck,
  ExternalLink, FileSignature, Mail, Phone, Slack, Layers,
  CalendarClock, TrendingDown, Info, ChevronRight, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/wouter";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { resolveTaskStatus } from "@/lib/workflow";
import { getActiveEmployeeCase, getLatestEmployeeCase } from "@/lib/employee-case";
import { useState } from "react";

// ── Leave-Offset Calculator ──────────────────────────────────────────────────
const LEAVE_TYPES = [
  { key: "casual", label: "Casual Leave", balance: 5 },
  { key: "paid", label: "Paid Leave", balance: 12 },
  { key: "sick", label: "Sick Leave", balance: 3 },
] as const;

function LeaveOffsetCalculator({ lwdDate }: { lwdDate: Date }) {
  const [selectedLeaves, setSelectedLeaves] = useState<Record<string, number>>({});

  const totalOffset = Object.values(selectedLeaves).reduce((a, b) => a + b, 0);
  const adjustedLWD = new Date(lwdDate);
  adjustedLWD.setDate(adjustedLWD.getDate() - totalOffset);
  const today = new Date();
  const originalDaysLeft = differenceInCalendarDays(lwdDate, today);
  const adjustedDaysLeft = differenceInCalendarDays(adjustedLWD, today);

  const toggle = (key: string, value: number) => {
    setSelectedLeaves(prev => {
      if (prev[key] !== undefined) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  };

  return (
    <Card className="shadow-premium border-border/50 bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-amber-500/5 to-orange-400/5 border-b border-amber-200/20 dark:border-amber-500/10 pb-4 px-6 pt-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-200/30 dark:border-amber-500/20">
            <CalendarClock className="w-3.5 h-3.5" />
          </div>
          <div>
            <CardTitle className="text-sm font-extrabold tracking-tight">Leave-Offset Calculator</CardTitle>
            <CardDescription className="text-[10px] font-semibold mt-0.5">
              Apply remaining leaves to reduce your notice period
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {LEAVE_TYPES.map((lt) => {
            const isSelected = selectedLeaves[lt.key] !== undefined;
            return (
              <button
                key={lt.key}
                onClick={() => toggle(lt.key, lt.balance)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all duration-200 group",
                  isSelected
                    ? "border-amber-400/50 bg-amber-50 dark:bg-amber-500/10 shadow-sm"
                    : "border-border/60 hover:border-amber-300/50 hover:bg-amber-50/50 dark:hover:bg-amber-500/5"
                )}
              >
                <p className={cn("text-[9px] font-bold uppercase tracking-widest mb-1", isSelected ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>{lt.label}</p>
                <p className={cn("text-lg font-extrabold tracking-tight", isSelected ? "text-amber-700 dark:text-amber-300" : "text-foreground")}>{lt.balance}</p>
                <p className={cn("text-[9px] font-semibold mt-0.5", isSelected ? "text-amber-600/70" : "text-muted-foreground/60")}>days balance</p>
              </button>
            );
          })}
        </div>

        {totalOffset > 0 ? (
          <div className="rounded-xl border border-emerald-200/50 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/5 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-semibold">Original LWD</span>
              <span className="font-bold text-foreground line-through text-muted-foreground/60">{formatDate(lwdDate.toISOString())}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5" />
                Adjusted LWD
              </span>
              <span className="font-extrabold text-emerald-700 dark:text-emerald-400">{formatDate(adjustedLWD.toISOString())}</span>
            </div>
            <div className="h-px bg-emerald-200/40 dark:bg-emerald-500/15" />
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
              🎉 You can exit <strong>{totalOffset} days earlier</strong> ({adjustedDaysLeft > 0 ? `${adjustedDaysLeft} days remaining` : "date passed"})
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/40 bg-muted/20 p-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-muted-foreground/60 shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed">
              Select leave types above to calculate how your remaining leave balance can offset your last working day. Contact HR to apply.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Assignee Directory with contact shortcuts ────────────────────────────────
const DEPT_CONTACTS = [
  { dept: "manager", email: "rahul.mehta@company.com", slack: "@rahul.mehta", phone: "+91 99001 00200" },
  { dept: "it", email: "kiran.patel@company.com", slack: "@kiran.it", phone: "+91 99001 00201" },
  { dept: "finance", email: "sunita.rao@company.com", slack: "@sunita.finance", phone: "+91 99001 00202" },
  { dept: "hr", email: "anita.desai@company.com", slack: "@anita.hr", phone: "+91 99001 00203" },
  { dept: "infosec", email: "infosec@company.com", slack: "@infosec-team", phone: "+91 99001 00204" },
  { dept: "admin", email: "admin.dept@company.com", slack: "@admin", phone: "+91 99001 00205" },
];

// ── Relieving Document Pipeline ──────────────────────────────────────────────
const DOC_PIPELINE_STEPS = [
  { id: "nda", label: "NDA Sign-off", icon: FileText, desc: "Data confidentiality agreement" },
  { id: "relieving", label: "Relieving Letter", icon: FileSignature, desc: "Official departure confirmation" },
  { id: "experience", label: "Experience Certificate", icon: ShieldCheck, desc: "Service record document" },
  { id: "fnf", label: "Full & Final Settlement", icon: CheckCircle2, desc: "Payroll & dues cleared" },
];

export function EmployeeDashboard() {
  const { user } = useAuth();
  const { data: cases = [] } = useCases();
  const activeCase = getActiveEmployeeCase(cases, user);
  const latestCase = getLatestEmployeeCase(cases, user);
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

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

  // Map tasks to their contact info
  const tasksWithContacts = myCase.tasks.map(task => ({
    ...task,
    contact: DEPT_CONTACTS.find(c => c.dept === task.deptId),
  }));

  // Determine doc pipeline status
  const isCompleted = myCase.status === 'completed';
  const allClearancesApproved = myCase.tasks.every(t => resolveTaskStatus(t) === 'approved');
  const docPipelineStatus = (step: typeof DOC_PIPELINE_STEPS[number], idx: number) => {
    if (!isCompleted && idx > 0) return 'locked';
    if (isCompleted) return 'complete';
    if (allClearancesApproved && idx === 0) return 'active';
    return 'locked';
  };

  const getDeptIcon = (status: string) => {
    switch (status) {
      case 'approved': return <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/10"><CheckCircle2 className="w-4 h-4" /></div>;
      case 'rejected': return <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center shrink-0 border border-red-500/10 animate-pulse"><AlertCircle className="w-4 h-4" /></div>;
      case 'in_progress': return <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 border border-blue-500/10"><Clock className="w-4 h-4" /></div>;
      case 'overdue': return <div className="w-8 h-8 rounded-lg bg-red-500/15 text-red-600 border border-red-500/25 flex items-center justify-center shrink-0 animate-pulse"><AlertCircle className="w-4 h-4" /></div>;
      default: return <div className="w-8 h-8 rounded-lg bg-secondary/80 text-muted-foreground/60 flex items-center justify-center shrink-0"><Circle className="w-4 h-4 opacity-55" /></div>;
    }
  };

  return (
    <div className="space-y-8 animate-slide-up pb-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-3xl font-extrabold tracking-tight">Good morning, {firstName}</h1>
            <Badge variant="outline" className="font-mono text-[10px] bg-primary/5 text-primary border-primary/20 hidden sm:flex">
              {myCase.id}
            </Badge>
          </div>
          <p className="text-muted-foreground font-semibold mt-0.5 text-xs uppercase tracking-wider">{user?.dept} Department</p>
        </div>
        <Link href={`/cases/${myCase.id}`}>
          <Button variant="outline" size="sm" className="font-bold text-xs rounded-xl shadow-sm transition-all duration-300 gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            View Full Case Details
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* ── Status Hero Card ── */}
          <Card className="overflow-hidden shadow-premium border-border/50 bg-card/50 backdrop-blur-sm rounded-2xl">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-indigo-500 to-violet-500" />
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-border/40 pb-8">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <StatusBadge status={myCase.status} />
                    {daysRemaining > 0 && daysRemaining < 7 && (
                      <Badge className="bg-red-50 text-red-700 border-red-200/50 dark:bg-red-900/20 dark:text-red-300 text-[9px] font-bold">
                        ⚡ Urgent — {daysRemaining}d left
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight">Exit Process Active</h2>
                  <p className="text-xs text-muted-foreground font-semibold mt-1">{myCase.employeeRole} · {myCase.employeeDept}</p>
                </div>

                <div className="flex items-center gap-5">
                  <ProgressRing
                    value={clearanceProgress}
                    label="Clearance"
                    sublabel={`${approvedCount}/${myCase.tasks.length}`}
                    size={96}
                    strokeWidth={7}
                  />
                  <div className="bg-secondary/45 rounded-xl p-4 border border-border/50 flex flex-col items-end min-w-[152px] shadow-sm">
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground/80 font-bold mb-1">Last Working Day</p>
                    <p className="text-xl font-extrabold text-foreground mb-2">{formatDate(myCase.lastWorkingDay)}</p>
                    {daysRemaining >= 0 && (
                      <Badge variant="secondary" className={cn("font-bold text-[9px] px-2 py-0.5 rounded-md border",
                        daysRemaining < 7 ? 'bg-red-50 text-red-700 border-red-200/50 dark:bg-red-900/20 dark:text-red-300' :
                        daysRemaining < 20 ? 'bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-900/20 dark:text-amber-300' :
                        'bg-primary/5 text-primary border-primary/20')}>
                        {daysRemaining} days remaining
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {nextPendingTask && myCase.status === 'in_clearance' && (
                <div className="mb-6 p-4 rounded-xl border border-primary/25 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-primary mb-1">Next Required Action</p>
                    <p className="text-xs font-semibold text-foreground">Waiting on <strong>{nextPendingTask.deptLabel}</strong> department clearance approval.</p>
                  </div>
                  <SLARiskChip dueAt={nextPendingTask.slaDueAt} />
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 pt-1">
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
                  <p className="text-[9px] font-extrabold tracking-widest text-muted-foreground/80 uppercase mb-1.5">Exit Reason</p>
                  <p className="font-bold text-xs text-foreground truncate">{myCase.exitReason.replace(/_/g, ' ')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Leave-Offset Notice Calculator (new feature) ── */}
          <LeaveOffsetCalculator lwdDate={lwd} />

          {/* ── Clearance Checklist with Assignee Directory ── */}
          <Card className="shadow-premium border-border/50 bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/10 border-b border-border/40 pb-4 px-6 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-extrabold tracking-tight">Clearance Checklist</CardTitle>
                  <CardDescription className="text-[10px] font-semibold mt-0.5">
                    Click a department row to see contact info &amp; reach out directly.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 border-border/60">
                  {approvedCount}/{myCase.tasks.length} done
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 bg-card/5">
              <div className="divide-y divide-border/30">
                {tasksWithContacts.map((task) => {
                  const displayStatus = resolveTaskStatus(task);
                  const isExpanded = expandedDept === task.deptId;
                  const isActionable = ['pending', 'in_progress', 'overdue'].includes(displayStatus);

                  return (
                    <div key={task.id}>
                      <button
                        className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-muted/10 transition-colors duration-200 gap-3 text-left"
                        onClick={() => setExpandedDept(isExpanded ? null : task.deptId)}
                      >
                        <div className="flex items-center gap-4">
                          {getDeptIcon(displayStatus)}
                          <div>
                            <p className="font-bold text-xs text-foreground leading-none mb-1.5">{task.deptLabel}</p>
                            <p className="text-[10px] text-muted-foreground font-semibold">
                              Assigned Owner: <span className="text-foreground/80">{task.assigneeName}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:ml-auto pl-12 sm:pl-0">
                          {isActionable && (
                            <SLARiskChip dueAt={task.slaDueAt} className="hidden sm:inline-flex" />
                          )}
                          <StatusBadge status={displayStatus} className="shadow-none rounded-md" />
                          <ChevronRight className={cn("w-3.5 h-3.5 text-muted-foreground/50 transition-transform duration-200 shrink-0", isExpanded && "rotate-90")} />
                        </div>
                      </button>

                      {/* Expandable Assignee Contact Directory */}
                      {isExpanded && task.contact && (
                        <div className="px-5 pb-4 bg-muted/5 border-t border-border/20">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-3 mb-3">Direct Contact Options</p>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={`mailto:${task.contact.email}`}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 bg-background hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group"
                            >
                              <Mail className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                              <span className="text-[11px] font-semibold text-foreground/80 group-hover:text-primary transition-colors">{task.contact.email}</span>
                            </a>
                            <button
                              onClick={() => navigator.clipboard?.writeText(task.contact!.slack)}
                              title="Copy Slack handle"
                              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 bg-background hover:border-indigo-400/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-all duration-200 group"
                            >
                              <Slack className="w-3.5 h-3.5 text-muted-foreground group-hover:text-indigo-500 transition-colors" />
                              <span className="text-[11px] font-semibold text-foreground/80 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{task.contact.slack}</span>
                            </button>
                            <a
                              href={`tel:${task.contact.phone}`}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 bg-background hover:border-emerald-400/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 transition-all duration-200 group"
                            >
                              <Phone className="w-3.5 h-3.5 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
                              <span className="text-[11px] font-semibold text-foreground/80 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{task.contact.phone}</span>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ── Relieving Document Pipeline (new feature) ── */}
          <Card className="shadow-premium border-border/50 bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-500/5 to-violet-500/5 border-b border-indigo-200/20 dark:border-indigo-500/10 pb-4 px-6 pt-5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center border border-indigo-200/30 dark:border-indigo-500/20">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-extrabold tracking-tight">Relieving Document Pipeline</CardTitle>
                  <CardDescription className="text-[10px] font-semibold mt-0.5">
                    Step-by-step sign-off pipeline — unlocks after all clearances approved
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="relative">
                {/* Connector line */}
                <div className="absolute left-[22px] top-8 bottom-8 w-px bg-border/40 hidden sm:block" />

                <div className="space-y-3">
                  {DOC_PIPELINE_STEPS.map((step, idx) => {
                    const status = docPipelineStatus(step, idx);
                    const Icon = step.icon;
                    return (
                      <div key={step.id} className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border transition-all duration-300",
                        status === 'complete' ? 'border-emerald-200/50 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/5' :
                        status === 'active' ? 'border-primary/25 bg-primary/5' :
                        'border-border/40 bg-muted/10 opacity-55'
                      )}>
                        <div className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 z-10 relative transition-all",
                          status === 'complete' ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/20' :
                          status === 'active' ? 'bg-primary border-primary text-white shadow-sm shadow-primary/20' :
                          'bg-muted border-border/50 text-muted-foreground/40'
                        )}>
                          {status === 'complete'
                            ? <CheckCircle2 className="w-4 h-4" />
                            : status === 'locked'
                            ? <Lock className="w-3.5 h-3.5" />
                            : <Icon className="w-4 h-4" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn(
                              "text-xs font-extrabold tracking-tight",
                              status === 'complete' ? 'text-emerald-700 dark:text-emerald-400' :
                              status === 'active' ? 'text-foreground' : 'text-muted-foreground/60'
                            )}>
                              {step.label}
                            </p>
                            {status === 'complete' && (
                              <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 text-[8px] font-bold">Done</Badge>
                            )}
                            {status === 'active' && (
                              <Badge className="bg-primary/10 border-primary/20 text-primary text-[8px] font-bold animate-pulse">In Progress</Badge>
                            )}
                          </div>
                          <p className={cn("text-[10px] font-semibold mt-0.5",
                            status === 'locked' ? "text-muted-foreground/40" : "text-muted-foreground/70"
                          )}>
                            {step.desc}
                          </p>
                        </div>
                        {status === 'complete' && (
                          <Button variant="secondary" size="sm" className="h-7 text-[10px] font-bold px-3 rounded-lg shrink-0">
                            Download
                          </Button>
                        )}
                        {status === 'active' && (
                          <Button size="sm" className="h-7 text-[10px] font-bold px-3 rounded-lg shrink-0 shadow-sm shadow-primary/10">
                            Sign Now
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!allClearancesApproved && !isCompleted && (
                  <div className="mt-4 rounded-xl border border-amber-200/40 dark:border-amber-500/15 bg-amber-50/40 dark:bg-amber-500/5 p-3.5 flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold leading-relaxed">
                      Complete all department clearances above to unlock the document sign-off pipeline. HR will initiate the process once all approvals are received.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── My Documents ── */}
          <Card className="shadow-premium border-border/50 bg-card/40 backdrop-blur-sm rounded-2xl">
            <CardHeader className="bg-muted/10 border-b border-border/40 pb-4 px-6 pt-6">
              <CardTitle className="text-sm font-extrabold tracking-tight">My Documents</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
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
                  <ShieldCheck className="w-4 h-4 text-muted-foreground/35 mr-2" />
                </div>

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
                  <ShieldCheck className="w-4 h-4 text-muted-foreground/35 mr-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column: Timeline ── */}
        <div className="lg:col-span-1">
          <Card className="h-full shadow-premium border-border/50 bg-card/45 backdrop-blur-sm rounded-2xl sticky top-20">
            <CardHeader className="bg-muted/10 border-b border-border/40 pb-4 px-6 pt-6">
              <CardTitle className="text-sm font-extrabold tracking-tight">Activity Timeline</CardTitle>
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
