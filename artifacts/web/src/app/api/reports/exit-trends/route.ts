import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";
import { subDays, format } from "date-fns";

export async function GET() {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const supabase = createServerSupabase();
  const { data: cases, error } = await supabase
    .from("legacy_exit_cases")
    .select("resignation_date, status")
    .order("resignation_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = new Date();
  const months = 12;
  const buckets: Record<string, number> = {};

  for (let i = months - 1; i >= 0; i--) {
    buckets[format(subDays(now, i * 30), "MMM")] = 0;
  }

  cases.forEach((c) => {
    const key = format(new Date(c.resignation_date), "MMM");
    if (key in buckets) buckets[key]++;
  });

  const data = Object.entries(buckets).map(([name, exits]) => ({
    name,
    exits,
  }));

  return NextResponse.json(data);
}
