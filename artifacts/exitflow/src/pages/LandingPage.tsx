import { Link, Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Box, GitBranch, Bell, FileCheck, Shield, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <header className="h-16 flex items-center justify-between px-6 lg:px-12 border-b/50 glass sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-foreground flex items-center justify-center shadow-sm">
            <Box className="w-4 h-4 text-background" />
          </div>
          <span className="font-bold text-xl tracking-tight">ExitFlow</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            Documentation
          </Link>
          <Link href="/login">
            <Button variant="default" size="sm" className="font-medium shadow-sm h-9 px-5">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]" />

        {/* Hero */}
        <section className="flex-1 flex flex-col justify-center items-center text-center px-4 py-32 md:py-48 relative z-10">
          <div className="space-y-8 max-w-[800px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              Enterprise HR Operations
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground leading-[1.1]">
              Exit processes that <br className="hidden md:block" />
              <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">actually work.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
              Structured clearances, automated reminders, and instant relieving letters — orchestrated with calm precision.
            </p>
            
            <div className="pt-8 pb-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="h-14 px-8 text-lg font-medium shadow-elevated hover:shadow-lg transition-all rounded-full group">
                  Access Platform
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center justify-center gap-6 text-sm font-medium text-muted-foreground/80">
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> SOC2 Compliant</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1.5"><FileCheck className="w-4 h-4" /> Audit Ready</span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-card border-t border-border/50 relative z-10 shadow-soft">
          <div className="max-w-7xl mx-auto px-6 py-24">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
              <Feature 
                icon={GitBranch} 
                title="Structured Workflow" 
                desc="8-department clearance, fully tracked and gated with rigorous state management."
              />
              <Feature 
                icon={Bell} 
                title="SLA Alerts" 
                desc="Intelligent escalation pathways prevent bottlenecks before deadlines are missed."
              />
              <Feature 
                icon={FileCheck} 
                title="Auto Documents" 
                desc="Cryptographically signed relieving letters generated instantly on final approval."
              />
              <Feature 
                icon={Shield} 
                title="Audit Ready" 
                desc="Immutable ledger tracking every action with precise timestamp and actor."
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
    <div className="flex flex-col items-start text-left space-y-4 group">
      <div className="w-12 h-12 rounded-xl bg-secondary border border-border/50 shadow-sm flex items-center justify-center group-hover:border-primary/30 transition-colors">
        <Icon className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
      </div>
      <div>
        <h3 className="text-lg font-semibold tracking-tight mb-2 text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}