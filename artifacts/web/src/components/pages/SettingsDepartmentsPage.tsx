import { useAuth } from "@/hooks/useAuth";
import { Redirect, Link } from "@/lib/wouter";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useDepartments, useUpdateDepartment } from "@/hooks/api/useDepartments";
import { useUsers } from "@/hooks/api/useUsers";
import { Department } from "@/lib/types";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function SettingsDepartmentsPage() {
  const { isAdmin } = useAuth();
  const { data: departments = [], isLoading: isLoadingDepts } = useDepartments();
  const { mutate: updateDepartment, isPending: isUpdating } = useUpdateDepartment();
  
  const [activeDept, setActiveDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    slaHours: "",
    assignee: "",
    mandatory: true,
  });

  useEffect(() => {
    if (departments.length > 0 && !activeDept) {
      handleDeptSelect(departments[0]);
    }
  }, [departments, activeDept]);

  const { data: dbUsersResp } = useUsers({ limit: 50 });
  const assignees = dbUsersResp?.data || [];

  if (!isAdmin) return <Redirect to="/dashboard" />;

  const handleDeptSelect = (dept: Department) => {
    setActiveDept(dept);
    setFormData({
      slaHours: dept.slaHours.toString(),
      assignee: dept.defaultAssignee,
      mandatory: dept.isMandatory,
    });
  };

  const handleSave = () => {
    if (!activeDept) return;
    updateDepartment({
      id: activeDept.id,
      updates: {
        slaHours: parseInt(formData.slaHours, 10) || activeDept.slaHours,
        defaultAssignee: formData.assignee,
        isMandatory: formData.mandatory,
      }
    }, {
      onSuccess: () => {
        toast.success(`${activeDept.label} configuration saved successfully`);
      },
      onError: (err: any) => {
        toast.error(`Failed to save: ${err.message}`);
      }
    });
  };

  if (isLoadingDepts) return <div className="p-8">Loading departments...</div>;
  if (!activeDept) return null;

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
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => handleDeptSelect(dept)}
                  className={`w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors ${activeDept.id === dept.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
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
                    onChange={(e) => setFormData({ ...formData, slaHours: e.target.value })}
                  />
                  <span className="text-sm text-muted-foreground">hours</span>
                </div>
              </div>

              <div className="space-y-2 max-w-sm">
                <Label>Default Assignee / Approver Group</Label>
                <Select value={formData.assignee} onValueChange={(val) => setFormData({ ...formData, assignee: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignees.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="space-y-0.5">
                  <Label>Mandatory Clearance</Label>
                  <p className="text-xs text-muted-foreground">
                    If enabled, the final relieving letter cannot be issued until this department approves.
                  </p>
                </div>
                <Switch
                  checked={formData.mandatory}
                  onCheckedChange={(val) => setFormData({ ...formData, mandatory: val })}
                  disabled={["manager", "hr", "it"].includes(activeDept.id)}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Link href="/settings">
                  <Button variant="ghost">Cancel</Button>
                </Link>
                <Button onClick={handleSave} disabled={isUpdating}>
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
