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
import { AlertTriangle, CalendarIcon, ExternalLink } from "lucide-react";
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
      <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <PageHeader
          title="Submit Resignation"
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Resign" }]}
        />

        <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
              <AlertTriangle className="h-5 w-5" />
              Exit Process Already Active
            </CardTitle>
            <CardDescription className="text-amber-800/90 dark:text-amber-100/80">
              You already have an active exit case in progress. Open the case to track approvals and clearance updates instead of creating a duplicate request.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href={`/cases/${activeCase.id}`}>
              <Button>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Active Case
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
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
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader 
        title="Submit Resignation" 
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Resign" }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Resignation Details</CardTitle>
            <CardDescription>Initiate your exit process. Your manager will be notified for approval.</CardDescription>
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
                        <FormLabel>Proposed Last Working Day</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "h-11 w-full justify-start rounded-xl border-border/60 bg-background font-medium",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-xl" align="start">
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
                        <FormDescription className="flex items-center gap-2">
                          <span>Select a date after today.</span>
                          {noticeDays > 0 && (
                            <Badge variant="secondary" className={cn("font-semibold", noticeDays < 30 && "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200")}>
                              Notice: {noticeDays} days
                            </Badge>
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Reason for Exit</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-xl border-border/60 bg-background">
                              <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {EXIT_REASONS.map((r) => (
                              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resignation Note</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Share context for your manager (handover plan, dates, etc.)"
                          className="resize-none min-h-[120px] rounded-xl border-border/60 bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Optional. Keep it professional and concise.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="acknowledged"
                  render={({ field }) => (
                    <FormItem className="rounded-xl border border-border/60 bg-muted/20 p-4">
                      <div className="flex flex-row items-start space-x-3">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="font-semibold text-foreground">
                            I understand this action cannot be undone
                          </FormLabel>
                          <FormDescription>
                            Submitting triggers the formal clearance workflow and notifications.
                          </FormDescription>
                        </div>
                      </div>
                      <FormMessage className="mt-2" />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
                  <Link href="/dashboard">
                    <Button variant="ghost" type="button">Cancel</Button>
                  </Link>
                  <Button type="submit" disabled={!form.formState.isValid || isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Resignation"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Review before submitting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Employee</span>
              <span className="font-semibold text-foreground truncate">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Department</span>
              <span className="font-semibold text-foreground truncate">{user?.dept || "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Notice</span>
              <span className="font-semibold text-foreground">{noticeDays > 0 ? `${noticeDays} days` : "—"}</span>
            </div>
            {latestCase && (
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Most Recent Case</div>
                <div className="mt-1 font-semibold text-foreground">{latestCase.id}</div>
                <div className="mt-1 text-xs text-muted-foreground">{latestCase.status.replace("_", " ")}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm Resignation Submission"
        description="Are you absolutely sure you want to submit your resignation? This will initiate the formal exit clearance process."
        confirmLabel="Yes, Submit Resignation"
        variant="destructive"
        onConfirm={onConfirm}
      />
    </div>
  );
}
