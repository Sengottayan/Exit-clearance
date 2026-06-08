import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import CasesPage from "@/pages/CasesPage";
import NewCasePage from "@/pages/NewCasePage";
import CaseDetailPage from "@/pages/CaseDetailPage";
import TasksPage from "@/pages/TasksPage";
import TaskDetailPage from "@/pages/TaskDetailPage";
import ResignPage from "@/pages/ResignPage";
import ReportsPage from "@/pages/ReportsPage";
import AuditPage from "@/pages/AuditPage";
import SettingsPage from "@/pages/SettingsPage";
import SettingsDepartmentsPage from "@/pages/SettingsDepartmentsPage";
import SettingsWorkflowsPage from "@/pages/SettingsWorkflowsPage";
import SettingsUsersPage from "@/pages/SettingsUsersPage";

import { AppShell } from "@/components/layout/AppShell";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      
      <Route path="/dashboard">
        <AppShell><DashboardPage /></AppShell>
      </Route>
      <Route path="/cases">
        <AppShell><CasesPage /></AppShell>
      </Route>
      <Route path="/cases/new">
        <AppShell><NewCasePage /></AppShell>
      </Route>
      <Route path="/cases/:id">
        <AppShell><CaseDetailPage /></AppShell>
      </Route>
      <Route path="/tasks">
        <AppShell><TasksPage /></AppShell>
      </Route>
      <Route path="/tasks/:taskId">
        <AppShell><TaskDetailPage /></AppShell>
      </Route>
      <Route path="/resign">
        <AppShell><ResignPage /></AppShell>
      </Route>
      <Route path="/reports">
        <AppShell><ReportsPage /></AppShell>
      </Route>
      <Route path="/reports/audit">
        <AppShell><AuditPage /></AppShell>
      </Route>
      <Route path="/settings">
        <AppShell><SettingsPage /></AppShell>
      </Route>
      <Route path="/settings/departments">
        <AppShell><SettingsDepartmentsPage /></AppShell>
      </Route>
      <Route path="/settings/workflows">
        <AppShell><SettingsWorkflowsPage /></AppShell>
      </Route>
      <Route path="/settings/users">
        <AppShell><SettingsUsersPage /></AppShell>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
