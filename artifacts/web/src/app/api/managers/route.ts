import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { userId, orgId } = await getOptionalAuth();
  
  if (!userId) return unauthorized();
  if (!orgId) return NextResponse.json({ error: "Organization context required" }, { status: 403 });

  const supabase = createServerSupabase();

  const { data: orgData } = await supabase
    .from("organizations")
    .select("id")
    .eq("clerk_org_id", orgId)
    .single();
  const dbOrgId = orgData?.id || "00000000-0000-0000-0000-000000000000";

  // Fetch users who are either 'manager' or 'hr' or 'admin' and belong to this organization.
  // In a robust system, "manager" might be defined by having reports or a specific role tag.
  // We will join users with organization_members to get the member ID, Name, and Job Title.
  const { data, error } = await supabase
    .from("organization_members")
    .select(`
      id, 
      job_title,
      users!inner (
        id, name, email, avatar_url, role
      )
    `)
    .eq("organization_id", dbOrgId)
    // Filter for managerial roles. Next.js Supabase client allows filtering on joined tables:
    .in("users.role", ["manager", "hr", "admin", "dept_approver"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Managers query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform to a clean, lightweight payload
  const managers = data.map((m: any) => ({
    memberId: m.id,
    userId: m.users.id,
    name: m.users.name,
    email: m.users.email,
    jobTitle: m.job_title || m.users.role,
    avatarUrl: m.users.avatar_url,
  }));

  return NextResponse.json({ data: managers });
}
