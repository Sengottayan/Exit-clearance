"use client";

import { Link, Redirect } from "@/lib/wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Box, GitBranch, Bell, FileCheck, Shield, ArrowRight, ChevronRight, Activity, CheckCircle2 } from "lucide-react";
import { motion, Variants } from "framer-motion";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px] mix-blend-multiply opacity-70 animate-pulse duration-1000" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 blur-[120px] mix-blend-multiply opacity-70 animate-pulse duration-1000 delay-500" />
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[120px] mix-blend-multiply opacity-70 animate-pulse duration-1000 delay-1000" />
      </div>

      <header className="h-16 flex items-center justify-between px-6 lg:px-12 border-b/10 glass sticky top-0 z-50 backdrop-blur-xl bg-background/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Box className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">ExitFlow</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="default" size="sm" className="font-medium shadow-lg shadow-primary/20 h-9 px-5 rounded-full transition-transform hover:scale-105">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative z-10">
        {/* Hero Section */}
        <section className="flex-1 flex flex-col justify-center items-center text-center px-4 pt-24 pb-16 md:pt-32 md:pb-24">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 max-w-[900px] mx-auto w-full"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              The New Standard for Enterprise HR
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.05]">
              Exit processes that <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600">actually work.</span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
              Structured clearances, automated reminders, and instant relieving letters — orchestrated with calm precision and zero bottlenecks.
            </motion.p>
            
            <motion.div variants={itemVariants} className="pt-6 pb-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="h-14 px-8 text-lg font-medium shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all rounded-full group bg-gradient-to-r from-primary to-indigo-600 hover:from-primary hover:to-indigo-500 border-0">
                  Access Platform
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
            
            <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-muted-foreground/80 pt-8">
              <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-500" /> SOC2 Compliant</span>
              <span className="flex items-center gap-2"><FileCheck className="w-4 h-4 text-blue-500" /> Audit Ready</span>
              <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-500" /> 99.9% Uptime</span>
            </motion.div>
          </motion.div>
        </section>

        {/* Floating Mockup Preview */}
        <section className="px-4 pb-24 relative z-20">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="max-w-5xl mx-auto rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/20">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="mx-auto flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-md px-3 py-1 text-xs text-muted-foreground border border-border/50">
                <Shield className="w-3 h-3 mr-1" /> app.exitflow.com
              </div>
            </div>
            <div className="p-6 md:p-8 bg-gradient-to-b from-transparent to-muted/20 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">Recent Terminations</h3>
                  <p className="text-sm text-muted-foreground">Monitor the progress of offboarding employees</p>
                </div>
                <Link href="/login">
                  <Button size="sm" variant="outline" className="rounded-full">View All</Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card rounded-xl border border-border/50 p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold">
                        {String.fromCharCode(64 + i)}
                      </div>
                      <div>
                        <div className="text-sm font-medium">Employee {i}</div>
                        <div className="text-xs text-muted-foreground">Software Engineer</div>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${30 * i}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{30 * i}% Complete</span>
                      <span>2 days left</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* Bento Features */}
        <section className="relative z-10 py-32 bg-muted/30 border-y border-border/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Everything you need to orchestrate exits</h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">A comprehensive toolkit designed specifically to eliminate friction from employee offboarding.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[400px]">
              <FeatureCard 
                icon={GitBranch} 
                title="Structured Workflow" 
                desc="8-department clearance, fully tracked and gated with rigorous state management."
                className="md:col-span-2"
                gradient="from-blue-500/20 to-transparent"
              >
                <div className="flex items-center gap-2 w-full max-w-sm mx-auto opacity-80 group-hover:opacity-100 transition-opacity">
                  <div className="flex-1 h-12 rounded-lg bg-background border border-border flex items-center justify-center text-xs font-medium text-muted-foreground shadow-sm group-hover:border-blue-500/30 group-hover:text-blue-600 transition-all">HR</div>
                  <div className="w-4 h-[2px] bg-border group-hover:bg-blue-500/30 transition-colors" />
                  <div className="flex-1 h-12 rounded-lg bg-background border border-border flex items-center justify-center text-xs font-medium text-muted-foreground shadow-sm group-hover:border-blue-500/30 group-hover:text-blue-600 transition-all">IT Dept</div>
                  <div className="w-4 h-[2px] bg-border group-hover:bg-blue-500/30 transition-colors" />
                  <div className="flex-1 h-12 rounded-lg bg-background border border-border flex items-center justify-center text-xs font-medium text-muted-foreground shadow-sm group-hover:border-blue-500/30 group-hover:text-blue-600 transition-all">Finance</div>
                  <div className="w-4 h-[2px] bg-border group-hover:bg-blue-500/30 transition-colors" />
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
              </FeatureCard>

              <FeatureCard 
                icon={Bell} 
                title="SLA Alerts" 
                desc="Intelligent escalation pathways prevent bottlenecks before deadlines."
                className="md:col-span-1"
                gradient="from-amber-500/20 to-transparent"
              >
                <div className="w-full max-w-[240px] bg-background border border-border rounded-xl p-4 shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-500 flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 animate-pulse" />
                  <div>
                    <div className="text-sm font-semibold mb-1">SLA Warning</div>
                    <div className="text-xs text-muted-foreground">IT clearance for John Doe is due in 2 hours.</div>
                  </div>
                </div>
              </FeatureCard>

              <FeatureCard 
                icon={FileCheck} 
                title="Auto Documents" 
                desc="Cryptographically signed letters generated instantly on final approval."
                className="md:col-span-1"
                gradient="from-emerald-500/20 to-transparent"
              >
                <div className="relative w-32 h-40 mt-8 group-hover:-translate-y-2 transition-transform duration-500">
                  <div className="absolute inset-0 bg-background border border-border rounded-lg shadow-sm rotate-6 opacity-50" />
                  <div className="absolute inset-0 bg-background border border-border rounded-lg shadow-md -rotate-3 opacity-80" />
                  <div className="absolute inset-0 bg-background border border-border rounded-lg shadow-lg flex flex-col p-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 mb-2 flex items-center justify-center">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="h-2 w-16 bg-muted rounded mb-2" />
                    <div className="h-2 w-full bg-muted rounded mb-1" />
                    <div className="h-2 w-full bg-muted rounded mb-1" />
                    <div className="h-2 w-2/3 bg-muted rounded" />
                    <div className="mt-auto h-4 w-4 self-end bg-emerald-500 rounded-full" />
                  </div>
                </div>
              </FeatureCard>

              <FeatureCard 
                icon={Box} 
                title="Asset Recovery" 
                desc="Automate equipment returns with one-click shipping labels and remote device locking."
                className="md:col-span-2"
                gradient="from-purple-500/20 to-transparent"
              >
                <div className="w-full max-w-sm flex flex-col gap-3 group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100">
                  <div className="flex items-center gap-3 bg-background border border-border rounded-lg p-3 shadow-sm">
                    <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center text-xl text-muted-foreground">💻</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">MacBook Pro 16"</div>
                      <div className="text-xs text-muted-foreground">Assigned to John Doe</div>
                    </div>
                    <div className="text-xs font-semibold text-amber-500 bg-amber-500/10 px-2 py-1 rounded">Pending Return</div>
                  </div>
                  <div className="flex items-center gap-3 bg-background border border-border rounded-lg p-3 shadow-sm">
                    <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center text-xl text-muted-foreground">🔑</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Office Keycard</div>
                      <div className="text-xs text-muted-foreground">Bldg A, Floor 3</div>
                    </div>
                    <div className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">Returned</div>
                  </div>
                </div>
              </FeatureCard>
            </div>
          </div>
        </section>
        
        {/* CTA Footer */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5" />
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10 space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Ready to transform your offboarding?</h2>
            <p className="text-xl text-muted-foreground">Join forward-thinking teams using ExitFlow to manage their offboarding processes securely and efficiently.</p>
            <Link href="/login">
              <Button size="lg" className="h-14 px-10 text-lg font-medium shadow-xl rounded-full bg-foreground text-background hover:bg-foreground/90 hover:scale-105 transition-all">
                Get Started Now
              </Button>
            </Link>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground bg-background relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4" />
            <span className="font-semibold text-foreground">ExitFlow</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, className = "", gradient, children }: { icon: any, title: string, desc: string, className?: string, gradient?: string, children?: React.ReactNode }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`group relative overflow-hidden rounded-3xl border border-border/50 bg-card shadow-sm hover:shadow-xl transition-all flex flex-col ${className}`}
    >
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-40 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Decorative Visual Content Area */}
      {children && (
        <div className="relative w-full h-48 flex items-center justify-center p-6 border-b border-border/20 bg-background/40 backdrop-blur-sm overflow-hidden z-10">
          <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            {children}
          </div>
        </div>
      )}

      {/* Text Area */}
      <div className="relative z-10 p-8 flex flex-col flex-1 bg-card/40 backdrop-blur-sm">
        <div className="w-12 h-12 rounded-2xl bg-background border border-border/50 shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:bg-primary/10 group-hover:border-primary/20 group-hover:text-primary">
          <Icon className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
        </div>
        <h3 className="text-xl font-bold tracking-tight mb-3 text-foreground">{title}</h3>
        <p className="text-muted-foreground leading-relaxed flex-1">{desc}</p>
      </div>
    </motion.div>
  );
}
