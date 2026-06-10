import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";
import { subDays, format } from "date-fns";

export const revalidate = 0; // Audit logs must never be stale-cached

// ── Safe delta: avoids Infinity% when previous period = 0 ─────────────────
function safeDelta(current: number, previous: number): number | "new" {
  if (previous === 0) return current > 0 ? "new" : 0;
  return Math.round(((current - previous) / previous) * 100);
}

const TYPE_COLORS: Record<string, string> = {
  case:     "#6366f1",
  asset:    "#10b981",
  task:     "#f59e0b",
  user:     "#8b5cf6",
  document: "#ec4899",
};

// Helper: derive severity from new_value JSONB (stored during write path)
function getSeverity(row: any): "info" | "warn" | "error" {
  return row.new_value?.severity ?? "info";
}

// Helper: derive display name from joined user or new_value (synthetic fallback)
function getActorName(row: any): string {
  return row.users?.name ?? row.new_value?.actor_name ?? "System";
}

function getActorRole(row: any): string {
  return row.new_value?.actor_role ?? "System";
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p: string) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const ACTOR_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899",
  "#3b82f6", "#ef4444", "#14b8a6", "#64748b",
];

export async function GET(req: NextRequest) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const { searchParams } = req.nextUrl;
  const page     = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
  const limit    = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") ?? "10", 10)));
  const type     = searchParams.get("type")     ?? "all";
  const severity = searchParams.get("severity") ?? "all";
  const search   = searchParams.get("search")   ?? "";
  const from     = searchParams.get("from")     ?? "";
  const to       = searchParams.get("to")       ?? "";
  const fmt      = searchParams.get("format")   ?? "json"; // "json" | "csv"

  const supabase = createServerSupabase();
  const now      = new Date();
  const since90  = subDays(now, 90).toISOString();
  const since180 = subDays(now, 180).toISOString();

  // ── Build base filter (excludes archived synthetic rows) ─────────────────
  // "Active" rows = real rows + un-archived synthetic rows
  function buildQuery() {
    let q = supabase
      .from("org_audit_logs")
      .select(`
        id, entity_type, entity_id, action,
        old_value, new_value, ip_address, user_agent, session_id,
        is_synthetic, source_type, created_at,
        actor_user_id,
        users ( name )
      `, { count: "exact" })
      // Exclude archived synthetic events
      .or("is_synthetic.eq.false,synthetic_archived_at.is.null");

    // Type filter
    if (type !== "all") {
      q = q.eq("entity_type", type);
    }

    // Severity filter (stored in new_value.severity)
    if (severity !== "all") {
      q = q.eq("new_value->>severity", severity);
    }

    // Date range
    if (from) q = q.gte("created_at", from);
    if (to)   q = q.lte("created_at", to);

    // Text search: actor_name (in new_value), entity_id, action, ip_address, session_id
    if (search) {
      const s = `%${search}%`;
      q = q.or(
        `entity_id.ilike.${s},action.ilike.${s},ip_address.ilike.${s},session_id.ilike.${s},new_value->>actor_name.ilike.${s},new_value->>details.ilike.${s}`,
      );
    }

    return q;
  }

  // ── Check if any data exists (pre-filter, for source determination) ───────
  const { count: totalCount } = await supabase
    .from("org_audit_logs")
    .select("id", { count: "exact", head: true })
    .or("is_synthetic.eq.false,synthetic_archived_at.is.null");

  const source: "empty" | "real" | "synthetic" | "legacy" =
    (totalCount ?? 0) === 0
      ? "empty"
      : "real"; // We'll refine below from source_type distribution

  if (source === "empty") {
    return NextResponse.json({
      source: "empty",
      items: [],
      total: 0,
      page: 1,
      totalPages: 0,
      stats: {
        totalEvents: 0, criticalEvents: 0, warningEvents: 0,
        infoEvents: 0, uniqueActors: 0,
        totalEventsDelta: 0, criticalDelta: 0, warningDelta: 0,
      },
      eventTrend: [],
      typeBreakdown: [],
      topActors: [],
    });
  }

  // ── Paginated list query ──────────────────────────────────────────────────
  const offset = (page - 1) * limit;
  const { data: rows, count: filteredCount, error } = await buildQuery()
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (rows ?? []).map((row: any) => ({
    id:          row.id,
    timestamp:   row.created_at,
    severity:    getSeverity(row),
    actor:       getActorName(row),
    actorRole:   getActorRole(row),
    eventType:   (row.entity_type as string).toUpperCase(),
    action:      row.action,
    target:      row.entity_id,
    details:     row.new_value?.details ?? "",
    ip:          row.ip_address ?? "",
    sessionId:   row.session_id ?? "",
    isSynthetic: row.is_synthetic,
  }));

  // ── Determine source label from data ─────────────────────────────────────
  const hasSynthetic = (rows ?? []).some((r: any) => r.is_synthetic);
  const hasReal      = (rows ?? []).some((r: any) => !r.is_synthetic);
  const resolvedSource = !hasReal && hasSynthetic ? "synthetic" : "real";

  // ── Export: CSV / JSON ────────────────────────────────────────────────────
  if (fmt === "csv") {
    const header = "Timestamp,Severity,Actor,Role,EventType,Action,Target,Details,IP,SessionID";
    const csvRows = items.map((r: any) =>
      [
        r.timestamp, r.severity, r.actor, r.actorRole,
        r.eventType, r.action, r.target,
        `"${(r.details ?? "").replace(/"/g, '""')}"`,
        r.ip, r.sessionId,
      ].join(","),
    );
    const csv = [header, ...csvRows].join("\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audit-log-${format(now, "yyyy-MM-dd")}.csv"`,
      },
    });
  }

  // ── Stats: current 90-day window ──────────────────────────────────────────
  const { data: currentWindow } = await supabase
    .from("org_audit_logs")
    .select("new_value, actor_user_id, entity_type")
    .or("is_synthetic.eq.false,synthetic_archived_at.is.null")
    .gte("created_at", since90);

  const { data: prevWindow } = await supabase
    .from("org_audit_logs")
    .select("new_value")
    .or("is_synthetic.eq.false,synthetic_archived_at.is.null")
    .gte("created_at", since180)
    .lt("created_at", since90);

  const curr   = currentWindow ?? [];
  const prev   = prevWindow   ?? [];

  const countBySeverity = (arr: any[], sev: string) =>
    arr.filter((r: any) => getSeverity(r) === sev).length;

  const currTotal    = curr.length;
  const currCritical = countBySeverity(curr, "error");
  const currWarn     = countBySeverity(curr, "warn");
  const currInfo     = countBySeverity(curr, "info");
  const uniqueActors = new Set(curr.map((r: any) => r.actor_user_id).filter(Boolean)).size;

  const prevTotal    = prev.length;
  const prevCritical = countBySeverity(prev, "error");
  const prevWarn     = countBySeverity(prev, "warn");

  // ── Event trend: daily buckets over last 30 days ──────────────────────────
  const { data: trendRows } = await supabase
    .from("org_audit_logs")
    .select("created_at")
    .or("is_synthetic.eq.false,synthetic_archived_at.is.null")
    .gte("created_at", subDays(now, 90).toISOString())
    .order("created_at", { ascending: true });

  // Group into ~5 even buckets
  const BUCKETS = 5;
  const bucketMs = (90 * 24 * 60 * 60 * 1000) / BUCKETS;
  const trendBuckets: { date: string; v: number }[] = [];
  for (let b = 0; b < BUCKETS; b++) {
    const bucketStart = new Date(now.getTime() - (BUCKETS - b) * bucketMs);
    const bucketEnd   = new Date(now.getTime() - (BUCKETS - b - 1) * bucketMs);
    const v = (trendRows ?? []).filter((r: any) => {
      const t = new Date(r.created_at).getTime();
      return t >= bucketStart.getTime() && t < bucketEnd.getTime();
    }).length;
    trendBuckets.push({
      date: format(bucketStart, "MMM d"),
      v,
    });
  }

  // ── Type breakdown ────────────────────────────────────────────────────────
  const typeCounts: Record<string, number> = {};
  curr.forEach((r: any) => {
    const t = (r.entity_type as string) ?? "unknown";
    typeCounts[t] = (typeCounts[t] ?? 0) + 1;
  });
  const typeBreakdown = Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      pct: currTotal > 0
        ? `${Math.round((value / currTotal) * 100)}% (${value})`
        : "0%",
      color: TYPE_COLORS[name] ?? "#64748b",
    }));

  // ── Top actors ────────────────────────────────────────────────────────────
  // Fetch a broader slice for actor counting
  const { data: actorRows } = await supabase
    .from("org_audit_logs")
    .select("actor_user_id, new_value, users ( name )")
    .or("is_synthetic.eq.false,synthetic_archived_at.is.null")
    .gte("created_at", since90);

  const actorCounts: Record<string, number> = {};
  (actorRows ?? []).forEach((r: any) => {
    const name = getActorName(r);
    actorCounts[name] = (actorCounts[name] ?? 0) + 1;
  });

  const topActors = Object.entries(actorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count], i) => ({
      name,
      count,
      initials: initials(name),
      color: ACTOR_COLORS[i % ACTOR_COLORS.length],
    }));

  return NextResponse.json({
    source: resolvedSource,
    items,
    total: filteredCount ?? 0,
    page,
    totalPages: Math.ceil((filteredCount ?? 0) / limit),
    stats: {
      totalEvents:    currTotal,
      criticalEvents: currCritical,
      warningEvents:  currWarn,
      infoEvents:     currInfo,
      uniqueActors,
      totalEventsDelta: safeDelta(currTotal,    prevTotal),
      criticalDelta:    safeDelta(currCritical, prevCritical),
      warningDelta:     safeDelta(currWarn,     prevWarn),
    },
    eventTrend:    trendBuckets,
    typeBreakdown,
    topActors,
  });
}
