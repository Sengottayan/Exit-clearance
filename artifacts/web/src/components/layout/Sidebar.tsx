import { Link, useLocation } from "@/lib/wouter";
import { NAV_CONFIG } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useClerk } from "@clerk/nextjs";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const logout = useAuthStore(state => state.logout);
  const { signOut } = useClerk();

  if (!user) return null;

  const navItems = NAV_CONFIG[user.role] || [];

  async function handleLogout() {
    logout();
    localStorage.removeItem("exitflow-auth");
    await signOut();
    setLocation("/login");
  }

  return (
    <aside className="hidden md:flex flex-col w-[260px] bg-sidebar/95 backdrop-blur-md border-r border-sidebar-border h-[100dvh] text-sidebar-foreground sticky top-0 shadow-xl shadow-black/15 z-20 transition-all duration-300">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 mb-4 border-b border-sidebar-border/30">
        <Link href="/dashboard" className="flex items-center gap-2.5 text-sidebar-primary-foreground group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 group-hover:shadow-primary/45 transition-all duration-300">
            <Icons.Box className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold tracking-tight text-lg text-white">ExitFlow</span>
        </Link>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 px-4 py-2 space-y-6">
        <div>
          <p className="text-[10px] font-bold text-sidebar-foreground/30 uppercase tracking-widest mb-4 px-3">
            WORKSPACE NAVIGATION
          </p>
          <nav className="space-y-2">
            {(() => {
              const exactMatch = navItems.find(i => location === i.href);
              return navItems.map((item) => {
                const Icon = Icons[item.icon as keyof typeof Icons] as React.ElementType;
                const isActive = exactMatch
                  ? exactMatch.href === item.href
                  : (item.href !== '/' && location.startsWith(item.href + '/'));
              return (
                <Link 
                  key={`${item.href}-${item.label}`} 
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 group relative border border-transparent",
                    isActive 
                      ? "bg-sidebar-accent/80 text-white shadow-soft border-sidebar-border/30" 
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/30 hover:text-white"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-sidebar-primary rounded-r-md shadow-[0_0_8px_var(--color-primary)]" />
                  )}
                  <Icon className={cn("w-4 h-4 shrink-0 transition-all duration-300 group-hover:scale-110", isActive ? "text-sidebar-primary drop-shadow-[0_0_4px_rgba(59,130,246,0.5)]" : "text-sidebar-foreground/35 group-hover:text-sidebar-foreground/75")} />
                  <span>{item.label}</span>
                </Link>
              );
            })})()}
          </nav>
        </div>
      </div>

      {/* Footer Profile Dropdown */}
      <div className="p-4 border-t border-sidebar-border/30 bg-sidebar/20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-sidebar-accent/50 transition-all duration-300 text-left group">
              <div className="relative">
                <UserAvatar name={user.name} className="w-9 h-9 border border-sidebar-border shadow-md group-hover:border-sidebar-primary/50 transition-all duration-300" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-sidebar" />
              </div>
              <div className="flex flex-col overflow-hidden flex-1">
                <span className="text-sm font-bold truncate text-sidebar-foreground/95 group-hover:text-white transition-colors">{user.name}</span>
                <span className="text-[10px] text-sidebar-foreground/35 truncate font-mono tracking-tight">{user.employeeId}</span>
              </div>
              <Icons.ChevronsUpDown className="w-4 h-4 text-sidebar-foreground/20 shrink-0 group-hover:text-sidebar-foreground/60 transition-colors" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                <div className="mt-2 text-[10px] font-bold uppercase tracking-wide bg-secondary/80 text-muted-foreground px-2 py-0.5 rounded inline-flex w-fit border">
                  {user.role}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLocation("/profile")}>
              <Icons.User className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Profile Details</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/preferences")}>
              <Icons.Sliders className="mr-2 h-4 w-4 text-muted-foreground" />
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
    </aside>
  );
}
