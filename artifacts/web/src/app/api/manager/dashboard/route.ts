import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";
import { subDays, format, differenceInHours } from "date-fns";

export const revalidate = 30; // Cache for 30 seconds

export async function GET(request: NextRequest) {
  try {
    const { userId } = await getOptionalAuth();
    if (!userId) return unauthorized();

    const supabase = createServerSupabase();
    const { searchParams } = new URL(request.url);
    
    // Manager ID comes from session (current user), but allow override for HR/Admin
    const managerId = searchParams.get("manager_id") || userId;
    const trendDays = parseInt(searchParams.get("days") || "30", 10);

    // ── Resolve manager email for fallback query ──────────────────────────────────
    let managerEmail: string | null = null;
    try {
      const { data: userRow } = await supabase
        .from("users")
        .select("email")
        .eq("id", managerId)
        .single();
      managerEmail = userRow?.email ?? null;
    } catch { /* ignore */ }
    
    // ── 1. Fetch all cases for this manager ─────────────────────────────────────
    // Strategy: primary query by manager_id (Clerk ID after remap).
    // Fallback: if no results, query by manager_email (catches pre-remap synthetic data).
    let { data: cases, error } = await supabase
      .from("legacy_exit_cases")
      .select("id, status, created_at, last_working_day, clearance_tasks:legacy_clearance_tasks(id, status, sla_due_at, completed_at, dept_label)")
      .eq("manager_id", managerId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    cases = cases ?? [];


    const now = new Date();

    // ── 2. KPI Metrics ──────────────────────────────────────────────────────────
    const metrics = {
      totalCases: 0,
      pendingApproval: 0,
      inClearance: 0,
      slaOverdue: 0,
      completed: 0,
    };

    for (const c of cases) {
      if (c.status === "cancelled") continue;
      metrics.totalCases++;
      if (c.status === "pending_manager") metrics.pendingApproval++;
      if (c.status === "in_clearance") metrics.inClearance++;
      if (c.status === "completed") metrics.completed++;

      // SLA overdue: any pending task past its SLA deadline
      const tasks = (c.clearance_tasks as any[]) ?? [];
      const hasOverdue = tasks.some(
        (t) =>
          t.status !== "approved" &&
          t.status !== "completed" &&
          t.sla_due_at &&
          new Date(t.sla_due_at) < now
      );
      if (hasOverdue) metrics.slaOverdue++;
    }

    // ── 3. SLA Status Breakdown (for donut chart) ────────────────────────────────
    let onTrack = 0;
    let atRisk = 0;
    let overdue = 0;

    for (const c of cases) {
      if (c.status === "completed" || c.status === "cancelled") continue;

      const tasks = (c.clearance_tasks as any[]) ?? [];
      const hasOverdueTask = tasks.some(
        (t) =>
          t.status !== "approved" &&
          t.status !== "completed" &&
          t.sla_due_at &&
          new Date(t.sla_due_at) < now
      );
      const hasAtRiskTask = tasks.some(
        (t) =>
          t.status !== "approved" &&
          t.status !== "completed" &&
          t.sla_due_at &&
          differenceInHours(new Date(t.sla_due_at), now) <= 24 &&
          differenceInHours(new Date(t.sla_due_at), now) >= 0
      );

      if (hasOverdueTask) overdue++;
      else if (hasAtRiskTask || c.status === "in_clearance") atRisk++;
      else onTrack++;
    }

    // ── 4. 30-Day Trend (for line chart) ────────────────────────────────────────
    const trend: { date: string; total: number; completed: number; overdue: number }[] = [];
    
    // Build a date-keyed map
    const trendMap: Record<string, { total: number; completed: number; overdue: number }> = {};
    for (let i = trendDays - 1; i >= 0; i--) {
      const dayKey = format(subDays(now, i), "MMM dd");
      trendMap[dayKey] = { total: 0, completed: 0, overdue: 0 };
    }

    for (const c of cases) {
      const cCreatedAt = new Date(c.created_at);
      const dayKey = format(cCreatedAt, "MMM dd");
      if (trendMap[dayKey] !== undefined) {
        trendMap[dayKey].total++;
        if (c.status === "completed") trendMap[dayKey].completed++;
        
        const tasks = (c.clearance_tasks as any[]) ?? [];
        const hasOverdueTask = tasks.some(
          (t) =>
            t.status !== "approved" &&
            t.status !== "completed" &&
            t.sla_due_at &&
            new Date(t.sla_due_at) < now
        );
        if (hasOverdueTask) trendMap[dayKey].overdue++;
      }
    }

    for (const [date, values] of Object.entries(trendMap)) {
      trend.push({ date, ...values });
    }

    // ── 5. Recent Pending Approvals (top 5, newest first) ───────────────────────
    const { data: pendingCases, error: pendingError } = await supabase
      .from("legacy_exit_cases")
      .select("id, employee_name, employee_dept, employee_role, created_at")
      .eq("manager_id", managerId)
      .eq("status", "pending_manager")
      .order("created_at", { ascending: false })
      .limit(5);

    if (pendingError) {
      console.error("Pending approvals error:", pendingError.message);
    }

    const recentPending = (pendingCases ?? []).map((c) => ({
      caseId: c.id,
      employeeName: c.employee_name,
      employeeDept: c.employee_dept,
      employeeRole: c.employee_role,
      submittedAt: c.created_at,
    }));

    return NextResponse.json({
      metrics,
      sla: {
        onTrack,
        atRisk,
        overdue,
        total: onTrack + atRisk + overdue,
      },
      trend,
      recentPending,
    });
  } catch (err: any) {
    console.error("Dashboard error:", err);
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
