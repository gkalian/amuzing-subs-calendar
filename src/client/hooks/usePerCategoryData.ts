import { useMemo } from 'react';
import type { Subscription } from '../types';
import type { PieDatum } from '../components/CategoryPieChart';
import type dayjs from 'dayjs';

export function usePerCategoryData(
  subscriptions: Subscription[],
  viewDate: dayjs.Dayjs,
  selectedCurrency: { code: string } | null,
  serviceCategoryMap: Record<string, string>,
): PieDatum[] {
  return useMemo(() => {
    if (!selectedCurrency) return [];
    const yearStr = viewDate.format('YYYY');
    const monthStr = viewDate.format('MM');
    const code = selectedCurrency.code;
    const acc = new Map<string, number>();
    for (const s of subscriptions) {
      if (s.currency !== code) continue;
      if (!s.startDate.startsWith(`${yearStr}-${monthStr}`)) continue;
      const cat = serviceCategoryMap[s.serviceId] || 'Other';
      acc.set(cat, (acc.get(cat) || 0) + (Number.isFinite(s.amount) ? (s.amount as number) : 0));
    }
    return Array.from(acc.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [subscriptions, viewDate, selectedCurrency, serviceCategoryMap]);
}
