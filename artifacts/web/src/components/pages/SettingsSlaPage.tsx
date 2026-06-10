import { useAuth } from "@/hooks/useAuth";
import { Redirect, Link } from "@/lib/wouter";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { usePlatformSettings, useUpdatePlatformSettings } from "@/hooks/api/usePlatformSettings";

export default function SettingsSlaPage() {
  const { isAdmin } = useAuth();
  const { data: settings, isLoading } = usePlatformSettings();
  const { mutate: updateSettings, isPending } = useUpdatePlatformSettings();

  const [formData, setFormData] = useState({
    sla_warning_hours: "24",
    escalation_hours: "48",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        sla_warning_hours: settings.sla_warning_hours.toString(),
        escalation_hours: settings.escalation_hours.toString(),
      });
    }
  }, [settings]);

  if (!isAdmin) return <Redirect to="/dashboard" />;

  const handleSave = () => {
    updateSettings({
      sla_warning_hours: parseInt(formData.sla_warning_hours, 10),
      escalation_hours: parseInt(formData.escalation_hours, 10),
    }, {
      onSuccess: () => toast.success("SLA settings updated successfully"),
      onError: (err: any) => toast.error(`Failed to save: ${err.message}`),
    });
  };

  if (isLoading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <PageHeader
        title="Global SLA Settings"
        breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "SLA Configuration" }]}
      />

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Service Level Agreements</CardTitle>
            <CardDescription>
              Configure global warning and escalation thresholds for tasks that miss their target SLAs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>SLA Warning Threshold (Hours)</Label>
              <div className="flex items-center gap-2 max-w-xs">
                <Input
                  type="number"
                  value={formData.sla_warning_hours}
                  onChange={(e) => setFormData({ ...formData, sla_warning_hours: e.target.value })}
                />
                <span className="text-sm text-muted-foreground">hours</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Number of hours before a task is due to show a warning state.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Escalation Threshold (Hours)</Label>
              <div className="flex items-center gap-2 max-w-xs">
                <Input
                  type="number"
                  value={formData.escalation_hours}
                  onChange={(e) => setFormData({ ...formData, escalation_hours: e.target.value })}
                />
                <span className="text-sm text-muted-foreground">hours</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Number of hours after a task is due to trigger an automatic escalation to managers.
              </p>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Link href="/settings">
                <Button variant="ghost">Cancel</Button>
              </Link>
              <Button onClick={handleSave} disabled={isPending}>
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
