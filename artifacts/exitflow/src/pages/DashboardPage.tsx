import { useAuth } from "@/hooks/useAuth";
import { EmployeeDashboard } from "@/components/dashboard/EmployeeDashboard";
import { ManagerDashboard } from "@/components/dashboard/ManagerDashboard";
import { HRDashboard } from "@/components/dashboard/HRDashboard";
import { DeptApproverDashboard } from "@/components/dashboard/DeptApproverDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'employee': return <EmployeeDashboard />;
    case 'manager': return <ManagerDashboard />;
    case 'hr': return <HRDashboard />;
    case 'dept_approver': return <DeptApproverDashboard />;
    case 'admin': return <AdminDashboard />;
    default: return <div>Unknown role</div>;
  }
}
