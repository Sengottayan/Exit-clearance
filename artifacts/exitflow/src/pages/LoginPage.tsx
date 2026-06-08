import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Redirect, useLocation } from "wouter";
import { Box, ShieldCheck, Zap, Layers } from "lucide-react";
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
      <div className="hidden md:flex flex-col w-[40%] bg-sidebar text-sidebar-foreground p-12 justify-between">
        <Link href="/" className="flex items-center gap-3 text-sidebar-primary-foreground hover:opacity-90 transition-opacity w-fit">
          <div className="w-8 h-8 rounded bg-sidebar-primary flex items-center justify-center">
            <Box className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-2xl tracking-tight">ExitFlow</span>
        </Link>

        <div className="space-y-10">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Streamline employee offboarding securely.
          </h2>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-sidebar-primary" />
              </div>
              <p className="text-lg font-medium text-sidebar-foreground/80">Secure, role-based access</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-sidebar-primary" />
              </div>
              <p className="text-lg font-medium text-sidebar-foreground/80">Automated SLAs & reminders</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5 text-sidebar-primary" />
              </div>
              <p className="text-lg font-medium text-sidebar-foreground/80">Comprehensive audit trails</p>
            </div>
          </div>
        </div>

        <div className="text-sm text-sidebar-foreground/40 font-medium">
          © {new Date().getFullYear()} ExitFlow Inc.
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          <div className="md:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <Box className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight">ExitFlow</span>
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back</h1>
            <p className="text-muted-foreground">Sign in to your account to continue</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@company.com" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="remember"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Remember me
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <a href="#" className="text-sm font-medium text-primary hover:underline">
                  Forgot password?
                </a>
              </div>

              <Button type="submit" className="w-full h-11 text-base" data-testid="button-login">
                Sign In
              </Button>
            </form>
          </Form>

          <div className="relative pt-6 pb-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-medium flex items-center gap-2">
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400">DEMO</Badge>
                or continue as
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {demoUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleDemoLogin(u.id)}
                className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent/5 hover:border-accent/30 transition-all text-left group"
                data-testid={`demo-login-${u.role}`}
              >
                <UserAvatar name={u.name} className="w-10 h-10 group-hover:scale-105 transition-transform" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-semibold truncate">{ROLE_LABELS[u.role] || u.role}</span>
                  <span className="text-xs text-muted-foreground truncate">{u.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
