"use client";

import { useCase, useApproveResignation, useAddComment } from "@/hooks/api/useCases";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { formatDate } from "@/lib/utils";
import { differenceInCalendarDays, formatDistanceToNow } from "date-fns";
import {
  Check, MessageSquare, ChevronRight, Clock, Loader2, CheckCircle2,
  AlertTriangle, Circle, MapPin, Mail, Building2, Briefcase,
  UserCheck, Hash, Send, Calendar, User, FileText, ArrowLeft
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EXIT_REASONS } from "@/lib/constants";
import { useParams, Link } from "@/lib/wouter";
import type { TimelineEvent } from "@/lib/types";

// ── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending_manager: { label: "Pending Approval",  cls: "border-[#fbbf24]/30 bg-[#fbbf24]/10 text-[#fbbf24]" },
  in_clearance:    { label: "In Clearance",       cls: "border-[#3b82f6]/30 bg-[#3b82f6]/10 text-[#60a5fa]" },
  completed:       { label: "Completed",          cls: "border-[#10b981]/30 bg-[#10b981]/10 text-[#34d399]" },
  cancelled:       { label: "Cancelled",          cls: "border-gray-500/30  bg-gray-500/10  text-gray-400"  },
};

// Stepper steps derived from workflow status
const STEPS = ["Employee", "Details", "Clearance", "Assets", "Review"];

function computeActiveStep(status: string, workflowStage?: number): number {
  if (workflowStage !== undefined) return workflowStage;
  if (status === "completed") return 5;
  if (status === "pending_manager") return 2;
  return 3;
}

function computeProgress(tasks: any[], status: string): number {
  if (status === "completed") return 100;
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "approved").length;
  return Math.round((done / tasks.length) * 100);
}

// ── Activity Timeline Item ───────────────────────────────────────────────────
function TimelineItem({ event }: { event: TimelineEvent }) {
  const isApproved = event.isPending === false || (event.label?.toLowerCase().includes("approved") || event.label?.toLowerCase().includes("completed"));
  const isPending  = event.isPending === true   || event.label?.toLowerCase().includes("pending");

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isApproved ? "bg-[#10b981]/15" : isPending ? "bg-[#f59e0b]/15" : "bg-[#1e2536]"}`}>
          {isApproved ? (
            <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
          ) : isPending ? (
            <Clock className="w-4 h-4 text-[#fbbf24]" />
          ) : (
            <Circle className="w-4 h-4 text-[#8e9bb0]" />
          )}
        </div>
        <div className="w-px flex-1 bg-[#1e2536] mt-2" />
      </div>
      <div className="pb-5">
        <p className="text-sm font-medium text-white">{event.label}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-[#8e9bb0]">{event.actor}</span>
          <span className="text-[10px] text-[#1e2536]">•</span>
          <span className="text-[10px] text-[#8e9bb0]">{formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function CaseDetailPage({
  caseId: propCaseId,
  onBack,
}: {
  caseId?: string;
  onBack?: () => void;
}) {
  const params = useParams();
  const id = propCaseId || params.id;
  const { user, isManager } = useAuth();

  const { data: exitCase, isLoading } = useCase(id ?? "");
  const { mutate: approveResignation, isPending: isApproving } = useApproveResignation();
  const { mutate: addComment, isPending: isAddingComment } = useAddComment();

  const [activeTab, setActiveTab] = useState("clearance");
  const [infoRequest, setInfoRequest] = useState("");
  const [showInfoForm, setShowInfoForm] = useState(false);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#0b1120]">
        <Loader2 className="w-8 h-8 text-[#3b82f6] animate-spin" />
      </div>
    );
  }

  if (!exitCase) {
    return (
      <div className="p-8 text-center text-[#8e9bb0]">
        <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-[#f87171]" />
        Case not found or you do not have access.
      </div>
    );
  }

  const tasks       = exitCase.tasks ?? [];
  const timeline    = exitCase.timeline ?? [];
  const lwd         = new Date(exitCase.lastWorkingDay);
  const noticeDays  = differenceInCalendarDays(lwd, new Date(exitCase.resignationDate));
  const exitReason  = EXIT_REASONS.find((r) => r.value === exitCase.exitReason)?.label ?? exitCase.exitReason;
  const progress    = computeProgress(tasks, exitCase.status);
  const activeStep  = computeActiveStep(exitCase.status, exitCase.workflowStage);
  const statusCfg   = STATUS_LABELS[exitCase.status] ?? STATUS_LABELS.in_clearance;

  const completedCount  = tasks.filter((t) => t.status === "approved").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const pendingCount    = tasks.filter((t) => t.status === "pending").length;
  const overdueCount    = tasks.filter((t) => {
    const due = t.slaDueAt ? new Date(t.slaDueAt) : null;
    return t.status !== "approved" && due && due < new Date();
  }).length;

  const formatPercent = (count: number, total: number): string => {
    if (total === 0) return "0%";
    const val = (count / total) * 100;
    return Number.isInteger(val) ? `${val}%` : `${val.toFixed(1)}%`;
  };

  const handleApprove = () => {
    approveResignation({ caseId: exitCase.id, actor: user?.name ?? "" }, {
      onSuccess: () => {
        toast.success("Resignation approved — clearance process started");
        setActiveTab("clearance");
      },
      onError: () => toast.error("Failed to approve. Please try again."),
    });
  };

  const handleRequestInfo = () => {
    if (!infoRequest.trim()) return;
    addComment(
      {
        caseId: exitCase.id,
        comment: {
          authorId: user.id,
          authorName: user.name,
          authorRole: user.role as any,
          message: `📋 **More Information Requested:**\n${infoRequest}`,
          visibility: "all",
        },
      },
      {
        onSuccess: () => {
          toast.success("Information request sent to employee.");
          setInfoRequest("");
          setShowInfoForm(false);
        },
        onError: () => toast.error("Failed to send request. Please try again."),
      }
    );
  };

  return (
    <div className="animate-slide-up pb-12 bg-[#0b1120] min-h-screen text-white">
      <div className="mb-6">
        {/* Back link */}
        {onBack ? (
          <button onClick={onBack} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121622]/60 hover:bg-[#1a202f] border border-[#1e2536] text-xs font-bold text-[#8e9bb0] hover:text-white transition-all shadow-sm mb-6">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Team Exits
          </button>
        ) : (
          <Link href="/cases" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121622]/60 hover:bg-[#1a202f] border border-[#1e2536] text-xs font-bold text-[#8e9bb0] hover:text-white transition-all shadow-sm mb-6">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Team Exits
          </Link>
        )}

        {/* Case Header */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#3146C4] flex items-center justify-center text-lg font-bold text-white shrink-0">
              {exitCase.employeeName.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{exitCase.employeeName}</h1>
              <p className="text-xs text-muted-foreground mt-1">
                {exitCase.id} • {exitCase.employeeDept} • {exitCase.employeeRole}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Dynamic status badge */}
            <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${statusCfg.cls}`}>
              {statusCfg.label}
            </span>
            {/* Real progress bar */}
            <div className="flex items-center gap-3">
              <span className="text-blue-400 font-bold text-sm">{progress}%</span>
              <div className="w-32 h-1.5 bg-[#1e2536] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${progress === 100 ? "bg-[#10b981]" : "bg-blue-500"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">Overall Progress</span>
            </div>
          </div>
        </div>

        {/* 5-Column Meta Info Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8 bg-[#121622]/40 border border-[#1e2536] p-4 rounded-xl">
          {[
            { icon: Calendar, label: "Last Working Day", value: formatDate(exitCase.lastWorkingDay) },
            { icon: Calendar, label: "Resignation Date", value: formatDate(exitCase.resignationDate) },
            { icon: Briefcase, label: "Exit Reason", value: exitReason },
            { icon: Clock, label: "Notice Period", value: `${noticeDays} Days` },
            { icon: User, label: "Reporting Manager", value: exitCase.managerName || "Manager" },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-center gap-3 bg-[#1e2536]/20 border border-[#1e2536]/30 p-3 rounded-lg">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-[#1e2536] bg-[#1e2536]/50 text-indigo-400">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider leading-none">{item.label}</p>
                  <p className="text-xs font-semibold text-white mt-1.5 leading-tight">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Horizontal Progress Stepper */}
        <div className="mb-8 bg-[#121622]/30 border border-[#1e2536]/80 p-5 rounded-2xl">
          <div className="flex items-center w-full">
            {STEPS.map((step, i) => {
              const stepNum = i + 1;
              const isDone = stepNum < activeStep;
              const isActive = stepNum === activeStep;

              return (
                <div key={step} className="relative flex flex-col items-center flex-1">
                  {/* Connection line to next step (behind the circles) */}
                  {i < STEPS.length - 1 && (
                    <div className="absolute top-4 left-[50%] right-[-50%] h-[2px] z-0">
                      {stepNum < activeStep - 1 ? (
                        <div className="h-full w-full bg-[#10b981]" />
                      ) : stepNum === activeStep - 1 ? (
                        <div className="h-full w-full bg-[#2563eb]" />
                      ) : (
                        <div className="h-full w-full border-t-2 border-dashed border-[#1e2536]" />
                      )}
                    </div>
                  )}

                  {/* Step circle */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white z-10 transition-all ${
                    isDone ? "bg-[#10b981] text-white" :
                    isActive ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)] border border-blue-500" :
                    "bg-[#1e2536] text-[#8e9bb0]"
                  }`}>
                    {isDone ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">{stepNum}</span>}
                  </div>

                  {/* Step labels */}
                  <div className="text-center mt-2 z-10">
                    <p className={`text-xs font-semibold ${isDone ? "text-[#10b981]" : isActive ? "text-[#60a5fa]" : "text-[#8e9bb0]"}`}>
                      {step}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
                      {isDone ? "Completed" : isActive ? "In Progress" : "Pending"}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* ── Tabs & Content ── */}
      <div className="bg-[#121622]/40 border border-[#1e2536] rounded-2xl overflow-hidden shadow-xl">
          <div className="flex gap-8 border-b border-[#1e2536] px-6">
            {["clearance", "activity", "documents"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 text-sm font-semibold transition-all border-b-2 capitalize relative ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-muted-foreground hover:text-white"
                }`}
              >
                {tab === "clearance" ? "Clearance" : tab === "activity" ? "Approvals & Activity" : "Documents"}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "clearance" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-semibold text-white">Department Clearances</h3>
                  <div className="flex gap-2">
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">
                      <CheckCircle2 className="w-3 h-3" /> {completedCount} Approved
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-orange-400 bg-orange-400/10 px-2 py-1 rounded border border-orange-400/20">
                      <Clock className="w-3 h-3" /> {pendingCount + inProgressCount} Pending
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#1e2536] overflow-hidden bg-[#0f111a]/50">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#1e2536] bg-[#1a202f]/80">
                        <th className="px-5 py-4 text-left text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Department</th>
                        <th className="px-5 py-4 text-left text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Assignee</th>
                        <th className="px-5 py-4 text-left text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Due Date</th>
                        <th className="px-5 py-4 text-left text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Status</th>
                        <th className="px-5 py-4 text-left text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Internal Notes</th>
                        <th className="px-5 py-4 text-right text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2536]">
                      {tasks.map((t) => {
                        const isOverdue = t.slaDueAt && new Date(t.slaDueAt) < new Date() && t.status !== "approved";
                        const statusCls = {
                          approved:    "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
                          completed:   "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
                          pending:     "text-orange-400 bg-orange-400/10 border-orange-400/20",
                          in_progress: "text-blue-400 bg-blue-400/10 border-blue-400/20",
                          rejected:    "text-red-400 bg-red-400/10 border-red-400/20",
                          overdue:     "text-red-400 bg-red-400/10 border-red-400/20",
                        }[isOverdue ? 'overdue' : t.status] ?? "text-muted-foreground bg-[#1e2536] border-transparent";
                        
                        return (
                          <tr key={t.id} className="hover:bg-[#1a202f]/60 transition-colors group">
                            <td className="px-5 py-4">
                              <div className="font-semibold text-white">{t.deptLabel}</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">{t.checklist?.length || 0} checks required</div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <UserAvatar name={t.assigneeName} className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-300 text-[10px]" />
                                <span className="text-muted-foreground">{t.assigneeName}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="text-muted-foreground">{t.slaDueAt ? formatDate(t.slaDueAt) : "—"}</div>
                              {isOverdue && <div className="text-[9px] text-red-400 font-medium mt-0.5">Overdue</div>}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`px-2.5 py-1 rounded text-[10px] font-bold border capitalize ${statusCls}`}>
                                {isOverdue ? 'Overdue' : t.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              {t.notes ? (
                                <p className="text-[10px] text-muted-foreground max-w-[200px] truncate" title={t.notes}>{t.notes}</p>
                              ) : (
                                <span className="text-[10px] text-[#8e9bb0]/50 italic">No notes</span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <Link href={`/tasks/${exitCase.id}__${t.deptId}`} className="inline-flex items-center justify-center px-3 py-1.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors text-xs font-semibold opacity-0 group-hover:opacity-100">
                                View Task
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                      {tasks.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground italic">
                            No clearance tasks generated yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

        {/* ── Approvals & Activity Tab ── */}
        {activeTab === "activity" && (
          <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h3 className="text-sm font-semibold text-white mb-4">Activity Timeline</h3>
                <div className="bg-[#0f111a]/50 rounded-xl border border-[#1e2536] p-6">
                  {timeline.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-8 h-8 text-[#8e9bb0] mx-auto mb-2" />
                      <p className="text-[#8e9bb0] text-sm">No activity recorded yet.</p>
                    </div>
                  ) : (
                    <div>
                      {[...timeline]
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((event) => (
                          <TimelineItem key={event.id} event={event} />
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4">Clearance Summary</h3>
                  <div className="bg-[#0f111a]/50 rounded-xl border border-[#1e2536] p-5 space-y-3">
                    {[
                      { label: "Total Departments",   value: tasks.length },
                      { label: "Approved",             value: tasks.filter((t) => (t.status as string) === "approved" || (t.status as string) === "completed").length, color: "text-[#34d399]" },
                      { label: "Pending",              value: tasks.filter((t) => (t.status as string) === "pending" || (t.status as string) === "in_progress").length, color: "text-[#fbbf24]" },
                      { label: "Overdue",              value: tasks.filter((t) => { const due = t.slaDueAt ? new Date(t.slaDueAt) : null; return (t.status as string) !== "approved" && (t.status as string) !== "completed" && due && due < new Date(); }).length, color: "text-[#f87171]" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex justify-between items-center text-xs">
                        <span className="text-[#8e9bb0]">{label}</span>
                        <span className={`font-bold ${color ?? "text-white"}`}>{value}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-[#1e2536]">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-[#8e9bb0]">Overall Progress</span>
                        <span className="font-bold text-white">{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-[#1e2536] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${progress === 100 ? "bg-[#10b981]" : "bg-[#3b82f6]"}`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white mb-4">Case Actions</h3>
                  <div className="bg-[#0f111a]/50 rounded-xl border border-[#1e2536] p-5">
                    <p className="text-muted-foreground text-[11px] mb-4 leading-relaxed">
                      {exitCase.status === "pending_manager"
                        ? "Review the resignation details and approve to begin clearance across all departments."
                        : "Monitor clearance progress and request additional information if needed."}
                    </p>

                    <div className="space-y-3">
                      {exitCase.status === "pending_manager" && isManager && (
                        <button
                          onClick={handleApprove}
                          disabled={isApproving}
                          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-lg shadow-blue-500/20"
                        >
                          {isApproving ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Approving…</>
                          ) : (
                            <><Check className="w-4 h-4" /> Review & Approve</>
                          )}
                        </button>
                      )}

                      {!showInfoForm ? (
                        <button
                          onClick={() => setShowInfoForm(true)}
                          className="w-full py-2.5 rounded-lg bg-[#3146C4] hover:bg-[#2539a8] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/10"
                        >
                          <MessageSquare className="w-4 h-4" /> Request Info
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <textarea
                            rows={3}
                            value={infoRequest}
                            onChange={(e) => setInfoRequest(e.target.value)}
                            placeholder="Describe what information you need…"
                            className="w-full bg-[#0b1120] border border-[#1e2536] text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-[#3b82f6] placeholder-muted-foreground resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleRequestInfo}
                              disabled={isAddingComment || !infoRequest.trim()}
                              className="flex-1 py-2 rounded-lg bg-[#f59e0b] hover:bg-[#d97706] text-white text-[10px] font-semibold transition-colors disabled:opacity-60"
                            >
                              {isAddingComment ? "Sending…" : "Send"}
                            </button>
                            <button
                              onClick={() => { setShowInfoForm(false); setInfoRequest(""); }}
                              className="px-3 py-2 rounded-lg border border-[#1e2536] text-muted-foreground hover:text-white text-[10px] transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => toast.info("Reminder notification sent to assignee")}
                        className="w-full py-2.5 rounded-lg border border-[#1e2536] bg-transparent hover:bg-[#1e2536] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-gray-400" /> Send Reminder
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Documents Tab ── */}
        {activeTab === "documents" && (
          <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-sm font-semibold text-white mb-4">Case Documents</h3>
            <div className="bg-[#0f111a]/50 rounded-xl border border-[#1e2536] p-8 text-center">
              <FileText className="w-12 h-12 text-[#1e2536] mx-auto mb-3" />
              <p className="text-muted-foreground text-sm font-medium">No documents uploaded</p>
              <p className="text-xs text-[#8e9bb0] mt-1">Exit interview and other related files will appear here.</p>
            </div>
          </div>
        )}
        </div>
        </div>
      </div>
    </div>
  );
}
