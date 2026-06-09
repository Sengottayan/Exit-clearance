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
    <header className="sticky top-0 z-40 w-full glass px-4 md:px-8 h-14 flex items-center justify-between shadow-[0_1px_0_rgba(255,255,255,0.05)]">
      {/* Mobile Logo & Desktop Path Context */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex md:hidden items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
            <Icons.Box className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold tracking-tight text-foreground text-sm">OffboardIQ</span>
        </Link>
      </div>

      {/* Global Search Button */}
      <div className="flex-1 max-w-[500px] mx-6 hidden sm:block">
        <button
          onClick={triggerSearch}
          className="w-full flex items-center justify-between text-left px-4 h-9 text-[13px] text-muted-foreground/60 bg-[#0f1525] hover:bg-[#151c30] hover:text-foreground rounded-full border border-white/5 transition-all duration-200 shadow-inner"
        >
          <div className="flex items-center gap-2.5">
            <Icons.Search className="w-4 h-4 text-[#8ab4f8]" />
            <span className="font-medium tracking-wide">Search cases, employees, documents...</span>
          </div>
          <kbd className="pointer-events-none flex h-5 items-center gap-1 rounded bg-[#273866] px-1.5 font-sans text-[10px] font-bold text-[#8ab4f8]">
            <span>⌘</span><span>K</span>
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
              <Button size="sm" className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary hover:to-indigo-500 text-white font-bold h-8 px-3 rounded-lg shadow-md transition-all duration-300 hover:scale-102 hover:shadow-primary/20">
                <Icons.Sparkles className="w-3.5 h-3.5" />
                <span className="text-xs">Quick Action</span>
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

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-8 w-8 rounded-md relative group flex items-center justify-center border border-white/10 hover:border-white/20 transition-all duration-200 shrink-0 cursor-pointer overflow-hidden">
              <UserAvatar name={user.name} className="w-full h-full" />
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
