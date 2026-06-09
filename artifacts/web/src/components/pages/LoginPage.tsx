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

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 group">
      <div className="w-10 h-10 rounded-lg bg-sidebar-accent border border-sidebar-border flex items-center justify-center shrink-0 shadow-sm mt-1 group-hover:scale-110 group-hover:border-primary/30 transition-all duration-300">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
        <p className="text-sm text-sidebar-foreground/70 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function LeftPanel() {
  return (
    <div className="hidden md:flex flex-col w-[45%] bg-sidebar text-sidebar-foreground p-12 justify-between relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/15 blur-[120px] pointer-events-none animate-pulse-soft" />
      <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 animate-slide-up">
        <Link href="/" className="flex items-center gap-3 text-sidebar-foreground hover:text-white transition-colors w-fit">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shadow-sm">
            <Box className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-2xl tracking-tight">ExitFlow</span>
        </Link>
      </div>

      <div className="space-y-12 relative z-10 max-w-md animate-slide-up" style={{ animationDelay: "150ms" }}>
        <h2 className="text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-white">
          Enterprise exit management,{" "}
          <span className="text-primary-foreground/60 italic">refined.</span>
        </h2>
        <div className="space-y-8">
          <FeatureCard icon={ShieldCheck} title="Secure Architecture" description="Role-based access controls with strict compartmentalization and SOC2 compliance readiness." />
          <FeatureCard icon={Zap} title="Algorithmic SLAs" description="Automated escalation routing prevents procedural bottlenecks before they occur." />
          <FeatureCard icon={Layers} title="Immutable Ledger" description="Comprehensive audit trails recording every approval, rejection, and document generation." />
        </div>
      </div>

      <div className="text-sm text-sidebar-foreground/50 font-mono relative z-10 animate-fade-in">
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

const clerkAppearance = {
  variables: {
    colorPrimary: "hsl(215, 90%, 55%)",
    colorBackground: "#ffffff",
    colorText: "#0f172a",
    colorTextSecondary: "#64748b",
    colorInputBackground: "#e2e8f0",
    colorInputText: "#0f172a",
    colorDanger: "hsl(350, 89%, 60%)",
    colorSuccess: "#059669",
  },
  elements: {
    card: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
      padding: "2rem",
      borderRadius: "1rem",
    },
    headerTitle: {
      color: "#0f172a",
      fontWeight: "700",
      fontSize: "1.25rem",
    },
    headerSubtitle: {
      color: "#64748b",
    },
    formFieldLabel: {
      color: "#1e293b",
      fontWeight: "600",
      fontSize: "0.8125rem",
    },
    formFieldInput: {
      border: "1.5px solid #94a3b8",
      borderRadius: "0.5rem",
      fontSize: "0.875rem",
      padding: "0.75rem 0.875rem",
      background: "#e2e8f0",
      color: "#0f172a",
      caretColor: "#0f172a",
      boxShadow: "none",
      outline: "none",
    },
    formFieldInput__password: {
      paddingRight: "2.5rem",
    },
    formFieldInput__code: {
      background: "#e2e8f0",
      color: "#0f172a",
      caretColor: "#0f172a",
      fontVariantNumeric: "tabular-nums",
      letterSpacing: "0.12em",
    },
    socialButtons: {
      display: "none",
    },
    socialButtonsProviderButton: {
      display: "none",
    },
    formButtonPrimary: {
      borderRadius: "0.5rem",
      fontSize: "0.875rem",
      fontWeight: "600",
      padding: "0.75rem 1rem",
      background: "hsl(215, 90%, 55%)",
      color: "#ffffff",
      boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
    },
    dividerLine: { background: "#e2e8f0" },
    dividerText: { color: "#94a3b8", fontSize: "0.75rem" },
    footerActionLink: { color: "hsl(215, 90%, 55%)", fontWeight: "600" },
    footerActionText: { color: "#64748b" },
    formFieldErrorText: { color: "hsl(350, 89%, 60%)" },
    formFieldSuccessText: { color: "#059669" },
    developmentModeWarning: { display: "none" },
    badge: { display: "none" },
    devModeWarning: { display: "none" },
    footer: { display: "none" },
    rootBox: { width: "100%" },
    formFieldInputShowPasswordButton: {
      color: "#64748b",
      right: "0.75rem",
    },
  },
} as const;

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
        <div className="w-8 h-8 rounded-md bg-foreground flex items-center justify-center shadow-sm">
          <Box className="w-5 h-5 text-background" />
        </div>
        <span className="font-bold text-2xl tracking-tight">ExitFlow</span>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
        <p className="text-muted-foreground text-sm">
          Sign in to manage employee exit clearances.
        </p>
      </div>

      <SignIn
        forceRedirectUrl="/dashboard"
        appearance={clerkAppearance}
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
    <div className="w-full max-w-[400px] mx-auto space-y-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
      <div className="md:hidden flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-md bg-foreground flex items-center justify-center shadow-sm">
          <Box className="w-5 h-5 text-background" />
        </div>
        <span className="font-bold text-2xl tracking-tight">ExitFlow</span>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Platform Access</h1>
        <p className="text-muted-foreground text-sm">
          Select a demo role to explore the platform.
        </p>
      </div>

      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-4 text-muted-foreground font-medium flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 font-mono text-[10px] uppercase tracking-wider rounded-sm px-1.5 py-0">
              Demo Sandbox
            </Badge>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {demoUsers.map((u, i) => (
          <button
            key={u.id}
            type="button"
            onClick={() => handleDemoLogin(u.id)}
            className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary hover:border-border transition-all text-left group animate-slide-up"
            style={{ animationDelay: `${300 + i * 50}ms` }}
            data-testid={`demo-login-${u.role}`}
          >
            <UserAvatar name={u.name} className="w-9 h-9 border border-background shadow-sm group-hover:scale-105 transition-transform" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold tracking-tight truncate text-foreground group-hover:text-primary transition-colors">
                {ROLE_LABELS[u.role] || u.role}
              </span>
              <span className="text-xs text-muted-foreground truncate">{u.name}</span>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground/0 group-hover:text-muted-foreground transition-all -translate-x-2 group-hover:translate-x-0" />
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
      <div className="flex-1 flex flex-col justify-center p-6 md:p-12 lg:p-24 overflow-y-auto bg-card shadow-[-20px_0_40px_-20px_rgba(0,0,0,0.1)] z-20">
        {clerkConfigured ? <ClerkAuthPanel /> : <DevAuthPanel />}
      </div>
    </div>
  );
}
