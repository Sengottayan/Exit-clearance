import { Link, useLocation } from "wouter";
import { NAV_CONFIG } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";

export function BottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  const navItems = NAV_CONFIG[user.role] || [];
  // Take up to 4 items for mobile bottom nav
  const items = navItems.slice(0, 4);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t flex items-center justify-around px-2 z-40 pb-safe">
      {items.map((item) => {
        const Icon = Icons[item.icon as keyof typeof Icons] as React.ElementType;
        const isActive = location === item.href || (item.href !== '/dashboard' && location.startsWith(item.href));
        
        return (
          <Link 
            key={item.href} 
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
