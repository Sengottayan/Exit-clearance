import { Redirect } from "wouter";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationStore, NotificationType } from "@/store/notificationStore";
import { toast } from "sonner";

const PREF_ITEMS: { key: NotificationType; label: string; description: string }[] = [
  { key: "approval", label: "Approval Requests", description: "Resignation submissions and clearance task assignments" },
  { key: "sla", label: "SLA & Escalations", description: "Overdue tasks and escalated cases" },
  { key: "rejection", label: "Rejections", description: "When a clearance task is rejected" },
  { key: "completion", label: "Completions", description: "When an exit case is fully cleared" },
  { key: "system", label: "System Updates", description: "Case updates, LWD changes, and cancellations" },
];

export default function PreferencesPage() {
  const { user, isAuthenticated } = useAuth();
  const preferences = useNotificationStore((s) => s.preferences);
  const updatePreferences = useNotificationStore((s) => s.updatePreferences);

  if (!isAuthenticated || !user) return <Redirect to="/login" />;

  const userPrefs = preferences[user.id] ?? {
    approval: true,
    sla: true,
    system: true,
    rejection: true,
    completion: true,
  };

  const handleToggle = (key: NotificationType, enabled: boolean) => {
    updatePreferences(user.id, { [key]: enabled });
    toast.success("Preferences saved");
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12 max-w-2xl mx-auto">
      <PageHeader
        title="Notification Preferences"
        description="Choose which in-app notifications you receive."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Preferences" }]}
      />

      <Card>
        <CardHeader>
          <CardTitle>In-App Notifications</CardTitle>
          <CardDescription>
            Control which events trigger notifications in your notification center.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {PREF_ITEMS.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor={item.key} className="text-sm font-medium">
                  {item.label}
                </Label>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <Switch
                id={item.key}
                checked={userPrefs[item.key] ?? true}
                onCheckedChange={(checked) => handleToggle(item.key, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
