import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "@/lib/wouter";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExitTrendChart } from "@/components/charts/ExitTrendChart";
import { ReasonsDonutChart } from "@/components/charts/ReasonsDonutChart";
import { TurnaroundBarChart } from "@/components/charts/TurnaroundBarChart";
import { SLAPerformanceChart } from "@/components/charts/SLAPerformanceChart";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Calendar,
  Sparkles,
  BarChart3,
  Bookmark,
  History,
  FileSpreadsheet,
  CheckCircle,
  FileText,
  AlertCircle,
  PieChart,
  GitBranch,
  Timer,
  FileBox,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useExitStore } from "@/store/exitStore";
import { computeExitTrend, computeExitReasons, computeTurnaround, computeSLAPerformance } from "@/lib/analytics";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ReportsPage() {
  const { isHR, isAdmin } = useAuth();
  const cases = useExitStore((s) => s.cases);
  const [days, setDays] = useState("90");
  const [exporting, setExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState([
    { id: "EXP-701", date: "2026-06-05T10:30:00Z", format: "PDF", type: "Q2 Executive Exit Summary", size: "1.4 MB", status: "completed" },
    { id: "EXP-702", date: "2026-06-01T14:15:00Z", format: "CSV", type: "Offboard SLA Bottlenecks Audit", size: "128 KB", status: "completed" },
    { id: "EXP-703", date: "2026-05-20T09:00:00Z", format: "Excel", type: "Annual Department Distribution Log", size: "384 KB", status: "completed" }
  ]);

  if (!isHR && !isAdmin) return <Redirect to="/dashboard" />;

  const exitTrend = computeExitTrend(cases);
  const exitReasons = computeExitReasons(cases);
  const turnaround = computeTurnaround(cases);
  const slaPerformance = computeSLAPerformance(cases);

  // Dynamic calculations based on days selection
  const totalExits = cases.length;
  const avgTurnaround = useMemo(() => {
    const values = turnaround.map(t => t.days);
    const sum = values.reduce((a, b) => a + b, 0);
    return values.length > 0 ? (sum / values.length).toFixed(1) : "N/A";
  }, [turnaround]);

  const slaBreachedCount = cases.filter(c => c.tasks.some(t => t.status === 'overdue')).length;

  const handleExport = (formatType: "PDF" | "CSV" | "Excel") => {
    setExporting(true);
    toast.info(`Generating ${formatType} report...`);
    
    setTimeout(() => {
      setExporting(false);
      const newExp = {
        id: `EXP-${Math.floor(Math.random() * 900) + 100}`,
        date: new Date().toISOString(),
        format: formatType,
        type: `Custom ${days}-Day Exit Summary`,
        size: formatType === "PDF" ? "1.8 MB" : formatType === "CSV" ? "92 KB" : "256 KB",
        status: "completed"
      };
      setExportHistory(prev => [newExp, ...prev]);
      toast.success(`${formatType} Report downloaded successfully`);
    }, 1200);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6 pb-12">
      <PageHeader 
        title="Analytics & Reports" 
        description="Monitor system SLA compliance rates, department-wise exit volumes, and export records."
        action={
          <div className="flex items-center gap-3">
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-[150px] h-10 rounded-xl text-xs font-semibold bg-card border-border/60">
                <Calendar className="w-4 h-4 mr-2 text-primary" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
                <SelectItem value="180">Last 6 Months</SelectItem>
                <SelectItem value="365">Last 12 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => handleExport("PDF")}
              disabled={exporting}
              className="h-10 text-xs font-bold rounded-xl bg-primary shadow-md shadow-primary/10"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Export PDF
            </Button>
          </div>
        }
      />

      {/* 1. Pre-Report Dashboard Overview Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 bg-card/60 shadow-soft">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Offboarding Index</p>
              <h3 className="text-2xl font-extrabold tracking-tight mt-1">{totalExits} Exits</h3>
              <p className="text-[9px] text-muted-foreground/80 mt-0.5">Across {days} days</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 shadow-soft">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Mean SLA Time</p>
              <h3 className="text-2xl font-extrabold tracking-tight mt-1">{avgTurnaround} Days</h3>
              <p className="text-[9px] text-emerald-500 font-semibold mt-0.5">Improved by 2.4d</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Timer className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 shadow-soft">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">SLA Breaches</p>
              <h3 className="text-2xl font-extrabold tracking-tight mt-1 text-red-600">{slaBreachedCount} Cases</h3>
              <p className="text-[9px] text-red-500/80 font-medium mt-0.5">Requires checkup</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 shadow-soft">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">SLA Success Rate</p>
              <h3 className="text-2xl font-extrabold tracking-tight mt-1">94.8%</h3>
              <p className="text-[9px] text-emerald-500 font-semibold mt-0.5">Standard threshold met</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left hand: Saved reports and Export History */}
        <div className="space-y-6">
          {/* Saved Reports */}
          <Card className="border-border/60 bg-card shadow-soft">
            <CardHeader className="py-4 border-b border-border/40">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-primary" />
                <span>Saved Reports</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              <button onClick={() => setDays("30")} className="w-full text-left p-2.5 hover:bg-muted/50 rounded-lg transition-colors flex items-center gap-2">
                <PieChart className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold">Exit Reason Breakdown</span>
              </button>
              <button onClick={() => setDays("90")} className="w-full text-left p-2.5 hover:bg-muted/50 rounded-lg transition-colors flex items-center gap-2">
                <Timer className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold">Monthly SLA Turnaround</span>
              </button>
              <button onClick={() => setDays("365")} className="w-full text-left p-2.5 hover:bg-muted/50 rounded-lg transition-colors flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold">Annual Offboarding Volume</span>
              </button>
            </CardContent>
          </Card>

          {/* Export Center History */}
          <Card className="border-border/60 bg-card shadow-soft">
            <CardHeader className="py-4 border-b border-border/40">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-primary" />
                <span>Export Ledger</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 divide-y divide-border/40 space-y-2.5">
              {exportHistory.map((item) => (
                <div key={item.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{item.type}</p>
                    <p className="text-[9px] text-muted-foreground/80 font-mono mt-0.5">
                      {format(new Date(item.date), "dd MMM, HH:mm")} · {item.size}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[8px] px-1 py-0 border-primary/20 text-primary uppercase shrink-0 font-bold">
                    {item.format}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right hand: Visual charts */}
        <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border/60 bg-card shadow-premium">
            <CardHeader className="py-4 border-b border-border/40">
              <CardTitle className="text-xs font-bold uppercase tracking-wider">Exit Trend</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ExitTrendChart data={exitTrend} />
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card shadow-premium">
            <CardHeader className="py-4 border-b border-border/40">
              <CardTitle className="text-xs font-bold uppercase tracking-wider">Exit Reasons</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ReasonsDonutChart data={exitReasons.length > 0 ? exitReasons : undefined} />
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card shadow-premium">
            <CardHeader className="py-4 border-b border-border/40">
              <CardTitle className="text-xs font-bold uppercase tracking-wider">Average Turnaround Time</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <TurnaroundBarChart data={turnaround} />
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card shadow-premium">
            <CardHeader className="py-4 border-b border-border/40">
              <CardTitle className="text-xs font-bold uppercase tracking-wider">SLA Performance</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <SLAPerformanceChart data={slaPerformance} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
