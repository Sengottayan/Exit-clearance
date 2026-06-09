import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";

/**
 * GET /api/employee/profile?dept=Engineering
 *
 * Returns the reporting manager for a given department.
 * Used by the resign form to assign the correct manager before submitting a case.
 *
 * Lookup priority:
 *   1. user.manager_id in the users table (explicit assignment)
 *   2. Any user with role='manager' in the same dept in the users table
 *   3. Fallback to the system-manager sentinel row
 */
export async function GET(request: NextRequest) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const supabase = createServerSupabase();
  const { searchParams } = new URL(request.url);
  const dept = searchParams.get("dept") ?? "";

  // 1. Try to check if the employee has an explicit manager_id set (requires migration 00003)
  try {
    const { data: employeeRow } = await supabase
      .from("users")
      .select("manager_id, manager_name")
      .eq("id", userId)
      .single();

    if (employeeRow) {
      const row = employeeRow as Record<string, unknown>;
      if (row.manager_id) {
        // Fetch the manager's name
        const { data: mgr } = await supabase
          .from("users")
          .select("id, name")
          .eq("id", row.manager_id as string)
          .single();

        return NextResponse.json({
          managerId: row.manager_id,
          managerName: mgr?.name ?? row.manager_name ?? "",
          source: "explicit_assignment",
        });
      }
    }
  } catch {
    // manager_id column doesn't exist yet — fall through to dept lookup
  }

  // 2. Find any manager in the same department
  if (dept) {
    const { data: deptManagers } = await supabase
      .from("users")
      .select("id, name")
      .eq("role", "manager")
      .eq("dept", dept)
      .order("created_at", { ascending: true })
      .limit(1);

    if (deptManagers && deptManagers.length > 0) {
      return NextResponse.json({
        managerId: deptManagers[0].id,
        managerName: deptManagers[0].name,
        source: "dept_lookup",
      });
    }
  }

  // 3. Fall back to any manager in the system
  const { data: anyManager } = await supabase
    .from("users")
    .select("id, name")
    .eq("role", "manager")
    .order("created_at", { ascending: true })
    .limit(1);

  if (anyManager && anyManager.length > 0) {
    return NextResponse.json({
      managerId: anyManager[0].id,
      managerName: anyManager[0].name,
      source: "global_fallback",
    });
  }

  // 4. Ultimate fallback — system-manager sentinel
  return NextResponse.json({
    managerId: "system-manager",
    managerName: "HR Manager (System)",
    source: "system_sentinel",
  });
}
