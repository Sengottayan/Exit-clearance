import { auth as clerkAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isValidClerkPublishableKey, isValidClerkSecretKey } from "@/lib/clerk-utils";

const clerkConfigured =
  isValidClerkPublishableKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) &&
  isValidClerkSecretKey(process.env.CLERK_SECRET_KEY);

import { cookies } from "next/headers";

export async function getOptionalAuth(): Promise<{ userId: string | null; orgId: string | null }> {
  if (!clerkConfigured) {
    const cookieStore = await cookies();
    const demoUserId = cookieStore.get("demo-user-id")?.value;
    return { userId: demoUserId || "dev-user", orgId: "dev-org" };
  }

  try {
    const { userId, orgId } = await clerkAuth();
    return { userId: userId ?? null, orgId: orgId ?? null };
  } catch {
    return { userId: null, orgId: null };
  }
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
