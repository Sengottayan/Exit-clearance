import { NextRequest, NextResponse } from "next/server";
import { useNotificationStore } from "@/store/notificationStore";

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json(
      { error: "Bad Request", message: "userId is required" },
      { status: 400 }
    );
  }
  useNotificationStore.getState().markAllRead(userId);
  return NextResponse.json({ status: "ok" });
}
