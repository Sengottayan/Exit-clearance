import { NextResponse, NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ deptId: string }> }) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const { deptId } = await params;
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("checklist_templates")
    .select("*")
    .eq("dept_id", deptId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching checklist templates:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ deptId: string }> }) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const { deptId } = await params;
  const body = await request.json(); // Expected: { items: ChecklistTemplate[] }

  const supabase = createServerSupabase();
  const items = body.items || [];

  // Delete existing items for this dept first to replace them entirely
  // A true robust implementation would diff and upsert, but for templates replacement is easy.
  const { error: deleteError } = await supabase
    .from("checklist_templates")
    .delete()
    .eq("dept_id", deptId);

  if (deleteError) {
    console.error("Error deleting old checklists:", deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (items.length > 0) {
    // Map items to db structure, generating IDs if new
    const records = items.map((item: any, index: number) => ({
      id: item.id.includes(deptId) ? item.id : `${deptId}-${Date.now()}-${index}`,
      dept_id: deptId,
      label: item.label,
      is_mandatory: item.isMandatory !== undefined ? item.isMandatory : item.is_mandatory,
      has_input: item.hasInput !== undefined ? item.hasInput : item.has_input,
      input_label: item.inputLabel !== undefined ? item.inputLabel : item.input_label,
      sort_order: index + 1
    }));

    const { error: insertError } = await supabase
      .from("checklist_templates")
      .insert(records);

    if (insertError) {
      console.error("Error inserting new checklists:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
