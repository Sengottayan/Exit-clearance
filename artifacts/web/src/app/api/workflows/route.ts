import { NextResponse, NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  const supabase = createServerSupabase();

  // Fetch all workflow configs
  const { data, error } = await supabase
    .from("workflow_configs")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching workflows:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also fetch the global SLA settings since workflows page displays them
  const { data: settingsData } = await supabase.from("settings").select("*");
  const settingsObj = (settingsData || []).reduce((acc: any, row: any) => {
    acc[row.key] = row.value;
    return acc;
  }, {});

  return NextResponse.json({
    workflows: data,
    settings: {
      sla_warning_hours: parseInt(settingsObj.sla_warning_hours || "24", 10),
      escalation_hours: parseInt(settingsObj.escalation_hours || "48", 10),
      default_workflow_template_id: (settingsObj.default_workflow_template_id || "standard").replace(/"/g, ''),
    }
  });
}
