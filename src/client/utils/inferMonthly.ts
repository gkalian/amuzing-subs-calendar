import dayjs from 'dayjs';
import type { Subscription } from '../types';

// Определяет, является ли подписка частью ежемесячной серии на основе истории
export function inferMonthlyFromHistory(target: Subscription, all: Subscription[]): boolean {
  const base = dayjs(target.startDate, 'YYYY-MM-DD', true);
  if (!base.isValid()) return false;
  const baseDay = base.date();
  for (let i = 1; i < 12; i++) {
    const t = base.add(i, 'month');
    const end = t.endOf('month');
    const day = Math.min(baseDay, end.date());
    const dateStr = t.date(day).format('YYYY-MM-DD');
    const exists = all.some(
      (z) =>
        z.serviceId === target.serviceId &&
        z.currency === target.currency &&
        Number.isFinite(z.amount) &&
        Number.isFinite(target.amount) &&
        z.amount === target.amount &&
        z.startDate === dateStr,
    );
    if (exists) return true;
  }
  return false;
}
