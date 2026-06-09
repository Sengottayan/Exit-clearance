import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { ClerkProvider } from "@/components/clerk-provider";
import { Toaster } from "sonner";
import { isValidClerkPublishableKey } from "@/lib/clerk-utils";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ExitFlow - Employee Exit Clearance System",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider clerkConfigured={clerkConfigured} clerkPublishableKey={clerkPublishableKey}>
          <Providers>
            {children}
            <Toaster position="top-right" />
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
