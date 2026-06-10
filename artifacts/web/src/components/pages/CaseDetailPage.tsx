"use client";

import { useCase, useApproveResignation, useAddComment } from "@/hooks/api/useCases";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { formatDate } from "@/lib/utils";
import { differenceInCalendarDays, formatDistanceToNow } from "date-fns";
import { Check, MessageSquare, ChevronRight, Clock, Loader2, CheckCircle2, AlertTriangle, Circle } from "lucide-react";
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

function computeActiveStep(status: string, tasks: any[]): number {
  if (status === "completed") return 5;
  if (status === "pending_manager") return 1;
  // In clearance — calculate from task completion
  if (tasks.length === 0) return 2;
  const completedCount = tasks.filter((t) => t.status === "approved" || t.status === "completed").length;
  const ratio = completedCount / tasks.length;
  if (ratio >= 0.75) return 4;
  if (ratio >= 0.5)  return 3;
  return 2;
}

function computeProgress(tasks: any[], status: string): number {
  if (status === "completed") return 100;
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "approved" || t.status === "completed").length;
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

  const [activeTab, setActiveTab] = useState("overview");
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
  const activeStep  = computeActiveStep(exitCase.status, tasks);
  const statusCfg   = STATUS_LABELS[exitCase.status] ?? STATUS_LABELS.in_clearance;

  const handleApprove = () => {
    approveResignation({ caseId: exitCase.id, actor: user?.name ?? "" }, {
      onSuccess: () => toast.success("Resignation approved — clearance process started"),
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
          <button onClick={onBack} className="text-sm font-semibold text-[#8e9bb0] hover:text-white mb-6 flex items-center gap-1 transition-colors">
            ← Back to Team Exits
          </button>
        ) : (
          <Link href="/cases" className="text-sm font-semibold text-[#8e9bb0] hover:text-white mb-6 inline-flex items-center gap-1 transition-colors">
            ← Back to Team Exits
          </Link>
        )}

        {/* Case Header */}
        <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6] flex items-center justify-center text-lg font-bold text-white shrink-0">
              {exitCase.employeeName.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{exitCase.employeeName}</h1>
              <p className="text-sm text-[#8e9bb0] mt-1">
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
            <div className="flex items-center gap-2">
              <span className="text-[#3b82f6] font-bold text-sm">{progress}%</span>
              <div className="w-32 h-1.5 bg-[#1e2536] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${progress === 100 ? "bg-[#10b981]" : "bg-[#3b82f6]"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-[#8e9bb0]">Overall Progress</span>
            </div>
          </div>
        </div>

        {/* 4-Column Meta */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 bg-[#121622] rounded-xl border border-[#1e2536] p-5">
          <div>
            <p className="text-[10px] text-[#8e9bb0] uppercase tracking-wider mb-1">Last Working Day</p>
            <p className="text-sm font-semibold">{formatDate(exitCase.lastWorkingDay)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#8e9bb0] uppercase tracking-wider mb-1">Resignation Date</p>
            <p className="text-sm font-semibold">{formatDate(exitCase.resignationDate)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#8e9bb0] uppercase tracking-wider mb-1">Exit Reason</p>
            <p className="text-sm font-semibold">{exitReason}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#8e9bb0] uppercase tracking-wider mb-1">Notice Period</p>
            <p className="text-sm font-semibold">{noticeDays} Days</p>
          </div>
        </div>

        {/* Horizontal Stepper driven by actual progress */}
        <div className="flex items-center justify-between mb-10 relative px-4">
          <div className="absolute top-3 left-8 right-8 h-[2px] bg-[#1e2536]" />
          <div
            className="absolute top-3 left-8 h-[2px] bg-[#3b82f6] transition-all duration-700"
            style={{ width: `${((activeStep - 1) / (STEPS.length - 1)) * 100}%` }}
          />

          {STEPS.map((step, i) => {
            const stepNum = i + 1;
            const isDone    = stepNum < activeStep;
            const isActive  = stepNum === activeStep;
            return (
              <div key={step} className="flex flex-col items-center gap-2 relative z-10 bg-[#0b1120] px-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white transition-all ${
                  isDone   ? "bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.4)]" :
                  isActive ? "bg-[#3b82f6] shadow-[0_0_12px_rgba(59,130,246,0.5)]" :
                             "bg-[#1e2536]"
                }`}>
                  {isDone ? <Check className="w-3.5 h-3.5" /> : <span className="text-xs font-bold">{stepNum}</span>}
                </div>
                <span className={`text-xs font-medium ${isDone ? "text-[#10b981]" : isActive ? "text-[#3b82f6]" : "text-[#8e9bb0]"}`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-[#1e2536] mb-6">
          {["overview", "activity"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 capitalize ${
                activeTab === tab ? "border-[#3b82f6] text-[#3b82f6]" : "border-transparent text-[#8e9bb0] hover:text-white"
              }`}
            >
              {tab === "overview" ? "Case Overview" : "Approvals & Activity"}
            </button>
          ))}
        </div>

        {/* ── Case Overview Tab ── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Employee details */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold text-white mb-4">Exit Details</h3>
              <div className="bg-[#121622] rounded-xl border border-[#1e2536] p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                {[
                  { label: "Employee ID",        value: exitCase.employeeId   },
                  { label: "Department",         value: exitCase.employeeDept },
                  { label: "Email",              value: exitCase.employeeEmail },
                  { label: "Role",               value: exitCase.employeeRole  },
                  { label: "Reporting Manager",  value: exitCase.managerName   },
                  { label: "Case Created",       value: formatDate(exitCase.resignationDate) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-[#8e9bb0] mb-1">{label}</p>
                    <p className="text-sm font-medium text-white">{value || "—"}</p>
                  </div>
                ))}
              </div>

              {/* Clearance Tasks summary */}
              {tasks.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-white mb-4">Clearance Status</h3>
                  <div className="bg-[#121622] rounded-xl border border-[#1e2536] overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#1e2536] bg-[#0f111a]/50">
                          <th className="px-4 py-3 text-left text-[#8e9bb0] font-semibold">Department</th>
                          <th className="px-4 py-3 text-left text-[#8e9bb0] font-semibold">Assignee</th>
                          <th className="px-4 py-3 text-left text-[#8e9bb0] font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e2536]">
                        {tasks.map((t) => {
                          const statusCls = {
                            approved:    "text-[#34d399] bg-[#10b981]/10",
                            completed:   "text-[#34d399] bg-[#10b981]/10",
                            pending:     "text-[#fbbf24] bg-[#f59e0b]/10",
                            in_progress: "text-[#60a5fa] bg-[#3b82f6]/10",
                            rejected:    "text-[#f87171] bg-[#ef4444]/10",
                            overdue:     "text-[#f87171] bg-[#ef4444]/10",
                          }[t.status] ?? "text-[#8e9bb0] bg-[#1e2536]";
                          return (
                            <tr key={t.id} className="hover:bg-[#1a202f]">
                              <td className="px-4 py-3 text-white font-medium">{t.deptLabel}</td>
                              <td className="px-4 py-3 text-[#8e9bb0]">{t.assigneeName}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${statusCls}`}>
                                  {t.status.replace("_", " ")}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Action Card */}
            {(exitCase.status === "pending_manager" || exitCase.status === "in_clearance") && isManager && (
              <div className="lg:col-span-1">
                <h3 className="text-sm font-semibold text-white mb-4">
                  {exitCase.status === "pending_manager" ? "Pending Manager Approval" : "Case Actions"}
                </h3>
                <div className="bg-[#121622] rounded-xl border border-[#1e2536] p-6">
                  <p className="text-[#8e9bb0] text-xs mb-6 leading-relaxed">
                    {exitCase.status === "pending_manager"
                      ? "Review the resignation details and approve to begin clearance across all departments."
                      : "Monitor clearance progress and request additional information if needed."}
                  </p>

                  <div className="space-y-3">
                    {exitCase.status === "pending_manager" && (
                      <button
                        onClick={handleApprove}
                        disabled={isApproving}
                        className="w-full py-2.5 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
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
                        className="w-full py-2.5 rounded-lg border border-[#1e2536] bg-transparent hover:bg-[#1e2536] text-[#8e9bb0] hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" /> Request More Information
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          rows={3}
                          value={infoRequest}
                          onChange={(e) => setInfoRequest(e.target.value)}
                          placeholder="Describe what information you need…"
                          className="w-full bg-[#0b1120] border border-[#1e2536] text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-[#3b82f6] placeholder-[#8e9bb0] resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleRequestInfo}
                            disabled={isAddingComment || !infoRequest.trim()}
                            className="flex-1 py-2 rounded-lg bg-[#f59e0b] hover:bg-[#d97706] text-white text-xs font-semibold transition-colors disabled:opacity-60"
                          >
                            {isAddingComment ? "Sending…" : "Send Request"}
                          </button>
                          <button
                            onClick={() => { setShowInfoForm(false); setInfoRequest(""); }}
                            className="px-3 py-2 rounded-lg border border-[#1e2536] text-[#8e9bb0] hover:text-white text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Approvals & Activity Tab ── */}
        {activeTab === "activity" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold text-white mb-4">Activity Timeline</h3>
              <div className="bg-[#121622] rounded-xl border border-[#1e2536] p-6">
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

            <div className="lg:col-span-1">
              <h3 className="text-sm font-semibold text-white mb-4">Clearance Summary</h3>
              <div className="bg-[#121622] rounded-xl border border-[#1e2536] p-5 space-y-3">
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
          </div>
        )}
      </div>
    </div>
  );
}
