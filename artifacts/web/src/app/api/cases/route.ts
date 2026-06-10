import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";

const MULTI_TENANT_ENABLED = false; // Toggle to true after full DB migration

export async function GET(request: NextRequest) {
  const { userId, orgId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  if (MULTI_TENANT_ENABLED && !orgId) {
    return NextResponse.json({ error: "Organization context required" }, { status: 403 });
  }

  const supabase = createServerSupabase();
  const { searchParams } = new URL(request.url);
  
  // Filtering
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const department = searchParams.get("department");
  const managerId = searchParams.get("manager_id");
  
  // Pagination
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "1000", 10);
  const offset = (page - 1) * limit;

  // Sorting
  const sort = searchParams.get("sort") || "created_at";
  const order = searchParams.get("order") || "desc";

  // During migration phase, we use the legacy backward-compatibility view
  let query = supabase
    .from("exit_cases")
    .select("*, clearance_tasks(*), timeline_events(*), exit_interviews(*)", { count: "exact" })
    .order(sort, { ascending: order === "asc" });

  if (MULTI_TENANT_ENABLED && orgId) {
    // In the future when querying org_exit_cases, we would add:
    // query = query.eq("organization_id", orgId);
  }

  // Apply filters
  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  if (department && department !== "all") {
    query = query.eq("employee_dept", department);
  }
  if (managerId) {
    query = query.eq("manager_id", managerId);
  }
  if (search) {
    query = query.or(
      `employee_name.ilike.%${search}%,employee_email.ilike.%${search}%,employee_dept.ilike.%${search}%,id.ilike.%${search}%`
    );
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return paginated response if limit is strictly applied, but UI currently expects array.
  // For backward compatibility, if pagination is implicit, just return data.
  // We'll return the data array directly to not break useCases map function,
  // but future UI refactors can use a metadata wrapper.
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { userId, orgId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  if (MULTI_TENANT_ENABLED && !orgId) {
    return NextResponse.json({ error: "Organization context required" }, { status: 403 });
  }

  const supabase = createServerSupabase();
  const body = await request.json();

  // Upsert employee into users table
  const { error: upsertEmployeeError } = await supabase
    .from("users")
    .upsert(
      {
        id: userId,
        email: body.employee_email || "",
        name: body.employee_name || "",
        role: "employee",
        dept: body.employee_dept || "",
        employee_id: body.employee_id || userId.slice(0, 8).toUpperCase(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (upsertEmployeeError) {
    console.error("[POST /api/cases] employee upsert error:", upsertEmployeeError.message);
  }

  // Resolve manager
  let managerId: string = body.manager_id ?? "system-manager";
  let managerName: string = body.manager_name ?? "HR Manager (System)";

  if (managerId && managerId !== "system-manager") {
    const { data: managerRow } = await supabase.from("users").select("id, name").eq("id", managerId).single();

    if (!managerRow) {
      const { data: deptManager } = await supabase
        .from("users")
        .select("id, name")
        .eq("role", "manager")
        .eq("dept", body.employee_dept || "")
        .limit(1)
        .single();

      if (deptManager) {
        managerId = deptManager.id;
        managerName = deptManager.name;
      } else {
        managerId = "system-manager";
        managerName = "HR Manager (System)";
      }
    } else {
      managerName = managerRow.name;
    }
  }

  await supabase
    .from("users")
    .upsert(
      { id: "system-manager", email: "manager@exitflow.system", name: "HR Manager (System)", role: "manager", dept: "HR", employee_id: "SYS-MGR-001" },
      { onConflict: "id" }
    );

  const caseId = `CASE-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

  const { data, error } = await supabase
    .from("exit_cases")
    .insert({
      id: caseId,
      employee_id: userId,
      employee_name: body.employee_name,
      employee_email: body.employee_email,
      employee_role: body.employee_role ?? "",
      employee_dept: body.employee_dept,
      manager_id: managerId,
      manager_name: managerName,
      status: "pending_manager",
      resignation_date: body.resignation_date,
      last_working_day: body.last_working_day,
      notice_period_days: body.notice_period_days,
      exit_reason: body.exit_reason,
      tags: body.tags ?? [],
    })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/cases] insert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Workflow initialization
  try {
    const { data: depts } = await supabase.from("departments").select("*");
    const { data: templates } = await supabase.from("checklist_templates").select("*");

    if (depts && depts.length > 0) {
      const now = new Date();
      const tasksToInsert = depts.map((d: any, index: number) => {
        const deptTemplates = (templates || []).filter((t: any) => t.dept_id === d.id);
        const checklist = deptTemplates.map((t: any) => ({
          id: t.id,
          label: t.label,
          isMandatory: t.is_mandatory,
          checked: false,
          hasInput: t.has_input,
          inputLabel: t.input_label
        }));

        const slaDueAt = new Date(now.getTime() + (d.sla_hours || 24) * 60 * 60 * 1000);

        return {
          id: `t-${d.id}-${caseId}-${index}`,
          case_id: caseId,
          dept_id: d.id,
          dept_label: d.label,
          assignee_id: d.default_assignee || managerId,
          assignee_name: d.default_assignee ? (d.label + " Admin") : managerName,
          status: "pending",
          sla_hours: d.sla_hours || 24,
          sla_due_at: slaDueAt.toISOString(),
          checklist: checklist
        };
      });

      const { error: tasksErr } = await supabase.from("clearance_tasks").insert(tasksToInsert);
      if (tasksErr) console.error("Error inserting tasks:", tasksErr.message);
    }

    await supabase.from("timeline_events").insert({
      case_id: caseId,
      actor: body.employee_name || "Employee",
      actor_role: "employee",
      label: "Resignation Submitted",
      status: "pending"
    });

    await supabase.from("audit_logs").insert({
      actor: body.employee_name || "Employee",
      role: "employee",
      type: "Case",
      action: "CREATED",
      entity: caseId,
      details: "Employee submitted resignation",
      case_id: caseId
    });

  } catch (err) {
    console.error("[POST /api/cases] Workflow initialization error:", err);
  }

  const { data: finalCase } = await supabase
    .from("exit_cases")
    .select("*, clearance_tasks(*), timeline_events(*), exit_interviews(*)")
    .eq("id", caseId)
    .single();

  return NextResponse.json(finalCase || data, { status: 201 });
}
