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
    <header className="sticky top-0 z-40 w-full bg-background/85 backdrop-blur-md border-b border-border/60 px-4 md:px-8 h-16 flex items-center justify-between shadow-sm shadow-black/[0.01]">
      {/* Mobile Logo & Desktop Path Context */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex md:hidden items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/20">
            <Icons.Box className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold tracking-tight text-foreground text-sm">ExitFlow</span>
        </Link>
        
        {/* Desktop Path Context */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest bg-muted/50 px-2.5 py-1 rounded-md border border-border/30">
          <Icons.LayoutDashboard className="w-3.5 h-3.5 text-primary" />
          <span>Enterprise Portal</span>
        </div>
      </div>

      {/* Global Search Button */}
      <div className="flex-1 max-w-md mx-4 hidden sm:block">
        <button
          onClick={triggerSearch}
          className="w-full flex items-center justify-between text-left px-3 h-9 text-xs text-muted-foreground/75 bg-muted/40 hover:bg-muted/70 hover:text-foreground rounded-lg border border-border/40 hover:border-border transition-all transition-all-300"
        >
          <div className="flex items-center gap-2">
            <Icons.Search className="w-3.5 h-3.5" />
            <span>Search cases, clearances, logs...</span>
          </div>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border bg-background px-1.5 font-mono text-[10px] font-bold text-muted-foreground shadow-sm">
            <span className="text-xs">⌘</span>K
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
          className="sm:hidden h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          <Icons.Search className="w-4 h-4" />
        </Button>

        {/* Quick Actions Dropdown (HR/Admin) */}
        {(user.role === 'hr' || user.role === 'admin') && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="hidden md:flex items-center gap-1.5 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-3.5 shadow-md shadow-primary/10">
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
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full relative group">
              <UserAvatar name={user.name} className="w-8 h-8 border shadow-sm group-hover:border-primary/50 transition-colors" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none text-foreground">{user.name}</p>
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
