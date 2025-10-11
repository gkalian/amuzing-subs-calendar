import { useCallback, useMemo, useRef, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { ApiAdapter, type Subscription as ApiSubscription } from '../services/apiAdapter';

// Local copies of shared shapes (can be moved to types.ts later)
export type Currency = { code: string; name: string; symbol: string };
export type Service = { id: string; name: string };
export type Subscription = ApiSubscription;

function clampToMonth(date: Dayjs, targetDay: number): Dayjs {
  const end = date.endOf('month');
  const day = Math.min(targetDay, end.date());
  return date.date(day);
}

function generateMonthlySeries(startISO: string, months = 12): string[] {
  const start = dayjs(startISO, 'YYYY-MM-DD', true);
  const startDay = start.date();
  const out: string[] = [];
  for (let i = 0; i < months; i++) {
    const d = clampToMonth(start.add(i, 'month'), startDay).format('YYYY-MM-DD');
    out.push(d);
  }
  return out;
}

function recomputeMarkedDates(subs: Subscription[]): Set<string> {
  return new Set<string>(subs.map((s) => s.startDate));
}

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
  const [markedDates, setMarkedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const subs = await api.getAll();
      setSubscriptions(subs);
      setMarkedDates(recomputeMarkedDates(subs));
    } catch (e) {
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, [api]);

  const addOne = useCallback(
    async (payload: Omit<Subscription, 'id'>) =>
      enqueue(async () => {
        const created = await api.add(payload);
        setSubscriptions((prev) => {
          const next = [...prev, created];
          setMarkedDates(recomputeMarkedDates(next));
          return next;
        });
        return created;
      }),
    [api, enqueue],
  );

  const addSeries = useCallback(
    async (base: Omit<Subscription, 'id'>, months = 12) =>
      enqueue(async () => {
        const dates = generateMonthlySeries(base.startDate, months);
        const createdList: Subscription[] = [];
        for (const date of dates) {
          const body: Omit<Subscription, 'id'> = { ...base, startDate: date, monthly: true };
          const created = await api.add(body);
          createdList.push(created);
        }
        setSubscriptions((prev) => {
          const next = [...prev, ...createdList];
          setMarkedDates(recomputeMarkedDates(next));
          return next;
        });
        return createdList;
      }),
    [api, enqueue],
  );

  const updateOne = useCallback(
    async (id: string, updates: Partial<Subscription>) =>
      enqueue(async () => {
        const updated = await api.update(id, updates);
        setSubscriptions((prev) => {
          const next = prev.map((s) => (s.id === id ? updated : s));
          setMarkedDates(recomputeMarkedDates(next));
          return next;
        });
        return updated;
      }),
    [api, enqueue],
  );

  const convertToSeries = useCallback(
    async (id: string, updates: Partial<Subscription> = {}, months = 12) =>
      enqueue(async () => {
        const current = subscriptions.find((s) => s.id === id);
        if (!current) return [] as Subscription[];
        const base: Subscription = {
          ...current,
          ...updates,
          monthly: true,
        };
        // Update the base entry
        const updated = await api.update(id, {
          serviceId: base.serviceId,
          startDate: base.startDate,
          amount: base.amount,
          currency: base.currency,
          monthly: true,
        });
        // Create missing months
        const seriesDates = generateMonthlySeries(base.startDate, months).slice(1); // skip month 0, already updated
        const existingKey = new Set(subscriptions.map((s) => `${s.serviceId}|${s.startDate}`));
        const createdList: Subscription[] = [];
        for (const date of seriesDates) {
          const key = `${base.serviceId}|${date}`;
          if (existingKey.has(key)) continue;
          const body: Omit<Subscription, 'id'> = {
            userId: base.userId,
            serviceId: base.serviceId,
            startDate: date,
            amount: base.amount,
            currency: base.currency,
            monthly: true,
          };
          const created = await api.add(body);
          createdList.push(created);
        }
        setSubscriptions((prev) => {
          const next = prev.map((s) => (s.id === updated.id ? updated : s));
          const merged = [...next, ...createdList];
          setMarkedDates(recomputeMarkedDates(merged));
          return merged;
        });
        return [updated, ...createdList];
      }),
    [api, enqueue, subscriptions],
  );

  const deleteOne = useCallback(
    async (id: string) =>
      enqueue(async () => {
        await api.delete(id);
        setSubscriptions((prev) => {
          const next = prev.filter((s) => s.id !== id);
          setMarkedDates(recomputeMarkedDates(next));
          return next;
        });
      }),
    [api, enqueue],
  );

  const deleteSeries = useCallback(
    async (id: string) =>
      enqueue(async () => {
        const target = subscriptions.find((s) => s.id === id);
        if (!target) return;
        const dates = generateMonthlySeries(target.startDate, 12);
        const dateSet = new Set(dates);
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
        for (const del of idsToDelete) await api.delete(del);
        setSubscriptions((prev) => {
          const next = prev.filter((s) => !idsToDelete.includes(s.id));
          setMarkedDates(recomputeMarkedDates(next));
          return next;
        });
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
