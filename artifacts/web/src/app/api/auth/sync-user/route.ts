import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";
import { Role } from "@/lib/types";

/**
 * POST /api/auth/sync-user
 *
 * Upserts the currently logged-in Clerk user into the `users` table and returns
 * their full profile including their reporting manager.
 *
 * Called:
 *  - After Clerk login (from useAuth hook)
 *  - Before submitting a resignation (to ensure user row exists for FK constraints)
 *
 * Body: { email, name, role?, dept?, employeeId?, managerId? }
 */
export async function POST(request: NextRequest) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const supabase = createServerSupabase();
  const body = await request.json().catch(() => ({}));

  const {
    email = "",
    name = "",
    role = "employee",
    dept = "",
    employeeId = "",
    managerId = null,
    managerName = "",
    jobTitle = "",
  } = body as {
    email?: string;
    name?: string;
    role?: Role;
    dept?: string;
    employeeId?: string;
    managerId?: string | null;
    managerName?: string;
    jobTitle?: string;
  };

  // Upsert user row using only columns guaranteed to exist in the base schema.
  // Extended columns (manager_id, job_title) are added by migration 00003.
  const baseUpsert: Record<string, unknown> = {
    id: userId,
    email: email || `${userId}@exitflow.app`,
    name: name || "Unknown User",
    role,
    dept,
    employee_id: employeeId || userId.slice(0, 8).toUpperCase(),
    updated_at: new Date().toISOString(),
  };

  // Check if manager_id column exists (migration 00003) before trying to set it
  // We do this by attempting the upsert without the column first, then with it.
  const { data: upsertedUser, error: upsertError } = await supabase
    .from("users")
    .upsert(baseUpsert, { onConflict: "id" })
    .select("id, email, name, role, dept, employee_id")
    .single();

  if (upsertError) {
    console.error("[POST /api/auth/sync-user] upsert error:", upsertError.message);
    return NextResponse.json(
      { id: userId, email, name, role, dept, employeeId, managerId: null, managerName: "", error: upsertError.message },
      { status: 207 },
    );
  }

  // Try to read manager_id if column exists (post-migration)
  let resolvedManagerId: string | null = null;
  let resolvedManagerName = "";

  try {
    const { data: withManager } = await supabase
      .from("users")
      .select("manager_id, manager_name")
      .eq("id", userId)
      .single();
    if (withManager) {
      resolvedManagerId = (withManager as Record<string, unknown>).manager_id as string | null;
      resolvedManagerName = ((withManager as Record<string, unknown>).manager_name as string) ?? "";
    }
  } catch {
    // manager_id column doesn't exist yet — migration 00003 not run
  }

  return NextResponse.json({
    id: upsertedUser!.id,
    email: upsertedUser!.email,
    name: upsertedUser!.name,
    role: upsertedUser!.role,
    dept: upsertedUser!.dept,
    employeeId: (upsertedUser as Record<string, unknown>).employee_id ?? "",
    managerId: resolvedManagerId,
    managerName: resolvedManagerName,
  });
}

/**
 * GET /api/auth/sync-user
 *
 * Returns the current user's profile from the DB, or null if not found.
 * Lightweight — used to check if manager assignment exists.
 */
export async function GET() {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("users")
    .select("*, manager:manager_id(id, name, email, dept, role)")
    .eq("id", userId)
    .single();

  if (error || !data) {
    // User hasn't been synced yet — return null so the client can POST to sync
    return NextResponse.json(null);
  }

  const manager = data?.manager as { id: string; name: string } | null;

  return NextResponse.json({
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role,
    dept: data.dept,
    employeeId: data.employee_id ?? "",
    managerId: manager?.id ?? null,
    managerName: manager?.name ?? data.manager_name ?? "",
    jobTitle: data.job_title ?? "",
  });
}
