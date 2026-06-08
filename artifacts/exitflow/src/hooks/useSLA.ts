import { differenceInHours, differenceInDays } from 'date-fns';

export function useSLA(dueAt: string | undefined) {
  if (!dueAt) return { status: 'unknown', label: 'Unknown', color: 'text-gray-600 bg-gray-50' };

  const now = new Date();
  const due = new Date(dueAt);
  const hours = differenceInHours(due, now);
  const days = differenceInDays(due, now);
  
  if (hours > 24) return { status: 'on_track', label: 'On Track', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400' };
  if (hours > 0) return { status: 'due_soon', label: hours < 24 ? `Due in ${hours}h` : 'Due Today', color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400' };
  if (hours === 0) return { status: 'due_now', label: 'Due Now', color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400' };
  
  const overdueDays = Math.abs(days);
  const overdueHours = Math.abs(hours) % 24;
  return { 
    status: 'overdue', 
    label: overdueDays > 0 ? `Overdue by ${overdueDays}d ${overdueHours}h` : `Overdue by ${Math.abs(hours)}h`, 
    color: 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400' 
  };
}
