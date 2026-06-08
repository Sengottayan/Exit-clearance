import { useExitStore } from "@/store/exitStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaseTable } from "@/components/cases/CaseTable";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { PlusCircle, Clock, AlertTriangle, Users, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function HRDashboard() {
  const cases = useExitStore(state => state.cases);
  const [filter, setFilter] = useState('all');

  const activeCases = cases.filter(c => c.status !== 'completed' && c.status !== 'cancelled');
  const pendingApprovals = cases.filter(c => c.status === 'pending_manager');
  const inClearance = cases.filter(c => c.status === 'in_clearance');
  
  const allTasks = cases.flatMap(c => c.tasks);
  const overdueTasks = allTasks.filter(t => t.status === 'overdue');
  const completedThisMonth = cases.filter(c => c.status === 'completed').length; // Mock, should check dates

  let filteredCases = cases;
  if (filter === 'pending') filteredCases = pendingApprovals;
  if (filter === 'clearance') filteredCases = inClearance;
  if (filter === 'overdue') filteredCases = cases.filter(c => c.tasks.some(t => t.status === 'overdue'));
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">HR Dashboard</h1>
          <p className="text-muted-foreground">Overview of all active exit processes</p>
        </div>
        <Link href="/cases/new">
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" />
            New Exit Case
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Active Cases</p>
              <h3 className="text-2xl font-bold">{activeCases.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Pending Manager</p>
              <h3 className="text-2xl font-bold">{pendingApprovals.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Overdue Tasks</p>
              <h3 className="text-2xl font-bold">{overdueTasks.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Completed (Month)</p>
              <h3 className="text-2xl font-bold">{completedThisMonth}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <Tabs defaultValue="all" value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="all">All ({cases.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending Approval ({pendingApprovals.length})</TabsTrigger>
              <TabsTrigger value="clearance">In Clearance ({inClearance.length})</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>
          </Tabs>

          <Card>
            <CardContent className="p-0">
              <CaseTable cases={filteredCases} />
            </CardContent>
          </Card>
        </div>

        <div className="w-full xl:w-80 space-y-6">
          <Card className="border-red-200 dark:border-red-900/50">
            <CardHeader className="bg-red-50 dark:bg-red-500/5 border-b border-red-100 dark:border-red-900/50 pb-4">
              <CardTitle className="text-red-800 dark:text-red-400 flex items-center text-base">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y">
              {overdueTasks.slice(0, 5).map(task => {
                const c = cases.find(c => c.tasks.some(t => t.id === task.id));
                if (!c) return null;
                return (
                  <div key={task.id} className="p-4 text-sm">
                    <p className="font-medium">{c.employeeName}</p>
                    <p className="text-muted-foreground text-xs mb-2">{task.deptLabel} clearance is overdue</p>
                    <Button variant="outline" size="sm" className="w-full text-xs h-7">Send Reminder</Button>
                  </div>
                );
              })}
              {overdueTasks.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No items need immediate attention.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
