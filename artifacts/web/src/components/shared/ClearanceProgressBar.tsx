import { ClearanceTask } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ClearanceProgressBarProps {
  tasks: ClearanceTask[];
  className?: string;
  showLabel?: boolean;
}

export function ClearanceProgressBar({ tasks, className, showLabel = true }: ClearanceProgressBarProps) {
  const total = tasks.length;
  if (total === 0) return null;
  
  const approved = tasks.filter(t => t.status === 'approved').length;
  const rejected = tasks.filter(t => t.status === 'rejected').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const overdue = tasks.filter(t => t.status === 'overdue').length;
  
  const approvedPct = (approved / total) * 100;
  const inProgressPct = ((inProgress + overdue) / total) * 100;
  const rejectedPct = (rejected / total) * 100;

  return (
    <div className={cn("w-full flex flex-col gap-2", className)}>
      <div className="flex h-2 w-full bg-secondary rounded-full overflow-hidden shadow-inner">
        {approvedPct > 0 && <div className="bg-emerald-500 h-full transition-all duration-500 ease-out border-r border-background/20 last:border-0" style={{ width: `${approvedPct}%` }} />}
        {inProgressPct > 0 && <div className="bg-blue-400 h-full transition-all duration-500 ease-out border-r border-background/20 last:border-0" style={{ width: `${inProgressPct}%` }} />}
        {rejectedPct > 0 && <div className="bg-red-500 h-full transition-all duration-500 ease-out" style={{ width: `${rejectedPct}%` }} />}
      </div>
      {showLabel && (
        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          <span>{approved}/{total}</span>
          <span className="text-foreground/70">Clearances</span>
        </div>
      )}
    </div>
  );
}
