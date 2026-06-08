import { Link, useLocation } from "wouter";
import { NAV_CONFIG } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
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

  if (!user) return null;

  const navItems = NAV_CONFIG[user.role] || [];

  return (
    <div className="hidden md:flex flex-col w-[260px] bg-sidebar border-r border-sidebar-border h-[100dvh] text-sidebar-foreground sticky top-0 shadow-xl shadow-black/5 z-20">
      <div className="h-16 flex items-center justify-between px-6 mb-2 border-b border-sidebar-border/50">
        <Link href="/dashboard" className="flex items-center gap-2.5 text-sidebar-primary-foreground group">
          <div className="w-7 h-7 rounded bg-sidebar-primary flex items-center justify-center shadow-sm group-hover:bg-white transition-colors">
            <Icons.Box className="w-4 h-4 text-sidebar group-hover:text-primary transition-colors" />
          </div>
          <span className="font-bold tracking-tight text-lg">ExitFlow</span>
        </Link>
        <div className="flex items-center gap-0.5">
          <NotificationBell className="text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent/50" />
          <ThemeToggle className="text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent/50" />
        </div>
      </div>

      <div className="px-4 py-3">
        <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider mb-2 px-2">
          Menu
        </p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = Icons[item.icon as keyof typeof Icons] as React.ElementType;
            const isActive = location === item.href || (item.href !== '/dashboard' && location.startsWith(item.href));
            return (
              <Link 
                key={`${item.href}-${item.label}`} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group relative",
                  isActive 
                    ? "bg-sidebar-accent text-white" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-sidebar-primary rounded-r-full" />
                )}
                <Icon className={cn("w-[18px] h-[18px]", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-sidebar-border/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-sidebar-accent/50 transition-colors text-left group">
              <UserAvatar name={user.name} className="w-9 h-9 border border-sidebar-border shadow-sm group-hover:border-sidebar-primary/50 transition-colors" />
              <div className="flex flex-col overflow-hidden flex-1">
                <span className="text-sm font-semibold truncate text-sidebar-foreground/90 group-hover:text-white">{user.name}</span>
                <span className="text-xs text-sidebar-foreground/50 truncate font-mono">{user.employeeId}</span>
              </div>
              <Icons.ChevronsUpDown className="w-4 h-4 text-sidebar-foreground/40 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                <div className="mt-2 text-xs font-mono bg-secondary/50 px-2 py-1 rounded inline-flex w-fit border">
                  Role: {user.role}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Icons.User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/preferences")}>
              <Icons.Bell className="mr-2 h-4 w-4" />
              <span>Notification Preferences</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs text-muted-foreground pointer-events-none">
              <Icons.Command className="mr-2 h-4 w-4" />
              <span>⌘K Quick search</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50">
              <Icons.LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}