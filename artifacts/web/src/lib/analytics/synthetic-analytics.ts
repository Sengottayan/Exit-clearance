/**
 * Synthetic Analytics Engine
 *
 * Generates statistically plausible, seed-deterministic analytics data for the
 * Reports & Analytics page when the organization has zero real exit cases.
 *
 * Key design goals:
 *  - Deterministic: same orgId → same numbers every run (no randomness drift)
 *  - Realistic: distributions mirror real-world exit patterns
 *  - Org-aware: total volume scales with estimated org size
 */

// ── Seeded pseudo-random number generator ──────────────────────────────────
// LCG (Linear Congruential Generator) – fast, deterministic, no dependencies.
function createSeededRng(seed: string) {
  let s = Array.from(seed).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return function next(min = 0, max = 1): number {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const n = (s >>> 0) / 0xffffffff;
    return min + Math.floor(n * (max - min + 1));
  };
}

// ── Date range helpers ─────────────────────────────────────────────────────
export type DateRange = "30d" | "90d" | "180d" | "365d";

function rangeDays(dateRange: DateRange): number {
  return { "30d": 30, "90d": 90, "180d": 180, "365d": 365 }[dateRange];
}

function rangeWeeks(dateRange: DateRange): number {
  return Math.ceil(rangeDays(dateRange) / 7);
}

// ── Types (mirroring the API response contract) ───────────────────────────
export interface SyntheticOverview {
  totalExits: number;
  completedExits: number;
  inClearance: number;
  overdueCases: number;
  avgSlaTimeDays: number;
  completionRate: number;
  totalExitsDelta: number;
  overdueDelta: number;
  avgSlaDelta: number;
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface SlaSegment {
  name: "Compliant" | "At Risk" | "Breached";
  value: number;
  pct: string;
  color: string;
}

export interface ReasonSegment {
  name: string;
  value: number;
  pct: string;
  color: string;
}

export interface DepartmentPoint {
  dept: string;
  exits: number;
}

export interface Insight {
  icon: "TrendingUp" | "Clock" | "AlertTriangle";
  title: string;
  sub: string;
}

export interface SyntheticAnalytics {
  source: "synthetic";
  overview: SyntheticOverview;
  exitTrend: TrendPoint[];
  sla: SlaSegment[];
  reasons: ReasonSegment[];
  departments: DepartmentPoint[];
  insights: Insight[];
}

// ── Exit reason catalogue (sorted by real-world frequency) ────────────────
const REASON_CATALOGUE: { name: string; weight: number; color: string }[] = [
  { name: "Better Opportunity", weight: 35, color: "#10b981" },
  { name: "Compensation",       weight: 20, color: "#f59e0b" },
  { name: "Relocation",         weight: 15, color: "#6366f1" },
  { name: "Higher Studies",     weight: 12, color: "#3b82f6" },
  { name: "Personal Reasons",   weight: 10, color: "#8b5cf6" },
  { name: "Work Environment",   weight: 5,  color: "#ec4899" },
  { name: "Health Reasons",     weight: 3,  color: "#ef4444" },
];

// ── Main generator ────────────────────────────────────────────────────────
export function generateSyntheticAnalytics(
  orgId: string,
  dateRange: DateRange = "90d",
  orgSize: number = 200,
): SyntheticAnalytics {
  const rng = createSeededRng(orgId + dateRange);
  const days = rangeDays(dateRange);

  // Scale exit volume realistically: ~1–2% of org size per 30 days
  const exitRatePerMonth = 0.012 + rng(0, 6) * 0.001; // 1.2% – 1.8%
  const totalExits = Math.round((orgSize * exitRatePerMonth * days) / 30);

  const completionRate = 65 + rng(0, 20); // 65–85 %
  const completedExits = Math.round((totalExits * completionRate) / 100);
  const inClearance = Math.round((totalExits * rng(18, 30)) / 100);
  const overdueCases = Math.max(1, Math.round((totalExits * rng(3, 8)) / 100));
  const avgSlaTimeDays = parseFloat((rng(20, 40) / 10).toFixed(1)); // 2.0–4.0 days

  // Delta vs previous period (synthesized % change)
  const totalExitsDelta = rng(-5, 25); // −5% to +25%
  const overdueDelta = rng(-3, 4);
  const avgSlaDelta = rng(-15, 5) / 10; // −1.5 to +0.5 improvement

  const overview: SyntheticOverview = {
    totalExits,
    completedExits,
    inClearance,
    overdueCases,
    avgSlaTimeDays,
    completionRate,
    totalExitsDelta,
    overdueDelta,
    avgSlaDelta,
  };

  return {
    source: "synthetic",
    overview,
    exitTrend: generateExitTrend(orgId, dateRange, totalExits),
    sla: generateSlaMetrics(orgId, totalExits),
    reasons: generateReasonsBreakdown(orgId, totalExits),
    departments: generateDepartmentVolume(orgId, totalExits),
    insights: generateInsights(overview, totalExitsDelta, avgSlaDelta, overdueCases),
  };
}

// ── Exit Trend ─────────────────────────────────────────────────────────────
function generateExitTrend(
  seed: string,
  dateRange: DateRange,
  totalExits: number,
): TrendPoint[] {
  const rng = createSeededRng(seed + "trend");
  const weeks = rangeWeeks(dateRange);

  // Generate raw weekly proportions with slight upward trend + noise
  const raw: number[] = [];
  let cursor = 0.6 + rng(0, 4) * 0.1; // start between 0.6–1.0 (relative to mean)
  for (let i = 0; i < weeks; i++) {
    // Gentle drift upward (~1%) + noise (±15%)
    cursor = cursor * (1 + 0.01) + (rng(0, 30) - 15) / 100;
    cursor = Math.max(0.2, Math.min(2.0, cursor));
    raw.push(cursor);
  }

  // Scale to match total exits
  const rawSum = raw.reduce((a, b) => a + b, 0);
  const points: TrendPoint[] = [];
  const now = new Date();

  for (let i = 0; i < weeks; i++) {
    const weeksAgo = weeks - 1 - i;
    const date = new Date(now);
    date.setDate(date.getDate() - weeksAgo * 7);

    const weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - date.getDay()); // Sunday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const fmt = (d: Date) =>
      `${d.toLocaleString("en-US", { month: "short" })} ${d.getDate()}`;

    const value = Math.max(1, Math.round((raw[i] / rawSum) * totalExits));
    points.push({ date: `${fmt(weekStart)}–${fmt(weekEnd)}`, value });
  }

  return points;
}

// ── SLA Metrics ─────────────────────────────────────────────────────────────
function generateSlaMetrics(seed: string, totalExits: number): SlaSegment[] {
  const rng = createSeededRng(seed + "sla");
  const breachedPct = rng(1, 4); // 1–4%
  const atRiskPct = rng(2, 6);   // 2–6%
  const compliantPct = 100 - breachedPct - atRiskPct;

  const breached = Math.max(1, Math.round((totalExits * breachedPct) / 100));
  const atRisk = Math.max(1, Math.round((totalExits * atRiskPct) / 100));
  const compliant = totalExits - breached - atRisk;
  const total = compliant + atRisk + breached;

  const pct = (v: number) => `${((v / total) * 100).toFixed(1)}%`;

  return [
    { name: "Compliant", value: compliant, pct: pct(compliant), color: "#10b981" },
    { name: "At Risk",   value: atRisk,    pct: pct(atRisk),    color: "#f59e0b" },
    { name: "Breached",  value: breached,  pct: pct(breached),  color: "#ef4444" },
  ];
}

// ── Exit Reasons ─────────────────────────────────────────────────────────────
function generateReasonsBreakdown(seed: string, totalExits: number): ReasonSegment[] {
  const rng = createSeededRng(seed + "reasons");

  // Shuffle weights slightly to differentiate between orgs
  const adjusted = REASON_CATALOGUE.map((r) => ({
    ...r,
    weight: Math.max(1, r.weight + rng(-5, 5)),
  }));

  const weightSum = adjusted.reduce((a, r) => a + r.weight, 0);
  const result: ReasonSegment[] = [];
  let remaining = totalExits;

  for (let i = 0; i < adjusted.length; i++) {
    const isLast = i === adjusted.length - 1;
    const value = isLast
      ? Math.max(1, remaining)
      : Math.max(1, Math.round((adjusted[i].weight / weightSum) * totalExits));
    remaining -= value;

    result.push({
      name: adjusted[i].name,
      value,
      pct: `${((value / totalExits) * 100).toFixed(1)}%`,
      color: adjusted[i].color,
    });
  }

  return result.sort((a, b) => b.value - a.value);
}

// ── Department Volume ─────────────────────────────────────────────────────────
const DEFAULT_DEPARTMENTS = [
  "Engineering",
  "Product",
  "Sales",
  "Marketing",
  "Finance",
  "HR",
  "Operations",
];

function generateDepartmentVolume(
  seed: string,
  totalExits: number,
  departments?: string[],
): DepartmentPoint[] {
  const rng = createSeededRng(seed + "depts");
  const depts = departments ?? DEFAULT_DEPARTMENTS;

  // Engineering/Sales/Product tend to have higher exit rates
  const weights = depts.map((d, i) =>
    Math.max(1, 30 - i * 3 + rng(-5, 8)),
  );
  const weightSum = weights.reduce((a, b) => a + b, 0);

  let remaining = totalExits;
  return depts.map((dept, i) => {
    const isLast = i === depts.length - 1;
    const exits = isLast
      ? Math.max(1, remaining)
      : Math.max(1, Math.round((weights[i] / weightSum) * totalExits));
    remaining -= exits;
    return { dept, exits };
  }).sort((a, b) => b.exits - a.exits);
}

// ── Insights ─────────────────────────────────────────────────────────────────
function generateInsights(
  overview: SyntheticOverview,
  totalExitsDelta: number,
  avgSlaDelta: number,
  overdueCases: number,
): Insight[] {
  const insights: Insight[] = [];

  // Exit volume trend
  if (totalExitsDelta > 0) {
    insights.push({
      icon: "TrendingUp",
      title: `Exit volume increased by ${totalExitsDelta}%`,
      sub: "Compared to previous period",
    });
  } else if (totalExitsDelta < 0) {
    insights.push({
      icon: "TrendingUp",
      title: `Exit volume decreased by ${Math.abs(totalExitsDelta)}%`,
      sub: "Compared to previous period",
    });
  }

  // SLA improvement/worsening
  if (avgSlaDelta < 0) {
    insights.push({
      icon: "Clock",
      title: `Average clearance time improved`,
      sub: `By ${Math.abs(avgSlaDelta).toFixed(1)} days this period`,
    });
  } else {
    insights.push({
      icon: "Clock",
      title: `Average clearance time is ${overview.avgSlaTimeDays} days`,
      sub: "Monitor SLA adherence across departments",
    });
  }

  // Overdue cases alert
  if (overdueCases > 0) {
    insights.push({
      icon: "AlertTriangle",
      title: `${overdueCases} case${overdueCases > 1 ? "s" : ""} breached SLA`,
      sub: "Immediate attention required",
    });
  }

  return insights;
}
