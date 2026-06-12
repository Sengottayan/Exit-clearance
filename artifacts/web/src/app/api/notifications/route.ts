import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "Bad Request", message: "userId is required" },
      { status: 400 }
    );
  }

  const supabase = createServerSupabase();
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  const mappedNotifications = notifications.map((n) => ({
    id: n.id,
    userId: n.user_id,
    type: n.type,
    title: n.title,
    message: n.message,
    href: n.href,
    read: n.read,
    createdAt: n.created_at,
  }));

  return NextResponse.json({ notifications: mappedNotifications, unreadCount });
}
