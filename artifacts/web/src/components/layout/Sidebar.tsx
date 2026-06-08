import { Link, useLocation } from "@/lib/wouter";
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
    <aside className="hidden md:flex flex-col w-[260px] bg-sidebar border-r border-sidebar-border h-[100dvh] text-sidebar-foreground sticky top-0 shadow-lg shadow-black/10 z-20 transition-all duration-300">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 mb-4 border-b border-sidebar-border/40">
        <Link href="/dashboard" className="flex items-center gap-2.5 text-sidebar-primary-foreground group">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-all transition-all-300">
            <Icons.Box className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold tracking-tight text-lg text-white">ExitFlow</span>
        </Link>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 px-4 py-2 space-y-6">
        <div>
          <p className="text-[10px] font-bold text-sidebar-foreground/35 uppercase tracking-widest mb-3 px-3">
            WORKSPACE NAVIGATION
          </p>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = Icons[item.icon as keyof typeof Icons] as React.ElementType;
              const isActive = location === item.href || (item.href !== '/dashboard' && location.startsWith(item.href));
              return (
                <Link 
                  key={`${item.href}-${item.label}`} 
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 group relative",
                    isActive 
                      ? "bg-sidebar-accent text-white shadow-sm shadow-black/5" 
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-white"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-sidebar-primary rounded-r-md" />
                  )}
                  <Icon className={cn("w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/35 group-hover:text-sidebar-foreground/75")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Profile Dropdown */}
      <div className="p-4 border-t border-sidebar-border/40 bg-sidebar/30">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-sidebar-accent/50 transition-all duration-200 text-left group">
              <div className="relative">
                <UserAvatar name={user.name} className="w-9 h-9 border border-sidebar-border shadow-md group-hover:border-sidebar-primary/50 transition-colors" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-sidebar" />
              </div>
              <div className="flex flex-col overflow-hidden flex-1">
                <span className="text-sm font-semibold truncate text-sidebar-foreground/90 group-hover:text-white">{user.name}</span>
                <span className="text-[10px] text-sidebar-foreground/40 truncate font-mono tracking-tight">{user.employeeId}</span>
              </div>
              <Icons.ChevronsUpDown className="w-4 h-4 text-sidebar-foreground/30 shrink-0 group-hover:text-sidebar-foreground/60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                <div className="mt-2 text-[10px] font-bold uppercase tracking-wide bg-secondary/80 text-muted-foreground px-2 py-0.5 rounded inline-flex w-fit border">
                  {user.role}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Icons.User className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Profile Details</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/preferences")}>
              <Icons.Sliders className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Preferences</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50">
              <Icons.LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
