import { useSLA } from '@/hooks/useSLA';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface SLARiskChipProps {
  dueAt: string | undefined;
  className?: string;
  showIcon?: boolean;
}

export function SLARiskChip({ dueAt, className, showIcon = true }: SLARiskChipProps) {
  const { label, color } = useSLA(dueAt);
  
  return (
    <Badge 
      variant="outline" 
      className={cn("px-2 py-0.5 font-medium whitespace-nowrap shadow-sm bg-background", color, className)}
    >
      {showIcon && <Clock className="w-[10px] h-[10px] mr-1.5 opacity-70" />}
      {label}
    </Badge>
  );
}