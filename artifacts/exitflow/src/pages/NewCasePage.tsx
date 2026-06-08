import { useState } from "react";
import { Link, useLocation } from "wouter";
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
import { CalendarIcon, Search, Lock, User, Briefcase, FileText, CheckCircle2 } from "lucide-react";
import { MOCK_USERS, DEPARTMENTS, EXIT_REASONS } from "@/lib/constants";
import { useExitStore } from "@/store/exitStore";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shared/UserAvatar";

export default function NewCasePage() {
  const { isHR, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const addCase = useExitStore(state => state.addCase);
  
  const [step, setStep] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [search, setSearch] = useState("");
  
  const [lwd, setLwd] = useState<Date>();
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  
  const [selectedDepts, setSelectedDepts] = useState<string[]>(
    DEPARTMENTS.filter(d => d.isMandatory).map(d => d.id)
  );

  if (!isHR && !isAdmin) return <Link href="/dashboard" />;

  const searchResults = MOCK_USERS.filter(u => 
    u.role === 'employee' && 
    (u.name.toLowerCase().includes(search.toLowerCase()) || 
     u.email.toLowerCase().includes(search.toLowerCase()) ||
     u.employeeId.toLowerCase().includes(search.toLowerCase()))
  );

  const noticeDays = lwd ? differenceInDays(lwd, new Date()) : 0;

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const handleCreate = () => {
    if (!selectedUser || !lwd || !reason) return;

    addCase({
      employeeId: selectedUser.employeeId,
      employeeName: selectedUser.name,
      employeeEmail: selectedUser.email,
      employeeRole: selectedUser.role,
      employeeDept: selectedUser.dept,
      managerId: 'u2', // Mock
      managerName: 'Rahul Mehta',
      status: 'pending_manager',
      resignationDate: new Date().toISOString(),
      lastWorkingDay: lwd.toISOString(),
      noticePeriodDays: noticeDays,
      exitReason: reason,
      tasks: selectedDepts.map(deptId => {
        const d = DEPARTMENTS.find(dep => dep.id === deptId)!;
        return {
          id: `t-${deptId}-${Date.now()}`,
          deptId: d.id,
          deptLabel: d.label,
          assigneeId: d.defaultAssignee,
          assigneeName: d.label,
          status: 'pending',
          slaHours: d.slaHours,
          slaDueAt: new Date().toISOString(), // Will be updated on manager approval
          checklist: [], // Would normally copy from templates
        };
      }),
      timeline: [
        {
          id: `evt-${Date.now()}`,
          label: 'Exit case created by HR',
          timestamp: new Date().toISOString(),
          actor: 'System Admin',
          actorRole: 'admin'
        }
      ],
      documents: {}
    });

    toast.success("Exit case created successfully");
    setLocation("/cases");
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      <PageHeader 
        title="New Exit Case" 
        breadcrumbs={[{ label: "Cases", href: "/cases" }, { label: "New" }]}
      />

      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-muted -z-10" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-colors z-10",
              step > i ? "bg-primary text-primary-foreground" : 
              step === i ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : 
              "bg-muted text-muted-foreground"
            )}>
              {step > i ? <CheckCircle2 className="w-5 h-5" /> : i}
            </div>
            <span className={cn(
              "text-xs font-medium bg-background px-1",
              step >= i ? "text-foreground" : "text-muted-foreground"
            )}>
              {i === 1 ? "Employee" : i === 2 ? "Details" : i === 3 ? "Clearances" : "Review"}
            </span>
          </div>
        ))}
      </div>

      <Card>
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle>Select Employee</CardTitle>
              <CardDescription>Search for the employee initiating the exit process.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name, ID, or email..." 
                  className="pl-9"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
                {searchResults.map(u => (
                  <div 
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={cn(
                      "flex items-center gap-4 p-3 cursor-pointer transition-colors",
                      selectedUser?.id === u.id ? "bg-primary/5" : "hover:bg-muted/50"
                    )}
                  >
                    <UserAvatar name={u.name} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.role} · {u.dept}</p>
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">{u.employeeId}</div>
                  </div>
                ))}
                {searchResults.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-sm">No employees found.</div>
                )}
              </div>
            </CardContent>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle>Resignation Details</CardTitle>
              <CardDescription>Enter the dates and reason for the exit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Last Working Day</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !lwd && "text-muted-foreground")}
                      >
                        {lwd ? format(lwd, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                  {noticeDays > 0 && <p className="text-xs text-muted-foreground">Notice period: {noticeDays} days</p>}
                </div>
                
                <div className="space-y-2">
                  <Label>Exit Reason</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXIT_REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Internal Notes (Optional)</Label>
                <Textarea 
                  placeholder="Any HR notes regarding this exit..." 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader>
              <CardTitle>Required Clearances</CardTitle>
              <CardDescription>Select which departments need to provide clearance for this exit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0 divide-y border rounded-md">
              {DEPARTMENTS.map(dept => {
                const isSelected = selectedDepts.includes(dept.id);
                return (
                  <div key={dept.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-sm flex items-center gap-2">
                        {dept.label}
                        {dept.isMandatory && <Lock className="w-3 h-3 text-muted-foreground" />}
                      </p>
                      <p className="text-xs text-muted-foreground">SLA: {dept.slaHours} hours</p>
                    </div>
                    {dept.isMandatory ? (
                      <Badge variant="secondary" className="opacity-70 text-xs">Required</Badge>
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
            </CardContent>
          </>
        )}

        {step === 4 && (
          <>
            <CardHeader>
              <CardTitle>Review & Confirm</CardTitle>
              <CardDescription>Review the exit case details before creating.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6 bg-muted/30 p-4 rounded-lg border">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Employee</p>
                      <p className="font-medium text-sm">{selectedUser?.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{selectedUser?.employeeId}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Reason</p>
                      <p className="font-medium text-sm">{EXIT_REASONS.find(r => r.value === reason)?.label}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Dates</p>
                      <p className="font-medium text-sm">LWD: {lwd ? format(lwd, 'dd MMM yyyy') : ''}</p>
                      <p className="text-xs text-muted-foreground">Notice: {noticeDays} days</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Clearances</p>
                      <p className="font-medium text-sm">{selectedDepts.length} departments selected</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )}

        <CardFooter className="flex justify-between border-t p-6 bg-muted/10">
          <Button variant="ghost" onClick={handlePrev} disabled={step === 1}>Back</Button>
          {step < 4 ? (
            <Button 
              onClick={handleNext} 
              disabled={(step === 1 && !selectedUser) || (step === 2 && (!lwd || !reason))}
            >
              Next Step
            </Button>
          ) : (
            <Button onClick={handleCreate}>Create Exit Case</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

// Temporary Badge component for this file
function Badge({ children, variant, className }: any) {
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-secondary text-secondary-foreground", className)}>{children}</span>;
}
