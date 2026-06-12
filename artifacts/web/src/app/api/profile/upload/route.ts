import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const { userId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Convert file to buffer to upload via supabase client
    const buffer = Buffer.from(await file.arrayBuffer());

    const { data, error: uploadError } = await supabase.storage
      .from("profile")
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from("profile")
      .getPublicUrl(filePath);

    return NextResponse.json({ publicUrl });
  } catch (error: any) {
    console.error("Avatar upload API error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 });
  }
}
