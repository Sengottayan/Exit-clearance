import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { MoreHorizontal, CalendarIcon, AlertTriangle, XCircle, FileText } from "lucide-react";
import { ExitCase } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { useExitStore } from "@/store/exitStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";

type DialogType = "cancel" | "escalate" | "extend" | null;

interface CaseActionsMenuProps {
  exitCase: ExitCase;
}

export function CaseActionsMenu({ exitCase }: CaseActionsMenuProps) {
  const { user, isHR, isAdmin, isManager } = useAuth();
  const { cancelCase, extendLastWorkingDay, escalateCase, generateDocument } = useExitStore();

  const [dialog, setDialog] = useState<DialogType>(null);
  const [reason, setReason] = useState("");
  const [newLwd, setNewLwd] = useState<Date>();
  const [issueDocsOpen, setIssueDocsOpen] = useState(false);

  const canManage = isHR || isAdmin;
  const canEscalate = (isManager || isHR || isAdmin) && exitCase.status !== "completed" && exitCase.status !== "cancelled";
  const canCancel = canManage && exitCase.status !== "completed" && exitCase.status !== "cancelled";
  const canExtend = canManage && exitCase.status !== "completed" && exitCase.status !== "cancelled";
  const canIssueDocs = canManage && exitCase.status === "completed";

  const hasActions = canEscalate || canCancel || canExtend || canIssueDocs;
  if (!hasActions || !user) return null;

  const actor = user.name;

  const handleCancel = () => {
    if (!reason.trim()) {
      toast.error("Cancellation reason is required");
      return;
    }
    cancelCase(exitCase.id, reason.trim(), actor);
    setDialog(null);
    setReason("");
    toast.success("Exit case cancelled");
  };

  const handleEscalate = () => {
    if (!reason.trim()) {
      toast.error("Escalation reason is required");
      return;
    }
    escalateCase(exitCase.id, reason.trim(), actor);
    setDialog(null);
    setReason("");
    toast.success("Case escalated to HR");
  };

  const handleExtend = () => {
    if (!newLwd) {
      toast.error("Please select a new last working day");
      return;
    }
    extendLastWorkingDay(exitCase.id, newLwd.toISOString(), actor);
    setDialog(null);
    setNewLwd(undefined);
    toast.success("Last working day updated");
  };

  const handleIssueDocs = () => {
    if (!exitCase.documents.relievingLetter) generateDocument(exitCase.id, "relievingLetter");
    if (!exitCase.documents.experienceCertificate) generateDocument(exitCase.id, "experienceCertificate");
    setIssueDocsOpen(false);
    toast.success("Documents issued successfully");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="w-4 h-4 mr-2" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {canExtend && (
            <DropdownMenuItem onClick={() => { setDialog("extend"); setNewLwd(new Date(exitCase.lastWorkingDay)); }}>
              <CalendarIcon className="w-4 h-4 mr-2" />
              Extend LWD
            </DropdownMenuItem>
          )}
          {canEscalate && (
            <DropdownMenuItem onClick={() => setDialog("escalate")}>
              <AlertTriangle className="w-4 h-4 mr-2" />
              Escalate to HR
            </DropdownMenuItem>
          )}
          {canIssueDocs && (
            <DropdownMenuItem onClick={() => setIssueDocsOpen(true)}>
              <FileText className="w-4 h-4 mr-2" />
              Issue Documents
            </DropdownMenuItem>
          )}
          {canCancel && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDialog("cancel")}>
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Case
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={issueDocsOpen}
        onOpenChange={setIssueDocsOpen}
        title="Issue Exit Documents"
        description="Generate relieving letter and experience certificate for this completed exit case?"
        confirmLabel="Issue Documents"
        onConfirm={handleIssueDocs}
      />

      {dialog === "extend" && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <Card className="w-full max-w-md shadow-lg border-2 animate-in zoom-in-95">
            <CardHeader>
              <CardTitle>Extend Last Working Day</CardTitle>
              <CardDescription>
                Current LWD: {format(new Date(exitCase.lastWorkingDay), "PPP")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>New Last Working Day</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newLwd && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newLwd ? format(newLwd, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newLwd}
                      onSelect={setNewLwd}
                      disabled={(date) => date < new Date(exitCase.resignationDate)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setDialog(null)}>Cancel</Button>
                <Button onClick={handleExtend}>Save New LWD</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {(dialog === "cancel" || dialog === "escalate") && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <Card className="w-full max-w-md shadow-lg border-2 animate-in zoom-in-95">
            <CardHeader>
              <CardTitle>{dialog === "cancel" ? "Cancel Exit Case" : "Escalate to HR"}</CardTitle>
              <CardDescription>
                {dialog === "cancel"
                  ? "This will stop the exit process. All stakeholders will be notified."
                  : "HR will be notified to intervene on this case."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={dialog === "cancel" ? "Employee withdrew resignation..." : "IT clearance overdue by 5 days..."}
                  className="resize-none min-h-[80px]"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => { setDialog(null); setReason(""); }}>Cancel</Button>
                <Button
                  variant={dialog === "cancel" ? "destructive" : "default"}
                  onClick={dialog === "cancel" ? handleCancel : handleEscalate}
                >
                  {dialog === "cancel" ? "Cancel Case" : "Escalate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
