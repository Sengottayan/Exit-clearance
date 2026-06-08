"use client";

import { ClerkProvider as ClerkProviderBase } from "@clerk/nextjs";

const hasClerkKey =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  if (!hasClerkKey) {
    return <>{children}</>;
  }

  return <ClerkProviderBase>{children}</ClerkProviderBase>;
}
