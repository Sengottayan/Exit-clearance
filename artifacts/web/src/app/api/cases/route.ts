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

  const targetEmployeeId = body.userId;
  if (!targetEmployeeId) {
    return NextResponse.json({ error: "Missing employee ID" }, { status: 400 });
  }

  // 1. Validate Employee Exists & Role
  const { data: employee, error: empError } = await supabase
    .from("users")
    .select("*")
    .eq("id", targetEmployeeId)
    .single();

  if (empError || !employee) {
    return NextResponse.json({ error: "Selected employee not found in database" }, { status: 404 });
  }

  if (employee.role !== "employee") {
    return NextResponse.json({ error: "Selected user is not an employee" }, { status: 400 });
  }

  // Active validation (if employment_status exists later, enforce here)
  if (employee.status && employee.status !== "active") {
    return NextResponse.json({ error: "Employee is not active" }, { status: 400 });
  }

  if (MULTI_TENANT_ENABLED && employee.organization_id !== orgId) {
    return NextResponse.json({ error: "Employee does not belong to this organization" }, { status: 403 });
  }

  // 2. Duplicate Prevention
  const { data: existingCases } = await supabase
    .from("exit_cases")
    .select("id")
    .eq("employee_id", targetEmployeeId)
    .not("status", "in", '("completed", "cancelled")');

  if (existingCases && existingCases.length > 0) {
    return NextResponse.json({ error: "Employee already has an active exit case" }, { status: 409 });
  }

  // 3. Resolve & Validate Manager
  let managerId: string = body.manager_id || employee.manager_id;
  let managerName: string = body.manager_name || "HR Manager (System)";

  if (managerId) {
    const { data: managerRow } = await supabase.from("users").select("id, name, role").eq("id", managerId).single();
    if (managerRow) {
      managerName = managerRow.name;
    } else {
      return NextResponse.json({ error: "Assigned manager does not exist" }, { status: 400 });
    }
  } else {
    // Fallback to department manager
    const { data: deptManager } = await supabase
      .from("users")
      .select("id, name")
      .eq("role", "manager")
      .eq("dept", employee.dept || "")
      .limit(1)
      .single();

    if (deptManager) {
      managerId = deptManager.id;
      managerName = deptManager.name;
    } else {
      return NextResponse.json({ error: "No manager found for employee" }, { status: 400 });
    }
  }

  // 4. Validate Workflow Exists
  const { data: depts } = await supabase.from("departments").select("*");
  const { data: templates } = await supabase.from("checklist_templates").select("*");

  if (!depts || depts.length === 0) {
    return NextResponse.json({ error: "No workflow steps configured (0 departments found)" }, { status: 400 });
  }

  // 5. Generate Reference ID & Create Case
  const caseId = `EXIT-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;

  const { data: newCase, error } = await supabase
    .from("exit_cases")
    .insert({
      id: caseId,
      employee_id: targetEmployeeId,
      employee_name: employee.name,
      employee_email: employee.email,
      employee_role: employee.role,
      employee_dept: employee.dept,
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
  let stepsGenerated = 0;
  let expectedCompletionDate = new Date();

  try {
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

      const slaHours = d.sla_hours || 24;
      const slaDueAt = new Date(now.getTime() + slaHours * 60 * 60 * 1000);
      if (slaDueAt > expectedCompletionDate) expectedCompletionDate = slaDueAt;

      stepsGenerated++;

      return {
        id: `t-${d.id}-${caseId}-${index}`,
        case_id: caseId,
        dept_id: d.id,
        dept_label: d.label,
        assignee_id: d.default_assignee || managerId,
        assignee_name: d.default_assignee ? (d.label + " Admin") : managerName,
        status: "pending",
        sla_hours: slaHours,
        sla_due_at: slaDueAt.toISOString(),
        checklist: checklist
      };
    });

    const { error: tasksErr } = await supabase.from("clearance_tasks").insert(tasksToInsert);
    if (tasksErr) console.error("Error inserting tasks:", tasksErr.message);

    await supabase.from("timeline_events").insert({
      case_id: caseId,
      actor: employee.name || "Employee",
      actor_role: "employee",
      label: "Resignation Submitted",
      status: "pending"
    });

  } catch (err) {
    console.error("[POST /api/cases] Workflow initialization error:", err);
  }

  // Return standard success payload
  return NextResponse.json({
    success: true,
    caseId: caseId,
    employee: employee.name,
    workflow: "Standard Exit",
    stepsGenerated,
    expectedCompletionDate: expectedCompletionDate.toISOString(),
    raw: newCase
  }, { status: 201 });
}
