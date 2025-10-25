import { useMemo } from 'react';
import type { Subscription } from '../types';
import type { SubscriptionListItem } from '../components/SubscriptionList';

export function useSelectedDateItems(
  selectedDate: string | null,
  subscriptions: Subscription[],
  serviceNameMap: Record<string, string>,
  currencySymbolMap: Record<string, string>,
): SubscriptionListItem[] {
  return useMemo(() => {
    if (!selectedDate) return [];
    return subscriptions
      .filter((sub) => sub.startDate === selectedDate)
      .map((sub) => {
        const name = serviceNameMap[sub.serviceId] ?? sub.serviceId;
        const symbol = currencySymbolMap[sub.currency] ?? sub.currency;
        return {
          id: sub.id,
          name,
          amountText: `${sub.amount.toFixed(2)} ${symbol}`,
        } satisfies SubscriptionListItem;
      });
  }, [selectedDate, subscriptions, serviceNameMap, currencySymbolMap]);
}
