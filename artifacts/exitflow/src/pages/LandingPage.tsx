import { Link, Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Box, GitBranch, Bell, FileCheck, Shield } from "lucide-react";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      <header className="h-16 flex items-center justify-between px-6 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <Box className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight">ExitFlow</span>
        </div>
        <Link href="/login">
          <Button variant="outline" className="font-medium">Sign In</Button>
        </Link>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="flex-1 flex flex-col justify-center items-center text-center px-4 py-24 md:py-32">
          <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
            <p className="font-mono text-sm tracking-widest text-muted-foreground uppercase">
              Employee Exit Management
            </p>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground">
              Exit processes that <span className="text-primary">actually work.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Structured clearances, automated reminders, and instant relieving letters — all in one place.
            </p>
            <div className="pt-4 pb-8">
              <Link href="/login">
                <Button size="lg" className="h-14 px-8 text-lg font-medium shadow-lg hover:shadow-xl transition-all">
                  Get Started <span className="ml-2">→</span>
                </Button>
              </Link>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              For IT companies · 5 roles · Full workflow automation
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="bg-secondary/50 border-t">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              <Feature 
                icon={GitBranch} 
                title="Structured Workflow" 
                desc="8-department clearance, fully tracked and gated."
              />
              <Feature 
                icon={Bell} 
                title="SLA Alerts" 
                desc="Auto-escalation before deadlines are missed."
              />
              <Feature 
                icon={FileCheck} 
                title="Auto Documents" 
                desc="Relieving letters generated on final approval."
              />
              <Feature 
                icon={Shield} 
                title="Audit Ready" 
                desc="Every action logged with timestamp and actor."
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex flex-col items-center text-center md:items-start md:text-left space-y-4">
      <div className="w-12 h-12 rounded-xl bg-background border shadow-sm flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
