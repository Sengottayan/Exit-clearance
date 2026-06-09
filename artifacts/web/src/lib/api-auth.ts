import { auth as clerkAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isValidClerkPublishableKey, isValidClerkSecretKey } from "@/lib/clerk-utils";

const clerkConfigured =
  isValidClerkPublishableKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) &&
  isValidClerkSecretKey(process.env.CLERK_SECRET_KEY);

export async function getOptionalAuth(): Promise<{ userId: string | null }> {
  if (!clerkConfigured) {
    return { userId: "dev-user" };
  }

  try {
    return await clerkAuth();
  } catch {
    return { userId: null };
  }
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
