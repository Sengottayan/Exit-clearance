import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { userId, orgId } = await getOptionalAuth();
  if (!userId) return unauthorized();
  // Note: orgId may be null in dev (user not in a Clerk org yet) — we fall back gracefully

  const supabase = createServerSupabase();

  // Resolve the database org ID from the Clerk org ID (falls back to legacy org UUID)
  let dbOrgId = "00000000-0000-0000-0000-000000000000";
  if (orgId) {
    const { data: orgData } = await supabase
      .from("organizations")
      .select("id")
      .eq("clerk_org_id", orgId)
      .single();
    if (orgData?.id) dbOrgId = orgData.id;
  }

  // 1. Fetch User Identity (including dept and role from users table)
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email, name, first_name, last_name, avatar_url, phone_number, role, dept, job_title")
    .eq("id", userId)
    .single();

  if (userError) {
    console.error("User query error:", userError);
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  // 2. Fetch Employment Details
  const { data: member, error: memberError } = await supabase
    .from("organization_members")
    .select(`
      id, employee_id_string, job_title, employee_type, date_of_hire, employment_status,
      organizations (id, name)
    `)
    .eq("user_id", userId)
    .eq("organization_id", dbOrgId)
    .single();

  if (memberError && memberError.code !== 'PGRST116') {
    console.error("Member query error:", memberError);
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  // 3. Fetch Manager (via reporting_relationships)
  let managerId = null;
  if (member?.id) {
    const { data: rel } = await supabase
      .from("reporting_relationships")
      .select("manager_member_id")
      .eq("employee_member_id", member.id)
      .is("effective_to", null)
      .limit(1)
      .single();
    if (rel) managerId = rel.manager_member_id;
  }

  // 4. Role-specific data: Team Stats for Manager
  let teamStats = undefined;
  if (user.role === "manager") {
    const { count: totalReports } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("manager_id", userId);

    // Use OR clause: match by manager_id (after remap) OR manager_email (before remap)
    // This ensures the count is accurate even on the very first profile load
    const { count: activeExits } = await supabase
      .from("legacy_exit_cases")
      .select("id", { count: "exact", head: true })
      .or(`manager_id.eq.${userId},manager_email.eq.${user.email}`)
      .not("status", "in", "(completed,cancelled)");

    teamStats = {
      totalReports: totalReports ?? 0,
      activeExits: activeExits ?? 0,
    };
  }

  // 5. Role-specific data: Department Assignments for Dept Approver
  let departmentAssignments = undefined;
  if (user.role === "dept_approver") {
    const { data: assignments } = await supabase
      .from("department_assignments")
      .select("department, dept_label, authority")
      .eq("user_id", userId)
      .eq("is_active", true);

    departmentAssignments = assignments ?? [];
  }

  const userRole = user.role || "employee";

  return NextResponse.json({
    user: {
      id: user.id,
      firstName: user.first_name || user.name?.split(" ")[0] || "",
      lastName: user.last_name || user.name?.split(" ").slice(1).join(" ") || "",
      email: user.email,
      phone: user.phone_number || "",
      avatarUrl: user.avatar_url || "",
    },
    employment: {
      memberId: member?.id || "",
      employeeId: member?.employee_id_string || "",
      jobTitle: member?.job_title || user.job_title || "",
      employeeType: member?.employee_type || "full_time",
      dateOfHire: member?.date_of_hire || null,
      employmentStatus: member?.employment_status || "active",
      managerId: managerId,
      dept: user.dept || "",
      role: userRole,
    },
    organization: {
      id: (Array.isArray(member?.organizations) ? member.organizations[0]?.id : (member?.organizations as any)?.id) || orgId,
      name: (Array.isArray(member?.organizations) ? member.organizations[0]?.name : (member?.organizations as any)?.name) || "Legacy Organization",
      role: userRole,
    },
    ...(teamStats !== undefined && { teamStats }),
    ...(departmentAssignments !== undefined && { departmentAssignments }),
  });
}

export async function PATCH(request: NextRequest) {
  const { userId, orgId } = await getOptionalAuth();
  if (!userId) return unauthorized();
  // orgId may be null in dev — fall back to legacy org UUID

  const supabase = createServerSupabase();
  
  let dbOrgId = "00000000-0000-0000-0000-000000000000";
  if (orgId) {
    const { data: orgData } = await supabase
      .from("organizations")
      .select("id")
      .eq("clerk_org_id", orgId)
      .single();
    if (orgData?.id) dbOrgId = orgData.id;
  }


  try {
    const body = await request.json();
    const { 
      firstName, lastName, phone, 
      jobTitle, employeeType, dateOfHire, managerId,
      dept,  // Now supported for all roles
    } = body;

    // VALIDATION
    if (dateOfHire && new Date(dateOfHire) > new Date()) {
      return NextResponse.json({ error: "Date of hire cannot be in the future" }, { status: 400 });
    }
    if (phone && !/^[0-9+\s-]{7,20}$/.test(phone)) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
    }

    // 1. Get current user role + member
    const { data: currentUser, error: cuError } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (cuError) throw new Error("Could not verify user");

    const { data: currentMember, error: cmError } = await supabase
      .from("organization_members")
      .select("id, job_title, employee_type, date_of_hire")
      .eq("user_id", userId)
      .eq("organization_id", dbOrgId)
      .single();

    if (cmError) throw new Error("Could not verify organization membership");

    if (managerId && managerId === currentMember.id) {
      return NextResponse.json({ error: "Cannot select yourself as a manager" }, { status: 400 });
    }

    if (managerId) {
      const { data: mgrCheck } = await supabase
        .from("organization_members")
        .select("id")
        .eq("id", managerId)
        .eq("organization_id", dbOrgId)
        .single();
      
      if (!mgrCheck) {
        return NextResponse.json({ error: "Manager does not belong to the active organization" }, { status: 400 });
      }
    }

    // 2. Update Identity (users table — includes dept now)
    const name = `${firstName} ${lastName}`.trim();
    const userUpdates: Record<string, unknown> = {
      first_name: firstName,
      last_name: lastName,
      name: name,
      phone_number: phone,
    };
    // Update dept for all roles (manager needs this for dashboard filtering)
    if (dept !== undefined) {
      userUpdates.dept = dept;
    }

    await supabase
      .from("users")
      .update(userUpdates)
      .eq("id", userId);

    // 3. Update Employment (organization_members)
    await supabase
      .from("organization_members")
      .update({
        job_title: jobTitle,
        employee_type: employeeType,
        date_of_hire: dateOfHire,
      })
      .eq("id", currentMember.id);

    // 4. Update Manager (reporting_relationships)
    if (managerId !== undefined) {
      await supabase
        .from("reporting_relationships")
        .update({ effective_to: new Date().toISOString() })
        .eq("employee_member_id", currentMember.id)
        .is("effective_to", null);

      if (managerId) {
        await supabase
          .from("reporting_relationships")
          .insert({
            organization_id: dbOrgId,
            employee_member_id: currentMember.id,
            manager_member_id: managerId,
            type: "solid",
          });
      }
    }

    // 5. If manager updated dept, remap any exit cases still pointing to their old dept
    if (currentUser.role === "manager" && dept) {
      // Also update users.dept so dashboard filter works immediately
      // (already done above in step 2)
    }

    // 6. Audit Log
    const auditPayload = {
      changed_fields: {
        job_title: { old: currentMember.job_title, new: jobTitle },
        employee_type: { old: currentMember.employee_type, new: employeeType },
        dept: { new: dept },
      }
    };

    await supabase
      .from("org_audit_logs")
      .insert({
        organization_id: dbOrgId,
        actor_id: userId,
        actor_role: currentUser.role || "employee",
        entity_type: "System",
        entity_id: userId,
        action: "Updated",
        details: JSON.stringify({ message: "Profile updated", changes: auditPayload }),
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
        session_id: "unknown",
        severity: "info",
        is_synthetic: false,
      });

    return NextResponse.json({ success: true });
    
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
