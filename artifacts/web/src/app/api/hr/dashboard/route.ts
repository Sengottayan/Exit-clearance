import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { auth } from "@clerk/nextjs/server";
import { subDays, format } from "date-fns";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabase();

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

  const activeCases = cases.filter(
    (c) => c.status !== "completed" && c.status !== "cancelled",
  );
  const pendingApprovals = cases.filter(
    (c) => c.status === "pending_manager",
  );
  const inClearance = cases.filter((c) => c.status === "in_clearance");
  const completedThisMonth = cases.filter((c) => {
    if (c.status !== "completed") return false;
    const d = new Date(c.updated_at);
    const now = new Date();
    return (
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  });

  const allTasks = cases.flatMap((c) => c.clearance_tasks ?? []);
  const overdueTasks = allTasks.filter((t: { status: string }) => t.status === "overdue");

  const timelineEvents = cases
    .flatMap((c: Record<string, unknown>) =>
      ((c.timeline_events ?? []) as Array<Record<string, unknown>>).map((t: Record<string, unknown>) => ({
        id: t.id as string,
        label: t.label as string,
        timestamp: t.timestamp as string,
        actor: t.actor as string,
        actor_role: t.actor_role as string,
        is_pending: t.is_pending as boolean,
        case_id: c.id as string,
        employee_name: c.employee_name as string,
        employee_dept: c.employee_dept as string,
      })),
    )
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 10);

  const exitTrend = computeExitTrend(cases);
  const slaPerformance = computeSLAPerformance(cases);

  return NextResponse.json({
    overview: {
      activeCases: activeCases.length,
      pendingApprovals: pendingApprovals.length,
      inClearance: inClearance.length,
      overdueTasks: overdueTasks.length,
      completedThisMonth: completedThisMonth.length,
      totalCases: cases.length,
    },
    activeCases,
    pendingApprovals,
    overdueTasks,
    timelineEvents,
    exitTrend,
    slaPerformance,
  });
}

function computeExitTrend(
  cases: any[],
  months = 12,
): { name: string; exits: number }[] {
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

function computeSLAPerformance(
  cases: any[],
  months = 6,
): { name: string; onTime: number; overdue: number }[] {
  const now = new Date();
  const buckets: Record<string, { onTime: number; overdue: number }> = {};

  for (let i = months - 1; i >= 0; i--) {
    const d = subDays(now, i * 30);
    buckets[format(d, "MMM")] = { onTime: 0, overdue: 0 };
  }

  cases.forEach((c) => {
    const monthKey = format(new Date(c.resignation_date), "MMM");
    if (!(monthKey in buckets)) return;

    (c.clearance_tasks ?? []).forEach((t: { status: string; completed_at?: string; sla_due_at?: string }) => {
      if (t.status === "approved") {
        const isOverdue =
          t.completed_at &&
          t.sla_due_at &&
          new Date(t.completed_at) > new Date(t.sla_due_at);
        if (isOverdue) {
          buckets[monthKey].overdue++;
        } else {
          buckets[monthKey].onTime++;
        }
      }
    });
  });

  return Object.entries(buckets).map(([name, v]) => ({
    name,
    onTime: v.onTime,
    overdue: v.overdue,
  }));
}
