"use client";

import { useAuth } from "@/hooks/useAuth";
import { useCases } from "@/hooks/api/useCases";
import { useRouter } from "next/navigation";
import { getActiveEmployeeCase, getLatestEmployeeCase } from "@/lib/employee-case";
import { GlobalLoading } from "@/components/shared/GlobalLoading";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSignature, FolderOpen } from "lucide-react";
import { Link } from "@/lib/wouter";
import { useEffect } from "react";

export default function Page() {
  const { user, isEmployee } = useAuth();
  const { data: cases = [], isLoading } = useCases();
  const router = useRouter();

  const activeCase = getActiveEmployeeCase(cases, user);
  const latestCase = getLatestEmployeeCase(cases, user);

  useEffect(() => {
    if (isLoading || !user) return;

    if (!isEmployee) {
      router.replace("/cases");
      return;
    }

    if (activeCase) {
      router.replace(`/cases/${activeCase.id}`);
    } else if (latestCase) {
      router.replace(`/cases/${latestCase.id}`);
    }
  }, [isLoading, isEmployee, activeCase, latestCase, user, router]);

  if (isLoading) {
    return <GlobalLoading />;
  }

  // Render a high-fidelity fallback page instead of silently redirecting if they have no active/latest case
  if (!activeCase && !latestCase) {
    return (
      <div className="space-y-6 animate-slide-up pb-12">
        <PageHeader
          title="My Exit Case"
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "My Exit Case" }]}
        />
        <Card className="border-dashed bg-muted/10 border-2 shadow-none rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6 shadow-sm">
              <FolderOpen className="w-8 h-8 text-muted-foreground/60" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">No Exit Case Found</h3>
            <p className="text-muted-foreground mt-2 max-w-sm text-xs font-semibold leading-relaxed">
              You do not have any active or past exit cases recorded. You can submit a resignation to start the clearance process.
            </p>
            <div className="mt-6">
              <Link href="/resign">
                <Button className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary hover:to-indigo-500 font-bold text-xs py-5 rounded-xl border-0 shadow-md">
                  <FileSignature className="w-4 h-4 mr-2" />
                  Initiate Resignation
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <GlobalLoading />;
}
