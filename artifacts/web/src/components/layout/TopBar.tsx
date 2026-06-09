import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "@/lib/wouter";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/authStore";
import { useClerk } from "@clerk/nextjs";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export function TopBar() {
  const { user } = useAuth();
  const logout = useAuthStore(state => state.logout);
  const [, setLocation] = useLocation();
  const { signOut } = useClerk();

  async function handleLogout() {
    logout();
    localStorage.removeItem("exitflow-auth");
    await signOut();
    setLocation("/login");
  }

  if (!user) return null;

  const triggerSearch = () => {
    const e = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(e);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border/40 px-4 md:px-8 h-16 flex items-center justify-between shadow-sm">
      {/* Mobile Logo & Desktop Path Context */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex md:hidden items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-md">
            <Icons.Box className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-tight text-foreground text-sm">ExitFlow</span>
        </Link>
        
        {/* Desktop Path Context */}
        <div className="hidden md:flex items-center gap-2 text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest bg-muted/40 hover:bg-muted/65 px-3 py-1.5 rounded-xl border border-border/40 transition-colors">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft" />
          <span>Enterprise Portal</span>
        </div>
      </div>

      {/* Global Search Button */}
      <div className="flex-1 max-w-md mx-6 hidden sm:block">
        <button
          onClick={triggerSearch}
          className="w-full flex items-center justify-between text-left px-4 h-10 text-xs text-muted-foreground/70 bg-secondary/55 hover:bg-secondary/90 hover:text-foreground rounded-xl border border-border/60 hover:border-primary/45 transition-all duration-300 shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <Icons.Search className="w-4 h-4 text-muted-foreground/60" />
            <span className="font-medium">Search anything (cases, clearances, logs...)</span>
          </div>
          <kbd className="pointer-events-none inline-flex h-5.5 select-none items-center gap-0.5 rounded-md border border-border bg-card px-2 font-mono text-[9px] font-extrabold text-muted-foreground shadow-sm">
            <span>ctrl</span><span>K</span>
          </kbd>
        </button>
      </div>

      {/* Actions and Utilities */}
      <div className="flex items-center gap-2">
        {/* Mobile Search Icon */}
        <Button
          variant="ghost"
          size="icon"
          onClick={triggerSearch}
          className="sm:hidden h-9 w-9 text-muted-foreground hover:text-foreground rounded-xl"
        >
          <Icons.Search className="w-4 h-4" />
        </Button>

        {/* Quick Actions Dropdown (HR/Admin) */}
        {(user.role === 'hr' || user.role === 'admin') && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary hover:to-indigo-500 text-white font-bold px-4 py-5 rounded-xl shadow-md transition-all duration-300 hover:scale-102 hover:shadow-primary/20">
                <Icons.Sparkles className="w-3.5 h-3.5" />
                <span>Quick Action</span>
                <Icons.ChevronDown className="w-3 h-3 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2">
              <DropdownMenuLabel className="text-xs">Clearance Operations</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation("/cases/new")}>
                <Icons.UserPlus className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Initiate Exit Case</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation("/reports")}>
                <Icons.BarChart3 className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Run Analytics</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation("/reports/audit")}>
                <Icons.ShieldAlert className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Check Compliance</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="w-px h-6 bg-border mx-1 hidden md:block" />

        <NotificationBell />
        <ThemeToggle />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-10 w-10 rounded-full relative group flex items-center justify-center border border-border/40 hover:border-primary/45 hover:bg-secondary/40 transition-all duration-300 shrink-0 cursor-pointer">
              <UserAvatar name={user.name} className="w-8 h-8 border shadow-sm group-hover:scale-105 transition-all duration-300" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background shadow-sm group-hover:scale-110 transition-transform" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold leading-none text-foreground">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                <div className="mt-2 text-[10px] font-bold tracking-wider uppercase bg-secondary/80 text-muted-foreground px-2 py-0.5 rounded inline-flex w-fit border border-border/50">
                  {user.role}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLocation("/profile")}>
              <Icons.User className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/preferences")}>
              <Icons.Settings className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Preferences</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50">
              <Icons.LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
