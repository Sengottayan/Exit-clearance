import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "wouter";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSettingsStore } from "@/store/settingsStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GripVertical, ChevronUp, ChevronDown, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { DeptId } from "@/lib/types";

export default function SettingsWorkflowsPage() {
  const { isAdmin } = useAuth();
  const workflow = useSettingsStore((s) => s.workflow);
  const departments = useSettingsStore((s) => s.departments);
  const updateWorkflow = useSettingsStore((s) => s.updateWorkflow);
  const workflowTemplates = useSettingsStore((s) => s.workflowTemplates);
  const [slaWarning, setSlaWarning] = useState(workflow.slaWarningHours.toString());
  const [escalation, setEscalation] = useState(workflow.escalationHours.toString());
  const [order, setOrder] = useState<DeptId[]>(workflow.deptOrder);

  if (!isAdmin) return <Redirect to="/dashboard" />;

  const orderedDepts = order
    .map((id) => departments.find((d) => d.id === id))
    .filter(Boolean) as typeof departments;

  const moveDept = (index: number, direction: -1 | 1) => {
    const next = [...order];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  };

  const handleSaveSla = () => {
    updateWorkflow({
      slaWarningHours: parseInt(slaWarning, 10) || workflow.slaWarningHours,
      escalationHours: parseInt(escalation, 10) || workflow.escalationHours,
    });
    toast.success("SLA settings saved");
  };

  const handleSaveOrder = () => {
    updateWorkflow({ deptOrder: order });
    toast.success("Department execution order saved");
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12 max-w-3xl mx-auto">
      <PageHeader
        title="Workflow Configuration"
        breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Workflows" }]}
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Workflow Templates
            </CardTitle>
            <CardDescription>
              Pre-configured exit workflows used when HR creates new cases. Set the default template below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {workflowTemplates.map((template) => (
              <div
                key={template.id}
                className={`flex items-start justify-between p-4 border rounded-lg ${workflow.defaultTemplateId === template.id ? "border-primary bg-primary/5" : ""}`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{template.name}</p>
                    {workflow.defaultTemplateId === template.id && (
                      <Badge variant="secondary" className="text-[10px]">Default</Badge>
                    )}
                    {template.slaMultiplier && template.slaMultiplier > 1 && (
                      <Badge variant="outline" className="text-[10px]">{template.slaMultiplier}x SLA</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Departments: {template.deptIds.join(", ")}
                  </p>
                </div>
                {workflow.defaultTemplateId !== template.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updateWorkflow({ defaultTemplateId: template.id });
                      toast.success(`"${template.name}" set as default template`);
                    }}
                  >
                    Set Default
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

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
                  <Input type="number" value={slaWarning} onChange={(e) => setSlaWarning(e.target.value)} />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">hours before due</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">When to show the &quot;Due Soon&quot; amber warning.</p>
              </div>
              <div className="space-y-2">
                <Label>Auto-escalation Timer</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" value={escalation} onChange={(e) => setEscalation(e.target.value)} />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">hours overdue</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">When to notify HR manager about overdue tasks.</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveSla}>Save SLA Settings</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clearance Execution Order</CardTitle>
            <CardDescription>Determine the sequence in which departments receive their clearance tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orderedDepts.map((dept, i) => (
                <div key={dept.id} className="flex items-center gap-3 p-3 bg-card border rounded-md">
                  <GripVertical className="w-5 h-5 text-muted-foreground opacity-50" />
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{dept.label}</p>
                  </div>
                  <div className="text-xs text-muted-foreground mr-2">{dept.isMandatory ? "Mandatory" : "Optional"}</div>
                  <div className="flex flex-col gap-0.5">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveDept(i, -1)} disabled={i === 0}>
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveDept(i, 1)}
                      disabled={i === orderedDepts.length - 1}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveOrder}>Save Order</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
