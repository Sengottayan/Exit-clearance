import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { userId, orgId } = await getOptionalAuth();
  if (!userId) return unauthorized();
  if (!orgId) return NextResponse.json({ error: "Organization context required" }, { status: 403 });

  const supabase = createServerSupabase();

  const { data: orgData } = await supabase
    .from("organizations")
    .select("id")
    .eq("clerk_org_id", orgId)
    .single();
  const dbOrgId = orgData?.id || "00000000-0000-0000-0000-000000000000";

  // 1. Fetch User Identity
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email, name, first_name, last_name, avatar_url, phone_number")
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

  // 3. Fetch Manager (if member exists)
  let managerId = null;
  if (member?.id) {
    const { data: rel } = await supabase
      .from("reporting_relationships")
      .select("manager_member_id")
      .eq("employee_member_id", member.id)
      .is("effective_to", null)
      .limit(1)
      .single();
    
    if (rel) {
      managerId = rel.manager_member_id;
    }
  }

  // Construct combined response
  return NextResponse.json({
    user: {
      id: user.id,
      firstName: user.first_name || user.name.split(" ")[0] || "",
      lastName: user.last_name || user.name.split(" ").slice(1).join(" ") || "",
      email: user.email,
      phone: user.phone_number || "",
      avatarUrl: user.avatar_url || "",
    },
    employment: {
      memberId: member?.id || "",
      employeeId: member?.employee_id_string || "",
      jobTitle: member?.job_title || "",
      employeeType: member?.employee_type || "full_time",
      dateOfHire: member?.date_of_hire || null,
      employmentStatus: member?.employment_status || "active",
      managerId: managerId,
    },
    organization: {
      id: (Array.isArray(member?.organizations) ? member.organizations[0]?.id : (member?.organizations as any)?.id) || orgId,
      name: (Array.isArray(member?.organizations) ? member.organizations[0]?.name : (member?.organizations as any)?.name) || "Legacy Organization",
      role: "employee", // Future: dynamic from org roles
    }
  });
}

export async function PATCH(request: NextRequest) {
  const { userId, orgId } = await getOptionalAuth();
  if (!userId) return unauthorized();
  if (!orgId) return NextResponse.json({ error: "Organization context required" }, { status: 403 });

  const supabase = createServerSupabase();
  
  const { data: orgData } = await supabase
    .from("organizations")
    .select("id")
    .eq("clerk_org_id", orgId)
    .single();
  const dbOrgId = orgData?.id || "00000000-0000-0000-0000-000000000000";

  try {
    const body = await request.json();
    const { 
      firstName, lastName, phone, 
      jobTitle, employeeType, dateOfHire, managerId 
    } = body;

    // VALIDATION
    if (dateOfHire && new Date(dateOfHire) > new Date()) {
      return NextResponse.json({ error: "Date of hire cannot be in the future" }, { status: 400 });
    }
    // Phone basic validation (digits, plus, spaces, dashes)
    if (phone && !/^[0-9+\s-]{7,20}$/.test(phone)) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
    }

    // 1. Get Current Member ID and role for validation & audit
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

    // Manager validation: verify new manager belongs to same org
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

    // 2. Update Identity (users)
    const name = `${firstName} ${lastName}`.trim();
    await supabase
      .from("users")
      .update({
        first_name: firstName,
        last_name: lastName,
        name: name,
        phone_number: phone
      })
      .eq("id", userId);

    // 3. Update Employment (organization_members)
    // Only HR/Admin should typically update jobTitle/etc, but for this iteration,
    // if passed in, we update. (Role-based restriction would be handled UI side or via explicit role checks here).
    await supabase
      .from("organization_members")
      .update({
        job_title: jobTitle,
        employee_type: employeeType,
        date_of_hire: dateOfHire
      })
      .eq("id", currentMember.id);

    // 4. Update Manager (reporting_relationships)
    if (managerId !== undefined) {
      // End existing
      await supabase
        .from("reporting_relationships")
        .update({ effective_to: new Date().toISOString() })
        .eq("employee_member_id", currentMember.id)
        .is("effective_to", null);

      if (managerId) {
        // Create new
        await supabase
          .from("reporting_relationships")
          .insert({
            organization_id: dbOrgId,
            employee_member_id: currentMember.id,
            manager_member_id: managerId,
            type: "solid"
          });
      }
    }

    // 5. Audit Logging
    // Compute changes
    const details = [];
    if (jobTitle !== currentMember.job_title) details.push(`Job Title changed to ${jobTitle}`);
    if (employeeType !== currentMember.employee_type) details.push(`Employee Type changed to ${employeeType}`);
    // Simplified audit log payload (would ideally map old/new as requested)
    const auditPayload = {
      changed_fields: {
        job_title: { old: currentMember.job_title, new: jobTitle },
        employee_type: { old: currentMember.employee_type, new: employeeType },
      }
    };

    await supabase
      .from("org_audit_logs")
      .insert({
        organization_id: dbOrgId,
        actor_id: userId,
        actor_role: "employee", // or fetch real role
        entity_type: "System", // Or 'User' mapped to System
        entity_id: userId,
        action: "Updated",
        details: JSON.stringify({ message: "Profile updated", changes: auditPayload }),
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
        session_id: "unknown",
        severity: "info",
        is_synthetic: false
      });

    return NextResponse.json({ success: true });
    
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
