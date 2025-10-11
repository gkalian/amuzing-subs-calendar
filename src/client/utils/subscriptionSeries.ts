import dayjs, { Dayjs } from 'dayjs';
import type { Subscription } from '../types';

function clampToMonth(date: Dayjs, targetDay: number): Dayjs {
  const end = date.endOf('month');
  const day = Math.min(targetDay, end.date());
  return date.date(day);
}

export function generateMonthlySeries(startISO: string, months = 12): string[] {
  const start = dayjs(startISO, 'YYYY-MM-DD', true);
  const startDay = start.date();
  const out: string[] = [];
  for (let i = 0; i < months; i++) {
    const d = clampToMonth(start.add(i, 'month'), startDay).format('YYYY-MM-DD');
    out.push(d);
  }
  return out;
}

export function recomputeMarkedDates(subs: Subscription[]): Set<string> {
  return new Set<string>(subs.map((s) => s.startDate));
}
