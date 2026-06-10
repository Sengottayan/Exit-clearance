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
  if (body.sla_multiplier !== undefined) updateData.sla_multiplier = body.sla_multiplier;
  if (body.dept_ids !== undefined) updateData.dept_ids = body.dept_ids;
  // If is_default is being set to true, we might need to handle it or we can just let Settings update handle the global default.
  // We'll allow updating is_default here directly just in case.
  if (body.is_default !== undefined) updateData.is_default = body.is_default;

  const { data, error } = await supabase
    .from("workflow_configs")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating workflow:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If they passed global settings to update at the same time:
  if (body.global_settings) {
    const updates = Object.keys(body.global_settings).map((key) => ({
      key,
      value: body.global_settings[key]
    }));
    await supabase.from("settings").upsert(updates, { onConflict: "key" });
  }

  return NextResponse.json(data);
}
