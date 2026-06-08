import { useAuth } from "@/hooks/useAuth";
import { Redirect, Link } from "wouter";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Users, ArrowRightLeft, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { isAdmin } = useAuth();

  if (!isAdmin) return <Redirect to="/dashboard" />;

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader title="System Settings" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center mb-2">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <CardTitle>Departments</CardTitle>
            <CardDescription>Configure SLA hours, mandatory flags, and default assignees.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings/departments">
              <Button variant="outline" className="w-full">Configure Departments</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center mb-2">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
            </div>
            <CardTitle>Workflows</CardTitle>
            <CardDescription>Set department execution order and SLA warning thresholds.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings/workflows">
              <Button variant="outline" className="w-full">Edit Workflows</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center mb-2">
              <ListChecks className="w-5 h-5 text-primary" />
            </div>
            <CardTitle>Checklist Templates</CardTitle>
            <CardDescription>Edit per-department clearance checklist items.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings/checklists">
              <Button variant="outline" className="w-full">Edit Checklists</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <CardTitle>Users & Roles</CardTitle>
            <CardDescription>Manage system access, roles, and employee directory.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings/users">
              <Button variant="outline" className="w-full">Manage Users</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
