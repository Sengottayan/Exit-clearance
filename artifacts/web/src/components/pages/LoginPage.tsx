"use client";

import { Link, Redirect, useLocation } from "@/lib/wouter";
import { Box, ShieldCheck, Zap, Layers, ArrowRight } from "lucide-react";
import { SignIn, useAuth, useUser } from "@clerk/nextjs";
import { useAuthStore } from "@/store/authStore";
import { MOCK_USERS, ROLE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { GlobalLoading } from "@/components/shared/GlobalLoading";
import { useEffect } from "react";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

function LeftPanel() {
  return (
    <div className="hidden md:flex flex-col w-[45%] bg-sidebar text-sidebar-foreground p-12 justify-between relative overflow-hidden border-r border-sidebar-border/30">
      {/* Decorative grids and glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10" style={{ animation: "slide-up 0.5s cubic-bezier(0.16,1,0.3,1) both" }}>
        <Link href="/" className="flex items-center gap-3 text-sidebar-foreground hover:text-white transition-colors w-fit group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <Box className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">OffboardIQ</span>
        </Link>
      </div>

      {/* Interactive Clearance Funnel Visualizer */}
      <div className="relative z-10 flex flex-col justify-center my-8 flex-1 max-w-sm w-full mx-auto space-y-8" style={{ animation: "slide-up 0.6s 0.12s cubic-bezier(0.16,1,0.3,1) both" }}>
        <div className="space-y-3">
          <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-white">
            Enterprise exit <br />
            management, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 font-normal italic">refined.</span>
          </h2>
          <p className="text-xs text-sidebar-foreground/50 leading-relaxed font-semibold uppercase tracking-wider">
            Automating clearances, assets &amp; SLAs
          </p>
        </div>

        {/* Visual funnel board */}
        <div className="glass-card border border-white/5 rounded-2xl p-5 shadow-2xl relative overflow-hidden bg-white/[0.02] backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
            <span className="text-[10px] font-bold tracking-widest text-primary uppercase">Clearance Pipeline</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="space-y-3">
            {[
              { label: 'IT Infrastructure', role: 'Hardware & Access', status: 'done', pct: '100%' },
              { label: 'Finance & Accounts', role: 'Full & Final Settlement', status: 'active', pct: '60%' },
              { label: 'Human Resources', role: 'Relieving & NDA Signoff', status: 'pending', pct: '0%' }
            ].map((node, i) => (
              <div key={node.label} className={cn("p-3 rounded-xl border flex items-center justify-between transition-all duration-300",
                node.status === 'done' ? 'bg-white/[0.01] border-white/[0.03] opacity-60' :
                node.status === 'active' ? 'bg-primary/5 border-primary/20 shadow-sm border-primary/30' :
                'bg-transparent border-white/[0.02] opacity-40'
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px]",
                    node.status === 'done' ? 'bg-emerald-500/10 text-emerald-400' :
                    node.status === 'active' ? 'bg-primary text-white shadow-sm' :
                    'bg-white/5 text-white/50'
                  )}>
                    {node.status === 'done' ? '✓' : i + 1}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-none">{node.label}</p>
                    <p className="text-[9px] text-white/40 mt-1 font-medium">{node.role}</p>
                  </div>
                </div>
                <div className="text-[10px] font-mono font-bold text-white/60">
                  {node.pct}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-[10px] text-sidebar-foreground/35 font-mono relative z-10" style={{ animation: "slide-up 0.7s 0.2s cubic-bezier(0.16,1,0.3,1) both" }}>
        v2.4.0-stable // {new Date().getFullYear()} ExitFlow Systems
      </div>
    </div>
  );
}

function mapClerkRole(clerkRole: string | null): Role {
  if (!clerkRole) return "employee";
  const roleMap: Record<string, Role> = {
    "org:admin": "admin",
    "org:hr": "hr",
    "org:manager": "manager",
    "org:dept_approver": "dept_approver",
    "org:employee": "employee",
    admin: "admin",
    hr: "hr",
    manager: "manager",
    dept_approver: "dept_approver",
    employee: "employee",
  };
  return roleMap[clerkRole] || "employee";
}



function ClerkAuthPanel() {
  const { isLoaded, isSignedIn, orgRole } = useAuth();
  const { user: clerkUser } = useUser();
  const setClerkUser = useAuthStore((state) => state.setClerkUser);
  const existingUser = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !clerkUser) return;

    const role = mapClerkRole(orgRole);
    const name = clerkUser.fullName || clerkUser.firstName || "";
    const email = clerkUser.emailAddresses?.[0]?.emailAddress || "";

    if (!existingUser || existingUser.id !== clerkUser.id || existingUser.role !== role) {
      setClerkUser(clerkUser.id, role, name, email);
    }
  }, [isLoaded, isSignedIn, orgRole, clerkUser, existingUser, setClerkUser]);

  if (!isLoaded) {
    return <GlobalLoading />;
  }

  if (isSignedIn && existingUser) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="w-full max-w-[400px] mx-auto space-y-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
      <div className="md:hidden flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center shadow-sm">
          <Box className="w-5 h-5 text-background" />
        </div>
        <span className="font-extrabold text-2xl tracking-tight">ExitFlow</span>
      </div>

      <div className="space-y-2 text-center md:text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Welcome back</h1>
        <p className="text-muted-foreground text-sm font-medium">
          Sign in to manage employee exit clearances.
        </p>
      </div>

      <SignIn
        forceRedirectUrl="/dashboard"
      />
    </div>
  );
}

function DevAuthPanel() {
  const loginById = useAuthStore((state) => state.loginById);
  const [, setLocation] = useLocation();
  const isAuthenticated = useAuthStore((state) => !!state.user);

  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  function handleDemoLogin(userId: string) {
    loginById(userId);
    setLocation("/dashboard");
  }

  const demoUsers = [
    MOCK_USERS.find((u) => u.role === "hr"),
    MOCK_USERS.find((u) => u.id === "u1"),
    MOCK_USERS.find((u) => u.role === "manager"),
    MOCK_USERS.find((u) => u.id === "u4"),
    MOCK_USERS.find((u) => u.id === "u5"),
    MOCK_USERS.find((u) => u.role === "admin"),
  ].filter(Boolean) as typeof MOCK_USERS;

  return (
    <div className="w-full max-w-[420px] mx-auto space-y-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
      <div className="md:hidden flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center shadow-sm">
          <Box className="w-5 h-5 text-background" />
        </div>
        <span className="font-extrabold text-2xl tracking-tight">ExitFlow</span>
      </div>

      <div className="space-y-2 text-center md:text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Platform Access</h1>
        <p className="text-muted-foreground text-sm font-medium">
          Select a demo role to explore the offboarding workflows.
        </p>
      </div>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-4 text-muted-foreground font-semibold flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-mono text-[9px] uppercase tracking-wider rounded-md px-2 py-0.5 border border-blue-200/40">
              Demo Sandbox
            </Badge>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {demoUsers.map((u, i) => (
          <button
            key={u.id}
            type="button"
            onClick={() => handleDemoLogin(u.id)}
            className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border/70 bg-card hover:bg-secondary/40 hover:border-primary/45 transition-all duration-300 text-left group hover:shadow-soft"
            data-testid={`demo-login-${u.role}`}
          >
            <UserAvatar name={u.name} className="w-9 h-9 border border-background shadow-sm group-hover:scale-105 transition-transform duration-300 shrink-0" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-extrabold tracking-tight truncate text-foreground group-hover:text-primary transition-colors">
                {ROLE_LABELS[u.role] || u.role}
              </span>
              <span className="text-[11px] text-muted-foreground truncate font-medium mt-0.5">{u.name}</span>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-all -translate-x-2 group-hover:translate-x-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function LoginPage({
  clerkConfigured,
}: {
  clerkConfigured: boolean;
}) {
  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background animate-in fade-in duration-500">
      <LeftPanel />
      <div className="flex-1 flex flex-col justify-center p-6 md:p-12 lg:p-24 overflow-y-auto bg-card shadow-[-20px_0_40px_-20px_rgba(0,0,0,0.02)] z-20">
        {clerkConfigured ? <ClerkAuthPanel /> : <DevAuthPanel />}
      </div>
    </div>
  );
}
