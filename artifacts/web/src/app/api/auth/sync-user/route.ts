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
 * Email-Based Manager Remapping:
 *   Instead of hardcoding synthetic IDs like 'usr_mgr_004', we remap manager_id
 *   by matching on manager_email. This is production-safe and supports any dataset.
 *
 * Department Auto-Assign:
 *   On first login for a manager, if users.dept is empty, we copy the dept from
 *   any matching synthetic record (matched by email) so the dashboard works immediately.
 *
 * Called:
 *  - After Clerk login (from authStore.setClerkUser)
 *  - Before submitting a resignation (to ensure user row exists for FK constraints)
 *
 * Body: { email, name, role?, dept?, employeeId? }
 */
export async function POST(request: NextRequest) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const supabase = createServerSupabase();
  const body = await request.json().catch(() => ({}));

  const action = (body as { action?: string }).action;

  const {
    email = "",
    name = "",
    role = "employee",
    dept = "",
    phone = "",
    employeeId = "",
  } = body as {
    email?: string;
    name?: string;
    role?: Role;
    dept?: string;
    phone?: string;
    employeeId?: string;
  };

  if (action === "update_profile") {
    // Find a manager in the new dept for auto-assignment
    let newManagerId: string | null = null;
    let newManagerName = "";

    const { data: managers } = await supabase
      .from("users")
      .select("id, name")
      .eq("role", "manager")
      .eq("dept", dept)
      .limit(1);

    if (managers && managers.length > 0) {
      newManagerId = managers[0].id;
      newManagerName = managers[0].name;
    } else {
      newManagerId = "system-manager";
      newManagerName = "HR Manager (System)";
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({ dept, phone, manager_id: newManagerId, manager_name: newManagerName })
      .eq("id", userId)
      .select("id, email, name, role, dept, employee_id, phone")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        dept: updatedUser.dept,
        employeeId: updatedUser.employee_id ?? "",
        phone: updatedUser.phone ?? "",
        managerId: newManagerId,
        managerName: newManagerName,
      },
      token: "dummy-token-not-used",
    });
  }

  // ── Standard sync-user upsert ─────────────────────────────────────────────
  const baseUpsert: Record<string, unknown> = {
    id: userId,
    email: email || `${userId}@exitflow.app`,
    name: name || "Unknown User",
    role,
    dept,
    employee_id: employeeId || userId.slice(0, 8).toUpperCase(),
    updated_at: new Date().toISOString(),
  };

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

  // ── Email-based manager_id remapping ──────────────────────────────────────
  // After upsert, remap any exit cases where manager_email = this user's email
  // but manager_id is still a synthetic placeholder. This is safe for all datasets.
  if (role === "manager" && email) {
    try {
      // Remap legacy_exit_cases where manager_email matches but manager_id is stale
      const { error: remapCasesErr } = await supabase
        .from("legacy_exit_cases")
        .update({ manager_id: userId, manager_name: name || upsertedUser?.name || "" })
        .eq("manager_email", email)
        .neq("manager_id", userId); // only update if not already mapped

      if (remapCasesErr) {
        console.warn("[sync-user] Case remap warning:", remapCasesErr.message);
      }

      // ── Department auto-assign on first login ───────────────────────────
      // If the user has no dept set yet, look it up from the synthetic manager row
      const currentDept = (upsertedUser as any)?.dept ?? "";
      if (!currentDept || currentDept === "") {
        // Find the old synthetic manager row with the same email (different ID)
        const { data: syntheticMgr } = await supabase
          .from("users")
          .select("dept")
          .eq("email", email)
          .neq("id", userId) // a different row with same email
          .limit(1)
          .single();

        const resolvedDept = syntheticMgr?.dept || "Sales";

        await supabase
          .from("users")
          .update({ dept: resolvedDept })
          .eq("id", userId);

        // Return with dept set
        const resolvedManagerId = await resolveManager(supabase, upsertedUser!.id);
        return NextResponse.json({
          id: upsertedUser!.id,
          email: upsertedUser!.email,
          name: upsertedUser!.name,
          role: upsertedUser!.role,
          dept: resolvedDept,
          employeeId: (upsertedUser as any).employee_id ?? "",
          managerId: resolvedManagerId.id,
          managerName: resolvedManagerId.name,
        });
      }
    } catch (err) {
      console.warn("[sync-user] Manager remap error:", err);
    }
  }

  // ── dept_approver: seed department_assignments ──────────────────────────────
  if (role === "dept_approver" && email) {
    try {
      // Find any clearance tasks where this email was the assignee
      // and seed department_assignments accordingly
      const { data: taskDepts } = await supabase
        .from("legacy_clearance_tasks")
        .select("dept_id, dept_label")
        .eq("assignee_id", userId);

      if (taskDepts && taskDepts.length > 0) {
        const uniqueDepts = Array.from(
          new Map(taskDepts.map((t) => [t.dept_id, t])).values()
        );
        for (const d of uniqueDepts) {
          await supabase.from("department_assignments").upsert({
            user_id: userId,
            department: d.dept_id,
            dept_label: d.dept_label,
            authority: "primary",
            is_active: true,
          }, { onConflict: "user_id,department" });
        }
      }
    } catch (err) {
      console.warn("[sync-user] Dept approver assignment seeding error:", err);
    }
  }

  // ── Resolve manager for return payload ────────────────────────────────────
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

// Helper: resolve manager details
async function resolveManager(supabase: any, userId: string) {
  try {
    const { data } = await supabase
      .from("users")
      .select("manager_id, manager_name")
      .eq("id", userId)
      .single();
    return { id: data?.manager_id ?? null, name: data?.manager_name ?? "" };
  } catch {
    return { id: null, name: "" };
  }
}

/**
 * GET /api/auth/sync-user
 *
 * Returns the current user's profile from the DB, or null if not found.
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
