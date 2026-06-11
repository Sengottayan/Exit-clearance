import { SupabaseClient } from "@supabase/supabase-js";

export async function resolveDbOrgId(
  supabase: SupabaseClient,
  clerkOrgId?: string | null
): Promise<string> {
  const LEGACY_ORG_ID = "00000000-0000-0000-0000-000000000000";

  if (!clerkOrgId) {
    return LEGACY_ORG_ID;
  }

  const { data } = await supabase
    .from("organizations")
    .select("id")
    .eq("clerk_org_id", clerkOrgId)
    .single();

  return data?.id ?? LEGACY_ORG_ID;
}
