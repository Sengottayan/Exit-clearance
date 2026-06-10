import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const supabase = createServerSupabase();
  const { searchParams } = new URL(request.url);

  const managerId = searchParams.get("manager_id");
  const status = searchParams.get("status");
  const department = searchParams.get("department");
  const reason = searchParams.get("reason");
  const search = searchParams.get("search");
  const exportFormat = searchParams.get("format") || "csv"; // csv | excel

  // Build query — same filtering logic as GET /api/cases
  let query = supabase
    .from("exit_cases")
    .select("id, employee_name, employee_email, employee_role, employee_dept, manager_name, status, resignation_date, last_working_day, notice_period_days, exit_reason, escalated, created_at, clearance_tasks(id, status, sla_due_at)")
    .order("created_at", { ascending: false });

  if (managerId) query = query.eq("manager_id", managerId);
  if (status && status !== "all") query = query.eq("status", status);
  if (department && department !== "all") query = query.eq("employee_dept", department);
  if (reason && reason !== "all") query = query.eq("exit_reason", reason);
  if (search) {
    query = query.or(
      `employee_name.ilike.%${search}%,employee_email.ilike.%${search}%,employee_dept.ilike.%${search}%,id.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = new Date();

  // ── Compute SLA status per case ──────────────────────────────────────────────
  const enriched = (data ?? []).map((c: any) => {
    const tasks = c.clearance_tasks ?? [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === "approved" || t.status === "completed").length;
    const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : c.status === "completed" ? 100 : 0;

    let slaStatus = "On Track";
    if (c.status === "completed" || c.status === "cancelled") {
      slaStatus = "—";
    } else {
      const hasOverdue = tasks.some(
        (t: any) => t.status !== "approved" && t.status !== "completed" && t.sla_due_at && new Date(t.sla_due_at) < now
      );
      if (hasOverdue) slaStatus = "Overdue";
      else if (c.status === "in_clearance") slaStatus = "At Risk";
    }

    const statusLabels: Record<string, string> = {
      pending_manager: "Pending Approval",
      in_clearance: "In Clearance",
      completed: "Completed",
      cancelled: "Cancelled",
    };

    return {
      "Case ID": c.id,
      "Employee Name": c.employee_name,
      "Employee Email": c.employee_email,
      "Role": c.employee_role,
      "Department": c.employee_dept,
      "Manager": c.manager_name,
      "Status": statusLabels[c.status] ?? c.status,
      "SLA Status": slaStatus,
      "Progress (%)": progressPct,
      "Exit Reason": c.exit_reason?.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) ?? "",
      "Resignation Date": c.resignation_date ? format(new Date(c.resignation_date), "dd MMM yyyy") : "",
      "Last Working Day": c.last_working_day ? format(new Date(c.last_working_day), "dd MMM yyyy") : "",
      "Notice Period (Days)": c.notice_period_days ?? "",
      "Escalated": c.escalated ? "Yes" : "No",
      "Created At": c.created_at ? format(new Date(c.created_at), "dd MMM yyyy HH:mm") : "",
    };
  });

  // ── Build CSV ─────────────────────────────────────────────────────────────────
  if (exportFormat === "csv") {
    const headers = Object.keys(enriched[0] ?? {});
    const rows = enriched.map((row) =>
      headers.map((h) => {
        const val = String(row[h as keyof typeof row] ?? "");
        // Escape values with commas or quotes
        return val.includes(",") || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");

    const timestamp = format(now, "yyyy-MM-dd_HH-mm");
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="team-exits-${timestamp}.csv"`,
      },
    });
  }

  // Fallback — return JSON if unknown format
  return NextResponse.json({ data: enriched });
}
