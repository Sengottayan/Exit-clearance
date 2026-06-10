import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";

export async function POST() {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("org_audit_logs")
    .update({ synthetic_archived_at: new Date().toISOString() })
    .eq("is_synthetic", true)
    .is("synthetic_archived_at", null)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ archived: data?.length ?? 0 });
}
