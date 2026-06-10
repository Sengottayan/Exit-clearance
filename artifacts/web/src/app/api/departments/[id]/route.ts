import { NextResponse, NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const { id } = await params;
  const body = await request.json();

  const supabase = createServerSupabase();

  // Convert camelCase to snake_case for DB
  const updateData: any = {};
  if (body.slaHours !== undefined) updateData.sla_hours = body.slaHours;
  if (body.defaultAssignee !== undefined) updateData.default_assignee = body.defaultAssignee;
  if (body.isMandatory !== undefined) updateData.is_mandatory = body.isMandatory;

  const { data, error } = await supabase
    .from("departments")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating department:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
