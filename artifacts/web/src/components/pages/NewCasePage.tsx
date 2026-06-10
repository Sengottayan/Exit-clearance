"use client";
import { useState, useEffect } from "react";
import { Link, useLocation } from "@/lib/wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { format, differenceInDays, addDays } from "date-fns";
import {
  CheckCircle2, ChevronRight, Search, Filter, ArrowRight,
  Users, FileText, Shield, Monitor, ClipboardCheck, Eye,
  User, MapPin, Calendar, Briefcase, Mail, Phone, Building2,
  MoreVertical, GripVertical, ChevronDown, RotateCcw,
  Laptop, Smartphone, CreditCard, Key, Globe, HardDrive,
  Plus, Upload, Pencil, Trash2, AlertCircle, ExternalLink,
  CheckSquare, ArrowLeft,
} from "lucide-react";
import { DEPARTMENTS, EXIT_REASONS } from "@/lib/constants";
import { useSettingsStore } from "@/store/settingsStore";
import { useCreateCase } from "@/hooks/api/useCases";
import { useUsers } from "@/hooks/api/useUsers";
import { useWorkflowPreview } from "@/hooks/api/useSettings";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { getManagerForEmployee } from "@/lib/workflow";

// ── Step config ───────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Employee",  icon: Users },
  { id: 2, label: "Details",   icon: FileText },
  { id: 3, label: "Clearance", icon: Shield },
  { id: 4, label: "Assets",    icon: Monitor },
  { id: 5, label: "Review",    icon: ClipboardCheck },
];

// ── Clearance workflow rows ───────────────────────────────────────────────────
const DEFAULT_CLEARANCE = [
  { id: "mgr",     label: "Manager Approval",  desc: "Final approval from reporting manager",   assignee: "Rahul Mehta",   role: "Product Manager",  required: true,  color: "bg-blue-500",   initials: "RM" },
  { id: "hr",      label: "HR Clearance",      desc: "HR formalities and documentation",        assignee: "Priya Sharma",  role: "HR Manager",       required: true,  color: "bg-emerald-500",initials: "PS" },
  { id: "it",      label: "IT Clearance",      desc: "Access revocation and asset return",      assignee: "Arjun Nair",    role: "IT Manager",       required: true,  color: "bg-indigo-500", initials: "AN" },
  { id: "fin",     label: "Finance Clearance", desc: "Dues clearance and final settlement",     assignee: "Rohan Das",     role: "Finance Manager",  required: true,  color: "bg-amber-500",  initials: "RD" },
  { id: "admin",   label: "Admin Clearance",   desc: "ID cards, documents and admin tasks",    assignee: "Admin Dept",    role: "Admin Manager",    required: true,  color: "bg-purple-500", initials: "AD" },
  { id: "exit_int",label: "Exit Interview",    desc: "Exit Interview and feedback",             assignee: "Priya Sharma",  role: "HR Manager",       required: false, color: "bg-rose-500",   initials: "PS" },
];

// ── Mock assets ───────────────────────────────────────────────────────────────
const DEFAULT_ASSETS = [
  { id: "AST-1001", name: "MacBook Pro 16\"", sub: "Laptop",          category: "IT Equipment",     status: "Pending Return",     returnType: "Physical", condition: "Good",  icon: Laptop },
  { id: "AST-1002", name: "iPhone 14 Pro",    sub: "",                category: "IT Equipment",     status: "Pending Return",     returnType: "Physical", condition: "Good",  icon: Smartphone },
  { id: "AST-1003", name: "Employee ID Card", sub: "",                category: "Access Card",      status: "Pending Return",     returnType: "Physical", condition: "Good",  icon: CreditCard },
  { id: "AST-1004", name: "Office Door Key",  sub: "",                category: "Physical Access",  status: "Pending Return",     returnType: "Physical", condition: "Good",  icon: Key },
  { id: "AST-1005", name: "System Access",    sub: "",                category: "Digital Access",   status: "Pending Revocation", returnType: "Digital",  condition: null,    icon: Globe },
  { id: "AST-1006", name: "Email Access",     sub: "",                category: "Digital Access",   status: "Pending Revocation", returnType: "Digital",  condition: null,    icon: HardDrive },
];

// ── Sidebar Panel ─────────────────────────────────────────────────────────────
function SidePanel({ step, selectedUser, lwd, reason, selectedDepts }: any) {
  const pct = Math.round(((step - 1) / 5) * 100);

  if (step === 1) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-foreground">Exit Case Creation</h3>
          <p className="text-[11px] text-muted-foreground mt-1">Follow the steps to create a comprehensive exit case.</p>
        </div>
        <div className="space-y-3">
          {[
            { n: 1, label: "Employee",  desc: "Select the employee initiating exit",  icon: Users },
            { n: 2, label: "Details",   desc: "Provide exit and employment details",  icon: FileText },
            { n: 3, label: "Clearance", desc: "Configure clearance workflow",         icon: Shield },
            { n: 4, label: "Assets",    desc: "Identify assets and access",           icon: Monitor },
            { n: 5, label: "Review",    desc: "Review and confirm the case",          icon: ClipboardCheck },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.n} className={cn("flex items-center gap-3 p-3 rounded-xl transition-colors", step === s.n ? "bg-primary/10 border border-primary/20" : "")}>
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", step === s.n ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className={cn("text-xs font-bold", step === s.n ? "text-primary" : "text-foreground")}>{s.n}. {s.label}</p>
                  <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="border border-border/50 rounded-xl p-4 bg-card/50 mt-4">
          <h4 className="text-xs font-extrabold text-foreground mb-1">Need Help?</h4>
          <p className="text-[11px] text-muted-foreground mb-3">Check our guide on creating exit cases</p>
          <button className="w-full flex items-center justify-between text-xs font-bold text-foreground border border-border/50 rounded-lg px-3 py-2 hover:bg-muted/40 transition-colors">
            View Help Guide <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  const stepStatuses = STEPS.map(s => ({
    ...s,
    status: step > s.id ? "completed" : step === s.id ? "in_progress" : "pending",
  }));

  const label = (s: string) => s === "completed" ? "Completed" : s === "in_progress" ? "In Progress" : "Pending";

  return (
    <div className="space-y-5">
      {/* Progress block */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-sm font-extrabold text-foreground">Step Progress</h3>
          <span className="text-xs font-bold text-primary">{step - 1} of 5 completed</span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-2">{pct}%</p>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="space-y-2">
        {stepStatuses.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.id} className="flex items-center gap-3">
              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold",
                s.status === "completed" ? "bg-primary text-white" :
                s.status === "in_progress" ? "bg-muted border-2 border-primary text-primary" :
                "bg-muted text-muted-foreground"
              )}>
                {s.status === "completed" ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.id}
              </div>
              <div>
                <p className={cn("text-xs font-bold", s.status === "completed" ? "text-foreground" : s.status === "in_progress" ? "text-primary" : "text-muted-foreground")}>{s.label}</p>
                <p className={cn("text-[10px]", s.status === "completed" ? "text-emerald-500" : s.status === "in_progress" ? "text-primary/70" : "text-muted-foreground/60")}>
                  {label(s.status)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {step === 3 && (
        <div className="border border-border/50 rounded-xl p-4 bg-card/50">
          <h4 className="text-xs font-extrabold text-foreground mb-3">Workflow Summary</h4>
          <p className="text-[11px] text-muted-foreground mb-3">6 clearance steps configured</p>
          <div className="grid grid-cols-2 gap-3 text-center">
            {[["Required", "5"], ["Optional", "1"], ["Parallel", "0"], ["Estimated Time", "5 - 7 Days"]].map(([k, v]) => (
              <div key={k} className="bg-muted/40 rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground">{k}</p>
                <p className="text-xs font-extrabold text-foreground mt-0.5">{v}</p>
              </div>
            ))}
          </div>
          <button className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground border border-border/50 rounded-lg px-3 py-2 hover:bg-muted/40 transition-colors">
            <Eye className="w-3.5 h-3.5" /> Preview Workflow
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="border border-border/50 rounded-xl p-4 bg-card/50">
          <h4 className="text-xs font-extrabold text-foreground mb-3">Assets Summary</h4>
          <div className="relative flex items-center justify-center py-2 mb-3">
            <svg viewBox="0 0 80 80" className="w-20 h-20">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#1e293b" strokeWidth="10" />
              <circle cx="40" cy="40" r="32" fill="none" stroke="#f59e0b" strokeWidth="10" strokeDasharray="100 101" strokeDashoffset="25" strokeLinecap="round" />
              <circle cx="40" cy="40" r="32" fill="none" stroke="#3b82f6" strokeWidth="10" strokeDasharray="50 151" strokeDashoffset="-75" strokeLinecap="round" />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-lg font-extrabold text-foreground">6</span>
              <span className="text-[9px] text-muted-foreground">Total Assets</span>
            </div>
          </div>
          {[["Physical", "4", "text-amber-400"], ["Digital", "2", "text-blue-400"], ["Returned", "0", "text-emerald-400"], ["Overdue", "0", "text-red-400"]].map(([k, v, c]) => (
            <div key={k} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full", c.replace("text-", "bg-"))} />
                <span className="text-[11px] text-muted-foreground">{k}</span>
              </div>
              <span className="text-[11px] font-bold text-foreground">{v}</span>
            </div>
          ))}
          <button className="w-full mt-3 flex items-center justify-between text-xs font-bold text-foreground border border-border/50 rounded-lg px-3 py-2 hover:bg-muted/40 transition-colors">
            View Asset Guide <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {step === 5 && (
        <div className="border border-border/50 rounded-xl p-4 bg-card/50">
          <h4 className="text-xs font-extrabold text-foreground mb-3">Case Summary</h4>
          <div className="flex items-center gap-3 mb-3">
            <div className="relative w-16 h-16 shrink-0">
              <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                <circle cx="32" cy="32" r="28" fill="none" stroke="#1e293b" strokeWidth="6" />
                <circle cx="32" cy="32" r="28" fill="none" stroke="#6366f1" strokeWidth="6" strokeDasharray="176" strokeDashoffset="0" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[9px] font-extrabold text-foreground leading-none">Ready</span>
                <span className="text-[8px] text-muted-foreground">to create</span>
              </div>
            </div>
            <div className="space-y-1">
              {["All required fields completed", "Workflow configured", "Assets declared", "Handover in progress"].map(t => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="text-[10px] text-muted-foreground">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step !== 1 && (
        <div className="border border-border/50 rounded-xl p-4 bg-card/50">
          <h4 className="text-xs font-extrabold text-foreground mb-1">Need Help?</h4>
          <p className="text-[11px] text-muted-foreground mb-3">Learn more about creating exit cases.</p>
          {step === 3 ? (
            <div className="space-y-2">
              {["Exit Process Guide", "SLA Policies", "Clearance Checklist"].map(t => (
                <button key={t} className="w-full flex items-center justify-between text-[11px] font-semibold text-foreground border border-border/50 rounded-lg px-3 py-2 hover:bg-muted/40 transition-colors">
                  {t} <ExternalLink className="w-3 h-3" />
                </button>
              ))}
            </div>
          ) : (
            <button className="w-full flex items-center justify-between text-xs font-bold text-foreground border border-border/50 rounded-lg px-3 py-2 hover:bg-muted/40 transition-colors">
              View Help Guide <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function NewCasePage() {
  const { isHR, isAdmin, user } = useAuth();
  const [, setLocation] = useLocation();
  const { mutate: createCase, isPending: isCreating } = useCreateCase();
  const defaultTemplateId = useSettingsStore(s => s.workflow.defaultTemplateId);
  const [successData, setSuccessData] = useState<any>(null);

  const [step, setStep] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [search, setSearch] = useState("");

  // Step 2
  const [reason, setReason] = useState("better_opportunity");
  const [noticeDays, setNoticeDays] = useState(60);
  const [resignDate, setResignDate] = useState(new Date());
  const [lwd, setLwd] = useState<Date>(addDays(new Date(), 60));
  const [relievingDate, setRelievingDate] = useState<Date>(addDays(new Date(), 60));
  const [notes, setNotes] = useState("");
  const [handoverManager, setHandoverManager] = useState("Rahul Mehta");
  const [handoverStatus, setHandoverStatus] = useState("in_progress");
  const [handoverPct, setHandoverPct] = useState(60);

  // Step 3
  const [clearanceItems, setClearanceItems] = useState(
    DEFAULT_CLEARANCE.map(c => ({ ...c, enabled: true }))
  );

  // Step 4
  const [assets] = useState(DEFAULT_ASSETS);

  const { data: dbUsersResp, isLoading: isLoadingUsers } = useUsers({ role: "employee", status: "active", search, limit: 20 });
  const dbUsers = dbUsersResp?.data || [];
  const isDemoUsers = !isLoadingUsers && dbUsers.length === 0;

  const searchResults = isDemoUsers
    ? []
    : dbUsers;

  const { data: wfPreview } = useWorkflowPreview();
  const dbWorkflowSteps = wfPreview?.steps || [];
  const isDemoWorkflow = dbWorkflowSteps.length === 0;
  const workflowPreviewSteps = isDemoWorkflow ? DEFAULT_CLEARANCE : dbWorkflowSteps.map((s: any) => ({
    id: s.department,
    label: s.department + " Clearance",
    desc: `SLA: ${s.slaHours} Hours`,
    assignee: s.approver,
    role: "Approver",
    required: s.required,
    color: "bg-primary",
    initials: s.approver.substring(0, 2).toUpperCase()
  }));

  if (!isHR && !isAdmin) return <Link href="/dashboard" />;

  const handleNext = () => setStep(s => Math.min(s + 1, 5));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const handleCreate = () => {
    if (isDemoUsers) {
      toast.error("Case creation is disabled in Demo Mode. Create real employees first.");
      return;
    }
    if (!selectedUser || !lwd || !reason) {
      toast.error("Please fill in all mandatory details");
      return;
    }
    createCase({
      userId: selectedUser.id,
      employeeId: selectedUser.employeeId,
      employeeName: selectedUser.name,
      employeeEmail: selectedUser.email,
      employeeRole: selectedUser.role,
      employeeDept: selectedUser.dept,
      resignationDate: resignDate.toISOString(),
      lastWorkingDay: lwd.toISOString(),
      noticePeriodDays: noticeDays,
      exitReason: reason,
    }, {
      onSuccess: (data) => {
        setSuccessData(data);
      },
      onError: (err) => {
        toast.error(err.message);
      }
    });
  };

  const canNext = step === 1 ? !!selectedUser : step === 2 ? !!lwd && !!reason : true;

  return (
    <div className="flex gap-6 -mx-4 md:-mx-6 -mt-4 md:-mt-6 min-h-[calc(100vh-4rem)]">
      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col px-4 md:px-6 pt-4 md:pt-6 pb-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <button onClick={() => setLocation("/cases")} className="hover:text-foreground transition-colors">Exit Cases</button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-semibold">New Case</span>
        </div>

        {/* Page heading */}
        <div className="mb-5">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">New Exit Case</h1>
          <p className="text-sm text-muted-foreground mt-1">Create a new exit case and start the offboarding workflow.</p>
        </div>

        {/* ── Step indicator ──────────────────────────────────────────────── */}
        <div className="relative mb-6">
          {/* connector line */}
          <div className="absolute left-6 right-6 top-5 h-px bg-border/60" />
          <div
            className="absolute left-6 top-5 h-px bg-primary transition-all duration-500"
            style={{ width: `calc(${((step - 1) / 4) * 100}% - 48px + ${step === 5 ? 48 : 0}px)` }}
          />
          <div className="flex items-center justify-between relative z-10">
            {STEPS.map(s => {
              const done = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => s.id < step && setStep(s.id)}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all border-2",
                      done  ? "bg-primary border-primary text-white" :
                      active ? "bg-background border-primary text-primary shadow-lg shadow-primary/20" :
                               "bg-background border-border text-muted-foreground"
                    )}
                  >
                    {done ? <CheckCircle2 className="w-5 h-5" /> : s.id}
                  </button>
                  <span className={cn("text-[11px] font-bold", active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Step content area ──────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col">

          {/* STEP 1 — Select Employee */}
          {step === 1 && (
            <div className="bg-card border border-border/50 rounded-2xl flex-1 flex flex-col">
              <div className="p-6 border-b border-border/40">
                <h2 className="text-base font-extrabold text-foreground">Select Employee</h2>
                <p className="text-xs text-muted-foreground mt-1">Choose the employee who is initiating the offboarding process.</p>
              </div>
              <div className="p-6 flex-1 space-y-4">
                {isDemoUsers && (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-4 py-3 rounded-xl flex items-start gap-3 mb-2 animate-in fade-in duration-500">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-sm uppercase tracking-wider mb-0.5">⚠ Demo Mode</h4>
                      <p className="text-xs opacity-90 leading-relaxed">Using mock employee directory because no active employees exist in the database. Case creation is disabled in demo mode.</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      placeholder="Search by name, employee ID, or email"
                      className="pl-10 h-10 bg-background border-border/60 rounded-xl text-xs font-medium"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" className="h-10 px-4 rounded-xl text-xs font-semibold border-border/60 bg-background">
                    <Filter className="w-3.5 h-3.5 mr-1.5" /> Filters
                  </Button>
                </div>

                {!search && (
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recent Employees</p>
                )}

                <div className="space-y-0 border border-border/40 rounded-xl overflow-hidden">
                  {searchResults.map((u: any, idx: number) => (
                      <div
                        key={u.id}
                        onClick={() => setSelectedUser(u)}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3.5 cursor-pointer transition-colors border-b border-border/30 last:border-b-0",
                        selectedUser?.id === u.id ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/20"
                      )}
                    >
                      <UserAvatar name={u.name} className="w-9 h-9 shrink-0 text-xs font-bold" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground">{u.name}</p>
                        <p className="text-[11px] text-muted-foreground">{u.role || "Software Engineer"}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-foreground">{u.employeeId}</p>
                        <p className="text-[10px] text-muted-foreground">Employee ID</p>
                      </div>
                      <div className="w-24 text-center">
                        <p className="text-xs font-semibold text-foreground">{u.dept}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Showing {searchResults.length} of 243 employees</span>
                  <button className="flex items-center gap-1 text-primary font-bold hover:text-primary/80 transition-colors">
                    View all employees <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Exit Details */}
          {step === 2 && (
            <div className="grid grid-cols-5 gap-5 flex-1">
              {/* Left: form */}
              <div className="col-span-3 bg-card border border-border/50 rounded-2xl flex flex-col">
                <div className="p-6 border-b border-border/40">
                  <h2 className="text-base font-extrabold text-foreground">Exit & Employment Details</h2>
                  <p className="text-xs text-muted-foreground mt-1">Capture the employee's exit information and last working details.</p>
                </div>
                <div className="p-6 space-y-5 flex-1">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground/80">Exit Reason <span className="text-red-400">*</span></Label>
                      <Select value={reason} onValueChange={setReason}>
                        <SelectTrigger className="h-9 rounded-xl text-xs font-semibold bg-background border-border/60">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXIT_REASONS.map(r => <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground/80">Notice Period (Days) <span className="text-red-400">*</span></Label>
                      <Input
                        type="number"
                        value={noticeDays}
                        onChange={e => setNoticeDays(Number(e.target.value))}
                        className="h-9 rounded-xl text-xs font-semibold bg-background border-border/60"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground/80">Last Working Day <span className="text-red-400">*</span></Label>
                      <div className="h-9 flex items-center gap-2 px-3 border border-border/60 bg-background rounded-xl text-xs font-semibold text-foreground">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {format(lwd, "dd MMM yyyy")}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground/80">Resignation Date <span className="text-red-400">*</span></Label>
                      <div className="h-9 flex items-center gap-2 px-3 border border-border/60 bg-background rounded-xl text-xs font-semibold text-foreground">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {format(resignDate, "dd MMM yyyy")}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground/80">Relieving Date (Expected)</Label>
                      <div className="h-9 flex items-center gap-2 px-3 border border-border/60 bg-background rounded-xl text-xs font-semibold text-foreground">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {format(relievingDate, "dd MMM yyyy")}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground/80">Additional Comments</Label>
                    <Textarea
                      placeholder="Add any additional information about the exit..."
                      className="resize-none h-20 rounded-xl border-border/60 text-xs bg-background"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                    />
                  </div>

                  {/* Handover section */}
                  <div className="border-t border-border/40 pt-5">
                    <h3 className="text-sm font-extrabold text-foreground mb-1">Handover & Knowledge Transfer</h3>
                    <p className="text-xs text-muted-foreground mb-4">Track handover activities and knowledge transfer status.</p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-foreground/80">Handover Manager <span className="text-red-400">*</span></Label>
                        <div className="h-10 flex items-center justify-between px-3 border border-border/60 bg-background rounded-xl">
                          <div className="flex items-center gap-2">
                            <UserAvatar name={handoverManager} className="w-6 h-6 text-[10px] font-bold" />
                            <div>
                              <p className="text-xs font-bold text-foreground">{handoverManager}</p>
                              <p className="text-[9px] text-muted-foreground">Product Manager</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-foreground/80">Handover Status <span className="text-red-400">*</span></Label>
                        <Select value={handoverStatus} onValueChange={setHandoverStatus}>
                          <SelectTrigger className="h-10 rounded-xl text-xs font-semibold bg-background border-border/60">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_started" className="text-xs">Not Started</SelectItem>
                            <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
                            <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-foreground/80">Knowledge Transfer Completion</Label>
                        <span className="text-xs font-bold text-foreground">{handoverPct}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${handoverPct}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Employment Snapshot */}
              <div className="col-span-2 bg-card border border-border/50 rounded-2xl flex flex-col">
                <div className="p-6 border-b border-border/40">
                  <h2 className="text-sm font-extrabold text-foreground">Employment Snapshot</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Quick overview of employee details.</p>
                </div>
                <div className="p-6 space-y-4 flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <UserAvatar name={selectedUser?.name || user?.name || "SS"} className="w-12 h-12 text-sm font-bold" />
                    <div>
                      <p className="text-sm font-extrabold text-foreground">{selectedUser?.name || user?.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedUser?.role || "Product Manager"}</p>
                    </div>
                  </div>
                  {[
                    { icon: User,     label: "Employee ID",       value: selectedUser?.employeeId || "EMP-1056" },
                    { icon: Building2,label: "Department",        value: selectedUser?.dept || "Product" },
                    { icon: MapPin,   label: "Location",          value: "Bengaluru, India" },
                    { icon: Calendar, label: "Date of Joining",   value: "15 Jan 2023" },
                    { icon: Briefcase,label: "Employment Type",   value: "Full Time" },
                    { icon: User,     label: "Manager",           value: "Rahul Mehta", hasAvatar: true },
                    { icon: Mail,     label: "Email",             value: selectedUser?.email || "sengottayan.s@offboardiq.com" },
                    { icon: Phone,    label: "Phone",             value: "+91 98765 43210" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <item.icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[11px] font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.hasAvatar && <UserAvatar name="Rahul Mehta" className="w-5 h-5 text-[8px] font-bold" />}
                        <span className="text-[11px] font-bold text-foreground text-right max-w-[130px] truncate">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Clearance Workflow */}
          {step === 3 && (
            <div className="bg-card border border-border/50 rounded-2xl flex-1 flex flex-col">
              <div className="p-6 border-b border-border/40 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-foreground">Clearance Workflow</h2>
                  <p className="text-xs text-muted-foreground mt-1">Configure the clearance workflow for this exit case.</p>
                </div>
                <Button variant="outline" className="h-9 px-4 rounded-xl text-xs font-semibold border-border/60 bg-background gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" /> Use Default Workflow
                </Button>
              </div>
              {isDemoWorkflow && (
                <div className="mx-6 mt-6 mb-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-4 py-3 rounded-xl flex items-start gap-3 animate-in fade-in duration-500">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-sm uppercase tracking-wider mb-0.5">⚠ Demo Mode: Default Workflow</h4>
                    <p className="text-xs opacity-90 leading-relaxed">Showing standard clearance steps because no custom workflow template is configured for this organization.</p>
                  </div>
                </div>
              )}
              <div className="flex-1 divide-y divide-border/40 mt-2">
                {workflowPreviewSteps.map((item: any, idx: number) => (
                  <div key={item.id || idx} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/10 transition-colors">
                    <GripVertical className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", item.color + "/20")}>
                      <Shield className={cn("w-4 h-4", item.color.replace("bg-", "text-"))} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <div className="flex items-center gap-2 w-44">
                      <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shrink-0", item.color)}>
                        {item.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{item.assignee}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{item.role}</p>
                      </div>
                    </div>
                    <span className={cn("text-[10px] font-bold w-16 text-right", item.required ? "text-foreground" : "text-muted-foreground")}>
                      {item.required ? "Required" : "Optional"}
                    </span>
                    <Switch
                      checked={item.enabled ?? true}
                      disabled={true}
                    />
                    <ChevronDown className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4 — Assets */}
          {step === 4 && (
            <div className="bg-card border border-border/50 rounded-2xl flex-1 flex flex-col">
              <div className="p-6 border-b border-border/40 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-foreground">Asset Declaration</h2>
                  <p className="text-xs text-muted-foreground mt-1">Add assets assigned to the employee and configure return requirements.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="h-9 px-4 rounded-xl text-xs font-semibold border-border/60 bg-background gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Add Asset
                  </Button>
                  <Button className="h-9 px-4 rounded-xl text-xs font-semibold bg-primary gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> Bulk Import
                  </Button>
                </div>
              </div>
              <div className="mx-6 mt-6 mb-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-4 py-3 rounded-xl flex items-start gap-3 animate-in fade-in duration-500">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-wider mb-0.5">⚠ Asset Tracking Module Not Configured Yet</h4>
                  <p className="text-xs opacity-90 leading-relaxed">Asset tracking functionality is coming soon. The data below is a placeholder preview of the upcoming interface.</p>
                </div>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/10">
                      {["Asset", "Asset ID", "Category", "Status", "Return Type", "Condition", "Actions"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {assets.map(asset => {
                      const Icon = asset.icon;
                      const isPending = asset.status === "Pending Return";
                      return (
                        <tr key={asset.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                <Icon className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-bold text-foreground">{asset.name}</p>
                                {asset.sub && <p className="text-[10px] text-muted-foreground">{asset.sub}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-muted-foreground">{asset.id}</td>
                          <td className="px-4 py-3.5 text-foreground/80">{asset.category}</td>
                          <td className="px-4 py-3.5">
                            <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border",
                              isPending ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            )}>
                              {asset.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-foreground/80">{asset.returnType}</td>
                          <td className="px-4 py-3.5">
                            {asset.condition ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" /> {asset.condition}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1">
                              <button className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                              <button className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 border-t border-border/30 text-[11px] text-muted-foreground">
                Showing {assets.length} of {assets.length} assets
              </div>
              {/* Asset Return Instructions */}
              <div className="mx-6 mb-6 border border-border/40 rounded-xl">
                <button className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-foreground hover:bg-muted/20 rounded-xl transition-colors">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-muted-foreground" />
                    <span>Asset Return Instructions</span>
                    <AlertCircle className="w-3.5 h-3.5 text-muted-foreground/50" />
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
                <div className="px-4 pb-3 text-[11px] text-muted-foreground">Add instructions for asset return and handover process.</div>
              </div>
            </div>
          )}

          {/* STEP 5 — Review & Confirm */}
          {step === 5 && (
            <div className="bg-card border border-border/50 rounded-2xl flex-1 flex flex-col">
              <div className="p-6 border-b border-border/40 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-foreground">Review & Confirm</h2>
                  <p className="text-xs text-muted-foreground mt-1">Review all information before creating the exit case.</p>
                </div>
                <Button variant="outline" className="h-9 px-4 rounded-xl text-xs font-semibold border-border/60 bg-background gap-1.5">
                  <Pencil className="w-3.5 h-3.5" /> Edit All
                </Button>
              </div>
              <div className="p-6 space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  {/* Employee card */}
                  <div className="border border-border/40 rounded-xl p-4 bg-background/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <span className="text-xs font-extrabold text-foreground">Employee</span>
                    </div>
                    <p className="text-sm font-extrabold text-foreground">{selectedUser?.name || "Sengottayan S"}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{selectedUser?.employeeId || "EMP-1056"}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{selectedUser?.role || "Product Manager"}</p>
                  </div>
                  {/* Exit Details card */}
                  <div className="border border-border/40 rounded-xl p-4 bg-background/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="text-xs font-extrabold text-foreground">Exit Details</span>
                    </div>
                    {[
                      ["Resignation Date", format(resignDate, "dd MMM yyyy")],
                      ["Last Working Day", format(lwd, "dd MMM yyyy")],
                      ["Notice Period", `${noticeDays} Days`],
                      ["Exit Reason", EXIT_REASONS.find(r => r.value === reason)?.label || "—"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between py-0.5">
                        <span className="text-[10px] text-muted-foreground">{k}</span>
                        <span className={cn("text-[10px] font-bold text-foreground", (k === "Last Working Day" || k === "Resignation Date") && "text-amber-400")}>{v}</span>
                      </div>
                    ))}
                  </div>
                  {/* Clearance Workflow card */}
                  <div className="border border-border/40 rounded-xl p-4 bg-background/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <Shield className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <span className="text-xs font-extrabold text-foreground">Clearance Workflow</span>
                    </div>
                    {["6 Departments", "5 Required", "1 Optional", "6 Sequential Workflow"].map(v => (
                      <p key={v} className="text-[11px] text-muted-foreground py-0.5">{v}</p>
                    ))}
                  </div>
                  {/* Assets card */}
                  <div className="border border-border/40 rounded-xl p-4 bg-background/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Monitor className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <span className="text-xs font-extrabold text-foreground">Assets</span>
                    </div>
                    {["6 Assets Declared", "4 Physical", "2 Digital", "All assets to be returned"].map(v => (
                      <p key={v} className="text-[11px] text-muted-foreground py-0.5">{v}</p>
                    ))}
                  </div>
                  {/* Handover card */}
                  <div className="border border-border/40 rounded-xl p-4 bg-background/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <ClipboardCheck className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <span className="text-xs font-extrabold text-foreground">Handover</span>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground">Handover Manager</span>
                      <span className="text-[10px] font-bold text-foreground">Rahul Mehta</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-muted-foreground">Handover Status</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="text-[10px] font-bold text-foreground">In Progress</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-1">Knowledge Transfer</p>
                    <p className="text-xs font-extrabold text-foreground mb-1.5">60% Completed</p>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: "60%" }} />
                    </div>
                  </div>
                  {/* Additional Information card */}
                  <div className="border border-border/40 rounded-xl p-4 bg-background/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-500/10 flex items-center justify-center">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <span className="text-xs font-extrabold text-foreground">Additional Information</span>
                    </div>
                    {[
                      ["Employment Type", "Full Time"],
                      ["Department:", selectedUser?.dept || "Product"],
                      ["Location", "—"],
                      ["Manager", "Rahul Mehta"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between py-0.5">
                        <span className="text-[10px] text-muted-foreground">{k}</span>
                        <span className="text-[10px] font-bold text-foreground">{v}</span>
                      </div>
                    ))}
                    {notes && (
                      <div className="mt-2 pt-2 border-t border-border/30">
                        <p className="text-[10px] text-muted-foreground">Additional Comments</p>
                        <p className="text-[10px] text-foreground mt-0.5">{notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info banner */}
                <div className="flex items-center gap-2.5 p-4 border border-border/40 rounded-xl bg-muted/20">
                  <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                  <p className="text-[11px] text-muted-foreground">Once created, the exit case will be visible to all assigned stakeholders and the clearance workflow will be initiated.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer navigation ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-5 mt-auto">
          <Button
            variant="outline"
            onClick={step === 1 ? () => setLocation("/cases") : handlePrev}
            className="h-10 px-5 rounded-xl text-xs font-semibold border-border/60 bg-background gap-1.5"
          >
            {step === 1 ? "Cancel" : <><ArrowLeft className="w-3.5 h-3.5" /> Back</>}
          </Button>
          <div className="flex gap-2">
            {step > 1 && step < 5 && (
              <Button variant="outline" className="h-10 px-5 rounded-xl text-xs font-semibold border-border/60 bg-background">
                Save Draft
              </Button>
            )}
            {step < 5 ? (
              <Button
                onClick={handleNext}
                disabled={!canNext}
                className="h-10 px-6 rounded-xl text-xs font-bold bg-primary shadow-md shadow-primary/20 gap-1.5"
              >
                Next Step <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" className="h-10 px-5 rounded-xl text-xs font-semibold border-border/60 bg-background gap-1.5">
                  <Upload className="w-3.5 h-3.5" /> Save Draft
                </Button>
                <Button
                  onClick={handleCreate}
                  className="h-10 px-6 rounded-xl text-xs font-bold bg-primary shadow-md shadow-primary/20 gap-1.5"
                >
                  Create Exit Case <CheckCircle2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right sidebar ─────────────────────────────────────────────────── */}
      <div className="w-[260px] shrink-0 border-l border-border/40 pl-5 pr-4 pt-4 md:pt-6 pb-8 overflow-y-auto bg-card/20">
        <SidePanel
          step={step}
          selectedUser={selectedUser}
          lwd={lwd}
          reason={reason}
          selectedDepts={[]}
        />
      </div>

      <Dialog open={!!successData} onOpenChange={(open) => {
        if (!open) {
          setSuccessData(null);
          setLocation("/cases");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center text-xl">Exit Case Created</DialogTitle>
            <DialogDescription className="text-center text-xs">
              The case has been successfully initiated and workflow tasks have been generated.
            </DialogDescription>
          </DialogHeader>
          {successData && (
            <div className="space-y-3 my-4">
              <div className="flex justify-between border-b border-border/40 pb-2 text-sm">
                <span className="text-muted-foreground">Case ID</span>
                <span className="font-mono font-medium text-foreground">{successData.caseId}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2 text-sm">
                <span className="text-muted-foreground">Employee</span>
                <span className="font-medium text-foreground">{successData.employee}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2 text-sm">
                <span className="text-muted-foreground">Workflow Applied</span>
                <span className="font-medium text-foreground">{successData.workflow}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2 text-sm">
                <span className="text-muted-foreground">Tasks Generated</span>
                <span className="font-medium text-emerald-500">{successData.stepsGenerated} Tasks</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expected Completion</span>
                <span className="font-medium text-foreground">
                  {format(new Date(successData.expectedCompletionDate), "MMM dd, yyyy")}
                </span>
              </div>
            </div>
          )}
          <DialogFooter className="sm:justify-center flex-col sm:flex-col gap-2 mt-2">
            <Button className="w-full h-10 rounded-xl" onClick={() => setLocation(`/cases/${successData?.caseId}`)}>
              View Case Details
            </Button>
            <Button variant="outline" className="w-full h-10 rounded-xl border-border/60" onClick={() => {
              setSuccessData(null);
              setLocation("/cases");
            }}>
              Return to Cases list
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
