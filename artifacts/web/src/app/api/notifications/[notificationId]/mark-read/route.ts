import { NextRequest, NextResponse } from "next/server";
import { useNotificationStore } from "@/store/notificationStore";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  const { notificationId } = await params;
  useNotificationStore.getState().markRead(notificationId);
  return NextResponse.json({ status: "ok" });
}
