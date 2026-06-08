import { useAuth } from "@/hooks/useAuth";
import { Link } from "@/lib/wouter";
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
import { NotificationBell } from "@/components/shared/NotificationBell";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export function TopBar() {
  const { user } = useAuth();
  const logout = useAuthStore(state => state.logout);

  if (!user) return null;

  return (
    <div className="md:hidden h-14 border-b bg-background/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-40 shadow-sm">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-7 h-7 rounded bg-foreground flex items-center justify-center">
          <Icons.Box className="w-4 h-4 text-background" />
        </div>
        <span className="font-bold tracking-tight">ExitFlow</span>
      </Link>

      <div className="flex items-center gap-1">
        <NotificationBell />
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full ml-1">
              <UserAvatar name={user.name} className="w-8 h-8 border shadow-sm" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-1">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Icons.User className="mr-2 h-4 w-4" />
              <span>Profile</span>
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
