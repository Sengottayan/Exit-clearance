"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Briefcase, Users, Activity, ShieldCheck, Building2, Star } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/hooks/api/useProfile";

interface SectionCardProps {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  loading?: boolean;
}

export function SectionCard({ icon: Icon, iconBg, iconColor, title, subtitle, children, loading }: SectionCardProps) {
  return (
    <Card className="border-border/50 bg-card/60 shadow-soft overflow-hidden rounded-2xl">
      <div className="p-5 border-b border-border/40 flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div>
          <h2 className="text-sm font-extrabold text-foreground">{title}</h2>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="p-5">
        {loading ? <ProfileSkeleton rows={2} /> : children}
      </div>
    </Card>
  );
}

export function ProfileSkeleton({ rows }: { rows: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {Array.from({ length: rows * 2 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

// ── STAT BOX ───────────────────────────────────────────────────────────────────
function StatBox({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div className={`flex items-center gap-3 bg-muted/40 rounded-xl p-4 border border-border/40`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

// ── EMPLOYEE PROFILE SECTION ───────────────────────────────────────────────────
export function EmployeeProfileSection({
  profile, jobTitle, setJobTitle, employeeType, setEmployeeType,
  managerId, setManagerId, dateOfHire, setDateOfHire,
  managers, canEditManager, loading,
}: {
  profile: UserProfile | undefined;
  jobTitle: string; setJobTitle: (v: string) => void;
  employeeType: string; setEmployeeType: (v: string) => void;
  managerId: string; setManagerId: (v: string) => void;
  dateOfHire: Date | undefined; setDateOfHire: (d: Date | undefined) => void;
  managers: any[] | undefined;
  canEditManager: boolean;
  loading: boolean;
}) {
  return (
    <SectionCard
      icon={Briefcase}
      iconBg="bg-blue-500/10"
      iconColor="text-blue-500"
      title="Employment Details"
      subtitle="Your job and organizational structure."
      loading={loading}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-foreground/80">Employee ID</Label>
          <Input disabled value={profile?.employment.employeeId || ""} className="h-10 rounded-xl text-xs font-medium bg-muted border-border/60 opacity-80 cursor-not-allowed" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-foreground/80">Job Title</Label>
          <Input placeholder="e.g. Senior Engineer" value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="h-10 rounded-xl text-xs font-medium bg-background border-border/60" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-foreground/80">Manager (Reporting To)</Label>
          <Select value={managerId} onValueChange={setManagerId} disabled={!canEditManager}>
            <SelectTrigger className={cn("h-10 rounded-xl text-xs font-medium bg-background border-border/60", !canEditManager && "opacity-80 bg-muted cursor-not-allowed")}>
              <SelectValue placeholder="Select manager" />
            </SelectTrigger>
            <SelectContent>
              {managers?.map(m => (
                <SelectItem key={m.memberId} value={m.memberId}>{m.name} ({m.jobTitle})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!canEditManager && <p className="text-[10px] text-muted-foreground mt-1">Contact HR to change manager.</p>}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-foreground/80">Employee Type</Label>
          <Select value={employeeType} onValueChange={setEmployeeType}>
            <SelectTrigger className="h-10 rounded-xl text-xs font-medium bg-background border-border/60">
              <SelectValue placeholder="Select employee type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full_time">Full Time</SelectItem>
              <SelectItem value="part_time">Part Time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="intern">Intern</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-foreground/80">Date of Hire</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full h-10 justify-start text-left font-medium text-xs rounded-xl border-border/60 bg-background hover:bg-background", !dateOfHire && "text-muted-foreground")}>
                {dateOfHire ? format(dateOfHire, "PPP") : <span>Select date</span>}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateOfHire} onSelect={setDateOfHire} initialFocus disabled={(date) => date > new Date()} />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-foreground/80">Status</Label>
          <Input disabled value={profile?.employment.employmentStatus?.replace('_', ' ').toUpperCase() || "ACTIVE"} className="h-10 rounded-xl text-xs font-bold bg-muted border-border/60 opacity-80 text-green-600 cursor-not-allowed" />
        </div>
      </div>
    </SectionCard>
  );
}

// ── MANAGER PROFILE SECTION ────────────────────────────────────────────────────
export function ManagerProfileSection({
  profile, dept, setDept, jobTitle, setJobTitle,
  employeeType, setEmployeeType, dateOfHire, setDateOfHire, loading,
}: {
  profile: UserProfile | undefined;
  dept: string; setDept: (v: string) => void;
  jobTitle: string; setJobTitle: (v: string) => void;
  employeeType: string; setEmployeeType: (v: string) => void;
  dateOfHire: Date | undefined; setDateOfHire: (d: Date | undefined) => void;
  loading: boolean;
}) {
  const DEPARTMENTS = ["Sales", "Engineering", "Marketing", "Finance", "HR", "Operations", "Product", "Design", "Legal", "Admin"];

  return (
    <>
      {/* Team Overview — Read-only live stats */}
      {!loading && profile?.teamStats && (
        <SectionCard
          icon={Users}
          iconBg="bg-violet-500/10"
          iconColor="text-violet-500"
          title="Team Overview"
          subtitle="Live snapshot of your team's status."
        >
          <div className="grid grid-cols-2 gap-4">
            <StatBox label="Direct Reports" value={profile.teamStats.totalReports} icon={Users} color="bg-violet-500/10 text-violet-400" />
            <StatBox label="Active Exits" value={profile.teamStats.activeExits} icon={Activity} color="bg-orange-500/10 text-orange-400" />
          </div>
        </SectionCard>
      )}

      {/* Manager Role Details */}
      <SectionCard
        icon={Briefcase}
        iconBg="bg-blue-500/10"
        iconColor="text-blue-500"
        title="Manager Details"
        subtitle="Your role and department assignment."
        loading={loading}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground/80">Employee ID</Label>
            <Input disabled value={profile?.employment.employeeId || ""} className="h-10 rounded-xl text-xs font-medium bg-muted border-border/60 opacity-80 cursor-not-allowed" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground/80">Designation / Job Title</Label>
            <Input placeholder="e.g. Senior Manager" value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="h-10 rounded-xl text-xs font-medium bg-background border-border/60" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground/80">
              Department <span className="text-red-500">*</span>
              <span className="ml-1 text-[10px] text-muted-foreground font-normal">(Required for dashboard)</span>
            </Label>
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger className="h-10 rounded-xl text-xs font-medium bg-background border-border/60">
                <SelectValue placeholder="Select your department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">Cases assigned to your department will appear in your dashboard.</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground/80">Employment Type</Label>
            <Select value={employeeType} onValueChange={setEmployeeType}>
              <SelectTrigger className="h-10 rounded-xl text-xs font-medium bg-background border-border/60">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_time">Full Time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="part_time">Part Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground/80">Date of Hire</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full h-10 justify-start text-left font-medium text-xs rounded-xl border-border/60 bg-background hover:bg-background", !dateOfHire && "text-muted-foreground")}>
                  {dateOfHire ? format(dateOfHire, "PPP") : <span>Select date</span>}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateOfHire} onSelect={setDateOfHire} initialFocus disabled={(date) => date > new Date()} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground/80">Status</Label>
            <Input disabled value="ACTIVE" className="h-10 rounded-xl text-xs font-bold bg-muted border-border/60 opacity-80 text-green-600 cursor-not-allowed" />
          </div>
        </div>
      </SectionCard>
    </>
  );
}

// ── HR PROFILE SECTION ─────────────────────────────────────────────────────────
export function HRProfileSection({
  profile, jobTitle, setJobTitle, employeeType, setEmployeeType,
  dateOfHire, setDateOfHire, loading,
}: {
  profile: UserProfile | undefined;
  jobTitle: string; setJobTitle: (v: string) => void;
  employeeType: string; setEmployeeType: (v: string) => void;
  dateOfHire: Date | undefined; setDateOfHire: (d: Date | undefined) => void;
  loading: boolean;
}) {
  return (
    <SectionCard
      icon={Star}
      iconBg="bg-rose-500/10"
      iconColor="text-rose-500"
      title="HR Professional Details"
      subtitle="Your HR role and specialization."
      loading={loading}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-foreground/80">Employee ID</Label>
          <Input disabled value={profile?.employment.employeeId || ""} className="h-10 rounded-xl text-xs font-medium bg-muted border-border/60 opacity-80 cursor-not-allowed" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-foreground/80">Job Title / Designation</Label>
          <Input placeholder="e.g. HR Business Partner" value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="h-10 rounded-xl text-xs font-medium bg-background border-border/60" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-foreground/80">HR Specialization</Label>
          <Select value={employeeType} onValueChange={setEmployeeType}>
            <SelectTrigger className="h-10 rounded-xl text-xs font-medium bg-background border-border/60">
              <SelectValue placeholder="Select specialization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="exit">Exit Management</SelectItem>
              <SelectItem value="recruitment">Recruitment</SelectItem>
              <SelectItem value="payroll">Payroll</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
              <SelectItem value="general">General HR</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-foreground/80">Date of Hire</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full h-10 justify-start text-left font-medium text-xs rounded-xl border-border/60 bg-background hover:bg-background", !dateOfHire && "text-muted-foreground")}>
                {dateOfHire ? format(dateOfHire, "PPP") : <span>Select date</span>}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateOfHire} onSelect={setDateOfHire} initialFocus disabled={(date) => date > new Date()} />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-foreground/80">Access Level</Label>
          <Input disabled value="HR OPERATIONS" className="h-10 rounded-xl text-xs font-bold bg-muted border-border/60 opacity-80 text-rose-500 cursor-not-allowed" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-foreground/80">Status</Label>
          <Input disabled value="ACTIVE" className="h-10 rounded-xl text-xs font-bold bg-muted border-border/60 opacity-80 text-green-600 cursor-not-allowed" />
        </div>
      </div>
    </SectionCard>
  );
}

// ── DEPT APPROVER PROFILE SECTION ──────────────────────────────────────────────
export function ApproverProfileSection({
  profile, jobTitle, setJobTitle, loading,
}: {
  profile: UserProfile | undefined;
  jobTitle: string; setJobTitle: (v: string) => void;
  loading: boolean;
}) {
  const AUTHORITY_LABELS: Record<string, string> = {
    primary: "Primary Approver",
    backup: "Backup Approver",
    approver: "Department Approver",
  };

  return (
    <>
      {/* Department Assignments — Read-only live view */}
      {!loading && profile?.departmentAssignments && profile.departmentAssignments.length > 0 && (
        <SectionCard
          icon={Building2}
          iconBg="bg-teal-500/10"
          iconColor="text-teal-500"
          title="Department Assignments"
          subtitle="Departments where you are the clearance approver."
        >
          <div className="space-y-3">
            {profile.departmentAssignments.map((da) => (
              <div key={da.department} className="flex items-center justify-between bg-muted/40 rounded-xl px-4 py-3 border border-border/40">
                <div>
                  <p className="text-xs font-bold text-foreground">{da.deptLabel}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{AUTHORITY_LABELS[da.authority] ?? da.authority}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 font-semibold border border-teal-500/20">
                  {da.authority === 'primary' ? '★ Primary' : 'Backup'}
                </span>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground mt-2">Contact Admin to update department assignments.</p>
          </div>
        </SectionCard>
      )}

      {/* Approver Role Details */}
      <SectionCard
        icon={ShieldCheck}
        iconBg="bg-teal-500/10"
        iconColor="text-teal-500"
        title="Approver Details"
        subtitle="Your clearance authority and role information."
        loading={loading}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground/80">Employee ID</Label>
            <Input disabled value={profile?.employment.employeeId || ""} className="h-10 rounded-xl text-xs font-medium bg-muted border-border/60 opacity-80 cursor-not-allowed" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground/80">Designation</Label>
            <Input placeholder="e.g. IT Manager" value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="h-10 rounded-xl text-xs font-medium bg-background border-border/60" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground/80">Clearance Authority</Label>
            <Input disabled value="DEPARTMENT APPROVER" className="h-10 rounded-xl text-xs font-bold bg-muted border-border/60 opacity-80 text-teal-500 cursor-not-allowed" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground/80">Status</Label>
            <Input disabled value="ACTIVE" className="h-10 rounded-xl text-xs font-bold bg-muted border-border/60 opacity-80 text-green-600 cursor-not-allowed" />
          </div>
        </div>
      </SectionCard>
    </>
  );
}

// ── ADMIN PROFILE SECTION ──────────────────────────────────────────────────────
export function AdminProfileSection({
  profile, jobTitle, setJobTitle, loading,
}: {
  profile: UserProfile | undefined;
  jobTitle: string; setJobTitle: (v: string) => void;
  loading: boolean;
}) {
  return (
    <SectionCard
      icon={ShieldCheck}
      iconBg="bg-amber-500/10"
      iconColor="text-amber-500"
      title="Admin Details"
      subtitle="System administration role and access."
      loading={loading}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-foreground/80">Employee ID</Label>
          <Input disabled value={profile?.employment.employeeId || ""} className="h-10 rounded-xl text-xs font-medium bg-muted border-border/60 opacity-80 cursor-not-allowed" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-foreground/80">Admin Title</Label>
          <Input placeholder="e.g. System Administrator" value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="h-10 rounded-xl text-xs font-medium bg-background border-border/60" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-foreground/80">Access Level</Label>
          <Input disabled value="FULL SYSTEM ACCESS" className="h-10 rounded-xl text-xs font-bold bg-muted border-border/60 opacity-80 text-amber-500 cursor-not-allowed" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-foreground/80">Status</Label>
          <Input disabled value="ACTIVE" className="h-10 rounded-xl text-xs font-bold bg-muted border-border/60 opacity-80 text-green-600 cursor-not-allowed" />
        </div>
        <div className="md:col-span-2 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <p className="text-xs font-bold text-amber-400 mb-1">Administrator Privileges</p>
          <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
            <li>Full read/write access to all exit cases</li>
            <li>Can manage users, roles, and departments</li>
            <li>Access to audit logs and system settings</li>
            <li>Can override clearance decisions</li>
          </ul>
        </div>
      </div>
    </SectionCard>
  );
}
