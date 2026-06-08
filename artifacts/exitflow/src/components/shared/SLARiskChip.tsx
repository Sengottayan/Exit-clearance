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
      className={cn("px-2 py-0.5 border-transparent font-medium", color, className)}
    >
      {showIcon && <Clock className="w-3 h-3 mr-1" />}
      {label}
    </Badge>
  );
}
