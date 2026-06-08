import { useExitStore } from "@/store/exitStore";
import { useAuth } from "@/hooks/useAuth";
import { Redirect, Link } from "wouter";
import { PageHeader } from "@/components/shared/PageHeader";
import { CaseTable } from "@/components/cases/CaseTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function CasesPage() {
  const { user, isHR, isAdmin } = useAuth();
  const cases = useExitStore(state => state.cases);
  const [filter, setFilter] = useState('all');

  if (!isHR && !isAdmin) return <Redirect to="/dashboard" />;

  let filteredCases = cases;
  if (filter === 'pending') filteredCases = cases.filter(c => c.status === 'pending_manager');
  if (filter === 'clearance') filteredCases = cases.filter(c => c.status === 'in_clearance');
  if (filter === 'overdue') filteredCases = cases.filter(c => c.tasks.some(t => t.status === 'overdue'));
  if (filter === 'completed') filteredCases = cases.filter(c => c.status === 'completed');

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader 
        title="Exit Cases" 
        action={
          <Link href="/cases/new">
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              New Case
            </Button>
          </Link>
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
