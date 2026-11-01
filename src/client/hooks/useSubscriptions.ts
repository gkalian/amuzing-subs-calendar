import { useCallback, useMemo, useRef, useState } from 'react';
import { ApiAdapter } from '../services/apiAdapter';
import type { Currency, Service, Subscription } from '../types';
import { generateMonthlySeries, recomputeMarkedDates } from '../utils/subscriptionSeries';

export type UseSubscriptionsState = {
  subscriptions: Subscription[];
  markedDates: Set<string>;
  loading: boolean;
  error: string | null;
  currencySymbolMap: Record<string, string>;
  serviceNameMap: Record<string, string>;
};

export type UseSubscriptionsActions = {
  loadAll: () => Promise<void>;
  addOne: (payload: Omit<Subscription, 'id'>) => Promise<Subscription>;
  addSeries: (base: Omit<Subscription, 'id'>, months?: number) => Promise<Subscription[]>;
  updateOne: (id: string, updates: Partial<Subscription>) => Promise<Subscription>;
  convertToSeries: (id: string, updates?: Partial<Subscription>, months?: number) => Promise<Subscription[]>;
  deleteOne: (id: string) => Promise<void>;
  deleteSeries: (id: string) => Promise<void>;
};

export function useSubscriptions(currencies: Currency[], services: Service[]): UseSubscriptionsState & UseSubscriptionsActions {
  const api = useMemo(() => new ApiAdapter(), []);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markedDates = useMemo(() => recomputeMarkedDates(subscriptions), [subscriptions]);

  // Serialize write operations to avoid JSON file write races on backend
  const queueRef = useRef<Promise<any>>(Promise.resolve());
  const enqueue = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const chained = queueRef.current.then(task, task);
    queueRef.current = chained.catch(() => {});
    return chained;
  }, []);

  const currencySymbolMap = useMemo(() => {
    return currencies.reduce<Record<string, string>>((acc, c) => {
      acc[c.code] = c.symbol;
      return acc;
    }, {});
  }, [currencies]);

  const serviceNameMap = useMemo(() => {
    return services.reduce<Record<string, string>>((acc, s) => {
      acc[s.id] = s.name;
      return acc;
    }, {});
  }, [services]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSubscriptions(await api.getAll());
    } catch {
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, [api]);

  const addOne = useCallback(
    async (payload: Omit<Subscription, 'id'>) =>
      enqueue(async () => {
        const created = await api.add(payload);
        setSubscriptions((prev) => [...prev, created]);
        return created;
      }),
    [api, enqueue],
  );

  const addSeries = useCallback(
    async (base: Omit<Subscription, 'id'>, months = 12) =>
      enqueue(async () => {
        const dates = generateMonthlySeries(base.startDate, months);
        const createdList: Subscription[] = [];
        try {
          for (const date of dates) {
            createdList.push(await api.add({ ...base, startDate: date, monthly: true }));
          }
        } finally {
          // Keep whatever was already saved on the server, even if a later request failed
          setSubscriptions((prev) => [...prev, ...createdList]);
        }
        return createdList;
      }),
    [api, enqueue],
  );

  const updateOne = useCallback(
    async (id: string, updates: Partial<Subscription>) =>
      enqueue(async () => {
        const updated = await api.update(id, updates);
        setSubscriptions((prev) => prev.map((s) => (s.id === id ? updated : s)));
        return updated;
      }),
    [api, enqueue],
  );

  const convertToSeries = useCallback(
    async (id: string, updates: Partial<Subscription> = {}, months = 12) =>
      enqueue(async () => {
        const current = subscriptions.find((s) => s.id === id);
        if (!current) return [] as Subscription[];
        const base: Subscription = { ...current, ...updates, monthly: true };
        // Update the base entry
        const updated = await api.update(id, {
          serviceId: base.serviceId,
          name: base.name,
          startDate: base.startDate,
          amount: base.amount,
          currency: base.currency,
          monthly: true,
        });
        // Create missing months
        const seriesDates = generateMonthlySeries(base.startDate, months).slice(1); // skip month 0, already updated
        const existingKey = new Set(subscriptions.map((s) => `${s.serviceId}|${s.startDate}`));
        const createdList: Subscription[] = [];
        try {
          for (const date of seriesDates) {
            if (existingKey.has(`${base.serviceId}|${date}`)) continue;
            createdList.push(
              await api.add({
                userId: base.userId,
                serviceId: base.serviceId,
                name: base.name,
                startDate: date,
                amount: base.amount,
                currency: base.currency,
                monthly: true,
              }),
            );
          }
        } finally {
          setSubscriptions((prev) => [
            ...prev.map((s) => (s.id === updated.id ? updated : s)),
            ...createdList,
          ]);
        }
        return [updated, ...createdList];
      }),
    [api, enqueue, subscriptions],
  );

  const deleteOne = useCallback(
    async (id: string) =>
      enqueue(async () => {
        await api.delete(id);
        setSubscriptions((prev) => prev.filter((s) => s.id !== id));
      }),
    [api, enqueue],
  );

  const deleteSeries = useCallback(
    async (id: string) =>
      enqueue(async () => {
        const target = subscriptions.find((s) => s.id === id);
        if (!target) return;
        const dateSet = new Set(generateMonthlySeries(target.startDate, 12));
        const idsToDelete = subscriptions
          .filter(
            (s) =>
              s.userId === target.userId &&
              s.serviceId === target.serviceId &&
              s.currency === target.currency &&
              Number.isFinite(s.amount) &&
              Number.isFinite(target.amount) &&
              s.amount === target.amount &&
              dateSet.has(s.startDate),
          )
          .map((s) => s.id);
        if (!idsToDelete.includes(id)) idsToDelete.push(id);
        const deleted = new Set<string>();
        try {
          for (const del of idsToDelete) {
            await api.delete(del);
            deleted.add(del);
          }
        } finally {
          // Drop only the entries the server actually deleted
          setSubscriptions((prev) => prev.filter((s) => !deleted.has(s.id)));
        }
      }),
    [api, enqueue, subscriptions],
  );

  return {
    // state
    subscriptions,
    markedDates,
    loading,
    error,
    currencySymbolMap,
    serviceNameMap,
    // actions
    loadAll,
    addOne,
    addSeries,
    updateOne,
    convertToSeries,
    deleteOne,
    deleteSeries,
  };
}
