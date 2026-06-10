"use client";
import {
  useTask, useApproveTask, useRejectTask,
  useSaveTaskDraft, useCheckItem, useSetItemInput,
} from "@/hooks/api/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { Redirect, Link, useParams, useLocation } from "@/lib/wouter";
import { sendReminderEmail } from "@/lib/email";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { resolveTaskStatus } from "@/lib/workflow";
import { TASK_METADATA, EXIT_REASONS } from "@/lib/constants";
import {
  ChevronRight, Calendar, User, Clock, AlertCircle,
  CheckCircle2, Circle, MoreHorizontal, FileText, Check, MessageSquare,
  Eye, Briefcase, User2, Loader2, Send
} from "lucide-react";
import { isPast, parseISO, formatDistanceToNowStrict, format, differenceInCalendarDays } from "date-fns";

const STEPS = ["Employee", "Details", "Clearance", "Assets", "Review"];

function computeActiveStep(status: string, workflowStage?: number): number {
  if (workflowStage !== undefined) return workflowStage;
  if (status === "completed") return 5;
  if (status === "pending_manager") return 2;
  return 3;
}

export default function TaskDetailPage() {
  const { taskId } = useParams();
  const { isDeptApprover, isAdmin, user } = useAuth();
  const [, setLocation] = useLocation();

  const [activeTab, setActiveTab] = useState("clearance");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  const { data: resolvedTask, isLoading } = useTask(taskId ?? "");
  const { mutate: checkItem } = useCheckItem();
  const { mutate: setItemInput } = useSetItemInput();
  const { mutate: approveTask, isPending: isApproving } = useApproveTask();
  const { mutate: rejectTask } = useRejectTask();

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b1120]">
        <Loader2 className="w-8 h-8 text-[#3b82f6] animate-spin" />
      </div>
    );
  }

  if (!isDeptApprover && !isAdmin) return <Redirect to="/dashboard" />;
  if (!taskId) return <Redirect to="/tasks" />;

  const [caseId, deptId] = taskId.split("__");
  const exitCase = resolvedTask?.case;
  const task = resolvedTask;

  if (!exitCase || !task) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 bg-[#0b1120]">
        <AlertCircle className="w-10 h-10 text-muted-foreground" />
        <p className="text-muted-foreground">Task not found.</p>
      </div>
    );
  }

  const meta = TASK_METADATA[deptId] || { title: task.deptLabel, description: "", priority: "Medium" as const };
  const isLocked = exitCase.status === "pending_manager" && deptId !== "manager";
  const displayStatus = resolveTaskStatus(task);
  const isCompleted = displayStatus === "approved" || displayStatus === "rejected";
  const canEdit = !isLocked && !isCompleted;

  const checklist = task.checklist ?? [];
  const checkedCount = checklist.filter((i) => i.checked).length;
  const totalCount = checklist.length;
  const inProgressCount = checklist.some(i => i.checked) && checkedCount < totalCount ? totalCount - checkedCount : 0;
  const pendingCount = checkedCount === 0 ? totalCount : 0;
  const pct = totalCount === 0 ? 0 : Math.round((checkedCount / totalCount) * 100);
  const allMandatoryChecked = checklist.every((i) => !i.isMandatory || i.checked);

  const slaDueLabel = task.slaDueAt ? format(parseISO(task.slaDueAt), "dd MMM yyyy") : "N/A";
  const slaOverdue = task.slaDueAt && isPast(parseISO(task.slaDueAt));
  
  const lwd = new Date(exitCase.lastWorkingDay);
  const noticeDays = differenceInCalendarDays(lwd, new Date(exitCase.resignationDate));
  const exitReason = EXIT_REASONS.find((r) => r.value === exitCase.exitReason)?.label ?? exitCase.exitReason;
  const lwdFormatted = exitCase.lastWorkingDay ? format(parseISO(exitCase.lastWorkingDay), "dd MMM yyyy") : "N/A";
  
  const lwdDaysLeft = exitCase.lastWorkingDay ? Math.max(0, Math.ceil((parseISO(exitCase.lastWorkingDay).getTime() - Date.now()) / 86400000)) : null;

  const activeStep = computeActiveStep(exitCase.status, exitCase.workflowStage);

  const handleCheck = (itemId: string, checked: boolean) => checkItem({ caseId, deptId, itemId, checked });

  const handleApproveClick = () => {
    if (!allMandatoryChecked) {
      setShowErrors(true);
      toast.error("Please complete all mandatory items.");
      return;
    }
    approveTask({ taskId });
    toast.success("Task marked as complete");
    setLocation("/tasks");
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) { toast.error("Reason required"); return; }
    rejectTask({ taskId, reason: rejectReason });
    setRejectOpen(false);
    toast.info("Task rejected");
    setLocation("/tasks");
  };

  const handleSendReminder = async () => {
    setIsSendingReminder(true);
    try {
      await sendReminderEmail({
        assignee_name: "Assignee",
        assignee_email: "sengottayan2003@gmail.com",
        task_name: meta.title,
        case_id: exitCase.id,
        due_date: slaDueLabel,
        employee_name: exitCase.employeeName || "N/A",
        assigned_department: task.deptLabel || "N/A",
        sender_name: user?.name || "OffboardIQ"
      });
      toast.success("Reminder notification sent to assignee.");
    } catch (err: any) {
      toast.error("Failed to send reminder email.");
    } finally {
      setIsSendingReminder(false);
    }
  };

  return (
    <div className="animate-slide-up pb-12 bg-[#0b1120] min-h-screen text-white font-sans">
      <div className="mb-6 px-6 pt-6">
        {/* Breadcrumb & Actions */}
        <div className="flex justify-between items-center mb-6">
          <nav className="flex items-center gap-2 text-xs font-semibold text-[#8e9bb0]">
            <Link href="/tasks" className="hover:text-white transition-colors">My Tasks</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#8e9bb0] uppercase tracking-wide">{caseId}</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">{task.deptLabel} Clearance</span>
          </nav>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 rounded-md bg-[#121622] border border-[#1e2536] flex items-center justify-center text-[#8e9bb0] hover:text-white transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <Link href={`/cases/${caseId}`} className="px-3 py-1.5 rounded-md bg-[#121622] border border-[#1e2536] text-[#8e9bb0] hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors">
              <FileText className="w-3.5 h-3.5" /> View Case Details
            </Link>
          </div>
        </div>

        {/* Top Header Card */}
        <div className="flex justify-between items-start mb-8 border-b border-[#1e2536] pb-8">
          <div className="flex gap-16">
            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#3146C4] flex items-center justify-center text-xl font-bold text-white shrink-0">
                {exitCase.employeeName.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">{exitCase.employeeName}</h1>
                <div className="flex items-center gap-2 text-xs font-medium text-[#8e9bb0]">
                  <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> {exitCase.employeeRole}</span>
                  <span className="text-[#3b82f6]"> • {exitCase.employeeDept}</span>
                </div>
                <p className="text-xs text-[#8e9bb0]/70 mt-1">{caseId}</p>
              </div>
            </div>

            {/* Meta Cols */}
            <div className="flex gap-12 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-[#8e9bb0] tracking-wider">Last Working Day</span>
                <span className="font-semibold text-white">{lwdFormatted}</span>
                {lwdDaysLeft !== null && <span className="text-xs text-[#8e9bb0]">({lwdDaysLeft === 0 ? "Today" : `${lwdDaysLeft} days left`})</span>}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-[#8e9bb0] tracking-wider">Exit Type</span>
                <span className="font-semibold text-white">{exitReason}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-[#8e9bb0] tracking-wider">Notice Period</span>
                <span className="font-semibold text-white">{noticeDays} Days</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-[#8e9bb0] tracking-wider">Reporting Manager</span>
                <span className="font-semibold text-white">{exitCase.managerName || "Manager"}</span>
                <span className="text-xs text-[#8e9bb0]">Product</span>
              </div>
            </div>
          </div>

          {/* Overdue Card */}
          <div className={`px-5 py-3 rounded-xl border ${slaOverdue ? "bg-[#ef4444]/10 border-[#ef4444]/30" : "bg-[#10b981]/10 border-[#10b981]/30"}`}>
            <div className={`flex flex-col gap-1 ${slaOverdue ? "text-[#ef4444]" : "text-[#10b981]"}`}>
              <div className="flex items-center gap-2 text-xs font-bold">
                <Clock className="w-4 h-4" />
                {slaOverdue ? "Overdue" : "On Track"}
              </div>
              <span className="text-sm font-semibold">
                {task.slaDueAt ? formatDistanceToNowStrict(parseISO(task.slaDueAt), { addSuffix: true }) : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Horizontal Progress Stepper */}
        <div className="mb-10 mx-auto w-full max-w-5xl">
          <div className="flex items-center w-full relative">
            {STEPS.map((step, i) => {
              const stepNum = i + 1;
              const isDone = stepNum < activeStep;
              const isActive = stepNum === activeStep;

              return (
                <div key={step} className="relative flex flex-col items-center flex-1">
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

                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white z-10 transition-all ${
                    isDone ? "bg-[#10b981] text-white" :
                    isActive ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)] border border-blue-500" :
                    "bg-[#1e2536] text-[#8e9bb0]"
                  }`}>
                    {isDone ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">{stepNum}</span>}
                  </div>
                  <div className="text-center mt-3 z-10">
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

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
          
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            
            {/* Tabs Row */}
            <div className="flex items-center justify-between border-b border-[#1e2536] pb-0">
              <div className="flex gap-8 px-2">
                {[
                  { id: "clearance", label: `Clearance Checklist`, count: totalCount },
                  { id: "activity", label: `Approvals & Activity`, count: 0 },
                  { id: "documents", label: `Documents`, count: 0 }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`pb-4 text-sm font-semibold transition-all border-b-2 relative ${
                      activeTab === t.id
                        ? "border-blue-500 text-blue-400"
                        : "border-transparent text-[#8e9bb0] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {t.label}
                      {t.count > 0 && (
                        <span className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 text-[10px] flex items-center justify-center font-bold">
                          {t.count}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <button className="mb-4 px-3 py-1.5 rounded-lg border border-[#1e2536] text-[#8e9bb0] hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors">
                <Eye className="w-4 h-4" /> View Workflow
              </button>
            </div>

            {/* Checklist Tab Content */}
            {activeTab === "clearance" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                
                {/* 4 Summary Cards */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-[#121622]/40 border border-[#1e2536] rounded-xl p-4 flex flex-col justify-between">
                    <div className="text-[10px] font-bold text-[#8e9bb0] uppercase tracking-wider mb-2">Total Items</div>
                    <div className="flex justify-between items-end">
                      <span className="text-2xl font-bold text-white">{totalCount}</span>
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#121622]/40 border border-[#1e2536] rounded-xl p-4 flex flex-col justify-between">
                    <div className="text-[10px] font-bold text-[#8e9bb0] uppercase tracking-wider mb-2">Completed</div>
                    <div className="flex justify-between items-end">
                      <span className="text-2xl font-bold text-[#10b981]">{checkedCount}</span>
                      <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 text-[#10b981] flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#121622]/40 border border-[#1e2536] rounded-xl p-4 flex flex-col justify-between">
                    <div className="text-[10px] font-bold text-[#8e9bb0] uppercase tracking-wider mb-2">In Progress</div>
                    <div className="flex justify-between items-end">
                      <span className="text-2xl font-bold text-[#3b82f6]">{inProgressCount}</span>
                      <div className="w-8 h-8 rounded-lg bg-[#3b82f6]/10 text-[#3b82f6] flex items-center justify-center">
                        <MoreHorizontal className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#121622]/40 border border-[#1e2536] rounded-xl p-4 flex flex-col justify-between">
                    <div className="text-[10px] font-bold text-[#8e9bb0] uppercase tracking-wider mb-2">Pending</div>
                    <div className="flex justify-between items-end">
                      <span className="text-2xl font-bold text-[#fbbf24]">{pendingCount}</span>
                      <div className="w-8 h-8 rounded-lg bg-[#fbbf24]/10 text-[#fbbf24] flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="bg-[#0f111a]/50 border border-[#1e2536] rounded-xl overflow-hidden shadow-xl">
                  {checklist.length === 0 ? (
                    <div className="py-16 text-center text-[#8e9bb0]">No checklist items configured.</div>
                  ) : (
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#1e2536] bg-[#1a202f]/80">
                          <th className="px-6 py-4 font-bold text-[#8e9bb0] uppercase tracking-wider w-[35%]">Item</th>
                          <th className="px-6 py-4 font-bold text-[#8e9bb0] uppercase tracking-wider w-[25%]">Requirement</th>
                          <th className="px-6 py-4 font-bold text-[#8e9bb0] uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 font-bold text-[#8e9bb0] uppercase tracking-wider text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e2536]">
                        {checklist.map((item, idx) => {
                          const isChecked = item.checked;
                          return (
                            <tr key={item.id} className="hover:bg-[#1a202f]/60 transition-colors group">
                              <td className="px-6 py-4 align-top">
                                <div className="flex items-start gap-3">
                                  <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${isChecked ? "bg-[#10b981] border-[#10b981] text-white" : showErrors && item.isMandatory ? "border-red-500" : "border-[#1e2536] bg-[#1e2536]/50"}`}>
                                    {isChecked && <Check className="w-3 h-3" />}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-white leading-snug">{item.label}</div>
                                    <div className="text-[10px] font-bold text-[#8e9bb0] mt-1 uppercase tracking-wide">
                                      {item.isMandatory ? "Mandatory" : "Optional"}
                                    </div>
                                    {item.hasInput && (
                                      <input
                                        type="text"
                                        defaultValue={item.inputValue ?? ""}
                                        placeholder={item.inputLabel ?? "Enter value"}
                                        disabled={!canEdit}
                                        onChange={(e) => setItemInput({ caseId, deptId, itemId: item.id, inputValue: e.target.value })}
                                        className="mt-2 h-8 text-xs px-3 rounded-lg border border-[#1e2536] bg-[#0b1120] text-white placeholder-[#8e9bb0]/50 w-full focus:outline-none focus:border-blue-500"
                                      />
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 align-top text-[#8e9bb0]">
                                {item.label} requirement details.
                              </td>
                              <td className="px-6 py-4 align-top">
                                {isChecked ? (
                                  <span className="inline-flex px-2.5 py-1 rounded border border-[#10b981]/20 bg-[#10b981]/10 text-[#10b981] font-bold text-[10px] uppercase tracking-wide">
                                    Approved
                                  </span>
                                ) : (
                                  <span className="inline-flex px-2.5 py-1 rounded border border-[#3b82f6]/20 bg-[#3b82f6]/10 text-[#3b82f6] font-bold text-[10px] uppercase tracking-wide">
                                    In Progress
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 align-top text-right">
                                {canEdit ? (
                                  <button
                                    onClick={() => handleCheck(item.id, !isChecked)}
                                    className="px-3 py-1.5 rounded border border-[#1e2536] text-[#8e9bb0] hover:text-white hover:border-[#3b82f6] hover:bg-[#3b82f6]/10 transition-colors text-xs font-semibold"
                                  >
                                    {isChecked ? "Undo" : "Complete"}
                                  </button>
                                ) : (
                                  <button disabled className="px-3 py-1.5 rounded border border-[#1e2536] text-[#8e9bb0]/50 text-xs font-semibold">
                                    Locked
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
            
            {/* Other tabs dummy content */}
            {activeTab === "activity" && <div className="text-center py-12 text-[#8e9bb0]">Activity tab content</div>}
            {activeTab === "documents" && <div className="text-center py-12 text-[#8e9bb0]">Documents tab content</div>}
          </div>

          {/* Right Column Sidebar */}
          <div className="flex flex-col gap-5">
            
            {/* Task Summary Card */}
            <div className="bg-[#121622]/40 border border-[#1e2536] rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#1e2536] bg-[#1a202f]/40">
                <h3 className="text-sm font-bold text-white">Task Summary</h3>
              </div>
              <div className="p-5 flex items-center justify-between">
                <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                  <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90 drop-shadow-lg">
                    <circle cx="48" cy="48" r="40" fill="none" stroke="#1e2536" strokeWidth="8" />
                    <circle
                      cx="48" cy="48" r="40" fill="none"
                      stroke="#10b981"
                      strokeWidth="8"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (pct / 100) * 251.2}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-white">{pct}%</span>
                    <span className="text-[8px] uppercase tracking-wider text-[#8e9bb0] font-bold mt-0.5 text-center leading-tight">Overall<br/>Progress</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2.5 text-xs ml-4">
                  <div className="flex justify-between items-center w-24">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#10b981]"></span><span className="text-[#8e9bb0] font-semibold">Completed</span></div>
                    <span className="text-white font-bold">{checkedCount}</span>
                  </div>
                  <div className="flex justify-between items-center w-24">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span><span className="text-[#8e9bb0] font-semibold">In Progress</span></div>
                    <span className="text-white font-bold">{inProgressCount}</span>
                  </div>
                  <div className="flex justify-between items-center w-24">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#fbbf24]"></span><span className="text-[#8e9bb0] font-semibold">Pending</span></div>
                    <span className="text-white font-bold">{pendingCount}</span>
                  </div>
                  <div className="flex justify-between items-center w-24">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#ef4444]"></span><span className="text-[#8e9bb0] font-semibold">Overdue</span></div>
                    <span className="text-white font-bold">{slaOverdue ? 1 : 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SLA Information Card */}
            <div className="bg-[#121622]/40 border border-[#1e2536] rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#1e2536] bg-[#1a202f]/40">
                <h3 className="text-sm font-bold text-white">SLA Information</h3>
              </div>
              <div className="p-5 flex flex-col gap-4 text-xs font-semibold">
                <div className="flex justify-between items-center">
                  <span className="text-[#8e9bb0]">SLA Due Date</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white">{slaDueLabel}</span>
                    {slaOverdue && <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#ef4444]/15 border border-[#ef4444]/30 text-[#ef4444] uppercase tracking-wide">Overdue</span>}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8e9bb0]">SLA</span>
                  <span className="text-white">{task.slaHours} hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8e9bb0]">Assigned On</span>
                  <span className="text-white">{task.startedAt ? format(parseISO(task.startedAt), "dd MMM yyyy, hh:mm a") : "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8e9bb0]">Assigned By</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-[#3146C4] flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                      MK
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-white font-bold leading-tight">{exitCase.managerName || "System"}</span>
                      <span className="text-[#8e9bb0] text-[9px]">Product Manager</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-[#121622]/40 border border-[#1e2536] rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#1e2536] bg-[#1a202f]/40">
                <h3 className="text-sm font-bold text-white">Actions</h3>
              </div>
              <div className="p-5 flex flex-col gap-3">
                <p className="text-[11px] text-[#8e9bb0] font-medium leading-relaxed mb-1">Take necessary actions to complete this task.</p>
                
                <button
                  onClick={handleApproveClick}
                  disabled={!canEdit || isApproving}
                  className="w-full py-2.5 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" /> Mark as Complete
                </button>
                
                <button
                  className="w-full py-2.5 rounded-lg border border-[#1e2536] text-white hover:bg-[#1a202f] text-xs font-bold flex items-center gap-2 transition-colors px-3 justify-center"
                >
                  <MessageSquare className="w-4 h-4 text-[#8e9bb0]" /> Request More Information
                </button>
                
                <button
                  onClick={handleSendReminder}
                  disabled={isSendingReminder}
                  className="w-full py-2.5 rounded-lg border border-[#1e2536] text-white hover:bg-[#1a202f] text-xs font-bold flex items-center gap-2 transition-colors px-3 justify-center disabled:opacity-50"
                >
                  {isSendingReminder ? <Loader2 className="w-4 h-4 text-[#8e9bb0] animate-spin" /> : <Send className="w-4 h-4 text-[#8e9bb0]" />}
                  {isSendingReminder ? "Sending..." : "Send Reminder"}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
