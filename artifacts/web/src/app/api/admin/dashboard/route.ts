import { NextResponse, NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";
import { subDays, format, startOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const supabase = createServerSupabase();

  // 1. Fetch total cases
  const { data: cases, error } = await supabase.from("exit_cases").select("id, status, created_at");
  if (error) {
    console.error("Error fetching cases for admin dashboard:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // KPIs
  const totalCases = cases.length;
  const activeCases = cases.filter((c: any) => c.status !== "completed" && c.status !== "cancelled").length;
  const pendingCases = cases.filter((c: any) => c.status === "pending_manager").length;
  const completedCases = cases.filter((c: any) => c.status === "completed").length;

  // Pie Data (status distribution)
  const pieData = [
    { name: "Active", value: activeCases, color: "#a855f7" },
    { name: "Pending", value: pendingCases, color: "#eab308" },
    { name: "Completed", value: completedCases, color: "#22c55e" },
    { name: "Cancelled", value: cases.filter((c: any) => c.status === "cancelled").length, color: "#64748b" },
  ].filter(d => d.value > 0);

  // Trend Data (last 30 days)
  const today = new Date();
  const trendDataMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = startOfDay(subDays(today, i));
    trendDataMap[format(d, "MMM dd")] = 0;
  }

  cases.forEach((c: any) => {
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

  return NextResponse.json({
    kpis: {
      totalCases,
      activeCases,
      pendingCases,
      completedCases,
    },
    pieData,
    trendData,
    activities
  });
}
