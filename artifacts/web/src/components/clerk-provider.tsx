"use client";

import { ClerkProvider as ClerkProviderBase } from "@clerk/nextjs";

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
    <ClerkProviderBase publishableKey={clerkPublishableKey}>
      {children}
    </ClerkProviderBase>
  );
}
