import { NextResponse, NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const id = params.id;
  const body = await request.json();

  const supabase = createServerSupabase();

  const updateData: any = {};
  if (body.role !== undefined) updateData.role = body.role;
  if (body.dept !== undefined) updateData.dept = body.dept;

  const { data, error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const id = params.id;

  const supabase = createServerSupabase();

  // For safety, instead of fully deleting the user which might break foreign keys, 
  // we could clear their role/dept or flag them if we had an is_active column.
  // Since we don't have is_active, we'll just set their role to 'employee' 
  // and clear their dept as a soft "deactivation" from admin tools.
  const { data, error } = await supabase
    .from("users")
    .update({ role: 'employee', dept: '' })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error deactivating user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "User deactivated" });
}
