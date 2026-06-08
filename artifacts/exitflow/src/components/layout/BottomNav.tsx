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
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[68px] bg-background/90 backdrop-blur-md border-t flex items-center justify-around px-2 z-40 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
      {items.map((item) => {
        const Icon = Icons[item.icon as keyof typeof Icons] as React.ElementType;
        const isActive = location === item.href || (item.href !== '/dashboard' && location.startsWith(item.href));
        
        return (
          <Link 
            key={item.href} 
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isActive && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full" />
            )}
            <Icon className={cn("w-5 h-5", isActive && "fill-primary/10")} />
            <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}