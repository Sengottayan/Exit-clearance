import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";
import { differenceInHours } from "date-fns";

const MULTI_TENANT_ENABLED = true; // Toggle to true after full DB migration

export async function GET(request: NextRequest) {
  const { userId, orgId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  if (MULTI_TENANT_ENABLED && !orgId) {
    return NextResponse.json({ error: "Organization context required" }, { status: 403 });
  }

  const supabase = createServerSupabase();
  const { searchParams } = new URL(request.url);
  const managerId = searchParams.get("manager_id");

  let query = supabase
    .from("exit_cases")
    .select("status, clearance_tasks(status, sla_due_at, completed_at)");

  if (MULTI_TENANT_ENABLED && orgId) {
    // In the future when querying org_exit_cases, we would add:
    // query = query.eq("organization_id", orgId);
  }

  if (managerId) {
    query = query.eq("manager_id", managerId);
  }

  const { data: cases, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const metrics = {
    totalCases: cases.length,
    pendingManager: 0,
    inClearance: 0,
    overdue: 0,
    completed: 0,
    avgClearanceTime: "0 days", // Placeholder for future enhancement
    slaComplianceRate: "100%", // Placeholder for future enhancement
  };

  let totalTasks = 0;
  let compliantTasks = 0;

  const now = new Date();

  for (const c of cases) {
    if (c.status === "pending_manager") metrics.pendingManager++;
    if (c.status === "in_clearance") metrics.inClearance++;
    if (c.status === "completed") metrics.completed++;

    let caseIsOverdue = false;

    if (c.clearance_tasks) {
      for (const t of c.clearance_tasks) {
        totalTasks++;
        
        // If task is completed, check if it was completed on time
        if (t.status === "approved" || t.status === "completed") {
          if (t.sla_due_at && t.completed_at) {
            if (new Date(t.completed_at) <= new Date(t.sla_due_at)) {
              compliantTasks++;
            }
          } else {
            // Assume compliant if no SLA or completed_at
            compliantTasks++;
          }
        } else {
          // If task is pending, check if it's currently overdue
          if (t.sla_due_at && new Date(t.sla_due_at) < now) {
            caseIsOverdue = true;
          } else {
            // Pending but not overdue
            compliantTasks++;
          }
        }
      }
    }
    
    if (caseIsOverdue) {
      metrics.overdue++;
    }
  }

  if (totalTasks > 0) {
    metrics.slaComplianceRate = Math.round((compliantTasks / totalTasks) * 100) + "%";
  }

  return NextResponse.json(metrics);
}
