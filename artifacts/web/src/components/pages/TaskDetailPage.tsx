import { useTask, useApproveTask, useRejectTask, useSaveTaskDraft, useCheckItem, useSetItemInput } from "@/hooks/api/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { Redirect, Link, useParams, useLocation } from "@/lib/wouter";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChecklistItem } from "@/components/tasks/ChecklistItem";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SLARiskChip } from "@/components/shared/SLARiskChip";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { resolveTaskStatus } from "@/lib/workflow";

export default function TaskDetailPage() {
  const { taskId } = useParams();
  const { user, isDeptApprover, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  if (!isDeptApprover && !isAdmin) return <Redirect to="/dashboard" />;
  if (!taskId) return <Redirect to="/tasks" />;

  const [caseId, deptId] = taskId.split("__");
  const { data: resolvedTask } = useTask(taskId ?? "");

  const exitCase = resolvedTask?.case;
  const task = resolvedTask;

  if (!exitCase || !task) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-medium">Task not found</h2>
        <Link href="/tasks"><Button className="mt-4">Back to Tasks</Button></Link>
      </div>
    );
  }

  const isLocked = exitCase.status === 'pending_manager' && deptId !== 'manager';
  const displayStatus = resolveTaskStatus(task);
  const isCompleted = displayStatus === 'approved' || displayStatus === 'rejected';
  const canEdit = !isLocked && !isCompleted;

  const allMandatoryChecked = task.checklist.every(item => !item.isMandatory || item.checked);

  const { mutate: checkItem } = useCheckItem();
  const { mutate: setItemInput } = useSetItemInput();
  const { mutate: saveTaskDraft } = useSaveTaskDraft();
  const { mutate: approveTask } = useApproveTask();
  const { mutate: rejectTask } = useRejectTask();

  const handleCheck = (itemId: string, checked: boolean) => {
    checkItem({ caseId, deptId, itemId, checked });
  };

  const handleInput = (itemId: string, value: string) => {
    setItemInput({ caseId, deptId, itemId, inputValue: value });
  };

  const handleSaveDraft = () => {
    saveTaskDraft({ taskId: taskId ?? "", checklist: task.checklist });
    toast.success("Draft saved successfully");
  };

  const handleApproveClick = () => {
    if (!allMandatoryChecked) {
      setShowErrors(true);
      toast.error("Please complete all mandatory checklist items.");
      return;
    }
    setApproveOpen(true);
  };

  const handleApproveConfirm = () => {
    approveTask({ taskId: taskId ?? "" });
    setApproveOpen(false);
    toast.success("Clearance approved successfully");
    setLocation("/tasks");
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    rejectTask({ taskId: taskId ?? "", reason: rejectReason });
    setRejectOpen(false);
    toast.info("Clearance rejected");
    setLocation("/tasks");
  };

  return (
    <div className="max-w-3xl mx-auto animate-slide-up pb-24">
      <PageHeader 
        title={`${task.deptLabel} Clearance`}
        breadcrumbs={[{ label: "Tasks", href: "/tasks" }, { label: exitCase.employeeName }]}
      />

      {isLocked && (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400">
          <h4 className="font-semibold text-sm mb-1">Clearance Locked</h4>
          <p className="text-sm opacity-90">Waiting for manager approval. You cannot begin clearance tasks until the resignation is approved.</p>
        </div>
      )}

      <Card className="mb-6">
        <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <UserAvatar name={exitCase.employeeName} className="w-12 h-12" />
            <div>
              <p className="font-medium text-lg">{exitCase.employeeName}</p>
              <p className="text-sm text-muted-foreground">{exitCase.employeeRole} · {exitCase.employeeDept}</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">{caseId}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={displayStatus} />
            {!isCompleted && <SLARiskChip dueAt={task.slaDueAt} />}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clearance Checklist</CardTitle>
          <CardDescription>Verify all items before granting clearance. Required items must be checked.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {task.checklist.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border rounded-lg bg-muted/20">
              No checklist items configured for this department.
            </div>
          ) : (
            task.checklist.map(item => (
              <ChecklistItem 
                key={item.id}
                item={item}
                onChange={(c) => handleCheck(item.id, c)}
                onInputChange={(v) => handleInput(item.id, v)}
                disabled={!canEdit}
                highlightError={showErrors}
              />
            ))
          )}

          {task.status === 'rejected' && task.rejectionReason && (
            <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-900 dark:bg-red-500/10 dark:border-red-900/30 dark:text-red-400">
              <p className="text-xs font-bold uppercase mb-1">Rejection Reason</p>
              <p className="text-sm">{task.rejectionReason}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {canEdit && (
        <div className="fixed bottom-0 left-0 right-0 md:left-60 border-t bg-background/80 backdrop-blur-md p-4 z-50">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Button variant="outline" onClick={handleSaveDraft}>Save Draft</Button>
            <div className="flex gap-3">
              <Button variant="destructive" onClick={() => setRejectOpen(true)}>Reject</Button>
              <Button onClick={handleApproveClick}>Approve Clearance</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Approve Clearance"
        description={`Confirm that all checklist items for ${exitCase.employeeName}'s ${task.deptLabel} clearance are complete.`}
        confirmLabel="Approve Clearance"
        onConfirm={handleApproveConfirm}
      />

      {rejectOpen && (
        <div className="fixed z-[100] inset-0 flex items-center justify-center pointer-events-none" />
      )}
      
      {rejectOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <Card className="w-full max-w-md shadow-lg border-2 animate-in zoom-in-95">
            <CardHeader>
              <CardTitle>Reject Clearance</CardTitle>
              <CardDescription>Provide a reason for rejecting. The employee and HR will be notified.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea 
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="E.g., Laptop screen is cracked, pending ₹5000 recovery..."
                  className="resize-none"
                />
              </div>
            </CardContent>
            <div className="p-6 pt-0 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleRejectConfirm}>Reject Clearance</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
