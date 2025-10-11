import { useCallback, useMemo, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import type { Currency } from './useSubscriptions';
import type { Subscription } from '../services/apiAdapter';

export function useCalendar(subscriptions: Subscription[], selectedCurrency: Currency | null) {
  const [viewDate, setViewDate] = useState(dayjs());

  const prevMonth = useCallback(() => setViewDate((d) => d.subtract(1, 'month')), []);
  const nextMonth = useCallback(() => setViewDate((d) => d.add(1, 'month')), []);
  const selectYear = useCallback((year: number) => setViewDate((d) => d.year(year)), []);
  const selectMonth = useCallback((monthIndex: number) => setViewDate((d) => d.month(monthIndex)), []);

  const monthlyTotalText = useMemo(() => {
    if (!selectedCurrency) return '0.00';
    const yearStr = viewDate.format('YYYY');
    const monthStr = viewDate.format('MM');
    const code = selectedCurrency.code;
    const total = subscriptions
      .filter((s) => s.currency === code && s.startDate.startsWith(`${yearStr}-${monthStr}`))
      .reduce((sum, s) => sum + (Number.isFinite(s.amount) ? (s.amount as number) : 0), 0);
    return `${total.toFixed(2)} ${selectedCurrency.symbol}`;
  }, [subscriptions, viewDate, selectedCurrency]);

  return { viewDate, prevMonth, nextMonth, selectYear, selectMonth, monthlyTotalText };
}
