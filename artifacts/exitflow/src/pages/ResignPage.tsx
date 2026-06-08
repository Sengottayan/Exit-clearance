import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Redirect, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useExitStore } from "@/store/exitStore";
import { EXIT_REASONS } from "@/lib/constants";
import { getManagerForEmployee } from "@/lib/workflow";
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
import { CalendarIcon } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

const resignSchema = z.object({
  lastWorkingDay: z.date({ required_error: "Last working day is required" }),
  reason: z.string().min(1, "Please select a reason"),
  notes: z.string().optional(),
  acknowledged: z.boolean().refine(val => val === true, "You must acknowledge this action"),
});

export default function ResignPage() {
  const { user, isEmployee } = useAuth();
  const cases = useExitStore(state => state.cases);
  const addCase = useExitStore(state => state.addCase);
  const [, setLocation] = useLocation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const myCase = cases.find(c => c.employeeId === user?.employeeId);

  const form = useForm<z.infer<typeof resignSchema>>({
    resolver: zodResolver(resignSchema),
    defaultValues: { acknowledged: false, notes: "" },
  });

  const lwd = form.watch("lastWorkingDay");
  const noticeDays = lwd ? differenceInDays(lwd, new Date()) : 0;

  if (!isEmployee) return <Redirect to="/dashboard" />;
  if (myCase) {
    toast.error("You already have an active exit process");
    return <Redirect to="/dashboard" />;
  }

  function onSubmit() {
    setConfirmOpen(true);
  }

  function onConfirm() {
    const data = form.getValues();
    
    // Create new case structure
    // Since we don't have a real backend, we construct the object here
    // In reality, this would just be an API call
    if (user) {
      const manager = getManagerForEmployee(user.dept);
      addCase({
        employeeId: user.employeeId,
        employeeName: user.name,
        employeeEmail: user.email,
        employeeRole: user.role,
        employeeDept: user.dept,
        managerId: manager.id,
        managerName: manager.name,
        status: "pending_manager",
        resignationDate: new Date().toISOString(),
        lastWorkingDay: data.lastWorkingDay.toISOString(),
        noticePeriodDays: noticeDays,
        exitReason: data.reason,
        tasks: [],
        timeline: [
          {
            id: `evt-${Date.now()}`,
            label: 'Resignation submitted',
            timestamp: new Date().toISOString(),
            actor: user.name,
            actorRole: 'employee'
          }
        ],
        documents: {}
      });
      
      toast.success("Resignation submitted successfully");
      setLocation("/dashboard");
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader 
        title="Submit Resignation" 
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Resign" }]}
      />

      <Card>
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
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date <= new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {noticeDays > 0 && (
                        <FormDescription>
                          Notice period: <strong className={noticeDays < 30 ? "text-amber-600" : ""}>{noticeDays} days</strong>
                        </FormDescription>
                      )}
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
                          <SelectTrigger>
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
                    <FormLabel>Resignation Note (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional details or message to your manager..." 
                        className="resize-none min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="acknowledged"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/30">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-medium text-destructive">
                        I understand this action cannot be undone
                      </FormLabel>
                      <FormDescription>
                        Submitting this form officially triggers your exit process. HR and your manager will be notified immediately.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Link href="/dashboard">
                  <Button variant="ghost" type="button">Cancel</Button>
                </Link>
                <Button type="submit" disabled={!form.formState.isValid}>Submit Resignation</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

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
