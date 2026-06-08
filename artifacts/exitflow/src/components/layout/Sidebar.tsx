import { Link, useLocation } from "wouter";
import { NAV_CONFIG } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const logout = useAuthStore(state => state.logout);

  if (!user) return null;

  const navItems = NAV_CONFIG[user.role] || [];

  return (
    <div className="hidden md:flex flex-col w-60 bg-sidebar border-r border-sidebar-border h-[100dvh] text-sidebar-foreground sticky top-0">
      <div className="h-14 flex items-center px-4 mb-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-sidebar-primary-foreground">
          <div className="w-6 h-6 rounded bg-sidebar-primary flex items-center justify-center">
            <Icons.Box className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold tracking-tight text-lg">ExitFlow</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = Icons[item.icon as keyof typeof Icons] as React.ElementType;
          const isActive = location === item.href || (item.href !== '/dashboard' && location.startsWith(item.href));
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border mt-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <UserAvatar name={user.name} className="w-9 h-9" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{user.name}</span>
              <span className="text-xs text-sidebar-foreground/60 truncate">{user.role.replace('_', ' ')}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent shrink-0" onClick={() => logout()}>
            <Icons.LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
