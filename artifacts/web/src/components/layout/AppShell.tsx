import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "@/lib/wouter";
import { GlobalLoading } from "@/components/shared/GlobalLoading";

interface AppShellProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export function AppShell({ children, requireAuth = true }: AppShellProps) {
  const { isAuthenticated, isHydrated } = useAuth();

  if (!isHydrated) {
    return <GlobalLoading />;
  }

  if (requireAuth && !isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (!requireAuth && !isAuthenticated) {
    return <div className="min-h-[100dvh] bg-background">{children}</div>;
  }

  return (
    <div className="min-h-[100dvh] bg-background flex w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
        <BottomNav />
      </div>
      <CommandPalette />
    </div>
  );
}
