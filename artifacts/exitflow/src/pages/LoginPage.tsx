import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Redirect, useLocation } from "wouter";
import { Box, ShieldCheck, Zap, Layers, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import { MOCK_USERS, ROLE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/UserAvatar";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  const login = useAuthStore(state => state.login);
  const loginById = useAuthStore(state => state.loginById);
  const [, setLocation] = useLocation();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "demo", remember: false },
  });

  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  function onSubmit(data: z.infer<typeof loginSchema>) {
    const user = login(data.email, data.password);
    if (user) {
      setLocation("/dashboard");
    } else {
      form.setError("email", { message: "Invalid email or password" });
    }
  }

  function handleDemoLogin(userId: string) {
    loginById(userId);
    setLocation("/dashboard");
  }

  const demoUsers = [
    MOCK_USERS.find(u => u.role === 'hr'),
    MOCK_USERS.find(u => u.id === 'u1'), // Priya (Employee)
    MOCK_USERS.find(u => u.role === 'manager'),
    MOCK_USERS.find(u => u.id === 'u4'), // IT Approver
    MOCK_USERS.find(u => u.id === 'u5'), // Finance Approver
    MOCK_USERS.find(u => u.role === 'admin'),
  ].filter(Boolean) as typeof MOCK_USERS;

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Left Panel */}
      <div className="hidden md:flex flex-col w-[45%] bg-sidebar text-sidebar-foreground p-12 justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 text-sidebar-foreground hover:text-white transition-colors w-fit">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shadow-sm">
              <Box className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-2xl tracking-tight">ExitFlow</span>
          </Link>
        </div>

        <div className="space-y-12 relative z-10 max-w-md">
          <h2 className="text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-white">
            Enterprise exit management, <span className="text-primary-foreground/60 italic">refined.</span>
          </h2>
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-sidebar-accent border border-sidebar-border flex items-center justify-center shrink-0 shadow-sm mt-1">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-1">Secure Architecture</h3>
                <p className="text-sm text-sidebar-foreground/70 leading-relaxed">Role-based access controls with strict compartmentalization and SOC2 compliance readiness.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-sidebar-accent border border-sidebar-border flex items-center justify-center shrink-0 shadow-sm mt-1">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-1">Algorithmic SLAs</h3>
                <p className="text-sm text-sidebar-foreground/70 leading-relaxed">Automated escalation routing prevents procedural bottlenecks before they occur.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-sidebar-accent border border-sidebar-border flex items-center justify-center shrink-0 shadow-sm mt-1">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-1">Immutable Ledger</h3>
                <p className="text-sm text-sidebar-foreground/70 leading-relaxed">Comprehensive audit trails recording every approval, rejection, and document generation.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-sidebar-foreground/50 font-mono relative z-10">
          v2.4.0-stable // {new Date().getFullYear()} ExitFlow Systems
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col justify-center p-6 md:p-12 lg:p-24 overflow-y-auto bg-card shadow-[-20px_0_40px_-20px_rgba(0,0,0,0.1)] z-20">
        <div className="w-full max-w-[420px] mx-auto space-y-8">
          <div className="md:hidden flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-md bg-foreground flex items-center justify-center shadow-sm">
              <Box className="w-5 h-5 text-background" />
            </div>
            <span className="font-bold text-2xl tracking-tight">ExitFlow</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Platform Access</h1>
            <p className="text-muted-foreground text-sm">Enter your corporate credentials to continue.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Corporate Email</FormLabel>
                      <FormControl>
                        <Input className="h-11" placeholder="name@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-foreground/80">Password</FormLabel>
                        <a href="#" className="text-xs font-medium text-primary hover:underline" tabIndex={-1}>
                          Reset password
                        </a>
                      </div>
                      <FormControl>
                        <Input className="h-11 font-mono text-sm" type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="remember"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-normal text-muted-foreground leading-none cursor-pointer">
                      Keep me signed in for 30 days
                    </FormLabel>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-11 text-base shadow-soft" data-testid="button-login">
                Authenticate
              </Button>
            </form>
          </Form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-4 text-muted-foreground font-medium flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 font-mono text-[10px] uppercase tracking-wider rounded-sm px-1.5 py-0">Demo Sandbox</Badge>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {demoUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleDemoLogin(u.id)}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary hover:border-border transition-all text-left group"
                data-testid={`demo-login-${u.role}`}
              >
                <UserAvatar name={u.name} className="w-9 h-9 border border-background shadow-sm group-hover:scale-105 transition-transform" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-semibold tracking-tight truncate text-foreground group-hover:text-primary transition-colors">{ROLE_LABELS[u.role] || u.role}</span>
                  <span className="text-xs text-muted-foreground truncate">{u.name}</span>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground/0 group-hover:text-muted-foreground transition-all -translate-x-2 group-hover:translate-x-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}