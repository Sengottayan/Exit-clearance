"use client";

import { ClerkProvider as ClerkProviderBase } from "@clerk/nextjs";
import { clerkGlobalAppearance } from "@/lib/clerk-appearance";
import { dark } from "@clerk/themes";

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

  // Merge clerkGlobalAppearance with dark theme base and OffboardIQ Dark SaaS overrides
  const appearance = {
    ...clerkGlobalAppearance,
    baseTheme: dark,
    variables: {
      ...clerkGlobalAppearance.variables,
      colorPrimary: "#6366f1",
      colorBackground: "#0b0e14",
      colorInputBackground: "#11141c",
      colorText: "#ffffff",
      colorTextSecondary: "#8a94a6",
      colorInputText: "#ffffff",
      colorBorder: "rgba(255, 255, 255, 0.08)",
      colorNeutral: "#8a94a6",
    },
    elements: {
      ...clerkGlobalAppearance.elements,
      card: "bg-[#0b0e14] border border-white/5 rounded-2xl shadow-xl p-8",
      headerTitle: "text-white font-extrabold text-xl",
      headerSubtitle: "text-[#8a94a6]",
      formFieldLabel: "text-white font-semibold",
      formFieldInput: "bg-[#11141c] border border-white/5 text-white focus:border-indigo-500",
      organizationProfileCard: {
        width: "900px",
        backgroundColor: "#0b0e14",
      },
      skeleton: {
        backgroundColor: "#11141c",
      }
    }
  };

  return (
    <ClerkProviderBase publishableKey={clerkPublishableKey} appearance={appearance}>
      {children}
    </ClerkProviderBase>
  );
}

