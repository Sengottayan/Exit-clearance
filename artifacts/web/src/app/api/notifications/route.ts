import { NextRequest, NextResponse } from "next/server";
import { useNotificationStore } from "@/store/notificationStore";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "Bad Request", message: "userId is required" },
      { status: 400 }
    );
  }

  const notifications = useNotificationStore.getState().getForUser(userId);
  const unreadCount = useNotificationStore.getState().getUnreadCount(userId);
  return NextResponse.json({ notifications, unreadCount });
}
