import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "@/lib/wouter";
import {
  PlusCircle,
  Clock,
  AlertTriangle,
  Users,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Calendar,
  Sparkles,
  Zap,
  FileSpreadsheet,
  FileCheck,
  History,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExitTrendChart } from "@/components/charts/ExitTrendChart";
import { SLAPerformanceChart } from "@/components/charts/SLAPerformanceChart";
import { format } from "date-fns";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useHRDashboard } from "@/lib/api/use-hr-dashboard";

export function HRDashboard() {
  const { data, loading: apiLoading, error } = useHRDashboard();
  const [, setLocation] = useLocation();
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), 650);
    return () => clearTimeout(timer);
  }, []);

  const loading = showSkeleton || apiLoading;

  const overview = data?.overview;
  const overdueTasks = data?.overdueTasks ?? [];
  const timelineEvents = data?.timelineEvents ?? [];
  const exitTrend = data?.exitTrend ?? [];
  const slaPerformance = data?.slaPerformance ?? [];

  const sparklineDataActive = "M 5 25 L 15 22 L 25 28 L 35 15 L 45 18 L 55 10 L 65 15 L 75 8";
  const sparklineDataPending = "M 5 15 L 15 18 L 25 10 L 35 22 L 45 25 L 55 18 L 65 12 L 75 16";
  const sparklineDataOverdue = "M 5 8 L 15 10 L 25 15 L 35 12 L 45 22 L 55 25 L 65 18 L 75 22";
  const sparklineDataCompleted = "M 5 28 L 15 25 L 25 22 L 35 18 L 45 15 L 55 12 L 65 10 L 75 5";

  if (loading) {
    return (
      <div className="space-y-8 pb-8 animate-pulse-soft">
        <div className="h-28 w-full bg-muted rounded-xl animate-shimmer" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-muted border border-border/50 rounded-xl animate-shimmer" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            <div className="h-32 bg-muted border border-border/50 rounded-xl animate-shimmer" />
            <div className="h-80 bg-muted border border-border/50 rounded-xl animate-shimmer" />
          </div>
          <div className="space-y-6">
            <div className="h-56 bg-muted border border-border/50 rounded-xl animate-shimmer" />
            <div className="h-64 bg-muted border border-border/50 rounded-xl animate-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-bold">Failed to load dashboard</h2>
        <p className="text-muted-foreground text-sm max-w-md">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up pb-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-6 md:p-8 text-white shadow-xl shadow-slate-950/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl -translate-y-12 translate-x-12" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-primary tracking-widest uppercase bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
              System Insights
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">HR Control Center</h1>
            <p className="text-slate-300 text-sm max-w-xl font-medium">
              Welcome back. Today is {format(new Date(), "EEEE, d MMM yyyy")}. You have{" "}
              <span className="text-white font-bold underline decoration-primary decoration-2">
                {overview?.overdueTasks ?? 0} clearance tasks
              </span> requiring attention.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setLocation("/cases/new")}
              className="bg-primary hover:bg-primary/95 text-white shadow-md shadow-primary/15 font-semibold text-xs py-5 px-4 rounded-xl flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              Initiate Exit Case
            </Button>
            <Button
              onClick={() => setLocation("/cases")}
              variant="outline"
              className="bg-transparent border-slate-700 hover:bg-slate-800 text-slate-200 text-xs py-5 px-4 rounded-xl font-semibold"
            >
              View Case Directory
            </Button>
          </div>
        </div>
      </div>

      <TooltipProvider>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="shadow-premium hover:shadow-elevated transition-all transition-all-300 group border-border/70 hover:border-primary/30 relative overflow-hidden bg-card/60 backdrop-blur-sm">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-none">
                    Active Cases
                  </p>
                  <h3 className="text-3xl font-extrabold tracking-tight mt-1 group-hover:text-primary transition-colors">
                    {overview?.activeCases ?? 0}
                  </h3>
                </div>
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/10">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+12%</span>
                </div>
                <svg className="w-16 h-6 stroke-blue-500 fill-none" strokeWidth="1.5">
                  <path d={sparklineDataActive} />
                </svg>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-premium hover:shadow-elevated transition-all transition-all-300 group border-border/70 hover:border-primary/30 relative overflow-hidden bg-card/60 backdrop-blur-sm">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-none">
                    Pending Manager
                  </p>
                  <h3 className="text-3xl font-extrabold tracking-tight mt-1">
                    {overview?.pendingApprovals ?? 0}
                  </h3>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/10 cursor-pointer">
                      <Clock className="w-4 h-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Exits waiting manager resignation approval</TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <div className="flex items-center gap-1.5 text-rose-500 text-xs font-semibold">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>-4%</span>
                </div>
                <svg className="w-16 h-6 stroke-amber-500 fill-none" strokeWidth="1.5">
                  <path d={sparklineDataPending} />
                </svg>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-premium hover:shadow-elevated transition-all transition-all-300 border-red-500/20 bg-red-500/[0.02] hover:border-red-500/40 relative overflow-hidden">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 leading-none">
                    Overdue Actions
                  </p>
                  <h3 className="text-3xl font-extrabold tracking-tight mt-1 text-red-600 dark:text-red-400">
                    {overview?.overdueTasks ?? 0}
                  </h3>
                </div>
                <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center border border-red-500/20 shadow-sm animate-pulse-soft">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-red-500/10">
                <span className="text-[10px] font-semibold text-red-600/70 dark:text-red-400/70 uppercase">
                  SLA Breached
                </span>
                <svg className="w-16 h-6 stroke-red-600 fill-none" strokeWidth="1.5">
                  <path d={sparklineDataOverdue} />
                </svg>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-premium hover:shadow-elevated transition-all transition-all-300 group border-border/70 hover:border-primary/30 relative overflow-hidden bg-card/60 backdrop-blur-sm">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-none">
                    Completed Exits
                  </p>
                  <h3 className="text-3xl font-extrabold tracking-tight mt-1">
                    {overview?.completedThisMonth ?? 0}
                  </h3>
                </div>
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/10">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+18%</span>
                </div>
                <svg className="w-16 h-6 stroke-emerald-500 fill-none" strokeWidth="1.5">
                  <path d={sparklineDataCompleted} />
                </svg>
              </div>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <Card className="border-border/60 bg-card/40 backdrop-blur-sm shadow-premium overflow-hidden">
            <CardHeader className="py-4 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-primary" />
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground/80">
                    Quick Action Hub
                  </CardTitle>
                </div>
                <span className="text-[10px] text-muted-foreground font-semibold">HR SHORTCUTS</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/cases/new" className="group p-4 bg-background border border-border/50 hover:border-primary/40 rounded-xl transition-all duration-200 hover:shadow-soft flex flex-col justify-between min-h-[110px]">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center transition-all group-hover:scale-105">
                  <PlusCircle className="w-4.5 h-4.5" />
                </div>
                <div className="mt-4 text-left">
                  <p className="text-xs font-bold text-foreground">Initiate Exit</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Add new exit case</p>
                </div>
              </Link>
              <Link href="/reports" className="group p-4 bg-background border border-border/50 hover:border-primary/40 rounded-xl transition-all duration-200 hover:shadow-soft flex flex-col justify-between min-h-[110px]">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center transition-all group-hover:scale-105">
                  <FileSpreadsheet className="w-4.5 h-4.5" />
                </div>
                <div className="mt-4 text-left">
                  <p className="text-xs font-bold text-foreground">Analytics Report</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Run SLA/funnel metrics</p>
                </div>
              </Link>
              <Link href="/reports/audit" className="group p-4 bg-background border border-border/50 hover:border-primary/40 rounded-xl transition-all duration-200 hover:shadow-soft flex flex-col justify-between min-h-[110px]">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center transition-all group-hover:scale-105">
                  <History className="w-4.5 h-4.5" />
                </div>
                <div className="mt-4 text-left">
                  <p className="text-xs font-bold text-foreground">Compliance Trail</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Verify system actions</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-premium">
              <CardHeader className="py-4 border-b border-border/40 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground/80">Exit Volume Trend</CardTitle>
                  <CardDescription className="text-[10px] mt-0.5">Exits recorded by month</CardDescription>
                </div>
                <Calendar className="w-4 h-4 text-muted-foreground opacity-60" />
              </CardHeader>
              <CardContent className="pt-6">
                <ExitTrendChart data={exitTrend} />
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-premium">
              <CardHeader className="py-4 border-b border-border/40 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground/80">SLA Compliance Rate</CardTitle>
                  <CardDescription className="text-[10px] mt-0.5">Performance index</CardDescription>
                </div>
                <Activity className="w-4 h-4 text-muted-foreground opacity-60" />
              </CardHeader>
              <CardContent className="pt-6">
                <SLAPerformanceChart data={slaPerformance} />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="border-red-200 dark:border-red-950/40 bg-red-500/[0.01] shadow-premium overflow-hidden flex flex-col">
            <CardHeader className="bg-red-500/10 border-b border-red-500/10 py-4 px-5">
              <div className="flex items-center gap-2">
                <Zap className="w-4.5 h-4.5 text-red-600 animate-pulse-soft" />
                <CardTitle className="text-red-900 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
                  Needs Attention
                </CardTitle>
              </div>
              <CardDescription className="text-red-700/80 dark:text-red-400/80 text-[10px] mt-0.5 font-medium">
                {overdueTasks.length} clearances exceed standard SLA due dates
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/40 max-h-[300px] overflow-y-auto">
              {overdueTasks.map((task: any) => (
                <div key={task.id} className="p-4 hover:bg-muted/20 transition-all transition-all-300">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-xs text-foreground leading-none">
                      {task.exit_cases?.employee_name ?? "Unknown"}
                    </p>
                    <Badge variant="outline" className="text-[9px] uppercase font-mono px-1.5 py-0 border-red-500/20 text-red-600 bg-red-500/5">
                      {task.dept_label}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[10px] mt-1 font-medium">
                    Clearance has breached the SLA requirement.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="w-full text-[10px] h-7 border-red-200/60 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold rounded-md">
                      Escalate
                    </Button>
                    <Button
                      onClick={() => setLocation("/cases")}
                      variant="secondary"
                      size="sm"
                      className="w-full text-[10px] h-7 font-semibold rounded-md"
                    >
                      Inspect
                    </Button>
                  </div>
                </div>
              ))}
              {overdueTasks.length === 0 && (
                <div className="p-8 flex flex-col items-center justify-center text-center text-muted-foreground min-h-[180px]">
                  <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-500/40" />
                  <p className="text-xs font-bold text-foreground">All clearances within SLA</p>
                  <p className="text-[10px] mt-0.5 text-muted-foreground/80">Exits are moving on track.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-premium">
            <CardHeader className="py-4 border-b border-border/40 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground/80">Activity Timeline</CardTitle>
              <History className="w-4 h-4 text-muted-foreground opacity-60" />
            </CardHeader>
            <CardContent className="pt-5 px-5">
              <div className="relative pl-4 border-l border-border/60 space-y-6">
                {timelineEvents.map((event: any, idx: number) => (
                  <div key={event.id || idx} className="relative z-10">
                    <span className="absolute -left-[20.5px] top-1 w-3.5 h-3.5 rounded-full border-2 border-background bg-primary flex items-center justify-center shadow-sm" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <UserAvatar name={event.actor} className="w-5 h-5 border shadow-sm shrink-0" />
                        <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">{event.actor}</span>
                        <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                          {format(new Date(event.timestamp), "d MMM")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground pl-7">{event.label}</p>
                      <p className="text-[10px] text-muted-foreground/75 font-medium pl-7 uppercase tracking-wider">
                        {event.employee_name} · {event.employee_dept}
                      </p>
                    </div>
                  </div>
                ))}
                {timelineEvents.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-xs">No recent activity.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
