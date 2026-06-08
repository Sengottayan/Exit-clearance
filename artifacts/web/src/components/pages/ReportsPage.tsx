import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "@/lib/wouter";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExitTrendChart } from "@/components/charts/ExitTrendChart";
import { ReasonsDonutChart } from "@/components/charts/ReasonsDonutChart";
import { TurnaroundBarChart } from "@/components/charts/TurnaroundBarChart";
import { SLAPerformanceChart } from "@/components/charts/SLAPerformanceChart";
import { Download, Calendar } from "lucide-react";
import { useExitStore } from "@/store/exitStore";
import { computeExitTrend, computeExitReasons, computeTurnaround, computeSLAPerformance } from "@/lib/analytics";

export default function ReportsPage() {
  const { isHR, isAdmin } = useAuth();
  const cases = useExitStore((s) => s.cases);

  if (!isHR && !isAdmin) return <Redirect to="/dashboard" />;

  const exitTrend = computeExitTrend(cases);
  const exitReasons = computeExitReasons(cases);
  const turnaround = computeTurnaround(cases);
  const slaPerformance = computeSLAPerformance(cases);

  return (
    <div className="animate-in fade-in duration-500 space-y-6 pb-12">
      <PageHeader 
        title="Analytics & Reports" 
        action={
          <div className="flex items-center gap-3">
            <Select defaultValue="90">
              <SelectTrigger className="w-[140px] h-9">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
                <SelectItem value="180">Last 6 Months</SelectItem>
                <SelectItem value="365">Last 12 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Exit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ExitTrendChart data={exitTrend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exit Reasons</CardTitle>
          </CardHeader>
          <CardContent>
            <ReasonsDonutChart data={exitReasons.length > 0 ? exitReasons : undefined} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Turnaround Time</CardTitle>
          </CardHeader>
          <CardContent>
            <TurnaroundBarChart data={turnaround} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SLA Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <SLAPerformanceChart data={slaPerformance} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
