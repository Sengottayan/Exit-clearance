import { useAuth } from "@/hooks/useAuth";
import { Redirect, Link } from "wouter";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DEPARTMENTS, MOCK_USERS } from "@/lib/constants";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function SettingsDepartmentsPage() {
  const { isAdmin } = useAuth();
  const [activeDept, setActiveDept] = useState(DEPARTMENTS[0]);
  const [formData, setFormData] = useState({
    slaHours: activeDept.slaHours.toString(),
    assignee: activeDept.defaultAssignee,
    mandatory: activeDept.isMandatory
  });

  if (!isAdmin) return <Redirect to="/dashboard" />;

  const handleDeptSelect = (dept: any) => {
    setActiveDept(dept);
    setFormData({
      slaHours: dept.slaHours.toString(),
      assignee: dept.defaultAssignee,
      mandatory: dept.isMandatory
    });
  };

  const handleSave = () => {
    toast.success(`${activeDept.label} configuration saved successfully`);
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <PageHeader 
        title="Department Configurations" 
        breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Departments" }]}
      />

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base">Departments</CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y">
              {DEPARTMENTS.map(dept => (
                <button
                  key={dept.id}
                  onClick={() => handleDeptSelect(dept)}
                  className={`w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors ${activeDept.id === dept.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                >
                  <div>
                    <p className="font-medium text-sm">{dept.label}</p>
                    <p className="text-xs text-muted-foreground">{dept.slaHours}h SLA</p>
                  </div>
                  {dept.isMandatory && (
                    <span className="text-[10px] font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                      Required
                    </span>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-2/3">
          <Card>
            <CardHeader>
              <CardTitle>{activeDept.label} Settings</CardTitle>
              <CardDescription>Configure SLA requirements and default assignees for this department.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 max-w-sm">
                <Label>SLA Target (Hours)</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    value={formData.slaHours}
                    onChange={(e) => setFormData({...formData, slaHours: e.target.value})}
                  />
                  <span className="text-sm text-muted-foreground">hours</span>
                </div>
              </div>

              <div className="space-y-2 max-w-sm">
                <Label>Default Assignee / Approver Group</Label>
                <Select value={formData.assignee} onValueChange={(val) => setFormData({...formData, assignee: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_USERS.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name} ({u.role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="space-y-0.5">
                  <Label>Mandatory Clearance</Label>
                  <p className="text-xs text-muted-foreground">If enabled, the final relieving letter cannot be issued until this department approves.</p>
                </div>
                <Switch 
                  checked={formData.mandatory}
                  onCheckedChange={(val) => setFormData({...formData, mandatory: val})}
                  disabled={['manager', 'hr', 'it'].includes(activeDept.id)} // Some core depts can't be made optional
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Link href="/settings"><Button variant="ghost">Cancel</Button></Link>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
