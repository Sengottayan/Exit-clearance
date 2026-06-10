import { useCase, useApproveResignation } from "@/hooks/api/useCases";
import { useAuth } from "@/hooks/useAuth";
import { Redirect, useParams } from "@/lib/wouter";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { differenceInCalendarDays } from "date-fns";
import { Mail, Briefcase, Calendar, Hash, AlertTriangle } from "lucide-react";
import * as Icons from "lucide-react";
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
import { isCaseOwnedByUser } from "@/lib/employee-case";
import { Link } from "@/lib/wouter";

export default function CaseDetailPage() {
  const { id } = useParams();
  const { user, isHR, isAdmin, isManager, isEmployee } = useAuth();
  const [approveOpen, setApproveOpen] = useState(false);

  const { data: exitCase, isLoading } = useCase(id ?? "");
  const { mutate: approveResignation } = useApproveResignation();

  // Show loading spinner while data is being fetched — prevents premature "Case not found" flash
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          <p className="text-xs text-muted-foreground font-semibold">Loading case details…</p>
        </div>
      </div>
    );
  }

  if (!exitCase) {
    return <div className="p-8 text-center text-muted-foreground">Case not found or you do not have access.</div>;
  }

  const isOwnCase = isCaseOwnedByUser(exitCase, user);
  const canView = isHR || isAdmin || (isManager && exitCase.managerId === user?.id) || (isEmployee && isOwnCase);

  if (!canView) return <Redirect to="/dashboard" />;

  const lwd = new Date(exitCase.lastWorkingDay);
  const noticeDays = differenceInCalendarDays(lwd, new Date(exitCase.resignationDate));
  const exitReasonLabel = EXIT_REASONS.find((r) => r.value === exitCase.exitReason)?.label ?? exitCase.exitReason;

  const handleApproveResignation = () => {
    approveResignation({ caseId: exitCase.id, actor: user?.name ?? "" });
    setApproveOpen(false);
    toast.success("Resignation approved — clearance process started");
  };

  return (
    <div className="animate-slide-up pb-12 bg-[#0b0f19] min-h-screen text-slate-200">
      
      <div className="px-6 py-4 md:py-6 max-w-7xl mx-auto">
        <div className="flex items-center text-xs font-semibold text-blue-400 mb-6">
          <Link href="/dashboard" className="hover:text-blue-300 transition-colors">&lt; Dashboard</Link>
          <span className="mx-2 text-slate-600">&gt;</span>
          <span className="text-slate-400">My Exit Case</span>
          <span className="mx-2 text-slate-600">&gt;</span>
          <span className="text-slate-500">{exitCase.id}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-white">{exitCase.id}</h1>
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20 px-2 uppercase tracking-wider">Pending</Badge>
            </div>
            <p className="text-sm font-medium text-amber-400">{exitCase.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-slate-500 mb-1">Last Working Day</p>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold text-white">{formatDate(exitCase.lastWorkingDay)}</span>
              </div>
            </div>
            <div className="w-px h-10 bg-white/10 hidden md:block" />
            <div className="flex items-center justify-center shrink-0">
              <div className="relative w-12 h-12 rounded-full border-4 border-blue-500 flex items-center justify-center border-l-white/10 border-b-white/10 rotate-45 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <span className="text-[11px] font-bold text-white -rotate-45">60%</span>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <div className="border-b border-white/10 mb-8">
            <TabsList className="bg-transparent border-0 p-0 h-auto gap-8 justify-start w-full">
              {['overview', 'workflow', 'documents', 'activity'].map(tab => (
                <TabsTrigger 
                  key={tab}
                  value={tab} 
                  className="bg-transparent border-0 px-0 pb-3 pt-0 rounded-none text-sm font-semibold text-slate-400 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 capitalize transition-colors"
                >
                  {tab}
                </TabsTrigger>
              ))}
              {!isEmployee && <TabsTrigger value="interview" className="bg-transparent border-0 px-0 pb-3 pt-0 rounded-none text-sm font-semibold text-slate-400 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500">Exit Interview</TabsTrigger>}
              {!isEmployee && <TabsTrigger value="comments" className="bg-transparent border-0 px-0 pb-3 pt-0 rounded-none text-sm font-semibold text-slate-400 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500">Comments</TabsTrigger>}
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border border-white/5 bg-[#121927] rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-white/5">
                  <h3 className="text-sm font-bold text-white">Employee Details</h3>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-8">
                    <UserAvatar name={exitCase.employeeName} className="w-12 h-12 text-base bg-pink-500 text-white font-bold" />
                    <div>
                      <h3 className="text-lg font-bold text-white mb-0.5">{exitCase.employeeName}</h3>
                      <p className="text-xs text-slate-400">{exitCase.employeeRole} · {exitCase.employeeDept}</p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="flex items-center text-sm">
                      <span className="w-32 flex items-center gap-2 text-slate-500 font-medium"><Hash className="w-3.5 h-3.5" /> Employee ID</span>
                      <span className="font-medium text-slate-200">{exitCase.employeeId}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="w-32 flex items-center gap-2 text-slate-500 font-medium"><Mail className="w-3.5 h-3.5" /> Email</span>
                      <span className="font-medium text-slate-200">{exitCase.employeeEmail}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="w-32 flex items-center gap-2 text-slate-500 font-medium"><Briefcase className="w-3.5 h-3.5" /> Manager</span>
                      <span className="font-medium text-slate-200">{exitCase.managerName}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="w-32 flex items-center gap-2 text-slate-500 font-medium"><Icons.MapPin className="w-3.5 h-3.5" /> Location</span>
                      <span className="font-medium text-slate-200">Bengaluru, India</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="w-32 flex items-center gap-2 text-slate-500 font-medium"><Calendar className="w-3.5 h-3.5" /> Date of Joining</span>
                      <span className="font-medium text-slate-200">15 Jan 2023</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-white/5 bg-[#121927] rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-white/5">
                  <h3 className="text-sm font-bold text-white">Exit Information</h3>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-6 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Resignation Date</span>
                      <span className="font-bold text-slate-200">{formatDate(exitCase.resignationDate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Notice Period</span>
                      <span className="font-bold text-slate-200">{noticeDays} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Last Working Day</span>
                      <span className="font-bold text-slate-200">{formatDate(exitCase.lastWorkingDay)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Exit Reason</span>
                      <span className="font-bold text-slate-200 capitalize">{exitReasonLabel.toLowerCase()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Current Status</span>
                      <span className="font-bold text-amber-400">Manager Approval Pending</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Next Step</span>
                      <span className="font-bold text-slate-200">IT Clearance</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border border-white/5 bg-[#121927] rounded-xl overflow-hidden shadow-sm mt-6">
              <div className="px-6 py-4 border-b border-white/5">
                <h3 className="text-sm font-bold text-white">Exit Summary</h3>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Icons.UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Current Stage</p>
                      <p className="text-sm font-bold text-white">Manager Approval</p>
                    </div>
                  </div>

                  <Icons.ArrowRight className="w-5 h-5 text-slate-600" />

                  <div className="flex items-center gap-4 opacity-50">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Icons.Monitor className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Next Stage</p>
                      <p className="text-sm font-bold text-white">IT Clearance</p>
                    </div>
                  </div>

                  <Icons.ArrowRight className="w-5 h-5 text-slate-600" />

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Expected Completion</p>
                      <p className="text-sm font-bold text-white">14 Jun 2026</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflow" className="mt-0">
            <ClearanceAccordion exitCase={exitCase} />
          </TabsContent>

          {!isEmployee && (
            <TabsContent value="interview" className="mt-0">
              <ExitInterviewForm exitCase={exitCase} />
            </TabsContent>
          )}

          <TabsContent value="documents" className="mt-0">
            <DocumentsTab exitCase={exitCase} />
          </TabsContent>

          {!isEmployee && (
            <TabsContent value="comments" className="mt-0">
              <CaseComments exitCase={exitCase} />
            </TabsContent>
          )}

          <TabsContent value="activity" className="mt-0">
            <Card className="border border-white/5 bg-[#121927]">
              <CardContent className="p-6">
                <CaseTimeline events={exitCase.timeline || []} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Approve Resignation"
        description="Are you sure you want to approve this resignation? This will immediately initiate clearance tasks for all departments."
        confirmLabel="Approve & Init Clearances"
        onConfirm={handleApproveResignation}
      />
    </div>
  );
}
