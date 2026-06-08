import { differenceInDays, format, parseISO, subDays } from 'date-fns';
import { ExitCase } from './types';
import { EXIT_REASONS, DEPARTMENTS } from './constants';
import { resolveTaskStatus } from './workflow';

export function computeExitTrend(cases: ExitCase[], months = 12) {
  const now = new Date();
  const buckets: Record<string, number> = {};

  for (let i = months - 1; i >= 0; i--) {
    const d = subDays(now, i * 30);
    const key = format(d, 'MMM');
    buckets[key] = 0;
  }

  cases.forEach((c) => {
    const key = format(parseISO(c.resignationDate), 'MMM');
    if (key in buckets) buckets[key]++;
  });

  return Object.entries(buckets).map(([name, exits]) => ({ name, exits }));
}

export function computeExitReasons(cases: ExitCase[]) {
  const counts: Record<string, number> = {};
  cases.forEach((c) => {
    counts[c.exitReason] = (counts[c.exitReason] ?? 0) + 1;
  });

  return EXIT_REASONS.filter((r) => counts[r.value])
    .map((r) => ({ name: r.label, value: counts[r.value] ?? 0 }))
    .sort((a, b) => b.value - a.value);
}

export function computeTurnaround(cases: ExitCase[]) {
  const deptDays: Record<string, number[]> = {};

  cases
    .filter((c) => c.status === 'completed')
    .forEach((c) => {
      c.tasks.forEach((t) => {
        if (t.completedAt && c.resignationDate) {
          const days = differenceInDays(parseISO(t.completedAt), parseISO(c.resignationDate));
          if (!deptDays[t.deptLabel]) deptDays[t.deptLabel] = [];
          deptDays[t.deptLabel].push(Math.max(0, days));
        }
      });
    });

  if (Object.keys(deptDays).length === 0) {
    return DEPARTMENTS.slice(0, 6).map((d) => ({ name: d.label, days: 0 }));
  }

  return Object.entries(deptDays).map(([name, days]) => ({
    name,
    days: Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10,
  }));
}

export function computeSLAPerformance(cases: ExitCase[], months = 6) {
  const now = new Date();
  const buckets: Record<string, { onTime: number; overdue: number }> = {};

  for (let i = months - 1; i >= 0; i--) {
    const d = subDays(now, i * 30);
    buckets[format(d, 'MMM')] = { onTime: 0, overdue: 0 };
  }

  cases.forEach((c) => {
    const monthKey = format(parseISO(c.resignationDate), 'MMM');
    if (!(monthKey in buckets)) return;

    c.tasks.forEach((t) => {
      if (t.status === 'approved') {
        const resolved = resolveTaskStatus(t);
        if (resolved === 'overdue' || (t.completedAt && t.slaDueAt && parseISO(t.completedAt) > parseISO(t.slaDueAt))) {
          buckets[monthKey].overdue++;
        } else {
          buckets[monthKey].onTime++;
        }
      }
    });
  });

  return Object.entries(buckets).map(([name, { onTime, overdue }]) => ({ name, onTime, overdue }));
}
