"use client";

import { useAuth } from "@/hooks/useAuth";
import { useCases } from "@/hooks/api/useCases";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SLARiskChip } from "@/components/shared/SLARiskChip";
import { CaseTimeline } from "@/components/cases/CaseTimeline";
import { formatDate, cn } from "@/lib/utils";
import { differenceInCalendarDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  FileText, CheckCircle2, Circle, AlertCircle, Clock, Lock, ShieldCheck,
  ExternalLink, FileSignature, Mail, Phone, Slack, Layers,
  CalendarClock, TrendingDown, Info, ChevronRight, Sparkles
} from "lucide-react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/wouter";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { resolveTaskStatus } from "@/lib/workflow";
import { getActiveEmployeeCase, getLatestEmployeeCase } from "@/lib/employee-case";
import { useState, useEffect } from "react";
import { ProfileCompletionModal } from "@/components/shared/ProfileCompletionModal";

export function EmployeeDashboard() {
  const { user } = useAuth();
  const { data: cases, isLoading } = useCases();
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (user && !user.dept && !isLoading) {
      setShowProfileModal(true);
    }
  }, [user, isLoading]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          <p className="text-xs text-muted-foreground font-semibold">Loading your exit process...</p>
        </div>
      </div>
    );
  }

  const myCase = getActiveEmployeeCase(cases || [], user) || getLatestEmployeeCase(cases || [], user);
  const firstName = user.name?.split(' ')[0] || "Employee";

  if (!myCase) {
    return (
      <div className="space-y-6 animate-slide-up pb-8 bg-[#0b0f19] min-h-screen text-slate-200">
        <ProfileCompletionModal open={showProfileModal} onComplete={() => setShowProfileModal(false)} />
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white tracking-tight">Good morning, {firstName} 👋</h1>
        </div>
        <Card className="border border-white/5 bg-[#121927] rounded-xl shadow-md p-8 text-center flex flex-col items-center max-w-2xl mx-auto mt-12">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
            <Icons.ShieldCheck className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Active Exit Process</h2>
          <p className="text-slate-400 text-sm max-w-md mb-8">
            You do not currently have an active resignation or exit process. If you are looking to initiate a resignation, please proceed to the resignation portal.
          </p>
          <Link href="/resign">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-lg">
              Submit Resignation
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const lwd = new Date(myCase.lastWorkingDay);
  const today = new Date();
  const daysRemaining = differenceInCalendarDays(lwd, today);

  const approvedCount = myCase.tasks.filter((t) => t.status === "approved").length;
  const clearanceProgress = (approvedCount / myCase.tasks.length) * 100;

  return (
    <div className="space-y-6 animate-slide-up pb-8 bg-[#0b0f19] min-h-screen text-slate-200">
      <ProfileCompletionModal open={showProfileModal} onComplete={() => setShowProfileModal(false)} />
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left / Main Column */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Main Welcome Card */}
          <Card className="border border-white/5 bg-[#121927] rounded-xl overflow-hidden shadow-md relative">
            {/* Top Bar inside card */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">Good morning, {firstName} <span className="inline-block origin-[70%_70%] animate-[wave_2.5s_infinite]">👋</span></h1>
              </div>
              <Badge variant="outline" className="font-mono text-[11px] bg-[#1e2a4f] text-[#8ab4f8] border-[#3b5998]/50 px-2.5 py-0.5 rounded-md">
                {myCase.id}
              </Badge>
            </div>
            
            <CardContent className="p-6">
              <p className="text-sm text-slate-400 mb-8">Here's your exit clearance overview</p>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                {/* Employee Info */}
                <div className="flex items-center gap-4">
                  <UserAvatar name={user?.name || "Employee"} className="w-16 h-16 text-xl bg-pink-500 text-white font-bold" />
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">{user?.name}</h2>
                    <p className="text-sm text-slate-400 mb-1">{user?.dept} Department</p>
                    <p className="text-xs text-slate-500">Manager: <span className="text-[#8ab4f8] font-medium">{myCase.managerName}</span></p>
                  </div>
                </div>

                {/* Vertical Divider hidden on mobile */}
                <div className="hidden md:block w-px h-16 bg-white/10" />

                {/* Status & LWD */}
                <div className="flex-1">
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-1 font-medium">Status</p>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-semibold text-sm tracking-wide">{myCase.status.replace(/_/g, ' ')}</span>
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20 px-2">Pending</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1 font-medium">Last Working Day</p>
                    <div className="flex items-center gap-2 text-slate-200">
                      <Icons.Calendar className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-sm">{formatDate(myCase.lastWorkingDay)}</span>
                    </div>
                  </div>
                </div>

                {/* Vertical Divider hidden on mobile */}
                <div className="hidden md:block w-px h-16 bg-white/10" />

                {/* Circular Progress */}
                <div className="flex items-center justify-center min-w-[120px]">
                  <ProgressRing
                    value={clearanceProgress}
                    label={`${Math.round(clearanceProgress)}%`}
                    sublabel="Completed"
                    size={110}
                    strokeWidth={8}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border border-white/5 bg-[#121927] rounded-xl p-5 hover:bg-[#161f30] transition-colors group">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Icons.ShieldCheck className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-300">Progress</span>
                </div>
                <div className="mt-auto">
                  <p className="text-2xl font-bold text-white mb-2">{Math.round(clearanceProgress)}%</p>
                  <p className="text-xs text-slate-500">{approvedCount} of {myCase.tasks.length} tasks completed</p>
                  <div className="h-1 w-full bg-white/10 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${clearanceProgress}%` }} />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border border-white/5 bg-[#121927] rounded-xl p-5 hover:bg-[#161f30] transition-colors">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Icons.ArrowDownToLine className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-300">Pending Approvals</span>
                </div>
                <div className="mt-auto">
                  <p className="text-2xl font-bold text-white mb-2">{myCase.tasks.length - approvedCount}</p>
                  <p className="text-xs text-slate-500">Awaiting action</p>
                </div>
              </div>
            </Card>

            <Card className="border border-white/5 bg-[#121927] rounded-xl p-5 hover:bg-[#161f30] transition-colors">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Icons.Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-300">Days Remaining</span>
                </div>
                <div className="mt-auto">
                  <p className="text-2xl font-bold text-white mb-2">{Math.max(0, daysRemaining)}</p>
                  <p className="text-xs text-slate-500">Till last working day</p>
                </div>
              </div>
            </Card>

            <Card className="border border-white/5 bg-[#121927] rounded-xl p-5 hover:bg-[#161f30] transition-colors">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Icons.FileText className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-300">Documents</span>
                </div>
                <div className="mt-auto">
                  <p className="text-2xl font-bold text-white mb-2">{myCase.documents?.attachments?.length || 0}</p>
                  <p className="text-xs text-slate-500">Uploaded documents</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Clearance Workflow Stepper */}
          <Card className="border border-white/5 bg-[#121927] rounded-xl p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Clearance Workflow</h3>
                <p className="text-xs text-slate-500">Track your exit clearance progress</p>
              </div>
              <Link href={`/cases/${myCase.id}`}>
                <Button variant="outline" size="sm" className="bg-[#1e2a4f]/50 border-white/10 hover:bg-[#1e2a4f] text-slate-300">
                  View Full Workflow
                </Button>
              </Link>
            </div>

            <div className="relative">
              {/* Connector Line */}
              <div className="absolute top-[18px] left-[10%] right-[10%] h-[1px] bg-white/10 border-t border-dashed border-white/20" />
              
              <div className="relative z-10 flex justify-between">
                {[
                  { label: "Manager", status: "completed", date: "09 Jun 2026", icon: Icons.CheckCircle2 },
                  { label: "HR", status: "completed", date: "09 Jun 2026", icon: Icons.CheckCircle2 },
                  { label: "IT", status: "in_progress", date: "In Progress", icon: Icons.MonitorSmartphone },
                  { label: "Finance", status: "pending", date: "Pending", icon: Icons.Landmark },
                  { label: "Admin", status: "pending", date: "Pending", icon: Icons.Building2 }
                ].map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center w-24 text-center">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center mb-3 bg-[#0f1525] border-2",
                      step.status === "completed" ? "border-emerald-500 text-emerald-500" :
                      step.status === "in_progress" ? "border-blue-500 text-blue-500" :
                      "border-slate-700 text-slate-500"
                    )}>
                      <step.icon className="w-4 h-4" />
                    </div>
                    <span className={cn("text-xs font-bold mb-1", step.status === "completed" ? "text-white" : "text-slate-400")}>{step.label}</span>
                    <span className={cn("text-[10px]", step.status === "completed" ? "text-slate-400" : step.status === "in_progress" ? "text-blue-400" : "text-slate-600")}>
                      {step.status === "completed" ? "Completed" : step.date}
                    </span>
                    {step.status === "completed" && <span className="text-[9px] text-slate-500 mt-0.5">{step.date}</span>}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Activity Timeline */}
          <Card className="border border-white/5 bg-[#121927] rounded-xl flex flex-col h-[320px]">
            <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-white/5">
              <h3 className="text-sm font-bold text-white">Activity Timeline</h3>
              <Link href={`/cases/${myCase.id}?tab=timeline`} className="text-xs text-blue-400 hover:text-blue-300 font-medium">View all</Link>
            </div>
            <CardContent className="p-5 flex-1 overflow-y-auto custom-scrollbar">
              <div className="space-y-5">
                {myCase.timeline?.slice(0, 4).map((event, idx) => (
                  <div key={event.id} className="relative pl-4 border-l border-white/10 last:border-transparent pb-1">
                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-[#121927]" />
                    <p className="text-[10px] text-slate-500 mb-1">{formatDate(event.timestamp)}</p>
                    <p className="text-xs font-semibold text-slate-200">{event.label}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{event.actor} - {event.actorRole.replace('_', ' ')}</p>
                  </div>
                ))}
                {!myCase.timeline?.length && (
                  <p className="text-xs text-slate-500">No activity recorded yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Actions */}
          <Card className="border border-white/5 bg-[#121927] rounded-xl">
            <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-white/5">
              <h3 className="text-sm font-bold text-white">Pending Actions</h3>
              <Link href={`/cases/${myCase.id}`} className="text-xs text-blue-400 hover:text-blue-300 font-medium">View all</Link>
            </div>
            <CardContent className="p-5">
              <div className="space-y-4">
                {[
                  { label: "Manager Approval", due: "Due today", icon: "user", color: "text-pink-400 bg-pink-500/10" },
                  { label: "NDA Sign-off", due: "Due tomorrow", icon: "file", color: "text-blue-400 bg-blue-500/10" },
                  { label: "Return Laptop", due: "Due in 2 days", icon: "monitor", color: "text-purple-400 bg-purple-500/10" }
                ].map((action, idx) => (
                  <div key={idx} className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", action.color)}>
                        {action.icon === "user" && <Icons.User className="w-4 h-4" />}
                        {action.icon === "file" && <Icons.FileText className="w-4 h-4" />}
                        {action.icon === "monitor" && <Icons.Monitor className="w-4 h-4" />}
                      </div>
                      <span className="text-sm font-medium text-slate-200">{action.label}</span>
                    </div>
                    <span className="text-xs font-medium text-amber-500">{action.due}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="border border-white/5 bg-[#121927] rounded-xl">
            <div className="px-5 pt-4 pb-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white">Quick Links</h3>
            </div>
            <CardContent className="p-4 flex gap-3">
              <Link href={`/cases/${myCase.id}`} className="flex-1">
                <Button variant="outline" className="w-full bg-[#1e2a4f]/50 border-white/10 hover:bg-[#1e2a4f] text-xs h-9 justify-center text-slate-300">
                  <Icons.LayoutDashboard className="w-3.5 h-3.5 mr-2" />
                  View Case Details
                </Button>
              </Link>
              <Link href={`/cases/${myCase.id}?tab=documents`} className="flex-1">
                <Button variant="outline" className="w-full bg-[#1e2a4f]/50 border-white/10 hover:bg-[#1e2a4f] text-xs h-9 justify-center text-slate-300">
                  <Icons.Download className="w-3.5 h-3.5 mr-2" />
                  Download Documents
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
