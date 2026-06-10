/**
 * Synthetic Audit Event Generator
 *
 * Generates 200 realistic audit events to be inserted into org_audit_logs
 * as a one-time onboarding aid. All rows carry is_synthetic=TRUE and will
 * be automatically archived when the first real audit event is inserted.
 *
 * Design principles:
 * - Seeded determinism: same orgId → same event corpus
 * - Actor names derived from real org members (not stored as truth)
 * - Timestamps: last 90 days, denser in recent weeks
 * - Volume: 200 events (not 1,248) — fast inserts, fast queries, realistic demos
 */

// ── Seeded LCG RNG (same as synthetic-analytics.ts) ────────────────────────
function createSeededRng(seed: string) {
  let s = Array.from(seed).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return function next(min = 0, max = 1): number {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const n = (s >>> 0) / 0xffffffff;
    return min + Math.floor(n * (max - min + 1));
  };
}

// ── Types ────────────────────────────────────────────────────────────────────
export interface SyntheticAuditEvent {
  organization_id: string;
  actor_user_id: string | null;      // FK to users(id) — null for system events
  actor_display_name: string;        // stored only in new_value for display; not truth
  entity_type: string;               // matches audit_event_type enum
  entity_id: string;
  action: string;
  old_value: Record<string, unknown>;
  new_value: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  session_id: string;
  is_synthetic: boolean;
  source_type: "synthetic";
  created_at: string;                // ISO timestamp
}

// ── Fallback actor pool (used if org has no real members yet) ────────────────
const FALLBACK_ACTORS = [
  { id: null, name: "Meera Krishnan",  role: "HR Manager"        },
  { id: null, name: "Arjun Nair",      role: "IT Manager"        },
  { id: null, name: "Rahul Mehta",     role: "Product Manager"   },
  { id: null, name: "Priya Sharma",    role: "HR Manager"        },
  { id: null, name: "Divya Reddy",     role: "Finance Manager"   },
  { id: null, name: "Vikram Singh",    role: "IT Manager"        },
  { id: null, name: "Neha Gupta",      role: "HR"                },
  { id: null, name: "System",          role: "System"            },
];

// ── Distribution tables ──────────────────────────────────────────────────────
const ENTITY_TYPES = [
  { type: "case",     weight: 42 },
  { type: "asset",    weight: 24 },
  { type: "task",     weight: 14 },
  { type: "user",     weight: 10 },
  { type: "document", weight: 10 },
];

// action → entity type constraints
const ACTIONS_BY_TYPE: Record<string, { action: string; weight: number }[]> = {
  case: [
    { action: "Created", weight: 40 },
    { action: "Updated", weight: 30 },
    { action: "Approved", weight: 15 },
    { action: "Cancelled", weight: 10 },
    { action: "Escalated", weight: 5 },
  ],
  asset: [
    { action: "Added", weight: 40 },
    { action: "Returned", weight: 35 },
    { action: "Verified", weight: 15 },
    { action: "Lost", weight: 10 },
  ],
  task: [
    { action: "Created", weight: 30 },
    { action: "Approved", weight: 35 },
    { action: "Rejected", weight: 20 },
    { action: "Delegated", weight: 15 },
  ],
  user: [
    { action: "Login", weight: 40 },
    { action: "Updated", weight: 30 },
    { action: "Failed Login", weight: 20 },
    { action: "Logout", weight: 10 },
  ],
  document: [
    { action: "Uploaded", weight: 45 },
    { action: "Generated", weight: 35 },
    { action: "Downloaded", weight: 20 },
  ],
};

const SEVERITY_BY_ACTION: Record<string, "info" | "warn" | "error"> = {
  "Failed Login": "error",
  "Cancelled":    "warn",
  "Escalated":    "warn",
  "Rejected":     "warn",
  "Lost":         "warn",
};

const DETAILS_TEMPLATES: Record<string, string[]> = {
  case: [
    "Exit case created for {actor}",
    "Clearance workflow updated",
    "Resignation submitted",
    "Case escalated due to SLA breach",
    "Case cancelled by HR",
  ],
  asset: [
    "Asset added to exit case",
    "Asset returned by employee",
    "Asset condition verified",
    "Asset reported as lost",
  ],
  task: [
    "Task marked as approved",
    "Task rejected — pending rework",
    "Task delegated to alternate approver",
    "Clearance task created",
  ],
  user: [
    "User logged in from new device",
    "Profile information updated",
    "Invalid password attempt",
    "Session terminated",
  ],
  document: [
    "FnF Settlement uploaded",
    "Relieving letter generated",
    "Experience certificate downloaded",
    "NDA document uploaded",
  ],
};

const ENTITY_ID_PREFIXES: Record<string, string> = {
  case: "CASE-2026-",
  asset: "ASSET-",
  task: "TASK-",
  user: "USER-",
  document: "DOC-",
};

const IP_SUBNETS = ["192.168.1.", "192.168.2.", "10.0.1.", "10.0.2."];

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/124",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124",
  "Mozilla/5.0 (X11; Linux x86_64) Firefox/125",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4) Safari/605",
];

// ── Weighted random selector ──────────────────────────────────────────────────
function pickWeighted<T extends { weight: number }>(items: T[], rng: (min: number, max: number) => number): T {
  const total = items.reduce((a, b) => a + b.weight, 0);
  let r = rng(0, total - 1);
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

// ── Timestamp generator ───────────────────────────────────────────────────────
// Denser timestamps in recent weeks (exponential decay into the past)
function generateTimestamp(rng: (min: number, max: number) => number, maxDaysAgo = 90): string {
  const now = Date.now();
  // Bias toward recent: square the random value to cluster near 0 (today)
  const rawFraction = (rng(0, 10000) / 10000) ** 1.5; // 0..1, biased toward 0
  const daysAgo = rawFraction * maxDaysAgo;
  const ts = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
  // Randomise the time-of-day within business hours (8:00–20:00)
  ts.setHours(rng(8, 20), rng(0, 59), rng(0, 59));
  return ts.toISOString();
}

// ── Main generator ─────────────────────────────────────────────────────────────
export function generateSyntheticAuditEvents(
  orgId: string,
  members: { id: string | null; name: string; role: string }[] = [],
  count = 200,
): SyntheticAuditEvent[] {
  const rng = createSeededRng(orgId + "audit");
  const actorPool = members.length > 0 ? members : FALLBACK_ACTORS;

  const events: SyntheticAuditEvent[] = [];

  for (let i = 0; i < count; i++) {
    const entityConfig = pickWeighted(ENTITY_TYPES, rng);
    const entityType = entityConfig.type;

    const actions = ACTIONS_BY_TYPE[entityType];
    const actionConfig = pickWeighted(actions, rng);
    const action = actionConfig.action;

    const actor = actorPool[rng(0, actorPool.length - 1)];
    const severity = SEVERITY_BY_ACTION[action] ?? "info";

    const entityNum = rng(1000, 9999);
    const entityId = `${ENTITY_ID_PREFIXES[entityType]}${entityNum}`;

    const templates = DETAILS_TEMPLATES[entityType];
    const detailTemplate = templates[rng(0, templates.length - 1)];
    const details = detailTemplate.replace("{actor}", actor.name);

    const ip = `${IP_SUBNETS[rng(0, IP_SUBNETS.length - 1)]}${rng(10, 254)}`;
    const ua = USER_AGENTS[rng(0, USER_AGENTS.length - 1)];
    const sessionId = `ses_${orgId.slice(0, 8)}_${rng(100000, 999999)}`;

    events.push({
      organization_id: orgId,
      actor_user_id: actor.id,
      actor_display_name: actor.name,
      entity_type: entityType,
      entity_id: entityId,
      action,
      old_value: {},
      new_value: {
        details,
        severity,
        actor_name: actor.name,
        actor_role: actor.role,
      },
      ip_address: ip,
      user_agent: ua,
      session_id: sessionId,
      is_synthetic: true,
      source_type: "synthetic",
      created_at: generateTimestamp(rng),
    });
  }

  // Sort newest-first for natural insertion order
  return events.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}
