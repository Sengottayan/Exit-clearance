import { useExitStore } from "@/store/exitStore";
import { useAuth } from "@/hooks/useAuth";
import { Redirect, Link } from "@/lib/wouter";
import { PageHeader } from "@/components/shared/PageHeader";
import { CaseTable } from "@/components/cases/CaseTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { resolveTaskStatus } from "@/lib/workflow";

export default function CasesPage() {
  const { user, isHR, isAdmin, isManager, isEmployee } = useAuth();
  const cases = useExitStore(state => state.cases);
  const [filter, setFilter] = useState('all');

  if (isEmployee) {
    const myCase = cases.find(c => c.employeeId === user?.employeeId);
    if (myCase) return <Redirect to={`/cases/${myCase.id}`} />;
    return <Redirect to="/resign" />;
  }

  if (!isHR && !isAdmin && !isManager) return <Redirect to="/dashboard" />;

  const isManagerOnly = isManager && !isHR && !isAdmin;
  const baseCases = isManagerOnly ? cases.filter(c => c.managerId === user?.id) : cases;

  let filteredCases = baseCases;
  if (filter === 'pending') filteredCases = baseCases.filter(c => c.status === 'pending_manager');
  if (filter === 'clearance') filteredCases = baseCases.filter(c => c.status === 'in_clearance');
  if (filter === 'overdue') filteredCases = baseCases.filter(c => c.tasks.some(t => resolveTaskStatus(t) === 'overdue'));
  if (filter === 'completed') filteredCases = baseCases.filter(c => c.status === 'completed');

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader 
        title={isManagerOnly ? "Team Exits" : "Exit Cases"}
        description={isManagerOnly ? "View and manage exit processes for your direct reports." : undefined}
        action={
          !isManagerOnly ? (
            <Link href="/cases/new">
              <Button>
                <PlusCircle className="w-4 h-4 mr-2" />
                New Case
              </Button>
            </Link>
          ) : undefined
        }
      />

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="clearance">In Clearance</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <CaseTable cases={filteredCases} />
        </CardContent>
      </Card>
    </div>
  );
}
