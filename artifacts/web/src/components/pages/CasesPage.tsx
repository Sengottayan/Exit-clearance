import { useAuth } from "@/hooks/useAuth";
import { useCases, useAddComment } from "@/hooks/api/useCases";
import { useUploadAttachment } from "@/hooks/api/useDocuments";
import { Redirect, Link } from "@/lib/wouter";
import { PageHeader } from "@/components/shared/PageHeader";
import { CaseTable } from "@/components/cases/CaseTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Search, X, FileText, CheckCircle2, AlertTriangle, Clipboard, Users, Landmark, Monitor, User, ShieldCheck, Mail, Upload, Clock, Activity, Download, Send } from "lucide-react";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { resolveTaskStatus } from "@/lib/workflow";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { buildAuditLog } from "@/lib/audit";
import { format } from "date-fns";
import { toast } from "sonner";
import { EXIT_REASONS } from "@/lib/constants";
import { getActiveEmployeeCase, getLatestEmployeeCase } from "@/lib/employee-case";
import type { CaseAttachment } from "@/lib/types";

export default function CasesPage() {
  const { user, isHR, isAdmin, isManager, isEmployee } = useAuth();
  const { data: cases = [], isLoading } = useCases();
  const { mutate: addComment } = useAddComment();
  const { mutate: uploadAttachment } = useUploadAttachment();
  
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [slaFilter, setSlaFilter] = useState("all");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  
  // Drawer Tab State
  const [drawerTab, setDrawerTab] = useState<'workflow' | 'documents' | 'comments' | 'audit'>('workflow');
  const [newCommentText, setNewCommentText] = useState("");

  const isManagerOnly = isManager && !isHR && !isAdmin;
  const baseCases = isManagerOnly ? cases.filter(c => c.managerId === user?.id) : cases;
  const activeCase = getActiveEmployeeCase(cases, user);
  const latestCase = getLatestEmployeeCase(cases, user);

  // Overview metrics
  const totalCount = baseCases.length;
  const pendingCount = baseCases.filter(c => c.status === 'pending_manager').length;
  const inClearanceCount = baseCases.filter(c => c.status === 'in_clearance').length;
  const overdueCount = baseCases.filter(c => c.tasks.some(t => resolveTaskStatus(t) === 'overdue')).length;
  const completedCount = baseCases.filter(c => c.status === 'completed').length;

  // Filtered cases
  const filteredCases = useMemo(() => {
    return baseCases.filter(c => {
      // Search term
      const matchesSearch = search === "" ||
        c.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase()) ||
        c.employeeDept.toLowerCase().includes(search.toLowerCase());

      // Tab filters
      let matchesTab = true;
      if (filter === 'pending') matchesTab = c.status === 'pending_manager';
      if (filter === 'clearance') matchesTab = c.status === 'in_clearance';
      if (filter === 'overdue') matchesTab = c.tasks.some(t => resolveTaskStatus(t) === 'overdue');
      if (filter === 'completed') matchesTab = c.status === 'completed';

      // Department dropdown
      const matchesDept = deptFilter === 'all' || c.employeeDept === deptFilter;

      // Exit type reason dropdown
      const matchesReason = reasonFilter === 'all' || c.exitReason === reasonFilter;

      // SLA priority dropdown
      let matchesSLA = true;
      if (slaFilter === 'overdue') {
        matchesSLA = c.tasks.some(t => resolveTaskStatus(t) === 'overdue');
      } else if (slaFilter === 'at_risk') {
        matchesSLA = c.status === 'in_clearance' && !c.tasks.some(t => resolveTaskStatus(t) === 'overdue') && c.tasks.some(t => resolveTaskStatus(t) === 'pending');
      }

      return matchesSearch && matchesTab && matchesDept && matchesReason && matchesSLA;
    });
  }, [baseCases, filter, search, deptFilter, reasonFilter, slaFilter]);

  const selectedCase = useMemo(() => {
    return cases.find(c => c.id === selectedCaseId);
  }, [cases, selectedCaseId]);

  // Case checklist progression percentage
  const progression = useMemo(() => {
    if (!selectedCase) return 0;
    const total = selectedCase.tasks.length;
    const completed = selectedCase.tasks.filter(t => t.status === 'approved').length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [selectedCase]);

  // Specific audit logs for the selected case
  const caseAuditLogs = useMemo(() => {
    if (!selectedCaseId) return [];
    return buildAuditLog(cases)
      .filter(log => log.entity === selectedCaseId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [cases, selectedCaseId]);

  const handleAddComment = () => {
    if (!selectedCaseId || !newCommentText.trim() || !user) return;
    addComment({
      caseId: selectedCaseId,
      comment: {
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        message: newCommentText,
        visibility: "all",
      },
    });
    setNewCommentText("");
    toast.success("Comment posted");
  };

  const handleClearFilters = () => {
    setSearch("");
    setDeptFilter("all");
    setReasonFilter("all");
    setSlaFilter("all");
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCaseId || !e.target.files || e.target.files.length === 0 || !user) return;
    const file = e.target.files[0];
    uploadAttachment({ caseId: selectedCaseId, fileName: file.name, actor: user.name });
    toast.success(`Uploaded attachment: ${file.name}`);
  };

  const activeDepartmentsList = useMemo(() => {
    const set = new Set(cases.map(c => c.employeeDept));
    return Array.from(set);
  }, [cases]);

  if (isEmployee) {
    if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
    if (activeCase) return <Redirect to={`/cases/${activeCase.id}`} />;
    if (latestCase) return <Redirect to={`/cases/${latestCase.id}`} />;
    return <Redirect to="/resign" />;
  }

  if (!isHR && !isAdmin && !isManager) return <Redirect to="/dashboard" />;

  return (
    <div className="animate-slide-up space-y-6 pb-12">
      <PageHeader 
        title={isManagerOnly ? "Team Exits" : "Exit Cases"}
        description={isManagerOnly ? "View and manage exit processes for your direct reports." : "Manage case lifecycles, assign checklists, and audit offboard compliance."}
        action={
          !isManagerOnly ? (
            <Link href="/cases/new">
              <Button className="shadow-md shadow-primary/10 font-semibold text-xs py-5 rounded-xl">
                <PlusCircle className="w-4.5 h-4.5 mr-1.5" />
                Create Exit Case
              </Button>
            </Link>
          ) : undefined
        }
      />

      {/* 1. Case Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-border/60 bg-card/60 shadow-soft">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Cases</p>
              <h3 className="text-2xl font-extrabold tracking-tight mt-1">{totalCount}</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-500/10 text-slate-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/60 bg-card/60 shadow-soft">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Pending Manager</p>
              <h3 className="text-2xl font-extrabold tracking-tight mt-1">{pendingCount}</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 shadow-soft">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">In Clearance</p>
              <h3 className="text-2xl font-extrabold tracking-tight mt-1">{inClearanceCount}</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-950/30 bg-red-500/[0.01] shadow-soft">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">SLA Overdue</p>
              <h3 className="text-2xl font-extrabold tracking-tight mt-1 text-red-600 dark:text-red-400">{overdueCount}</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center animate-pulse-soft">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 shadow-soft col-span-2 md:col-span-1">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Completed</p>
              <h3 className="text-2xl font-extrabold tracking-tight mt-1">{completedCount}</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs list */}
      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList className="bg-muted/60 p-1 border border-border/50 rounded-xl">
          <TabsTrigger value="all" className="text-xs font-semibold rounded-lg py-2 px-4">All Exits</TabsTrigger>
          <TabsTrigger value="pending" className="text-xs font-semibold rounded-lg py-2 px-4">Resignation Approvals</TabsTrigger>
          <TabsTrigger value="clearance" className="text-xs font-semibold rounded-lg py-2 px-4">In Clearance</TabsTrigger>
          <TabsTrigger value="overdue" className="text-xs font-semibold rounded-lg py-2 px-4 text-red-600 dark:text-red-400">SLA Overdue</TabsTrigger>
          <TabsTrigger value="completed" className="text-xs font-semibold rounded-lg py-2 px-4">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 2. Smart Filter Bar */}
      <div className="bg-card/75 backdrop-blur-md border border-border/70 p-4 rounded-2xl shadow-soft space-y-3 sticky top-16 z-10">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/85" />
            <Input
              type="text"
              placeholder="Search by name, ID, or department..."
              className="pl-10 h-10 w-full bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-primary/25 rounded-xl font-medium text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filters dropdowns */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Department */}
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-10 rounded-xl text-xs font-semibold bg-background border-border/60">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {activeDepartmentsList.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Exit Reason */}
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-10 rounded-xl text-xs font-semibold bg-background border-border/60">
                <SelectValue placeholder="Exit Reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reasons</SelectItem>
                {EXIT_REASONS.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* SLA Risk */}
            <Select value={slaFilter} onValueChange={setSlaFilter}>
              <SelectTrigger className="w-full sm:w-[140px] h-10 rounded-xl text-xs font-semibold bg-background border-border/60">
                <SelectValue placeholder="SLA Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any SLA Status</SelectItem>
                <SelectItem value="overdue">Breached / Overdue</SelectItem>
                <SelectItem value="at_risk">Pending Clearance</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear filters */}
            {(search || deptFilter !== "all" || reasonFilter !== "all" || slaFilter !== "all") && (
              <Button
                variant="ghost"
                onClick={handleClearFilters}
                className="h-10 px-3 hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl"
              >
                <X className="w-4 h-4 mr-1.5" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Table */}
      <Card className="border-border/60 bg-card shadow-premium overflow-hidden">
        <CardContent className="p-0">
          <CaseTable cases={filteredCases} showSearch={false} onRowClick={(id) => {
            setSelectedCaseId(id);
            setDrawerTab('workflow');
          }} />
        </CardContent>
      </Card>

      {/* 4. Case Detail Drawer (Radix UI Sheet) */}
      <Sheet open={!!selectedCaseId} onOpenChange={(open) => !open && setSelectedCaseId(null)}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto p-0 flex flex-col h-full bg-card border-l border-border/80 shadow-2xl">
          {selectedCase && (
            <>
              {/* Drawer Header Profile */}
              <div className="p-6 border-b border-border/40 bg-muted/20 relative">
                <div className="flex justify-between items-start gap-4 mb-4 pr-6">
                  <div className="flex items-center gap-4">
                    <UserAvatar name={selectedCase.employeeName} className="w-14 h-14 border border-border shadow-md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-extrabold tracking-tight text-foreground">{selectedCase.employeeName}</h3>
                        <Badge variant="outline" className="text-[9px] uppercase font-mono bg-muted border-border/60">
                          {selectedCase.id}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-semibold mt-1">
                        {selectedCase.employeeRole} · {selectedCase.employeeDept}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1.5 font-medium">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{selectedCase.employeeEmail}</span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={selectedCase.status} />
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <span>Clearance Progression</span>
                    <span className="text-primary">{progression}%</span>
                  </div>
                  <Progress value={progression} className="h-2 rounded-full" />
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-border/40 px-6 bg-muted/10 shrink-0">
                <button
                  onClick={() => setDrawerTab('workflow')}
                  className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                    drawerTab === 'workflow' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Clearance Pipeline
                </button>
                <button
                  onClick={() => setDrawerTab('documents')}
                  className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                    drawerTab === 'documents' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Documents & Assets
                </button>
                <button
                  onClick={() => setDrawerTab('comments')}
                  className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                    drawerTab === 'comments' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Comments ({selectedCase.comments?.length ?? 0})
                </button>
                <button
                  onClick={() => setDrawerTab('audit')}
                  className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                    drawerTab === 'audit' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Compliance Trail ({caseAuditLogs.length})
                </button>
              </div>

              {/* Drawer Tab Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                {/* 1. Clearance Workflow pipeline */}
                {drawerTab === 'workflow' && (
                  <div className="space-y-6">
                    <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-widest">
                      Department Approvals Status
                    </h4>
                    <div className="space-y-4">
                      {selectedCase.tasks.map(task => {
                        const isOverdue = resolveTaskStatus(task) === 'overdue';
                        const isApproved = task.status === 'approved';
                        
                        return (
                          <div
                            key={task.id}
                            className={`p-4 border rounded-xl flex items-center justify-between transition-all ${
                              isApproved ? 'border-emerald-500/20 bg-emerald-500/[0.01]' :
                              isOverdue ? 'border-red-500/20 bg-red-500/[0.01]' : 'border-border/60 bg-background/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                                isApproved ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' :
                                isOverdue ? 'bg-red-500/10 border-red-500/20 text-red-600 animate-pulse-soft' :
                                'bg-muted border-border/50 text-muted-foreground'
                              }`}>
                                {task.deptId === 'manager' ? <User className="w-4 h-4" /> :
                                 task.deptId === 'it' ? <Monitor className="w-4 h-4" /> :
                                 task.deptId === 'finance' ? <Landmark className="w-4 h-4" /> :
                                 task.deptId === 'infosec' ? <ShieldCheck className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-foreground">{task.deptLabel}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  Assignee: {task.assigneeName} {isOverdue && <span className="text-red-500 font-bold ml-1">SLA BREACHED</span>}
                                </p>
                              </div>
                            </div>

                            {/* Task state action/status */}
                            <div className="flex items-center gap-3">
                              {isApproved ? (
                                <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 font-bold text-[9px] uppercase">
                                  Approved
                                </Badge>
                              ) : isOverdue ? (
                                <Badge className="bg-red-500/10 border-red-500/20 text-red-600 font-bold text-[9px] uppercase animate-pulse-soft">
                                  Overdue
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px] font-semibold uppercase text-muted-foreground border-border/60 bg-muted/30">
                                  Pending
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Documents & Assets tab */}
                {drawerTab === 'documents' && (
                  <div className="space-y-6">
                    {/* General Documents Upload */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-widest">
                        Exit Records & Letter Files
                      </h4>
                      <div className="border border-dashed border-border/80 rounded-xl p-6 text-center hover:border-primary/50 transition-all bg-background/50 relative">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground opacity-50 mb-2" />
                        <p className="text-xs font-semibold">Upload return clearance forms or exit files</p>
                        <p className="text-[10px] text-muted-foreground/85 mt-0.5">PDF, DOCX, JPEG formats (up to 10MB)</p>
                        <input
                          type="file"
                          onChange={handleUploadFile}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </div>

                      {/* Attachments checklist list */}
                      <div className="space-y-2 mt-4">
                        {selectedCase.documents.attachments?.map((file: CaseAttachment) => (
                          <div key={file.id} className="p-3 border border-border/60 bg-background/60 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <FileText className="w-4 h-4 text-primary shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-foreground">{file.name}</p>
                                <p className="text-[9px] text-muted-foreground font-mono mt-0.5">
                                  By {file.uploadedBy} on {format(new Date(file.uploadedAt), "d MMM yyyy, HH:mm")}
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg">
                              <Download className="w-3.5 h-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                        ))}
                        {(!selectedCase.documents.attachments || selectedCase.documents.attachments.length === 0) && (
                          <div className="p-6 text-center text-xs text-muted-foreground border border-border/40 rounded-xl bg-background/20">
                            No files attached. Upload a document above.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Comments tab */}
                {drawerTab === 'comments' && (
                  <div className="space-y-6 flex flex-col h-full">
                    {/* Add comments box */}
                    <div className="space-y-2 shrink-0">
                      <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-widest">
                        Post Case Update Note
                      </h4>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add comments or notify HR..."
                          className="h-10 text-xs rounded-xl border-border/60"
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                        />
                        <Button
                          onClick={handleAddComment}
                          size="icon"
                          className="h-10 w-10 shrink-0 bg-primary hover:bg-primary/95 rounded-xl shadow-md shadow-primary/10"
                        >
                          <Send className="w-3.5 h-3.5 text-white" />
                        </Button>
                      </div>
                    </div>

                    {/* Timeline List of comments */}
                    <div className="space-y-4 pt-2">
                      {selectedCase.comments?.map((comment) => (
                        <div key={comment.id} className="p-4 bg-background border border-border/50 rounded-xl shadow-soft">
                          <div className="flex items-center gap-2 mb-2">
                            <UserAvatar name={comment.authorName} className="w-5.5 h-5.5 border shadow-sm" />
                            <div>
                              <span className="text-xs font-bold text-foreground">{comment.authorName}</span>
                              <span className="text-[9px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md border border-border/50 ml-1.5">
                                {comment.authorRole}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                              {format(new Date(comment.timestamp), "d MMM, HH:mm")}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground pl-7 leading-relaxed font-medium">
                            {comment.message}
                          </p>
                        </div>
                      ))}
                      {(!selectedCase.comments || selectedCase.comments.length === 0) && (
                        <div className="p-8 text-center text-xs text-muted-foreground border border-border/40 rounded-xl bg-background/20">
                          No notes on this exit case yet. Leave a note above.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Case compliance history log */}
                {drawerTab === 'audit' && (
                  <div className="space-y-6">
                    <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-widest">
                      Audit Trail Ledgers
                    </h4>
                    <div className="relative pl-3 border-l border-border space-y-4">
                      {caseAuditLogs.map((log) => (
                        <div key={log.id} className="relative">
                          <span className="absolute -left-[16.5px] top-1.5 w-2 h-2 rounded-full bg-primary border border-background shadow-sm" />
                          <div className="space-y-0.5 pl-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-foreground">{log.actor}</span>
                              <span className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground/85">
                                {log.action}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                                {format(new Date(log.timestamp), "d MMM, HH:mm:ss")}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">{log.details}</p>
                          </div>
                        </div>
                      ))}
                      {caseAuditLogs.length === 0 && (
                        <div className="p-8 text-center text-xs text-muted-foreground border border-border/40 rounded-xl bg-background/20">
                          No audit recordings available.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
