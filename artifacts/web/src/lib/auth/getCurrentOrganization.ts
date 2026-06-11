import { getOptionalAuth } from "@/lib/api-auth";
import { createServerSupabase } from "@/lib/supabase-server";

export async function getCurrentOrganization() {
  const { orgId, userId } = await getOptionalAuth();
  
  if (!orgId) {
    // If no org ID from Clerk, we might fallback to a default dev org or return null
    return null;
  }

  // Validate the organization exists and user is a member
  const supabase = createServerSupabase();
  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .single();

  if (!member) {
    return null;
  }

  return { id: orgId, userId };
}
