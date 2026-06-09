"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Phone } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const ORG_DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "HR",
  "Finance",
  "Sales",
  "Marketing",
  "IT"
];

const profileSchema = z.object({
  dept: z.string().min(1, "Please select a department"),
  phone: z.string().min(10, "Please enter a valid phone number").optional(),
});

interface ProfileCompletionModalProps {
  open: boolean;
  onComplete: () => void;
}

export function ProfileCompletionModal({ open, onComplete }: ProfileCompletionModalProps) {
  const { user } = useAuth();
  const updateUserProfile = useAuthStore(state => state.updateUserProfile);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      dept: "",
      phone: "",
    },
  });

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/sync-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_profile",
          userId: user.id,
          dept: values.dept,
          phone: values.phone,
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      const updatedData = await res.json();
      
      // Update local auth store
      updateUserProfile({ dept: updatedData.user.dept, phone: updatedData.user.phone, managerId: updatedData.user.managerId, managerName: updatedData.user.managerName });
      
      toast.success("Profile updated successfully!");
      onComplete();
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error("Could not update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px] glass-panel border-white/10 p-0 overflow-hidden hide-close-button">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary to-indigo-600" />
        <div className="p-6">
          <DialogHeader className="mb-6 text-left">
            <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Complete Your Profile
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-1.5 font-medium text-xs">
              Before you can access the dashboard, we need a few more details to properly route your workflows.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="dept"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Department *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="glass border-white/10 h-11 focus:ring-primary/50">
                          <SelectValue placeholder="Select your department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="glass-panel border-white/10">
                        {ORG_DEPARTMENTS.map(d => (
                          <SelectItem key={d} value={d} className="focus:bg-white/5 cursor-pointer">{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <Input 
                          placeholder="+1 (555) 000-0000" 
                          {...field} 
                          className="pl-9 h-11"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-red-400" />
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-8 sm:justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full sm:w-auto font-bold px-6 h-11 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
                >
                  {isSubmitting ? "Saving..." : "Save Profile & Continue"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
