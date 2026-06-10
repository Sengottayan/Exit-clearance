import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";
import { logAuditAndTimeline } from "@/lib/audit-server";

// Minimal raw PDF generator for simple text documents (avoids external deps)
function generateRawPDF(textLines: string[]): Buffer {
  const objects: string[] = [];
  objects.push("%PDF-1.4");
  
  // Object 1: Catalog
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");
  // Object 2: Pages
  objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj");
  // Object 3: Page
  objects.push("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj");
  // Object 4: Font
  objects.push("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj");
  
  // Object 5: Content
  const yStart = 700;
  const contentStream = [
    "BT",
    "/F1 12 Tf",
  ];
  
  textLines.forEach((line, i) => {
    // Escape parens and backslashes
    const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    contentStream.push(`50 ${yStart - (i * 20)} Td (${escaped}) Tj`);
    if (i < textLines.length - 1) {
      contentStream.push(`-50 ${-20} Td`); // Reset X, move Y down for next line relative logic if needed, but absolute Td is easier
    }
  });
  
  contentStream.push("ET");
  const streamData = contentStream.join("\n");
  
  objects.push(`5 0 obj\n<< /Length ${streamData.length} >>\nstream\n${streamData}\nendstream\nendobj`);
  
  // XRef and Trailer (Simplified for basic readers)
  objects.push("xref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000115 00000 n \n0000000224 00000 n \n0000000311 00000 n \n");
  objects.push("trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n450\n%%EOF");
  
  return Buffer.from(objects.join("\n"));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const supabase = createServerSupabase();
  const body = await request.json();
  const { id: caseId } = await params;
  const docType = body.doc_type || "relievingLetter";

  // 1. Fetch Exit Case & Employee Data
  const { data: exitCase, error: caseErr } = await supabase
    .from("legacy_exit_cases")
    .select("*, users!employee_id(name, email, role, dept)")
    .eq("id", caseId)
    .single();

  if (caseErr || !exitCase) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  // 2. Fetch Tasks to verify all mandatory are completed
  const { data: tasks } = await supabase.from("legacy_clearance_tasks").select("*").eq("case_id", caseId);
  const pendingTasks = (tasks || []).filter(t => t.status !== "approved");
  if (pendingTasks.length > 0) {
    return NextResponse.json({ error: "Cannot generate document until all clearance tasks are approved." }, { status: 400 });
  }

  // 3. Compile Real PDF Data
  const issueDate = new Date().toLocaleDateString();
  const lwd = new Date(exitCase.last_working_day).toLocaleDateString();
  
  const textLines = [
    `RELIEVING LETTER`,
    ` `,
    `Date: ${issueDate}`,
    ` `,
    `To,`,
    `${exitCase.employee_name}`,
    `Employee ID: ${exitCase.employee_id}`,
    `Department: ${exitCase.employee_dept}`,
    ` `,
    `Dear ${exitCase.employee_name},`,
    ` `,
    `This is to certify that your resignation has been accepted and you are `,
    `relieved from your duties as ${exitCase.employee_role} at the close of `,
    `business hours on ${lwd}.`,
    ` `,
    `Your final settlement has been processed successfully.`,
    ` `,
    `We wish you all the best in your future endeavors.`,
    ` `,
    `Sincerely,`,
    `Human Resources`,
    `OffboardIQ Corp.`
  ];

  const pdfBuffer = generateRawPDF(textLines);
  const fileName = `${docType}-${Date.now()}.pdf`;
  const filePath = `${caseId}/${fileName}`;

  // 4. Upload to Supabase Storage
  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from("exit-documents")
    .upload(filePath, pdfBuffer, {
      contentType: "application/pdf"
    });

  if (uploadErr) {
    console.error("PDF Upload Error:", uploadErr);
    return NextResponse.json({ error: "Failed to upload generated PDF" }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage.from("exit-documents").getPublicUrl(filePath);

  // 5. Save metadata to Documents table
  const { data: docRecord, error: docErr } = await supabase
    .from("legacy_documents")
    .insert({
      case_id: caseId,
      doc_type: docType === "relievingLetter" ? "relieving_letter" : "experience_certificate",
      file_name: fileName,
      file_path: publicUrl,
      file_size: pdfBuffer.length,
      mime_type: "application/pdf",
      uploaded_by: userId
    })
    .select()
    .single();

  if (docErr) {
    return NextResponse.json({ error: "Failed to save document metadata" }, { status: 500 });
  }

  // 6. Audit Logging
  await logAuditAndTimeline({
    caseId,
    actorId: userId,
    actorName: "System",
    actorRole: "system",
    type: "Document",
    action: "GENERATED",
    details: `Generated ${docType} PDF successfully`
  });

  return NextResponse.json(docRecord, { status: 201 });
}
