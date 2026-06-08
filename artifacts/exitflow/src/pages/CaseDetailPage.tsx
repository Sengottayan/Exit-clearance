import { useExitStore } from "@/store/exitStore";
import { useAuth } from "@/hooks/useAuth";
import { Redirect, useParams } from "wouter";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { differenceInDays } from "date-fns";
import { Mail, Briefcase, Calendar, Hash, AlertTriangle } from "lucide-react";
import { CaseTimeline } from "@/components/cases/CaseTimeline";
import { ClearanceAccordion } from "@/components/cases/ClearanceAccordion";
import { DocumentsTab } from "@/components/cases/DocumentsTab";
import { ExitInterviewForm } from "@/components/cases/ExitInterviewForm";
import { CaseActionsMenu } from "@/components/cases/CaseActionsMenu";
import { CaseComments } from "@/components/cases/CaseComments";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useState } from "react";
import { toast } from "sonner";
import { EXIT_REASONS } from "@/lib/constants";

export default function CaseDetailPage() {
  const { id } = useParams();
  const { user, isHR, isAdmin, isManager, isEmployee } = useAuth();
  const store = useExitStore();
  const [approveOpen, setApproveOpen] = useState(false);

  const exitCase = store.cases.find((c) => c.id === id);

  if (!exitCase) {
    return <div className="p-8 text-center">Case not found</div>;
  }

  const isOwnCase = user?.employeeId === exitCase.employeeId;
  const canView = isHR || isAdmin || (isManager && exitCase.managerId === user?.id) || (isEmployee && isOwnCase);

  if (!canView) return <Redirect to="/dashboard" />;

  const lwd = new Date(exitCase.lastWorkingDay);
  const noticeDays = differenceInDays(lwd, new Date(exitCase.resignationDate));
  const exitReasonLabel = EXIT_REASONS.find((r) => r.value === exitCase.exitReason)?.label ?? exitCase.exitReason;

  const handleApproveResignation = () => {
    store.approveResignation(exitCase.id, user?.name ?? "");
    setApproveOpen(false);
    toast.success("Resignation approved — clearance process started");
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <PageHeader
        title={isOwnCase ? "My Exit Process" : exitCase.employeeName}
        breadcrumbs={[
          { label: isEmployee ? "Dashboard" : "Cases", href: isEmployee ? "/dashboard" : "/cases" },
          { label: exitCase.id },
        ]}
        action={
          <div className="flex gap-3">
            {isManager && exitCase.status === "pending_manager" && exitCase.managerId === user?.id && (
              <Button onClick={() => setApproveOpen(true)}>Approve Resignation</Button>
            )}
            {!isEmployee && <CaseActionsMenu exitCase={exitCase} />}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-8 p-4 bg-card border rounded-lg">
        <StatusBadge status={exitCase.status} />
        <span className="text-sm text-muted-foreground font-mono">{exitCase.id}</span>
        {exitCase.escalated && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="w-3 h-3" /> Escalated
          </Badge>
        )}
        {exitCase.status === "cancelled" && exitCase.cancelReason && (
          <Badge variant="outline" className="text-muted-foreground">
            Reason: {exitCase.cancelReason}
          </Badge>
        )}
        <div className="flex-1" />
        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          LWD: <span className="font-medium text-foreground">{formatDate(exitCase.lastWorkingDay)}</span>
        </span>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clearances">Clearances</TabsTrigger>
          {!isEmployee && <TabsTrigger value="interview">Exit Interview</TabsTrigger>}
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <UserAvatar name={exitCase.employeeName} className="w-16 h-16 text-lg" />
                  <div>
                    <h3 className="text-xl font-bold">{exitCase.employeeName}</h3>
                    <p className="text-muted-foreground">
                      {exitCase.employeeRole} · {exitCase.employeeDept}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    <span className="w-24 text-muted-foreground">Emp ID</span>
                    <span className="font-medium">{exitCase.employeeId}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="w-24 text-muted-foreground">Email</span>
                    <span className="font-medium">{exitCase.employeeEmail}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <span className="w-24 text-muted-foreground">Manager</span>
                    <span className="font-medium">{exitCase.managerName}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-6">
                <h3 className="font-semibold mb-2">Exit Details</h3>
                <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Resignation Date</p>
                    <p className="font-medium">{formatDate(exitCase.resignationDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Notice Period</p>
                    <p className="font-medium">{noticeDays} days</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Last Working Day</p>
                    <p className="font-medium text-foreground">{formatDate(exitCase.lastWorkingDay)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Exit Reason</p>
                    <p className="font-medium">{exitReasonLabel}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clearances">
          <ClearanceAccordion tasks={exitCase.tasks} />
        </TabsContent>

        {!isEmployee && (
          <TabsContent value="interview">
            <ExitInterviewForm exitCase={exitCase} readOnly={!isHR && !isAdmin} />
          </TabsContent>
        )}

        <TabsContent value="documents">
          <DocumentsTab exitCase={exitCase} />
        </TabsContent>

        <TabsContent value="comments">
          <CaseComments exitCase={exitCase} />
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardContent className="p-6">
              <CaseTimeline events={exitCase.timeline} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Approve Resignation"
        description={`Confirm approval of ${exitCase.employeeName}'s resignation. This will unlock department clearance tasks.`}
        confirmLabel="Approve Resignation"
        onConfirm={handleApproveResignation}
      />
    </div>
  );
}
