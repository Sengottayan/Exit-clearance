import { CaseStatus, TaskStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: CaseStatus | TaskStatus;
  className?: string;
}

const STATUS_MAP: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  pending_manager: { label: 'Pending Manager', dot: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400' },
  in_clearance: { label: 'In Clearance', dot: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400' },
  completed: { label: 'Completed', dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400' },
  cancelled: { label: 'Cancelled', dot: 'bg-gray-500', bg: 'bg-gray-50 dark:bg-gray-500/10', text: 'text-gray-700 dark:text-gray-400' },
  pending: { label: 'Pending', dot: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400' },
  in_progress: { label: 'In Progress', dot: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400' },
  approved: { label: 'Approved', dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400' },
  rejected: { label: 'Rejected', dot: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-700 dark:text-red-400' },
  overdue: { label: 'Overdue', dot: 'bg-red-600', bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-700 dark:text-red-400' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_MAP[status] || STATUS_MAP.pending;
  
  return (
    <Badge 
      variant="outline" 
      className={cn("px-2.5 py-0.5 border-transparent font-medium", config.bg, config.text, className)}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full mr-2", config.dot)} />
      {config.label}
    </Badge>
  );
}
