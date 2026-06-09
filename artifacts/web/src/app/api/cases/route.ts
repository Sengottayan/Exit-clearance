import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const supabase = createServerSupabase();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  let query = supabase
    .from("exit_cases")
    .select("*, clearance_tasks(*), timeline_events(*), exit_interviews(*)")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }
  if (search) {
    query = query.or(
      `employee_name.ilike.%${search}%,employee_email.ilike.%${search}%,employee_dept.ilike.%${search}%,id.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const supabase = createServerSupabase();
  const body = await request.json();

  // Step 1: Upsert the employee into the users table so the FK constraint is satisfiable.
  // This is the missing link — Clerk users don't auto-appear in our users table.
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
      { onConflict: "id" },
    );

  if (upsertEmployeeError) {
    console.error("[POST /api/cases] employee upsert error:", upsertEmployeeError.message);
    // Non-fatal — continue and try to insert the case
  }

  // Step 2: Resolve the manager.
  // Priority: explicit manager_id in body → dept lookup in users table → system sentinel
  let managerId: string = body.manager_id ?? "system-manager";
  let managerName: string = body.manager_name ?? "HR Manager (System)";

  if (managerId && managerId !== "system-manager") {
    // Verify the manager_id exists in users table; if not, upsert it as well
    const { data: managerRow } = await supabase
      .from("users")
      .select("id, name")
      .eq("id", managerId)
      .single();

    if (!managerRow) {
      // Manager doesn't exist in DB — look for one by department
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
        // Use system sentinel — always exists from migration 00003
        managerId = "system-manager";
        managerName = "HR Manager (System)";
      }
    } else {
      managerName = managerRow.name;
    }
  }

  // Ensure system-manager sentinel exists (idempotent)
  await supabase
    .from("users")
    .upsert(
      { id: "system-manager", email: "manager@exitflow.system", name: "HR Manager (System)", role: "manager", dept: "HR", employee_id: "SYS-MGR-001" },
      { onConflict: "id" },
    );

  const caseId = `CASE-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

  const { data, error } = await supabase
    .from("exit_cases")
    .insert({
      id: caseId,
      // Use the Clerk user ID as employee_id (the FK reference to users.id)
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

  // --- NEW WORKFLOW INITIALIZATION ---
  try {
    // 1. Fetch departments
    const { data: depts } = await supabase.from("departments").select("*");
    
    // 2. Fetch checklist templates
    const { data: templates } = await supabase.from("checklist_templates").select("*");

    if (depts && depts.length > 0) {
      const now = new Date();
      
      const tasksToInsert = depts.map((d: any, index: number) => {
        // Find templates for this dept
        const deptTemplates = (templates || []).filter((t: any) => t.dept_id === d.id);
        
        // Map templates to the JSON structure expected by clearance_tasks.checklist
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
          // If default_assignee is null, fallback to the manager or a system user
          assignee_id: d.default_assignee || managerId,
          assignee_name: d.default_assignee ? (d.label + " Admin") : managerName, // simple mock name if ID exists
          status: "pending",
          sla_hours: d.sla_hours || 24,
          sla_due_at: slaDueAt.toISOString(),
          checklist: checklist
        };
      });

      // Insert tasks
      const { error: tasksErr } = await supabase.from("clearance_tasks").insert(tasksToInsert);
      if (tasksErr) console.error("Error inserting tasks:", tasksErr.message);
    }

    // 3. Insert Initial Timeline Event
    await supabase.from("timeline_events").insert({
      case_id: caseId,
      actor: body.employee_name || "Employee",
      actor_role: "employee",
      label: "Resignation Submitted",
      status: "pending"
    });

    // 4. Insert Audit Log
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
    // Non-fatal, return the case anyway
  }

  // Fetch the fully initialized case to return
  const { data: finalCase } = await supabase
    .from("exit_cases")
    .select("*, clearance_tasks(*), timeline_events(*), exit_interviews(*)")
    .eq("id", caseId)
    .single();

  return NextResponse.json(finalCase || data, { status: 201 });
}
