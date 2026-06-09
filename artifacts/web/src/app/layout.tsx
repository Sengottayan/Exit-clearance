import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { ClerkProvider } from "@/components/clerk-provider";
import { Toaster } from "sonner";
import { isValidClerkPublishableKey } from "@/lib/clerk-utils";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jbMono = JetBrains_Mono({
  variable: "--font-jb-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OffboardIQ",
  description: "Streamline employee offboarding and clearance workflows",
};

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const clerkConfigured = isValidClerkPublishableKey(clerkPublishableKey);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jbMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider clerkConfigured={clerkConfigured} clerkPublishableKey={clerkPublishableKey}>
          <Providers>
            {children}
            <Toaster position="bottom-right" richColors visibleToasts={1} />
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
