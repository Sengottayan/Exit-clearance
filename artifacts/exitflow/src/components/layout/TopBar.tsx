import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
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

export function TopBar() {
  const { user } = useAuth();
  const logout = useAuthStore(state => state.logout);

  if (!user) return null;

  return (
    <div className="md:hidden h-14 border-b bg-background flex items-center justify-between px-4 sticky top-0 z-40">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
          <Icons.Box className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-semibold tracking-tight">ExitFlow</span>
      </Link>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Icons.Bell className="w-4 h-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <UserAvatar name={user.name} className="w-8 h-8" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user.name}</span>
                <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              <Icons.LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
