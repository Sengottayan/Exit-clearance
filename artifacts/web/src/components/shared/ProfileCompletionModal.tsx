"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Form, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Building2, ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { PhoneInput, COUNTRIES, type PhoneInputValue, getMinDigits, getMaxDigits } from "@/components/shared/PhoneInput";

// ── Departments ───────────────────────────────────────────────────────────────
const ORG_DEPARTMENTS = [
  "Engineering", "Product", "Design", "HR",
  "Finance", "Sales", "Marketing", "IT",
];

// ── Zod validation schema ─────────────────────────────────────────────────────
const profileSchema = z
  .object({
    dept:        z.string().min(1, "Please select a department"),
    countryCode: z.string().default("+91"),
    phoneNumber: z.string().min(1, "Phone number is required"),
  })
  .superRefine((data, ctx) => {
    const num = data.phoneNumber ?? "";
    if (!num) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phoneNumber"],
        message: "Phone number is required",
      });
      return;
    }

    // Digits only
    if (!/^\d+$/.test(num)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phoneNumber"],
        message: "Only digits are allowed in the phone number",
      });
      return;
    }

    // Per-country length check
    const country = COUNTRIES.find((c) => c.code === data.countryCode);
    if (!country) return;

    const min = getMinDigits(country.digits);
    const max = getMaxDigits(country.digits);
    const label = min === max ? `${max} digits` : `${min}–${max} digits`;

    if (num.length < min || num.length > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phoneNumber"],
        message: `${country.name} phone numbers must be ${label} (you entered ${num.length})`,
      });
    }
  });

// ── Props ─────────────────────────────────────────────────────────────────────
interface ProfileCompletionModalProps {
  open: boolean;
  onComplete: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ProfileCompletionModal({ open, onComplete }: ProfileCompletionModalProps) {
  const { user } = useAuth();
  const updateUserProfile = useAuthStore((s) => s.updateUserProfile);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { dept: "", countryCode: "+91", phoneNumber: "" },
  });

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const fullPhone = values.phoneNumber
        ? `${values.countryCode} ${values.phoneNumber}`
        : "";

      const res = await fetch("/api/auth/sync-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_profile",
          userId: user.id,
          dept:   values.dept,
          phone:  fullPhone,
        }),
      });
      if (!res.ok) throw new Error("Failed to update profile");

      const updated = await res.json();
      updateUserProfile({
        dept:        updated.user.dept,
        phone:       updated.user.phone,
        managerId:   updated.user.managerId,
        managerName: updated.user.managerName,
      });
      toast.success("Profile saved — welcome aboard!");
      onComplete();
    } catch {
      toast.error("Could not save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    /**
     * Using Radix Dialog primitives directly instead of the shadcn wrapper so
     * we can:
     *  1. Omit the close (×) button entirely — no button → no way to dismiss
     *  2. Block Escape key via onEscapeKeyDown
     *  3. Block outside-click via onInteractOutside
     * This makes profile completion truly mandatory.
     */
    <DialogPrimitive.Root open={open} onOpenChange={() => { /* intentionally blocked */ }}>
      <DialogPrimitive.Portal>
        {/* Overlay — clicking outside does nothing */}
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0"
        />

        <DialogPrimitive.Content
          /* Block ALL dismiss mechanisms */
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-[440px] -translate-x-1/2 -translate-y-1/2
            rounded-2xl border border-white/10 bg-[#0c0e16] shadow-2xl
            data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
            data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]
            overflow-visible p-0"
          /* No DialogPrimitive.Close rendered → no × button */
        >
          {/* Gradient bar */}
          <div className="h-1.5 w-full rounded-t-2xl bg-gradient-to-r from-primary to-indigo-600" />

          <div className="p-6">
            {/* Header */}
            <div className="mb-5">
              <DialogPrimitive.Title className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
                <Building2 className="w-5 h-5 text-primary" />
                Complete Your Profile
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1.5 text-xs font-medium text-white/50">
                We need a few more details to route your workflows. This cannot be skipped.
              </DialogPrimitive.Description>
            </div>

            {/* Mandatory notice */}
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                Your department and contact info are required before you can access the platform.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                {/* Department */}
                <FormField
                  control={form.control}
                  name="dept"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                        Department <span className="text-primary">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="h-11 border-white/10 bg-white/[0.04] text-white focus:ring-primary/50 rounded-xl">
                          <SelectValue placeholder="Select your department" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#0f1117]">
                          {ORG_DEPARTMENTS.map((d) => (
                            <SelectItem
                              key={d} value={d}
                              className="focus:bg-white/5 cursor-pointer text-white"
                            >
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs text-red-400" />
                    </FormItem>
                  )}
                />

                {/* Phone number */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                    Phone Number <span className="text-primary">*</span>
                  </label>
                  <Controller
                    control={form.control}
                    name="phoneNumber"
                    render={({ field, fieldState }) => (
                      <>
                        <PhoneInput
                          defaultCountry="IN"
                          value={
                            form.watch("countryCode") && field.value
                              ? `${form.watch("countryCode")} ${field.value}`
                              : ""
                          }
                          onChange={(val: PhoneInputValue) => {
                            form.setValue("countryCode", val.countryCode, { shouldValidate: true });
                            field.onChange(val.number);
                          }}
                          disabled={isSubmitting}
                        />
                        {fieldState.error && (
                          <p className="text-xs text-red-400 mt-1">{fieldState.error.message}</p>
                        )}
                      </>
                    )}
                  />
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all duration-300 rounded-xl"
                  >
                    {isSubmitting ? "Saving…" : "Save Profile & Continue →"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
