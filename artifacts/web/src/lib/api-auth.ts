import { auth as clerkAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isValidClerkPublishableKey, isValidClerkSecretKey } from "@/lib/clerk-utils";

const clerkConfigured =
  isValidClerkPublishableKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) &&
  isValidClerkSecretKey(process.env.CLERK_SECRET_KEY);

import { cookies } from "next/headers";

export async function getOptionalAuth(): Promise<{ userId: string | null; orgId: string | null }> {
  if (!clerkConfigured) {
    const cookieStore = await cookies();
    const demoUserId = cookieStore.get("demo-user-id")?.value;
    return { userId: demoUserId || "dev-user", orgId: "dev-org" };
  }

  try {
    const { userId, orgId } = await clerkAuth();
    return { userId: userId ?? null, orgId: orgId ?? null };
  } catch {
    return { userId: null, orgId: null };
  }
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden(): NextResponse {
  return NextResponse.json({ error: "Forbidden: You do not have permission to perform this action" }, { status: 403 });
}

import { createServerSupabase } from "@/lib/supabase-server";

export async function verifyTaskAccess(userId: string, deptId: string): Promise<boolean> {
  const supabase = createServerSupabase();
  const { data: user } = await supabase.from("users").select("role").eq("id", userId).single();
  
  if (!user) return false;
  
  // Admins and HR have global access
  if (user.role === "admin" || user.role === "hr") return true;
  
  // Only department approvers can mutate tasks assigned to them
  if (user.role === "dept_approver") {
    const { data: assignments } = await supabase
      .from("department_assignments")
      .select("department")
      .eq("user_id", userId);
      
    if (assignments && assignments.some(a => a.department === deptId)) {
      return true;
    }
  }
  
  return false;
}
