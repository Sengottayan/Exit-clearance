import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";
import { generateSyntheticAuditEvents } from "@/lib/analytics/synthetic-audit";

export async function POST() {
  const { userId, orgId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  // Use orgId or userId as the synthetic seed
  const seed = orgId ?? userId;

  const supabase = createServerSupabase();

  // ── Idempotency check: return 409 if rows already exist ───────────────────
  const { count, error: countError } = await supabase
    .from("org_audit_logs")
    .select("id", { count: "exact", head: true });

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "Audit log already has data. Seeding skipped.", count },
      { status: 409 },
    );
  }

  // ── Fetch real members for realistic actor pool ───────────────────────────
  const { data: members } = await supabase
    .from("organization_members")
    .select(`
      id,
      user_id,
      users ( name )
    `)
    .limit(20);

  const actorPool = members
    ? members.map((m: any) => ({
        id: m.user_id ?? null,
        name: m.users?.name ?? "System",
        role: "HR Team", // role will be derived from member_roles in real queries
      }))
    : [];

  // ── Generate and insert 200 synthetic events ──────────────────────────────
  const events = generateSyntheticAuditEvents(seed, actorPool, 200);

  // Chunk into batches of 50 to avoid payload limits
  const CHUNK = 50;
  let inserted = 0;

  for (let i = 0; i < events.length; i += CHUNK) {
    const batch = events.slice(i, i + CHUNK).map(({ actor_display_name, ...rest }) => rest);
    const { error: insertError } = await supabase
      .from("org_audit_logs")
      .insert(batch);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    inserted += batch.length;
  }

  return NextResponse.json({ seeded: true, count: inserted });
}
