import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const supabase = createServerSupabase();
  const body = await request.json();

  const { id: caseId } = await params;

  const { data, error } = await supabase
    .from("documents")
    .insert({
      case_id: caseId,
      doc_type: "resignation_letter", // Or dynamic based on upload
      file_name: body.name,
      file_path: body.file_path,
      file_size: body.size_bytes,
      mime_type: body.file_type,
      uploaded_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/cases/[id]/documents] insert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
