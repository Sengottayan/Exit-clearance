import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json(
      { error: "Bad Request", message: "userId is required" },
      { status: 400 }
    );
  }

  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}
