import { useState, useEffect } from "react";
import { Link, useLocation } from "@/lib/wouter";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import {
  CalendarIcon,
  Search,
  Lock,
  User,
  Briefcase,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  HardDrive,
  Key,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";
import { MOCK_USERS, DEPARTMENTS, EXIT_REASONS } from "@/lib/constants";
import { buildClearanceTasks, getManagerForEmployee } from "@/lib/workflow";
import { useSettingsStore } from "@/store/settingsStore";
import { Badge } from "@/components/ui/badge";
import { useExitStore } from "@/store/exitStore";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shared/UserAvatar";

export default function NewCasePage() {
  const { isHR, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const addCase = useExitStore(state => state.addCase);
  const workflowTemplates = useSettingsStore((s) => s.workflowTemplates);
  const defaultTemplateId = useSettingsStore((s) => s.workflow.defaultTemplateId);

  const [step, setStep] = useState(1);
  const [workflowTemplateId, setWorkflowTemplateId] = useState(defaultTemplateId);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [search, setSearch] = useState("");
  
  const [lwd, setLwd] = useState<Date>();
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  
  // Simulated Autosave State
  const [saveTime, setSaveTime] = useState<string>("");

  // Step 4: Asset Tracking States
  const [hasLaptop, setHasLaptop] = useState(false);
  const [laptopSerial, setLaptopSerial] = useState("");
  const [hasPhone, setHasPhone] = useState(false);
  const [phoneModel, setPhoneModel] = useState("");
  const [hasBadge, setHasBadge] = useState(false);
  const [badgeNumber, setBadgeNumber] = useState("");
  const [hasKeys, setHasKeys] = useState(false);
  const [otherAssets, setOtherAssets] = useState("");

  const activeTemplate = workflowTemplates.find((t) => t.id === workflowTemplateId) ?? workflowTemplates[0];
  const [selectedDepts, setSelectedDepts] = useState<string[]>(activeTemplate?.deptIds ?? []);

  // Update Autosave timestamp when forms are edited
  useEffect(() => {
    setSaveTime(format(new Date(), "h:mm:ss a"));
  }, [selectedUser, lwd, reason, notes, hasLaptop, laptopSerial, hasPhone, phoneModel, hasBadge, badgeNumber, hasKeys, otherAssets, selectedDepts]);

  const applyTemplate = (templateId: string) => {
    setWorkflowTemplateId(templateId);
    const template = workflowTemplates.find((t) => t.id === templateId);
    if (template) setSelectedDepts([...template.deptIds]);
  };

  if (!isHR && !isAdmin) return <Link href="/dashboard" />;

  const searchResults = MOCK_USERS.filter(u => 
    u.role === 'employee' && 
    (u.name.toLowerCase().includes(search.toLowerCase()) || 
     u.email.toLowerCase().includes(search.toLowerCase()) ||
     u.employeeId.toLowerCase().includes(search.toLowerCase()))
  );

  const noticeDays = lwd ? differenceInDays(lwd, new Date()) : 0;

  const handleNext = () => setStep(s => Math.min(s + 1, 5));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const handleCreate = () => {
    if (!selectedUser || !lwd || !reason) {
      toast.error("Please fill in all mandatory details");
      return;
    }

    const manager = getManagerForEmployee(selectedUser.dept);
    
    // Aggregate assets notes to save in notes
    const assetSummary = [
      hasLaptop ? `Laptop: Yes (Serial: ${laptopSerial})` : "Laptop: No",
      hasPhone ? `Phone: Yes (Model: ${phoneModel})` : "Phone: No",
      hasBadge ? `Badge: Yes (Num: ${badgeNumber})` : "Badge: No",
      hasKeys ? "Office Keys: Yes" : "Office Keys: No",
      otherAssets ? `Other Assets: ${otherAssets}` : "",
    ].filter(Boolean).join(" | ");

    const finalNotes = notes ? `${notes}\n\nAsset Tracking Summary: ${assetSummary}` : `Asset Tracking Summary: ${assetSummary}`;

    addCase({
      employeeId: selectedUser.employeeId,
      employeeName: selectedUser.name,
      employeeEmail: selectedUser.email,
      employeeRole: selectedUser.role,
      employeeDept: selectedUser.dept,
      managerId: manager.id,
      managerName: manager.name,
      status: 'pending_manager',
      resignationDate: new Date().toISOString(),
      lastWorkingDay: lwd.toISOString(),
      noticePeriodDays: noticeDays,
      exitReason: reason,
      tasks: buildClearanceTasks(selectedDepts, undefined, activeTemplate?.slaMultiplier ?? 1),
      tags: [activeTemplate?.name ?? 'Standard Exit'],
      timeline: [
        {
          id: `evt-${Date.now()}`,
          label: 'Exit case created by HR',
          timestamp: new Date().toISOString(),
          actor: 'System Admin',
          actorRole: 'admin'
        }
      ],
      documents: {},
      comments: [
        {
          id: `cmt-${Date.now()}`,
          authorId: "u3",
          authorName: "Anita Desai",
          authorRole: "hr",
          message: `Case created. Selected Departments: ${selectedDepts.join(", ")}. Notice period: ${noticeDays} days.`,
          visibility: "all",
          timestamp: new Date().toISOString()
        }
      ]
    });

    toast.success("Exit case created successfully");
    setLocation("/cases");
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500 pb-12">
      <PageHeader 
        title="New Exit Case" 
        breadcrumbs={[{ label: "Cases", href: "/cases" }, { label: "New Case" }]}
      />

      {/* Stepper Wizard Indicator */}
      <div className="mb-10 relative px-4">
        <div className="absolute left-6 right-6 top-[22px] h-1 bg-muted/60 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.3)]"
            style={{ width: `${((step - 1) / 4) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between relative z-10">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <button 
                onClick={() => {
                  if (i < step || (step === 1 && selectedUser) || (step === 2 && lwd && reason)) {
                    setStep(i);
                  }
                }}
                disabled={i > step && ((step === 1 && !selectedUser) || (step === 2 && (!lwd || !reason)))}
                className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center font-extrabold text-xs transition-all duration-300 ring-4 ring-background cursor-pointer",
                  step > i ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-100" : 
                  step === i ? "bg-primary text-primary-foreground ring-primary/25 scale-110 shadow-xl shadow-primary/25" : 
                  "bg-muted/80 text-muted-foreground scale-95 hover:bg-muted"
                )}
              >
                {step > i ? <CheckCircle2 className="w-5.5 h-5.5 animate-in zoom-in" /> : i}
              </button>
              <span className={cn(
                "text-[9px] font-bold tracking-widest uppercase transition-colors hidden sm:block",
                step >= i ? "text-primary" : "text-muted-foreground/60"
              )}>
                {i === 1 ? "Employee" : i === 2 ? "Details" : i === 3 ? "Clearance" : i === 4 ? "Assets" : "Review"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Wizard Form Card */}
      <Card className="border-border/60 bg-card shadow-premium relative overflow-hidden">
        {/* Autosave header tag */}
        <div className="absolute top-4 right-6 flex items-center gap-1.5 text-[10px] text-muted-foreground/75 font-semibold bg-muted/60 px-2 py-0.5 rounded-full border border-border/50">
          <Clock className="w-3.5 h-3.5 text-emerald-500 animate-pulse-soft" />
          <span>Draft Saved at {saveTime}</span>
        </div>

        {/* Step 1: Select Employee */}
        {step === 1 && (
          <>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-extrabold tracking-tight">Select Employee</CardTitle>
              <CardDescription className="text-xs">Find and select the employee initiating offboarding.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/80" />
                <Input 
                  placeholder="Search by name, ID, or email..." 
                  className="pl-10 h-10 w-full bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-primary/25 rounded-xl font-medium text-xs"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="border rounded-xl divide-y divide-border/40 max-h-[260px] overflow-y-auto bg-background/30">
                {searchResults.map(u => (
                  <div 
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={cn(
                      "flex items-center gap-4 p-3.5 cursor-pointer transition-colors duration-200",
                      selectedUser?.id === u.id ? "bg-primary/[0.04]" : "hover:bg-muted/30"
                    )}
                  >
                    <UserAvatar name={u.name} className="w-9 h-9 border" />
                    <div className="flex-1">
                      <p className="font-bold text-xs text-foreground leading-none">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 font-semibold">{u.role} · {u.dept}</p>
                    </div>
                    <div className="text-[10px] font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border/50">
                      {u.employeeId}
                    </div>
                  </div>
                ))}
                {searchResults.length === 0 && (
                  <div className="p-8 text-center text-xs text-muted-foreground">No employees found matching query.</div>
                )}
              </div>
            </CardContent>
          </>
        )}

        {/* Step 2: Exit Details */}
        {step === 2 && (
          <>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-extrabold tracking-tight">Resignation & Last Working Day</CardTitle>
              <CardDescription className="text-xs font-semibold">Enter offboarding details, timeline, and exit reason.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-foreground/80">Last Working Day</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-semibold text-xs h-10 rounded-xl border-border/60 bg-background", !lwd && "text-muted-foreground")}
                      >
                        {lwd ? format(lwd, "PPP") : <span>Pick exit date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={lwd}
                        onSelect={setLwd}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Notice period warnings / compliance */}
                  {noticeDays > 0 && (
                    <div className={cn(
                      "p-3 rounded-lg flex items-start gap-2 border text-[10px] font-semibold mt-2",
                      noticeDays < 30 ? "bg-amber-500/5 border-amber-500/10 text-amber-600" : "bg-emerald-500/5 border-emerald-500/10 text-emerald-600"
                    )}>
                      {noticeDays < 30 ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                      <div>
                        <p className="leading-none">Notice Period: {noticeDays} days</p>
                        {noticeDays < 30 && (
                          <p className="text-[9px] text-amber-500/80 font-medium mt-1">
                            Warning: Employee has short notice (standard company requirement is 30 days).
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-foreground/80">Exit Reason</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger className="h-10 rounded-xl text-xs font-semibold bg-background border-border/60">
                      <SelectValue placeholder="Select exit reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXIT_REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground/80">Internal Offboard Notes (Optional)</Label>
                <Textarea 
                  placeholder="Leave details regarding transition schedules or compliance warnings..." 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="resize-none h-24 rounded-xl border-border/60 text-xs font-medium bg-background"
                />
              </div>
            </CardContent>
          </>
        )}

        {/* Step 3: Clearance Templates */}
        {step === 3 && (
          <>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-extrabold tracking-tight">Clearance Approvals Pipeline</CardTitle>
              <CardDescription className="text-xs">Select workflow checklist template or toggle optional checkers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {workflowTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => applyTemplate(template.id)}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all duration-200",
                      workflowTemplateId === template.id
                        ? "border-primary bg-primary/[0.02] ring-2 ring-primary/10"
                        : "hover:border-primary/20 hover:bg-muted/20 border-border/60",
                    )}
                  >
                    <p className="font-bold text-xs text-foreground">{template.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{template.description}</p>
                    <p className="text-[9px] font-bold text-primary mt-3 uppercase tracking-wider">{template.deptIds.length} departments</p>
                  </button>
                ))}
              </div>

              {/* Departments checklist list toggle */}
              <div className="space-y-0.5 divide-y divide-border/40 border border-border/60 rounded-xl bg-background/20 overflow-hidden">
                {DEPARTMENTS.map(dept => {
                  const isSelected = selectedDepts.includes(dept.id);
                  return (
                    <div key={dept.id} className="flex items-center justify-between p-3.5 hover:bg-background/40">
                      <div>
                        <p className="font-bold text-xs text-foreground flex items-center gap-1.5">
                          {dept.label}
                          {dept.isMandatory && <Lock className="w-3 h-3 text-muted-foreground opacity-60" />}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">SLA Check: {dept.slaHours} hours</p>
                      </div>
                      {dept.isMandatory ? (
                        <Badge className="bg-secondary text-muted-foreground font-bold text-[9px] uppercase border">Mandatory</Badge>
                      ) : (
                        <Switch 
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedDepts([...selectedDepts, dept.id]);
                            else setSelectedDepts(selectedDepts.filter(id => id !== dept.id));
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </>
        )}

        {/* Step 4: Asset Tracking (NEW STEP) */}
        {step === 4 && (
          <>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-extrabold tracking-tight">Corporate Asset Offboarding</CardTitle>
              <CardDescription className="text-xs">Audit hardware and credentials allocated to this employee.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Laptop Card */}
                <div className={cn("p-4 border rounded-xl space-y-3 transition-colors", hasLaptop ? "border-primary/20 bg-primary/[0.01]" : "border-border/60")}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <HardDrive className="w-4 h-4 text-primary" />
                      <span>Company Laptop</span>
                    </span>
                    <Switch checked={hasLaptop} onCheckedChange={setHasLaptop} />
                  </div>
                  {hasLaptop && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                      <Label className="text-[10px] font-bold text-muted-foreground">Serial / Asset Tag</Label>
                      <Input
                        placeholder="e.g. MAC-PRO-2025-09"
                        className="h-8 text-xs font-semibold rounded-lg border-border/60 mt-1 bg-background"
                        value={laptopSerial}
                        onChange={e => setLaptopSerial(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Phone Card */}
                <div className={cn("p-4 border rounded-xl space-y-3 transition-colors", hasPhone ? "border-primary/20 bg-primary/[0.01]" : "border-border/60")}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <User className="w-4 h-4 text-primary" />
                      <span>Mobile Device</span>
                    </span>
                    <Switch checked={hasPhone} onCheckedChange={setHasPhone} />
                  </div>
                  {hasPhone && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                      <Label className="text-[10px] font-bold text-muted-foreground">Phone Model & Number</Label>
                      <Input
                        placeholder="e.g. iPhone 15 Pro Max"
                        className="h-8 text-xs font-semibold rounded-lg border-border/60 mt-1 bg-background"
                        value={phoneModel}
                        onChange={e => setPhoneModel(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Security Badge Card */}
                <div className={cn("p-4 border rounded-xl space-y-3 transition-colors", hasBadge ? "border-primary/20 bg-primary/[0.01]" : "border-border/60")}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <span>Security Access Badge</span>
                    </span>
                    <Switch checked={hasBadge} onCheckedChange={setHasBadge} />
                  </div>
                  {hasBadge && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                      <Label className="text-[10px] font-bold text-muted-foreground">Badge ID Number</Label>
                      <Input
                        placeholder="e.g. BDG-70891"
                        className="h-8 text-xs font-semibold rounded-lg border-border/60 mt-1 bg-background"
                        value={badgeNumber}
                        onChange={e => setBadgeNumber(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Office Keys Card */}
                <div className={cn("p-4 border rounded-xl flex items-center justify-between transition-colors", hasKeys ? "border-primary/20 bg-primary/[0.01]" : "border-border/60")}>
                  <span className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Key className="w-4 h-4 text-primary" />
                    <span>Office Keys</span>
                  </span>
                  <Switch checked={hasKeys} onCheckedChange={setHasKeys} />
                </div>
              </div>

              {/* Other Assets Info */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground/80">Other Corporate Assets / Credentials</Label>
                <Textarea 
                  placeholder="Specify monitors, credit cards, or software access licenses to return..."
                  value={otherAssets}
                  onChange={e => setOtherAssets(e.target.value)}
                  className="resize-none h-20 rounded-xl border-border/60 text-xs bg-background"
                />
              </div>
            </CardContent>
          </>
        )}

        {/* Step 5: Review & Submit */}
        {step === 5 && (
          <>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-extrabold tracking-tight">Review & Confirm Exit</CardTitle>
              <CardDescription className="text-xs font-semibold">Verify details and checklist setup before starting the exit clearance workflow.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/60">
                <div className="space-y-4">
                  <div className="flex items-start gap-2.5">
                    <User className="w-4.5 h-4.5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Employee Profile</p>
                      <p className="font-bold text-xs text-foreground mt-0.5">{selectedUser?.name}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold">{selectedUser?.role} · {selectedUser?.dept}</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{selectedUser?.employeeId}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Briefcase className="w-4.5 h-4.5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Exit Reason</p>
                      <p className="font-bold text-xs text-foreground mt-0.5">{EXIT_REASONS.find(r => r.value === reason)?.label}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-2.5">
                    <CalendarIcon className="w-4.5 h-4.5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Offboard Dates</p>
                      <p className="font-bold text-xs text-foreground mt-0.5">LWD: {lwd ? format(lwd, 'dd MMM yyyy') : ''}</p>
                      <p className="text-[10px] font-bold text-muted-foreground mt-0.5 flex items-center gap-1">
                        <span>Notice period: {noticeDays} days</span>
                        {noticeDays < 30 && <Badge variant="outline" className="border-red-500/20 bg-red-500/5 text-red-600 text-[8px] py-0 px-1 font-bold animate-pulse-soft">Short Notice</Badge>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <ClipboardList className="w-4.5 h-4.5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Clearance Pipeline</p>
                      <p className="font-bold text-xs text-foreground mt-0.5">{selectedDepts.length} Checkers Active</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5 font-medium max-w-[220px] truncate">
                        {selectedDepts.map(id => DEPARTMENTS.find(d => d.id === id)?.label).join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Asset verification row */}
              <div className="p-4 border border-border/60 bg-background/50 rounded-xl space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Hardware & Assets Audit</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <CheckCircle2 className={cn("w-4 h-4", hasLaptop ? "text-primary" : "text-muted-foreground opacity-30")} />
                    <span className={hasLaptop ? "text-foreground" : "text-muted-foreground/50"}>Laptop</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <CheckCircle2 className={cn("w-4 h-4", hasPhone ? "text-primary" : "text-muted-foreground opacity-30")} />
                    <span className={hasPhone ? "text-foreground" : "text-muted-foreground/50"}>Mobile</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <CheckCircle2 className={cn("w-4 h-4", hasBadge ? "text-primary" : "text-muted-foreground opacity-30")} />
                    <span className={hasBadge ? "text-foreground" : "text-muted-foreground/50"}>Access Card</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <CheckCircle2 className={cn("w-4 h-4", hasKeys ? "text-primary" : "text-muted-foreground opacity-30")} />
                    <span className={hasKeys ? "text-foreground" : "text-muted-foreground/50"}>Keys</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {/* Wizard Footer Controls */}
        <CardFooter className="flex justify-between border-t border-border/40 p-5 bg-muted/10 shrink-0">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={step === 1}
            className="h-10 text-xs font-bold rounded-xl border border-border/50 bg-background/50 hover:bg-background"
          >
            Back Step
          </Button>
          {step < 5 ? (
            <Button 
              onClick={handleNext} 
              disabled={(step === 1 && !selectedUser) || (step === 2 && (!lwd || !reason))}
              className="h-10 text-xs font-bold rounded-xl bg-primary shadow-md shadow-primary/10"
            >
              Next Step
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              className="h-10 text-xs font-bold rounded-xl bg-primary shadow-md shadow-primary/15"
            >
              Create Exit Case
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
