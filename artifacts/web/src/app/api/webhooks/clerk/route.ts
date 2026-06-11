import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { createServerSupabase } from "@/lib/supabase-server";

// Helper: Seed default roles for a newly created organization in the database
async function seedDefaultRoles(supabase: any, dbOrgId: string) {
  const defaultRoles = [
    { organization_id: dbOrgId, name: "HR Admin", is_system_default: true },
    { organization_id: dbOrgId, name: "Manager", is_system_default: true },
    { organization_id: dbOrgId, name: "Department Approver", is_system_default: true },
    { organization_id: dbOrgId, name: "Employee", is_system_default: true }
  ];

  const { error } = await supabase
    .from("roles")
    .upsert(defaultRoles, { onConflict: "organization_id,name" });

  if (error) {
    console.error(`[Clerk Webhook] Failed to seed roles for org ${dbOrgId}:`, error.message);
  }
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const headersList = request.headers;
  const svix_id = headersList.get("svix-id");
  const svix_timestamp = headersList.get("svix-timestamp");
  const svix_signature = headersList.get("svix-signature");

  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  const isDevOrTest = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
  const bypassSignature = isDevOrTest && (headersList.get("x-test-bypass") === "true" || !webhookSecret);

  if (!bypassSignature) {
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Error: Missing svix headers", { status: 400 });
    }

    if (!webhookSecret) {
      console.error("ERROR: CLERK_WEBHOOK_SECRET is not set.");
      return new Response("Error: Webhook secret not configured", { status: 500 });
    }

    const wh = new Webhook(webhookSecret);
    try {
      wh.verify(payload, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err: any) {
      console.error("Error verifying webhook:", err.message);
      return new Response("Error: Invalid signature", { status: 400 });
    }
  }

  let evt: any;
  try {
    evt = JSON.parse(payload);
  } catch (err: any) {
    return new Response("Error: Invalid JSON body", { status: 400 });
  }

  const { type: eventType, data } = evt;
  const supabase = createServerSupabase();

  console.log(`[Clerk Webhook] Received event: ${eventType}`, data);

  try {
    // ── 1. ORGANIZATION EVENTS ───────────────────────────────────────────────
    if (eventType === "organization.created" || eventType === "organization.updated") {
      const orgData = {
        clerk_org_id: data.id,
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        logo_url: data.logo_url || null,
        created_by: data.created_by || "system",
        updated_at: new Date().toISOString(),
        deleted_at: null, // restore if soft-deleted
      };

      const { data: upsertedOrg, error: orgError } = await supabase
        .from("organizations")
        .upsert(orgData, { onConflict: "clerk_org_id" })
        .select("id")
        .single();

      if (orgError) {
        throw orgError;
      }

      if (upsertedOrg) {
        await seedDefaultRoles(supabase, upsertedOrg.id);
      }
    } 
    
    else if (eventType === "organization.deleted") {
      const { data: orgData } = await supabase
        .from("organizations")
        .select("id")
        .eq("clerk_org_id", data.id)
        .single();

      if (orgData) {
        const timestamp = new Date().toISOString();
        
        // Soft delete the organization
        await supabase
          .from("organizations")
          .update({ deleted_at: timestamp })
          .eq("id", orgData.id);

        // Soft delete all members in this organization
        await supabase
          .from("organization_members")
          .update({ deleted_at: timestamp })
          .eq("organization_id", orgData.id);
      }
    }

    // ── 2. MEMBERSHIP EVENTS ──────────────────────────────────────────────────
    else if (eventType === "organizationMembership.created" || eventType === "organizationMembership.updated") {
      const clerkOrgId = data.organization?.id;
      const userId = data.public_user_data?.user_id;

      if (!clerkOrgId || !userId) {
        return new Response("Error: Missing org or user ID", { status: 400 });
      }

      // Resolve organization DB UUID. If it does not exist, insert it.
      let { data: orgData } = await supabase
        .from("organizations")
        .select("id")
        .eq("clerk_org_id", clerkOrgId)
        .single();

      if (!orgData) {
        const { data: newOrg, error: newOrgErr } = await supabase
          .from("organizations")
          .insert({
            clerk_org_id: clerkOrgId,
            name: data.organization.name || "Unnamed Org",
            slug: data.organization.slug || clerkOrgId,
            created_by: "system",
          })
          .select("id")
          .single();

        if (newOrgErr) throw newOrgErr;
        orgData = newOrg;

        if (orgData) {
          await seedDefaultRoles(supabase, orgData.id);
        }
      }

      if (!orgData) {
        throw new Error(`Could not resolve organization for clerk ID ${clerkOrgId}`);
      }

      // Check if the user exists in the local users table.
      const { data: userExists } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .single();

      if (!userExists) {
        // Create a skeleton user record to satisfy foreign key constraints.
        const email = data.public_user_data.identifier || `${userId}@exitflow.app`;
        const firstName = data.public_user_data.first_name || "";
        const lastName = data.public_user_data.last_name || "";
        const name = `${firstName} ${lastName}`.trim() || "Clerk User";
        const avatarUrl = data.public_user_data.profile_image_url || "";
        
        // Map role to application database roles
        let userRole = "employee";
        if (data.role === "org:admin") {
          userRole = "admin";
        } else if (data.role === "org:manager") {
          userRole = "manager";
        } else if (data.role === "org:dept_approver") {
          userRole = "dept_approver";
        }

        const { error: userErr } = await supabase
          .from("users")
          .insert({
            id: userId,
            email,
            name,
            first_name: firstName,
            last_name: lastName,
            avatar_url: avatarUrl,
            role: userRole,
          });

        if (userErr) throw userErr;
      }

      // Upsert membership
      const { data: member, error: memberErr } = await supabase
        .from("organization_members")
        .upsert({
          organization_id: orgData.id,
          user_id: userId,
          updated_at: new Date().toISOString(),
          deleted_at: null, // restore if soft-deleted
        }, { onConflict: "organization_id,user_id" })
        .select("id")
        .single();

      if (memberErr) throw memberErr;

      // Assign role in the roles and member_roles tables
      if (member) {
        let targetRoleName = "Employee";
        if (data.role === "org:admin") {
          targetRoleName = "HR Admin";
        } else if (data.role === "org:manager") {
          targetRoleName = "Manager";
        } else if (data.role === "org:dept_approver") {
          targetRoleName = "Department Approver";
        }
        
        const { data: dbRole } = await supabase
          .from("roles")
          .select("id")
          .eq("organization_id", orgData.id)
          .eq("name", targetRoleName)
          .single();

        if (dbRole) {
          // Clear any existing roles for this member
          await supabase
            .from("member_roles")
            .delete()
            .eq("member_id", member.id);

          // Insert new role assignment
          await supabase
            .from("member_roles")
            .insert({
              member_id: member.id,
              role_id: dbRole.id,
            });
        }
      }
    } 
    
    else if (eventType === "organizationMembership.deleted") {
      const clerkOrgId = data.organization?.id;
      const userId = data.public_user_data?.user_id;

      if (clerkOrgId && userId) {
        const { data: orgData } = await supabase
          .from("organizations")
          .select("id")
          .eq("clerk_org_id", clerkOrgId)
          .single();

        if (orgData) {
          // Soft delete membership
          await supabase
            .from("organization_members")
            .update({ deleted_at: new Date().toISOString() })
            .eq("organization_id", orgData.id)
            .eq("user_id", userId);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[Clerk Webhook] Error processing event ${eventType}:`, err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
