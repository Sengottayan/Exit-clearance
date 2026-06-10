import { NextResponse, NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const supabase = createServerSupabase();
  const { data, error } = await supabase.from("settings").select("*");

  if (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Convert array of {key, value} to a single object
  const settingsObj = data.reduce((acc: any, row: any) => {
    acc[row.key] = row.value;
    return acc;
  }, {});

  return NextResponse.json(settingsObj);
}

export async function PATCH(request: NextRequest) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const body = await request.json();
  const supabase = createServerSupabase();

  // Convert incoming object to an array of updates
  const updates = Object.keys(body).map((key) => ({
    key,
    value: body[key]
  }));

  const { data, error } = await supabase
    .from("settings")
    .upsert(updates, { onConflict: "key" })
    .select();

  if (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const settingsObj = data.reduce((acc: any, row: any) => {
    acc[row.key] = row.value;
    return acc;
  }, {});

  return NextResponse.json(settingsObj);
}
