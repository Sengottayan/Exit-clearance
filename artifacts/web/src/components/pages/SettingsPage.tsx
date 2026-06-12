"use client";

import { useAuth } from "@/hooks/useAuth";
import { Redirect, Link } from "@/lib/wouter";
import { Building2, Users, ArrowRightLeft, ListChecks, Activity, CheckCircle2, AlertCircle, Search, ShieldCheck, ChevronRight, Settings, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDepartments, useWorkflowTemplates } from "@/hooks/api/useSettings";
import { useUsers } from "@/hooks/api/useUsers";
import { useAuditLogs } from "@/hooks/api/useAuditLogs";
import { format } from "date-fns";

export default function SettingsPage() {
  const { isAdmin } = useAuth();

  if (!isAdmin) return <Redirect to="/dashboard" />;

  const { data: departments = [], error: departmentsError } = useDepartments();
  const { data: workflowData, error: workflowsError } = useWorkflowTemplates();
  const { data: dbUsersResp, error: usersError } = useUsers();
  
  const workflows = workflowData?.workflows || [];
  const users = Array.isArray(dbUsersResp) ? dbUsersResp : (dbUsersResp?.data || []);

  const { data: auditData } = useAuditLogs({
    page: 1,
    limit: 5,
    type: "all",
    severity: "all",
    search: "",
    from: "",
    to: "",
  });

  const auditItems = auditData?.items ?? [];

  const totalDepts = departments?.length ?? 0;
  const activeWorkflows = workflows?.length ?? 0;
  const checklistTemplatesCount = departments?.filter((d: any) => d.checklist_templates && d.checklist_templates.length > 0).length ?? 0;
  const totalUsersCount = users?.length ?? 0;

  const systemStatus = (departmentsError || workflowsError || usersError) ? "Degraded" : "Healthy";
  const systemStatusColor = systemStatus === "Healthy" ? "text-emerald-500" : "text-amber-500";
  const systemStatusBg = systemStatus === "Healthy" ? "bg-emerald-500/10" : "bg-amber-500/10";

  const stats = [
    { label: "Total Departments", value: String(totalDepts), desc: "Active departments", icon: Building2, color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { label: "Active Workflows", value: String(activeWorkflows), desc: "Configured workflows", icon: ArrowRightLeft, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Checklist Templates", value: String(checklistTemplatesCount), desc: "Department templates", icon: ListChecks, color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: "Total Users", value: String(totalUsersCount), desc: "System users", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "System Status", value: systemStatus, desc: "All systems operational", icon: ShieldCheck, color: systemStatusColor, bg: systemStatusBg, valueColor: systemStatusColor },
  ];

  const activities = auditItems.map((item) => {
    let icon = Building2;
    let iconColor = "text-emerald-500";
    let iconBg = "bg-emerald-500/20";
    let statusColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";

    const typeLower = item.eventType.toLowerCase();
    if (typeLower === "user") {
      icon = Users;
      iconColor = "text-blue-500";
      iconBg = "bg-blue-500/20";
    } else if (typeLower === "task") {
      icon = ListChecks;
      iconColor = "text-purple-500";
      iconBg = "bg-purple-500/20";
    } else if (typeLower === "case") {
      icon = ArrowRightLeft;
      iconColor = "text-orange-500";
      iconBg = "bg-orange-500/20";
    }

    if (item.severity === "error") {
      statusColor = "text-red-400 bg-red-500/10 border-red-500/20";
      iconColor = "text-red-500";
      iconBg = "bg-red-500/20";
    } else if (item.severity === "warn") {
      statusColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
      iconColor = "text-amber-500";
      iconBg = "bg-amber-500/20";
    }

    let timeStr = "";
    try {
      timeStr = format(new Date(item.timestamp), "dd MMM yyyy, hh:mm a");
    } catch {
      timeStr = item.timestamp;
    }

    const text = `${item.actor} performed ${item.action.replace(/_/g, " ")} (${item.details || item.target})`;

    return {
      text,
      time: timeStr,
      status: item.severity.toUpperCase(),
      statusColor,
      icon,
      iconColor,
      iconBg,
    };
  });

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6 md:p-8 font-sans animate-in fade-in duration-500">
      
      {/* Top Header & Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[#8a94a6] text-sm mb-4">
          <span className="hover:text-white cursor-pointer transition-colors">Settings</span>
          <span>›</span>
          <span className="text-white font-medium">System Settings</span>
        </div>
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#11141c] to-[#1a1f35] border border-white/5 rounded-2xl p-6 md:p-8 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-30 pointer-events-none flex items-center justify-end pr-8">
            <Settings className="w-48 h-48 text-indigo-500 absolute -right-10 -top-10 animate-[spin_60s_linear_infinite] opacity-20" />
            <Settings className="w-24 h-24 text-blue-500 absolute right-20 top-10 animate-[spin_40s_linear_infinite_reverse] opacity-20" />
            <Settings className="w-16 h-16 text-purple-500 absolute right-40 bottom-10 animate-[spin_30s_linear_infinite] opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1a1f35] mix-blend-overlay"></div>
          </div>
          
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <Settings className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-2">System Settings</h1>
              <p className="text-[#8a94a6] text-sm md:text-base font-medium">Configure and manage system preferences, workflows, and access controls.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Overview */}
      <div className="bg-[#11141c] border border-white/5 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 text-[#8a94a6] mb-4 text-sm font-medium">
          <Activity className="w-4 h-4" /> Quick Overview
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 divide-x divide-white/5">
          {stats.map((stat, i) => (
            <div key={i} className={`flex items-center gap-4 ${i !== 0 ? 'pl-4' : ''}`}>
              <div className={`w-12 h-12 rounded-xl ${stat.bg} border border-white/5 flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-[#8a94a6] mb-0.5 whitespace-nowrap">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.valueColor || 'text-white'}`}>{stat.value}</p>
                <p className="text-[10px] text-[#8a94a6] whitespace-nowrap">{stat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Departments */}
        <div className="bg-[#11141c] border border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 transition-all group flex flex-col">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Departments</h2>
              <p className="text-xs text-[#8a94a6] leading-relaxed">Configure SLA hours, mandatory clearance flags, and default assignees for each department.</p>
            </div>
          </div>
          <div className="space-y-2 mb-8 flex-1">
            {['Manage department details and hierarchy', 'Set SLA hours and escalation rules', 'Configure mandatory flags', 'Assign default approvers'].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span className="text-xs text-[#cbd5e1]">{item}</span>
              </div>
            ))}
          </div>
          <Link href="/settings/departments">
            <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 font-medium h-10 px-5 rounded-lg border-0 transition-all flex items-center justify-between group-hover:px-6">
              Configure Departments
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Workflows */}
        <div className="bg-[#11141c] border border-white/5 rounded-2xl p-6 hover:border-emerald-500/30 transition-all group flex flex-col">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <ArrowRightLeft className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Workflows</h2>
              <p className="text-xs text-[#8a94a6] leading-relaxed">Define department execution order and SLA warning thresholds.</p>
            </div>
          </div>
          <div className="space-y-2 mb-8 flex-1">
            {['Set execution order for departments', 'Configure SLA warning thresholds', 'Manage auto-escalation timers', 'Enable/disable workflow steps'].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-xs text-[#cbd5e1]">{item}</span>
              </div>
            ))}
          </div>
          <Link href="/settings/workflows">
            <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 font-medium h-10 px-5 rounded-lg border-0 transition-all flex items-center justify-between group-hover:px-6">
              Edit Workflows
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Checklist Templates */}
        <div className="bg-[#11141c] border border-white/5 rounded-2xl p-6 hover:border-orange-500/30 transition-all group flex flex-col">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
              <ListChecks className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Checklist Templates</h2>
              <p className="text-xs text-[#8a94a6] leading-relaxed">Edit per-department clearance checklist items and requirements.</p>
            </div>
          </div>
          <div className="space-y-2 mb-8 flex-1">
            {['Create and edit checklist items', 'Set mandatory and input requirements', 'Reorder checklist items', 'Preview department checklists'].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span className="text-xs text-[#cbd5e1]">{item}</span>
              </div>
            ))}
          </div>
          <Link href="/settings/checklists">
            <Button className="w-full sm:w-auto bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-500/20 font-medium h-10 px-5 rounded-lg border-0 transition-all flex items-center justify-between group-hover:px-6">
              Edit Checklists
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Users & Roles (takes 2 columns) */}
        <div className="md:col-span-2 bg-[#11141c] border border-white/5 rounded-2xl p-6 hover:border-blue-500/30 transition-all group flex flex-col relative overflow-hidden">
          <div className="flex items-start gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Users & Roles</h2>
              <p className="text-xs text-[#8a94a6] leading-relaxed">Manage system access, roles, and employee directory.</p>
            </div>
          </div>
          
          <div className="flex justify-between items-start relative z-10 flex-1">
            <div className="space-y-2 mb-8">
              {['Add, edit, and deactivate users', 'Assign roles and permissions', 'Manage department access', 'Reset passwords and security settings'].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-[#cbd5e1]">{item}</span>
                </div>
              ))}
            </div>
            
            {/* Decorative Graphic for Users card */}
            <div className="hidden sm:flex w-48 h-32 bg-[#0b0e14] border border-white/5 rounded-xl absolute right-6 bottom-6 items-center justify-center shadow-lg">
              <div className="relative w-full h-full p-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 mb-3" />
                <div className="w-24 h-2 bg-white/10 rounded-full mb-2" />
                <div className="w-16 h-2 bg-white/10 rounded-full" />
                <ShieldCheck className="absolute bottom-3 right-3 w-10 h-10 text-blue-500 shadow-xl" />
              </div>
            </div>
          </div>
          
          <Link href="/settings/users" className="relative z-10">
            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 font-medium h-10 px-5 rounded-lg border-0 transition-all flex items-center justify-between group-hover:px-6">
              Manage Users
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Recent System Activity */}
        <div className="bg-[#11141c] border border-white/5 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-white">Recent System Activity</h2>
            <button className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center transition-colors">
              View All <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
          
          <div className="space-y-5 flex-1">
            {activities.length > 0 ? (
              activities.map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className={`w-8 h-8 rounded-full ${item.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white font-medium mb-1 line-clamp-1">{item.text}</p>
                    <p className="text-[10px] text-[#8a94a6]">{item.time}</p>
                  </div>
                  <div className={`text-[9px] px-2 py-0.5 rounded border font-semibold ${item.statusColor}`}>
                    {item.status}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-[#8a94a6]">
                No recent system activity.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Footer Note */}
      <div className="text-center pb-6">
        <p className="text-[#8a94a6] text-xs flex items-center justify-center gap-1.5 opacity-70">
          <Clock className="w-3.5 h-3.5" /> All times are shown in your local time zone (Asia/Kolkata)
        </p>
      </div>

    </div>
  );
}
