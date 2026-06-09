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
    <aside className="hidden md:flex flex-col w-[240px] bg-sidebar border-r border-sidebar-border h-[100dvh] text-sidebar-foreground sticky top-0 z-20">
      {/* Brand Header */}
      <div className="h-14 flex items-center px-4 mb-2">
        <Link href="/dashboard" className="flex items-center gap-2 text-sidebar-foreground hover:text-white group transition-colors">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
            <Icons.Box className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-sm">OffboardIQ</span>
        </Link>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 px-3 py-2 space-y-6">
        <div>
          <nav className="space-y-0.5">
            {(() => {
              const exactMatch = navItems.find(i => location === i.href);
              return navItems.map((item) => {
                const Icon = Icons[item.icon as keyof typeof Icons] as React.ElementType;
                const isActive = exactMatch
                  ? exactMatch.href === item.href
                  : (item.href !== '/' && location.startsWith(item.href + '/'));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-[#274472] text-[#8ab4f8] shadow-sm"
                        : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-7 h-7 flex items-center justify-center rounded-md transition-colors",
                        isActive ? "bg-[#33548a] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" : "text-muted-foreground group-hover:text-white group-hover:bg-white/10"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="tracking-wide">{item.label}</span>
                    </div>
                  </Link>
                );
              });
            })()}
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
