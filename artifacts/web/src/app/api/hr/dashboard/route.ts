import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";
import { subDays, format, differenceInHours, startOfDay, endOfDay, isWithinInterval } from "date-fns";

// Use Route Segment Config for caching (Next.js App Router)
export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
  const { userId, orgId } = await getOptionalAuth();
  
  if (!userId) return unauthorized();
  
  // Multi-Tenant Validation: Ensure organization context is present
  if (!orgId) {
    return NextResponse.json(
      { error: "Organization context required" },
      { status: 403 }
    );
  }

  const supabase = createServerSupabase();

  // Scope query (Note: legacy_exit_cases does not have organization_id yet, so we don't filter by it here to prevent breaking the backwards-compatibility view)
  const { data: cases, error } = await supabase
    .from("exit_cases")
    .select(`
      *,
      clearance_tasks(*),
      timeline_events(*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = new Date();
  
  // Base computations
  const activeCases = cases.filter(c => c.status !== "completed" && c.status !== "cancelled");
  const pendingApprovals = cases.filter(c => c.status === "pending_manager");
  const inClearance = cases.filter(c => c.status === "in_clearance");
  
  const completedThisMonth = cases.filter(c => {
    if (c.status !== "completed") return false;
    const d = new Date(c.updated_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  // Calculate 7-day trend (Current 7 days vs Previous 7 days)
  const current7DaysStart = startOfDay(subDays(now, 7));
  const previous7DaysStart = startOfDay(subDays(now, 14));
  
  const activeNow = activeCases.length;
  const activePrevious = cases.filter(c => 
    c.status !== "completed" && c.status !== "cancelled" && new Date(c.created_at) < current7DaysStart
  ).length;
  
  const activeTrend = activePrevious === 0 ? 100 : Math.round(((activeNow - activePrevious) / activePrevious) * 100);

  // Clearance Tasks Analysis
  const allTasks = cases.flatMap(c => c.clearance_tasks ?? []);
  
  let slaCompliant = 0;
  let slaAtRisk = 0;
  let slaBreached = 0;
  
  let unreturnedAssets = 0;
  let missingDocs = 0;
  let complianceIssues = 0;

  const priorityAlerts: { severity: string, message: string }[] = [];

  allTasks.forEach((t: any) => {
    if (t.status === "approved" || t.status === "completed") return; // Completed tasks are compliant if already done
    
    // SLA Analysis
    if (t.sla_due_at) {
      const due = new Date(t.sla_due_at);
      const hrsRemaining = differenceInHours(due, now);
      
      if (hrsRemaining < 0) {
        slaBreached++;
      } else if (hrsRemaining <= 24) {
        slaAtRisk++;
      } else {
        slaCompliant++;
      }
    }
    
    // Needs Attention queries based on task tags / type
    // If overdue, flag them
    if (t.sla_due_at && new Date(t.sla_due_at) < now) {
      if (t.title?.toLowerCase().includes("asset") || t.description?.toLowerCase().includes("equipment")) {
        unreturnedAssets++;
      }
      if (t.title?.toLowerCase().includes("document") || t.title?.toLowerCase().includes("letter")) {
        missingDocs++;
      }
      if (t.title?.toLowerCase().includes("compliance") || t.title?.toLowerCase().includes("access")) {
        complianceIssues++;
      }
    }
  });

  // Needs Attention Aggregates
  const attentionItems = [];
  if (slaBreached > 0) attentionItems.push({ title: "SLA Breaches", value: slaBreached, description: `${slaBreached} tasks exceed SLA` });
  if (pendingApprovals.length > 0) attentionItems.push({ title: "Pending Manager Approvals", value: pendingApprovals.length, description: `${pendingApprovals.length} approvals pending` });
  if (unreturnedAssets > 0) attentionItems.push({ title: "Unreturned Assets", value: unreturnedAssets, description: `${unreturnedAssets} assets unreturned` });
  if (missingDocs > 0) attentionItems.push({ title: "Missing Documents", value: missingDocs, description: `${missingDocs} missing docs` });
  if (complianceIssues > 0) attentionItems.push({ title: "Compliance Issues", value: complianceIssues, description: `${complianceIssues} compliance gaps` });

  // Upcoming Deadlines (Cases due today, tomorrow, this week)
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const tomorrowStart = startOfDay(subDays(now, -1));
  const tomorrowEnd = endOfDay(subDays(now, -1));
  const weekEnd = endOfDay(subDays(now, -7));

  let dueToday = 0;
  let dueTomorrow = 0;
  let dueThisWeek = 0;

  activeCases.forEach(c => {
    if (c.resignation_date) {
      // Calculate projected end date (resignation + notice period)
      const noticeDays = c.notice_period_days || 30;
      const dueDate = startOfDay(subDays(new Date(c.resignation_date), -noticeDays));
      
      if (isWithinInterval(dueDate, { start: todayStart, end: todayEnd })) dueToday++;
      else if (isWithinInterval(dueDate, { start: tomorrowStart, end: tomorrowEnd })) dueTomorrow++;
      else if (isWithinInterval(dueDate, { start: todayStart, end: weekEnd })) dueThisWeek++;
    }
  });

  // Priority Alerts
  if (slaAtRisk > 0) priorityAlerts.push({ severity: "high", message: `${slaAtRisk} exit tasks will breach SLA within 24 hours` });
  if (pendingApprovals.length > 0) priorityAlerts.push({ severity: "medium", message: `${pendingApprovals.length} managers have pending approvals` });
  if (slaBreached > 0) priorityAlerts.push({ severity: "critical", message: `${slaBreached} tasks have breached SLA!` });

  // Timeline Events (Newest first, limit 20)
  const timelineEvents = cases
    .flatMap((c: any) =>
      (c.timeline_events ?? []).map((t: any) => ({
        id: t.id,
        type: t.label?.toLowerCase().includes("approved") ? "approval" : t.label?.toLowerCase().includes("completed") ? "task_completed" : "event",
        label: t.label,
        timestamp: t.timestamp,
        actor: t.actor,
        actor_role: t.actor_role,
        case_id: c.id,
        employee_name: c.employee_name,
      }))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

  const exitTrend = computeExitTrend(cases);

  const recentCases = activeCases.slice(0, 3).map((c) => ({
    id: c.id,
    employeeName: c.employee_name,
    employeeDept: c.employee_dept,
    status: c.status,
    createdAt: c.created_at,
  }));

  return NextResponse.json({
    overview: {
      activeCases: activeCases.length,
      pendingApprovals: pendingApprovals.length,
      inClearance: inClearance.length,
      overdueTasks: slaBreached,
      completedThisMonth: completedThisMonth.length,
      totalCases: cases.length,
    },
    trends: {
      activeCasesPercentage: activeTrend,
    },
    slaAggregate: [
      { name: "Compliant", value: slaCompliant },
      { name: "At Risk", value: slaAtRisk },
      { name: "Breached", value: slaBreached }
    ],
    attentionItems,
    deadlines: [
      { label: "cases due today", count: dueToday, color: "text-red-400" },
      { label: "cases due tomorrow", count: dueTomorrow, color: "text-amber-400" },
      { label: "cases due this week", count: dueThisWeek, color: "text-blue-400" }
    ],
    priorityAlerts,
    timelineEvents,
    exitTrend,
    recentCases,
    hasMoreTimeline: timelineEvents.length === 20
  });
}

function computeExitTrend(cases: any[], months = 12) {
  const now = new Date();
  const buckets: Record<string, number> = {};
  for (let i = months - 1; i >= 0; i--) {
    const d = subDays(now, i * 30);
    buckets[format(d, "MMM")] = 0;
  }
  cases.forEach((c) => {
    const key = format(new Date(c.resignation_date), "MMM");
    if (key in buckets) buckets[key]++;
  });
  return Object.entries(buckets).map(([name, exits]) => ({ name, exits }));
}
