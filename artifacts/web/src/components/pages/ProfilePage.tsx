"use client";

import { useAuth } from "@/hooks/useAuth";
import { useCases } from "@/hooks/api/useCases";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Building2, Hash, ShieldCheck, Calendar, Briefcase, FolderOpen } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Link } from "@/lib/wouter";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: cases = [] } = useCases();

  if (!user) return null;

  // The database exit_cases.employee_id stores the Clerk User ID (user.id), not the mock string user.employeeId
  const myCases = cases.filter((c) => c.employeeId === user.id);

  return (
    <div className="animate-slide-up space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground font-medium mt-1">Manage your account and view employment details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm border-border/80">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <UserAvatar name={user.name} className="w-20 h-20 text-2xl border-2 border-border shadow-md mb-4" />
              <h2 className="text-xl font-bold tracking-tight">{user.name}</h2>
              <Badge variant="secondary" className="mt-2 text-xs font-semibold uppercase tracking-wider">
                {user.role.replace("_", " ")}
              </Badge>
              <p className="text-sm text-muted-foreground mt-3">{user.email}</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-border/80">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Employment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" />
                    Employee ID
                  </p>
                  <p className="font-medium text-sm">{user.employeeId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    Department
                  </p>
                  <p className="font-medium text-sm">{user.dept || "Not assigned"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    Email
                  </p>
                  <p className="font-medium text-sm">{user.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    Role
                  </p>
                  <p className="font-medium text-sm capitalize">{user.role.replace("_", " ")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {user.role === "employee" && (
            <Card className="shadow-sm border-border/80">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-primary" />
                  My Exit Cases
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {myCases.length > 0 ? (
                  <div className="space-y-3">
                    {myCases.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-4 border border-border/60 rounded-xl hover:bg-muted/20 transition-all">
                        <div>
                          <p className="text-sm font-semibold">{c.id}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{c.employeeRole} · {c.employeeDept}</p>
                        </div>
                        <Link href={`/cases/${c.id}`}>
                          <Button variant="outline" size="sm" className="text-xs">View Details</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">No exit cases found.</p>
                    {user.role === "employee" && (
                      <Link href="/resign">
                        <Button variant="link" className="mt-2 text-sm">Submit a resignation</Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
