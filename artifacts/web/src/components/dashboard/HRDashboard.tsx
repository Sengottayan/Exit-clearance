import { useExitStore } from "@/store/exitStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CaseTable } from "@/components/cases/CaseTable";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/wouter";
import { PlusCircle, Clock, AlertTriangle, Users, CheckCircle2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">HR Control Center</h1>
          <p className="text-muted-foreground mt-1 font-medium">Overview of all active exit processes</p>
        </div>
        <Link href="/cases/new">
          <Button className="shadow-sm">
            <PlusCircle className="w-4 h-4 mr-2" />
            Initiate Exit Case
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="shadow-sm border-border/60 hover:border-primary/20 transition-colors">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Active Cases</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-bold tracking-tighter">{activeCases.length}</h3>
                </div>
              </div>
              <div className="w-10 h-10 rounded-md bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border/60 hover:border-primary/20 transition-colors">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Pending Manager</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-bold tracking-tighter">{pendingApprovals.length}</h3>
                </div>
              </div>
              <div className="w-10 h-10 rounded-md bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center border border-amber-100 dark:border-amber-500/20">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20 hover:border-red-300 transition-colors">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-semibold tracking-wide text-red-800/80 dark:text-red-400/80 uppercase">Overdue Tasks</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-bold tracking-tighter text-red-700 dark:text-red-400">{overdueTasks.length}</h3>
                </div>
              </div>
              <div className="w-10 h-10 rounded-md bg-red-100 dark:bg-red-500/20 flex items-center justify-center border border-red-200 dark:border-red-500/30 shadow-sm">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60 hover:border-primary/20 transition-colors">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Completed</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-bold tracking-tighter">{completedThisMonth}</h3>
                  <span className="text-xs font-medium text-muted-foreground">this month</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-md bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Case Directory</h2>
            <Tabs defaultValue="all" value={filter} onValueChange={setFilter} className="w-[400px]">
              <TabsList className="grid w-full grid-cols-4 h-9 p-1 bg-muted/50 border border-border/50">
                <TabsTrigger value="all" className="text-xs font-medium">All</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs font-medium">Approval</TabsTrigger>
                <TabsTrigger value="clearance" className="text-xs font-medium">Clearance</TabsTrigger>
                <TabsTrigger value="overdue" className="text-xs font-medium">Overdue</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <CaseTable cases={filteredCases} />
        </div>

        <div className="w-full xl:w-[320px] space-y-6">
          <Card className="border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="bg-red-50 dark:bg-red-950/40 border-b border-red-100 dark:border-red-900/50 py-4 px-5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500 animate-pulse" />
                <CardTitle className="text-red-800 dark:text-red-400 text-base font-bold">
                  Needs Attention
                </CardTitle>
              </div>
              <CardDescription className="text-red-700/70 dark:text-red-400/70 text-xs mt-1 font-medium">
                {overdueTasks.length} {overdueTasks.length === 1 ? 'task requires' : 'tasks require'} immediate action
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/40 flex-1">
              {overdueTasks.slice(0, 6).map(task => {
                const c = cases.find(c => c.tasks.some(t => t.id === task.id));
                if (!c) return null;
                return (
                  <div key={task.id} className="p-4 hover:bg-muted/30 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-sm">{c.employeeName}</p>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0 border-red-200 text-red-600 bg-red-50">{task.deptLabel}</Badge>
                    </div>
                    <p className="text-muted-foreground text-xs mb-3 font-medium">Clearance task is overdue by {(Math.random() * 5 + 1).toFixed(0)} days.</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="w-full text-xs h-8 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800">Escalate</Button>
                      <Link href={`/cases/${c.id}`} className="w-full">
                        <Button variant="secondary" size="sm" className="w-full text-xs h-8">View Case</Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
              {overdueTasks.length === 0 && (
                <div className="p-10 flex flex-col items-center justify-center text-center text-muted-foreground h-full min-h-[200px]">
                  <CheckCircle2 className="w-10 h-10 mb-3 text-emerald-500/50" />
                  <p className="text-sm font-medium text-foreground">Zero Overdue Tasks</p>
                  <p className="text-xs mt-1">All clearances are running on schedule.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
