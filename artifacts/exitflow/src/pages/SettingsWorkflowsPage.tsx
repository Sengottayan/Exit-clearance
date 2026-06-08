import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "wouter";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DEPARTMENTS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GripVertical } from "lucide-react";

export default function SettingsWorkflowsPage() {
  const { isAdmin } = useAuth();

  if (!isAdmin) return <Redirect to="/dashboard" />;

  return (
    <div className="animate-in fade-in duration-500 pb-12 max-w-3xl mx-auto">
      <PageHeader 
        title="Workflow Configuration" 
        breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Workflows" }]}
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Global SLA Settings</CardTitle>
            <CardDescription>Configure system-wide SLA monitoring thresholds.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>SLA Warning Threshold</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" defaultValue="24" />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">hours before due</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">When to show the "Due Soon" amber warning.</p>
              </div>
              <div className="space-y-2">
                <Label>Auto-escalation Timer</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" defaultValue="48" />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">hours overdue</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">When to notify HR manager about overdue tasks.</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button>Save SLA Settings</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clearance Execution Order</CardTitle>
            <CardDescription>Determine the sequence in which departments receive their clearance tasks. (Visual only for demo)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {DEPARTMENTS.map((dept, i) => (
                <div key={dept.id} className="flex items-center gap-3 p-3 bg-card border rounded-md">
                  <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab opacity-50 hover:opacity-100 transition-opacity" />
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{dept.label}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {dept.isMandatory ? 'Mandatory' : 'Optional'}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button>Save Order</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
