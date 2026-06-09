import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Redirect, useLocation } from "@/lib/wouter";
import { useAuth } from "@/hooks/useAuth";
import { useCases, useCreateCase } from "@/hooks/api/useCases";
import { EXIT_REASONS } from "@/lib/constants";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertTriangle, CalendarIcon, ExternalLink, ShieldAlert, FileText, CheckCircle2, ArrowRight } from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { getActiveEmployeeCase, getLatestEmployeeCase } from "@/lib/employee-case";
import { Badge } from "@/components/ui/badge";

const resignSchema = z.object({
  lastWorkingDay: z
    .date({ required_error: "Last working day is required" })
    .refine((value) => value > new Date(), "Last working day must be in the future"),
  reason: z.string().min(1, "Please select a reason"),
  notes: z.string().optional(),
  acknowledged: z.boolean().refine(val => val === true, "You must acknowledge this action"),
});

export default function ResignPage() {
  const { user, isEmployee } = useAuth();
  const { data: cases = [], isLoading } = useCases();
  const { mutateAsync: createCase, isPending: isSubmitting } = useCreateCase();
  const [, setLocation] = useLocation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const activeCase = getActiveEmployeeCase(cases, user);
  const latestCase = getLatestEmployeeCase(cases, user);

  const form = useForm<z.infer<typeof resignSchema>>({
    resolver: zodResolver(resignSchema),
    mode: "onChange",
    defaultValues: { acknowledged: false, notes: "" },
  });

  const lwd = useWatch({ control: form.control, name: "lastWorkingDay" });
  const noticeDays = lwd ? differenceInCalendarDays(lwd, new Date()) : 0;

  if (!isEmployee) return <Redirect to="/dashboard" />;
  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
  
  if (activeCase) {
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
        <PageHeader
          title="Submit Resignation"
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Resign" }]}
        />

        <Card className="border-amber-200 dark:border-amber-500/25 bg-amber-50/50 dark:bg-amber-500/10 rounded-2xl shadow-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100 font-extrabold text-base">
              <AlertTriangle className="h-5 w-5 text-amber-600 animate-pulse-soft" />
              Exit Process Already Active
            </CardTitle>
            <CardDescription className="text-amber-800/90 dark:text-amber-100/80 font-medium text-xs leading-relaxed mt-1">
              You already have an active exit case in progress. Open the case to track approvals, timelines, and clearance updates instead of creating a duplicate request.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 pt-2">
            <Link href={`/cases/${activeCase.id}`}>
              <Button className="bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-md">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Active Case
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="font-bold text-xs rounded-xl shadow-sm">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  function onSubmit() {
    setConfirmOpen(true);
  }

  async function onConfirm() {
    const data = form.getValues();
    if (!user) return;

    try {
      const createdCase = await createCase({
        employeeId: user.employeeId,
        employeeName: user.name,
        employeeEmail: user.email,
        employeeRole: user.role,
        employeeDept: user.dept,
        resignationDate: new Date().toISOString(),
        lastWorkingDay: data.lastWorkingDay.toISOString(),
        noticePeriodDays: noticeDays,
        exitReason: data.reason,
      });

      setConfirmOpen(false);
      toast.success("Resignation submitted successfully");
      setLocation(`/cases/${createdCase.id}`);
    } catch {
      toast.error("We couldn't submit your resignation. Please try again.");
    }
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <PageHeader 
        title="Submit Resignation" 
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Resign" }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Notice & Offboarding Policies (FAQ) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-premium rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-extrabold uppercase tracking-widest text-foreground/80 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-primary" />
                <span>Notice Guidelines</span>
              </CardTitle>
              <CardDescription className="text-[10px] font-semibold">Standard corporate departure regulations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 text-xs text-muted-foreground font-semibold leading-relaxed">
              <div className="space-y-1">
                <p className="text-foreground font-bold">Standard Notice Requirement</p>
                <p className="text-[11px]">Your department requires a standard notice period of <strong>30 days</strong>. Selecting a date with less notice requires explicit manager overrides.</p>
              </div>
              <div className="space-y-1">
                <p className="text-foreground font-bold">Clearance Workflow</p>
                <p className="text-[11px]">Upon manager approval, clearances will be initiated across IT, Security, Finance, and HR. You can track approvals live on your dashboard.</p>
              </div>
              <div className="space-y-1">
                <p className="text-foreground font-bold">Asset Handover</p>
                <p className="text-[11px]">All corporate equipment (laptop, phones, access badges) must be returned prior to your last working day to receive final HR relieving documents.</p>
              </div>
              {latestCase && (
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 mt-2">
                  <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Most Recent Case</div>
                  <div className="mt-1 font-bold text-foreground text-xs">{latestCase.id}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground/80 uppercase font-bold">{latestCase.status.replace("_", " ")}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Resignation Submission Form */}
        <Card className="lg:col-span-2 border-border/50 bg-card shadow-premium rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-extrabold tracking-tight">Resignation Details</CardTitle>
            <CardDescription className="text-xs font-semibold">Initiate your formal exit process. Your reporting manager will be notified immediately for initial review and signoff.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="lastWorkingDay"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-xs font-bold text-foreground/80">Proposed Last Working Day</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "h-11 w-full justify-start rounded-xl border-border/60 bg-background font-bold text-xs transition-colors",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                                {field.value ? format(field.value, "PPP") : <span>Select last day</span>}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-xl shadow-premium border-border/40" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date <= new Date()}
                              initialFocus
                              className="[--cell-size:2.5rem]"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-semibold text-muted-foreground/80">Select a future date.</span>
                          {noticeDays > 0 && (
                            <Badge variant="secondary" className={cn("font-bold text-[9px] px-1.5 py-0 border", noticeDays < 30 ? "bg-amber-50 text-amber-700 border-amber-200/50" : "bg-primary/5 text-primary border-primary/20")}>
                              Notice: {noticeDays} days
                            </Badge>
                          )}
                        </FormDescription>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-foreground/80">Primary Reason for Exit</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-xl border-border/60 bg-background font-semibold text-xs transition-colors">
                              <SelectValue placeholder="Select exit reason" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-border/40">
                            {EXIT_REASONS.map((r) => (
                              <SelectItem key={r.value} value={r.value} className="text-xs font-semibold">{r.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-foreground/80">Resignation Note</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide context regarding transition files, active project handovers, or other relevant items..."
                          className="resize-none min-h-[110px] rounded-xl border-border/60 bg-background text-xs font-semibold focus-visible:ring-1 focus-visible:ring-primary/25 focus-visible:border-primary/50"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[10px]">Optional. Keep notes concise and professional.</FormDescription>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="acknowledged"
                  render={({ field }) => (
                    <FormItem className="rounded-xl border border-border/60 bg-muted/20 p-4 shadow-sm">
                      <div className="flex flex-row items-start space-x-3">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5 rounded-md" />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="font-bold text-xs text-foreground">
                            I understand this action is formal and initiates clearances
                          </FormLabel>
                          <FormDescription className="text-[10px] font-semibold leading-relaxed mt-0.5">
                            Submitting this request triggers formal notice period tracking, sets offboarding timelines, and schedules checklists across departments.
                          </FormDescription>
                        </div>
                      </div>
                      <FormMessage className="mt-2 text-[10px]" />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4.5 border-t border-border/40">
                  <Link href="/dashboard">
                    <Button variant="ghost" type="button" className="font-bold text-xs rounded-xl shadow-none">Cancel</Button>
                  </Link>
                  <Button type="submit" disabled={!form.formState.isValid || isSubmitting} className="font-bold text-xs rounded-xl bg-primary text-white shadow-md shadow-primary/10 px-5 h-10">
                    {isSubmitting ? "Submitting..." : "Submit Resignation"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm Resignation Submission"
        description="Are you absolutely sure you want to submit your resignation? This will notify your manager and initiate the formal offboarding workflow."
        confirmLabel="Yes, Submit Resignation"
        variant="destructive"
        onConfirm={onConfirm}
      />
    </div>
  );
}
