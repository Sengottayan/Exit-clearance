import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";

const MULTI_TENANT_ENABLED = true;

export async function GET() {
  const { userId, orgId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  if (MULTI_TENANT_ENABLED && !orgId) {
    return NextResponse.json({ error: "Organization context required" }, { status: 403 });
  }

  const supabase = createServerSupabase();

  let deptsQuery = supabase.from("departments").select("*");
  
  if (MULTI_TENANT_ENABLED && orgId) {
    // deptsQuery = deptsQuery.eq("organization_id", orgId);
  }

  const { data: depts, error: deptsError } = await deptsQuery;

  if (deptsError) {
    return NextResponse.json({ error: deptsError.message }, { status: 500 });
  }

  // Map to the required workflow preview format
  const steps = (depts || []).map((d: any, index: number) => ({
    department: d.label || d.name,
    approver: d.default_assignee ? (d.label + " Admin") : "Manager",
    slaHours: d.sla_hours || 24,
    required: true,
    stepOrder: index + 1
  }));

  return NextResponse.json({ steps });
}
