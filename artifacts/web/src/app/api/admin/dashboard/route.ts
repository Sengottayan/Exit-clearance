import { NextResponse, NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";
import { subDays, format, startOfDay, differenceInHours } from "date-fns";

export async function GET(request: NextRequest) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const supabase = createServerSupabase();

  // 1. Fetch total cases with clearance tasks
  const { data: cases, error } = await supabase
    .from("legacy_exit_cases")
    .select("*, clearance_tasks:legacy_clearance_tasks(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching cases for admin dashboard:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const casesList = cases || [];

  // KPIs
  const totalCases = casesList.length;
  const activeCases = casesList.filter((c: any) => c.status !== "completed" && c.status !== "cancelled").length;
  const pendingCases = casesList.filter((c: any) => c.status === "pending_manager").length;
  const completedCases = casesList.filter((c: any) => c.status === "completed").length;

  // SLA compliance calculation
  const allTasks = casesList.flatMap((c: any) => c.clearance_tasks ?? []);
  let slaCompliant = 0, slaAtRisk = 0, slaBreached = 0;
  const now = new Date();

  allTasks.forEach((t: any) => {
    if (!t.sla_due_at) { slaCompliant++; return; }
    if (t.status === "approved" || t.status === "completed") { slaCompliant++; return; }
    const hrs = differenceInHours(new Date(t.sla_due_at), now);
    if (hrs < 0) slaBreached++;
    else if (hrs <= 24) slaAtRisk++;
    else slaCompliant++;
  });

  const slaTotal = slaCompliant + slaAtRisk + slaBreached;
  const slaCompliance = slaTotal === 0 ? 100 : Math.round((slaCompliant / slaTotal) * 100);

  // Avg completion time (days from resignation to completion)
  const completedWithDates = casesList.filter(
    (c: any) => c.status === "completed" && c.resignation_date && c.updated_at,
  );
  const avgCompletionTime =
    completedWithDates.length === 0
      ? 0
      : Math.round(
          completedWithDates.reduce((sum: number, c: any) => {
            const d = differenceInHours(new Date(c.updated_at), new Date(c.resignation_date)) / 24;
            return sum + Math.max(0, d);
          }, 0) / completedWithDates.length
        );

  // Overdue cases (active cases whose projected LWD has passed)
  const overdueCases = casesList.filter((c: any) => {
    if (c.status === "completed" || c.status === "cancelled") return false;
    if (!c.last_working_day) return false;
    return new Date(c.last_working_day) < now;
  }).length;

  // Pie Data (status distribution)
  const pieData = [
    { name: "Active", value: activeCases, color: "#a855f7" },
    { name: "Pending", value: pendingCases, color: "#eab308" },
    { name: "Completed", value: completedCases, color: "#22c55e" },
    { name: "Cancelled", value: casesList.filter((c: any) => c.status === "cancelled").length, color: "#64748b" },
  ].filter(d => d.value > 0);

  // Trend Data (last 30 days)
  const today = new Date();
  const trendDataMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = startOfDay(subDays(today, i));
    trendDataMap[format(d, "MMM dd")] = 0;
  }

  casesList.forEach((c: any) => {
    const d = format(new Date(c.created_at), "MMM dd");
    if (trendDataMap[d] !== undefined) {
      trendDataMap[d]++;
    }
  });

  const trendData = Object.keys(trendDataMap).map(key => ({
    name: key,
    uv: trendDataMap[key]
  }));

  // Fetch recent activities (from timeline_events)
  const { data: timeline } = await supabase
    .from("timeline_events")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(4);

  const activities = (timeline || []).map((t: any) => ({
    id: t.id,
    user: t.actor,
    action: t.label,
    time: format(new Date(t.timestamp), "MMM dd, hh:mm a"),
  }));

  // Recent cases details mapping
  const recentCases = casesList.slice(0, 5).map((c: any) => {
    const tasks = c.clearance_tasks || [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === "approved" || t.status === "completed").length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Determine SLA status
    let sla = "On Track";
    let slaColor = "text-emerald-500 bg-emerald-500/10";
    const hasOverdue = tasks.some((t: any) => {
      if (t.status === "approved" || t.status === "completed") return false;
      return t.sla_due_at && new Date(t.sla_due_at) < now;
    });
    const hasDueSoon = tasks.some((t: any) => {
      if (t.status === "approved" || t.status === "completed") return false;
      if (!t.sla_due_at) return false;
      const hrs = (new Date(t.sla_due_at).getTime() - now.getTime()) / (1000 * 60 * 60);
      return hrs > 0 && hrs <= 24;
    });

    if (hasOverdue) {
      sla = "Overdue";
      slaColor = "text-red-500 bg-red-500/10";
    } else if (hasDueSoon) {
      sla = "Due Soon";
      slaColor = "text-amber-500 bg-amber-500/10";
    }

    // Status label
    let statusLabel = "Pending Manager";
    let statusColor = "text-amber-500";
    if (c.status === "completed") {
      statusLabel = "Completed";
      statusColor = "text-emerald-500";
    } else if (c.status === "in_clearance") {
      statusLabel = "In Clearance";
      statusColor = "text-blue-500";
    } else if (c.status === "cancelled") {
      statusLabel = "Cancelled";
      statusColor = "text-slate-500";
    }

    // Avatar fallback initials
    const nameParts = (c.employee_name || "").split(" ");
    const initials = nameParts.map((p: string) => p[0]).join("").toUpperCase().slice(0, 2) || "EE";

    const colors = ["bg-purple-600", "bg-blue-600", "bg-pink-600", "bg-indigo-600", "bg-teal-600"];
    const colorIndex = (c.employee_name || "").length % colors.length;
    const avatarColor = colors[colorIndex];

    return {
      id: c.id,
      name: c.employee_name,
      dept: c.employee_dept,
      avatar: initials,
      avatarColor,
      lwd: c.last_working_day ? format(new Date(c.last_working_day), "dd MMM yyyy") : "N/A",
      progress,
      sla,
      slaColor,
      status: statusLabel,
      statusColor
    };
  });

  return NextResponse.json({
    kpis: {
      totalCases,
      activeCases,
      pendingCases,
      completedCases,
      slaCompliance,
      avgCompletionTime,
      overdueCases,
    },
    pieData,
    trendData,
    activities,
    recentCases,
  });
}

