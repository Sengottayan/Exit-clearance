import { useExitStore } from "@/store/exitStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaseTable } from "@/components/cases/CaseTable";
import { Users, FileText, Settings } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function AdminDashboard() {
  const cases = useExitStore(state => state.cases);
  
  const activeCases = cases.filter(c => c.status !== 'completed' && c.status !== 'cancelled').length;
  const completedCases = cases.filter(c => c.status === 'completed').length;
  
  // Fake SLA compliance calculation
  const totalTasks = cases.flatMap(c => c.tasks).length;
  const overdueTasks = cases.flatMap(c => c.tasks).filter(t => t.status === 'overdue').length;
  const slaCompliance = totalTasks > 0 ? Math.round(((totalTasks - overdueTasks) / totalTasks) * 100) : 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and performance metrics</p>
        </div>
        <Link href="/settings">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            System Settings
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Cases</p>
            <h3 className="text-3xl font-bold">{cases.length}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Active Now</p>
            <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400">{activeCases}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">SLA Compliance</p>
            <h3 className={`text-3xl font-bold ${slaCompliance < 90 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {slaCompliance}%
            </h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Avg Completion</p>
            <h3 className="text-3xl font-bold">14<span className="text-lg text-muted-foreground font-normal ml-1">days</span></h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Recent Cases</CardTitle>
              <Link href="/cases">
                <Button variant="ghost" size="sm" className="text-xs">View All</Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <CaseTable cases={cases.slice(0, 5)} showSearch={false} />
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Link href="/settings/users">
                <Button variant="outline" className="w-full justify-start h-12">
                  <Users className="w-4 h-4 mr-3 text-muted-foreground" />
                  Manage Users
                </Button>
              </Link>
              <Link href="/settings/departments">
                <Button variant="outline" className="w-full justify-start h-12">
                  <FileText className="w-4 h-4 mr-3 text-muted-foreground" />
                  Department Configurations
                </Button>
              </Link>
              <Link href="/reports/audit">
                <Button variant="outline" className="w-full justify-start h-12">
                  <FileText className="w-4 h-4 mr-3 text-muted-foreground" />
                  System Audit Trail
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              SLA By Department Chart
              <div className="h-32 mt-4 flex items-end justify-between px-2 opacity-50">
                <div className="w-8 bg-primary rounded-t" style={{height: '80%'}}></div>
                <div className="w-8 bg-primary rounded-t" style={{height: '40%'}}></div>
                <div className="w-8 bg-primary rounded-t" style={{height: '60%'}}></div>
                <div className="w-8 bg-primary rounded-t" style={{height: '100%'}}></div>
                <div className="w-8 bg-primary rounded-t" style={{height: '30%'}}></div>
              </div>
              <p className="mt-4 text-xs">View full analytics in Reports</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
