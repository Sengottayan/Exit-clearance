import { useExitStore } from "@/store/exitStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CaseTable } from "@/components/cases/CaseTable";
import { Users, FileText, Settings, Activity, ShieldCheck, Database, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AdminDashboard() {
  const cases = useExitStore(state => state.cases);
  
  const activeCases = cases.filter(c => c.status !== 'completed' && c.status !== 'cancelled').length;
  const completedCases = cases.filter(c => c.status === 'completed').length;
  
  // Fake SLA compliance calculation
  const totalTasks = cases.flatMap(c => c.tasks).length;
  const overdueTasks = cases.flatMap(c => c.tasks).filter(t => t.status === 'overdue').length;
  const slaCompliance = totalTasks > 0 ? Math.round(((totalTasks - overdueTasks) / totalTasks) * 100) : 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Admin</h1>
          <p className="text-muted-foreground font-medium mt-1">Platform overview and configuration</p>
        </div>
        <Link href="/settings">
          <Button className="shadow-sm font-semibold h-10 px-5">
            <Settings className="w-4 h-4 mr-2" />
            System Settings
          </Button>
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="shadow-sm border-border/60 bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center border shadow-sm">
                <Database className="w-5 h-5 text-muted-foreground" />
              </div>
              <Badge variant="outline" className="bg-background text-[10px] font-mono">ALL-TIME</Badge>
            </div>
            <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-1">Total Cases Initiated</p>
            <h3 className="text-4xl font-bold tracking-tighter">{cases.length}</h3>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60 bg-gradient-to-br from-background to-blue-50/20 dark:to-blue-900/10">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-md bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/20 shadow-sm">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <Badge variant="outline" className="bg-background text-blue-600 border-blue-200 text-[10px] font-mono">LIVE</Badge>
            </div>
            <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-1">Active Now</p>
            <h3 className="text-4xl font-bold tracking-tighter text-blue-600 dark:text-blue-500">{activeCases}</h3>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-10 h-10 rounded-md flex items-center justify-center border shadow-sm ${slaCompliance < 90 ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'}`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-1">Platform SLA Score</p>
            <h3 className={`text-4xl font-bold tracking-tighter ${slaCompliance < 90 ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
              {slaCompliance}%
            </h3>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardContent className="p-6">
             <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center border shadow-sm">
                <Activity className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-1">Avg Completion</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-4xl font-bold tracking-tighter">14</h3>
              <span className="text-sm font-medium text-muted-foreground uppercase">days</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <Card className="shadow-sm border-border/80 h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 pb-4 px-6 pt-5">
              <div>
                <CardTitle className="text-lg font-bold">System Case Log</CardTitle>
                <CardDescription className="text-xs mt-1">Live view of all platform activity</CardDescription>
              </div>
              <Link href="/cases">
                <Button variant="secondary" size="sm" className="h-8 font-semibold text-xs px-4">
                  Full Database <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <CaseTable cases={cases.slice(0, 5)} showSearch={false} />
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-1 space-y-6">
          <Card className="shadow-sm border-border/80">
            <CardHeader className="bg-muted/20 border-b pb-4 px-6 pt-5">
              <CardTitle className="text-lg font-bold">Admin Controls</CardTitle>
            </CardHeader>
            <CardContent className="p-5 grid gap-3">
              <Link href="/settings/users">
                <Button variant="outline" className="w-full justify-start h-12 font-medium shadow-sm hover:border-primary/40 group">
                  <div className="w-8 h-8 rounded bg-muted/50 flex items-center justify-center mr-3 group-hover:bg-primary/10 transition-colors">
                    <Users className="w-4 h-4 text-foreground group-hover:text-primary transition-colors" />
                  </div>
                  Manage Users & Roles
                  <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground/40 group-hover:text-primary/70 transition-colors" />
                </Button>
              </Link>
              <Link href="/settings/departments">
                <Button variant="outline" className="w-full justify-start h-12 font-medium shadow-sm hover:border-primary/40 group">
                  <div className="w-8 h-8 rounded bg-muted/50 flex items-center justify-center mr-3 group-hover:bg-primary/10 transition-colors">
                    <Settings className="w-4 h-4 text-foreground group-hover:text-primary transition-colors" />
                  </div>
                  Department Workflows
                  <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground/40 group-hover:text-primary/70 transition-colors" />
                </Button>
              </Link>
              <Link href="/reports/audit">
                <Button variant="outline" className="w-full justify-start h-12 font-medium shadow-sm hover:border-primary/40 group">
                  <div className="w-8 h-8 rounded bg-muted/50 flex items-center justify-center mr-3 group-hover:bg-primary/10 transition-colors">
                    <FileText className="w-4 h-4 text-foreground group-hover:text-primary transition-colors" />
                  </div>
                  System Audit Trail
                  <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground/40 group-hover:text-primary/70 transition-colors" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-secondary/40 border-dashed border-border/80 shadow-none">
            <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[220px]">
              <Activity className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="font-semibold text-sm text-foreground">SLA Analytics Panel</p>
              <p className="text-xs text-muted-foreground font-medium mt-1 px-4">Performance breakdown by department</p>
              
              <div className="w-full h-24 mt-6 flex items-end justify-between px-6 gap-2">
                <div className="w-full bg-primary/20 hover:bg-primary/40 transition-colors rounded-t-sm relative group cursor-pointer" style={{height: '85%'}}>
                   <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">85%</div>
                </div>
                <div className="w-full bg-primary/30 hover:bg-primary/50 transition-colors rounded-t-sm relative group cursor-pointer" style={{height: '60%'}}>
                   <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">60%</div>
                </div>
                <div className="w-full bg-primary/60 hover:bg-primary/80 transition-colors rounded-t-sm relative group cursor-pointer" style={{height: '75%'}}>
                   <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">75%</div>
                </div>
                <div className="w-full bg-primary hover:bg-primary/90 transition-colors rounded-t-sm relative group cursor-pointer" style={{height: '100%'}}>
                   <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-primary opacity-0 group-hover:opacity-100 transition-opacity">100%</div>
                </div>
                <div className="w-full bg-primary/40 hover:bg-primary/60 transition-colors rounded-t-sm relative group cursor-pointer" style={{height: '40%'}}>
                   <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">40%</div>
                </div>
              </div>
              <div className="w-full h-px bg-border my-2"></div>
              <Link href="/reports" className="text-[11px] font-medium text-primary hover:underline uppercase tracking-wide">
                Open Full Analytics Report
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}