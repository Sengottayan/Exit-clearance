import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, getAvatarColor, cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  src?: string;
  className?: string;
}

export function UserAvatar({ name, src, className }: UserAvatarProps) {
  const initials = getInitials(name || '?');
  const bgColorClass = getAvatarColor(name || '?');

  return (
    <Avatar className={cn("h-8 w-8 ring-1 ring-border shadow-sm", className)}>
      {src && <AvatarImage src={src} alt={name} className="object-cover" />}
      <AvatarFallback className={cn("text-white font-semibold tracking-wider text-[0.65rem]", bgColorClass)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}