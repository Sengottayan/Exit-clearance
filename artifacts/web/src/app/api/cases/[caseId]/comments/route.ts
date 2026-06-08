import { NextRequest, NextResponse } from "next/server";
import { useExitStore } from "@/store/exitStore";
import { CommentVisibility } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params;
  const exitCase = useExitStore.getState().cases.find((c) => c.id === caseId);
  if (!exitCase) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }
  return NextResponse.json(exitCase.comments ?? []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params;
  const exitCase = useExitStore.getState().cases.find((c) => c.id === caseId);
  if (!exitCase) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const body = await req.json();
  const comment = {
    authorId: body.authorId,
    authorName: body.authorName,
    authorRole: body.authorRole ?? "employee",
    message: body.message,
    visibility: (body.visibility ?? "all") as CommentVisibility,
  };

  useExitStore.getState().addComment(caseId, comment);
  const updated = useExitStore.getState().cases.find((c) => c.id === caseId);
  const newComment = updated?.comments?.at(-1);
  return NextResponse.json(newComment, { status: 201 });
}
