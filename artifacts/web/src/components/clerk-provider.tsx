"use client";

import { ClerkProvider as ClerkProviderBase } from "@clerk/nextjs";
import { clerkGlobalAppearance } from "@/lib/clerk-appearance";

export function ClerkProvider({
  children,
  clerkConfigured,
  clerkPublishableKey,
}: {
  children: React.ReactNode;
  clerkConfigured: boolean;
  clerkPublishableKey?: string;
}) {
  if (!clerkConfigured) {
    return <>{children}</>;
  }

  return (
    <ClerkProviderBase publishableKey={clerkPublishableKey} appearance={clerkGlobalAppearance}>
      {children}
    </ClerkProviderBase>
  );
}
