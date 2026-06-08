import { useState } from "react";
import { Redirect } from "wouter";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useSettingsStore } from "@/store/settingsStore";
import { DEPARTMENTS } from "@/lib/constants";
import { ChecklistTemplate, DeptId } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsChecklistsPage() {
  const { isAdmin } = useAuth();
  const checklistTemplates = useSettingsStore((s) => s.checklistTemplates);
  const updateChecklistForDept = useSettingsStore((s) => s.updateChecklistForDept);
  const [activeDeptId, setActiveDeptId] = useState<DeptId>(DEPARTMENTS[1].id);

  if (!isAdmin) return <Redirect to="/dashboard" />;

  const activeDept = DEPARTMENTS.find((d) => d.id === activeDeptId)!;
  const items = checklistTemplates[activeDeptId] ?? [];

  const updateItem = (itemId: string, updates: Partial<ChecklistTemplate>) => {
    const updated = items.map((i) => (i.id === itemId ? { ...i, ...updates } : i));
    updateChecklistForDept(activeDeptId, updated);
  };

  const addItem = () => {
    const newItem: ChecklistTemplate = {
      id: `${activeDeptId}-${Date.now()}`,
      label: "New checklist item",
      isMandatory: false,
      hasInput: false,
    };
    updateChecklistForDept(activeDeptId, [...items, newItem]);
    toast.success("Checklist item added");
  };

  const removeItem = (itemId: string) => {
    updateChecklistForDept(
      activeDeptId,
      items.filter((i) => i.id !== itemId),
    );
    toast.success("Item removed");
  };

  const handleSave = () => {
    toast.success(`${activeDept.label} checklist saved`);
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <PageHeader
        title="Checklist Templates"
        breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Checklists" }]}
      />

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base">Departments</CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y">
              {DEPARTMENTS.filter((d) => d.id !== "manager").map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => setActiveDeptId(dept.id)}
                  className={`w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors ${activeDeptId === dept.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                >
                  <div>
                    <p className="font-medium text-sm">{dept.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {(checklistTemplates[dept.id] ?? []).length} items
                    </p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-2/3">
          <Card>
            <CardHeader>
              <CardTitle>{activeDept.label} Checklist</CardTitle>
              <CardDescription>Edit clearance checklist items for this department.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="p-4 border rounded-lg space-y-3 bg-muted/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Item {index + 1}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Label</Label>
                    <Input
                      value={item.label}
                      onChange={(e) => updateItem(item.id, { label: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.isMandatory}
                        onCheckedChange={(v) => updateItem(item.id, { isMandatory: v })}
                      />
                      <Label className="text-sm">Mandatory</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.hasInput}
                        onCheckedChange={(v) => updateItem(item.id, { hasInput: v })}
                      />
                      <Label className="text-sm">Requires input</Label>
                    </div>
                  </div>
                  {item.hasInput && (
                    <div className="space-y-2">
                      <Label>Input label</Label>
                      <Input
                        value={item.inputLabel ?? ""}
                        placeholder="e.g. Asset tag / Serial number"
                        onChange={(e) => updateItem(item.id, { inputLabel: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              ))}

              <Button variant="outline" className="w-full" onClick={addItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add Checklist Item
              </Button>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSave}>Save Checklist</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
