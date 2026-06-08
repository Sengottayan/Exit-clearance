import { NextResponse } from "next/server";
import { useSettingsStore } from "@/store/settingsStore";

export async function GET() {
  const templates = useSettingsStore.getState().workflowTemplates;
  const workflow = useSettingsStore.getState().workflow;
  return NextResponse.json({ templates, workflow });
}
