import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";
import { logAuditAndTimeline } from "@/lib/audit-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const supabase = createServerSupabase();
  const body = await request.json();

  const { id: caseId } = await params;

  // 1. Fetch user role
  const { data: userRow } = await supabase.from("users").select("name, role").eq("id", userId).single();
  const role = userRow?.role || "employee";

  const requestedDocType = body.doc_type || "attachment";

  // 2. Strict Permissions Validation
  if (role === "employee" && requestedDocType !== "resignationLetter" && requestedDocType !== "attachment") {
    return NextResponse.json({ error: "Employees can only upload Resignation Letters or Attachments." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      case_id: caseId,
      doc_type: body.doc_type || "attachment",
      file_name: body.file_name,
      file_path: body.file_path || body.file_name,
      file_size: body.file_size || 0,
      mime_type: body.mime_type || "application/pdf",
      uploaded_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/cases/[id]/documents] insert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch the user's details for the audit log
  // (already fetched above)

  await logAuditAndTimeline({
    caseId,
    actorId: userId,
    actorName: userRow?.name || "User",
    actorRole: userRow?.role || "employee",
    type: "Document",
    action: "UPLOADED",
    details: `Uploaded ${body.doc_type || "attachment"}: ${body.file_name}`
  });

  return NextResponse.json(data, { status: 201 });
}
