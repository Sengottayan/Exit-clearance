import { NextResponse, NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { userId } = await getOptionalAuth();
  
  const searchParams = request.nextUrl.searchParams;
  const role = searchParams.get("role");
  const demo = searchParams.get("demo");

  const supabase = createServerSupabase();
  let query = supabase.from("users").select("*");

  if (role) {
    query = query.eq("role", role);
  }

  // Demo parameter helps fetch our synthetic users specifically (e.g. for login bypass or testing)
  if (demo === "true") {
    // Only return users with offboardiq.com emails for demo purposes
    query = query.like("email", "%@offboardiq.com%");
  }

  const { data: users, error } = await query.order("name", { ascending: true });

  if (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }

  return NextResponse.json(users);
}
