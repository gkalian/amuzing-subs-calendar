import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import MonthList from './components/MonthList';
import MonthlyCalendar from './components/MonthlyCalendar';
import Footer from './components/Footer';
import ActionPanel from './components/ActionPanel';
import SubscriptionDialog from './components/SubscriptionDialog';
import SubscriptionList, { type SubscriptionListItem } from './components/SubscriptionList';
import { ApiAdapter, type Subscription as ClientSubscription } from './services/apiAdapter';
import currenciesData from './data/currencies.json';
import subscriptionsData from './data/subscriptions.json';

// Local types matching JSON shapes
type Currency = { code: string; name: string; symbol: string };
type Service = { id: string; name: string };
type ServiceCategory = { category: string; services: Service[] };

const DEFAULT_CURRENCY: Currency = {
  code: 'EUR',
  name: 'Euro',
  symbol: '€',
};

function App() {
  const [viewDate, setViewDate] = useState(() => dayjs());
  const today = useMemo(() => dayjs(), []);
  const [calendarHeight, setCalendarHeight] = useState<number | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>(
    (currenciesData as Currency[])?.length > 0
      ? (currenciesData as Currency[])
      : [DEFAULT_CURRENCY],
  );
  const [services, setServices] = useState<Service[]>(() => {
    const data = subscriptionsData as unknown as Service[] | ServiceCategory[];
    // If data is categorized, flatten categories; else assume it's already a flat array
    if (
      Array.isArray(data) &&
      data.length > 0 &&
      typeof (data as any)[0] === 'object' &&
      data[0] !== null &&
      'services' in (data[0] as any)
    ) {
      const cats = data as ServiceCategory[];
      return cats.flatMap((c) => c.services);
    }
    return data as Service[];
  });
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(
    (() => {
      const list =
        (currenciesData as Currency[])?.length > 0
          ? (currenciesData as Currency[])
          : [DEFAULT_CURRENCY];
      return list.find((c) => c.code === 'EUR') || list[0] || null;
    })(),
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [markedDates, setMarkedDates] = useState<Set<string>>(new Set());
  const [subscriptions, setSubscriptions] = useState<ClientSubscription[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const api = useMemo(() => new ApiAdapter(), []);
  // Settings (currencies and services) are loaded directly from JSON at build time
  useEffect(() => {
    // Marked dates will be filled after loading subscriptions
    setCurrencies((prev) => (prev.length > 0 ? prev : [DEFAULT_CURRENCY]));
    setServices((prev) => prev);
  }, []);

  // Load existing subscriptions on first render and mark their dates
  useEffect(() => {
    (async () => {
      try {
        const subs = await api.getAll();
        setSubscriptions(subs);
        const dates = new Set<string>(subs.map((s) => s.startDate));
        setMarkedDates(dates);
        setLoadError(null);
      } catch {
        setLoadError('Failed to load subscriptions. Please try refreshing the page later.');
      }
    })();
  }, [api]);

  const handlePrevMonth = () => setViewDate((prev) => prev.subtract(1, 'month'));
  const handleNextMonth = () => setViewDate((prev) => prev.add(1, 'month'));
  const handleSelectMonth = (monthIndex: number) => {
    setViewDate((prev) => prev.month(monthIndex));
  };
  const handleSelectYear = (year: number) => {
    setViewDate((prev) => prev.year(year));
  };
  const handleSubscriptionDateClick = (isoDate: string) => {
    setSelectedDate(isoDate);
    setListOpen(true);
  };

  // Monthly total for current view month and selected currency
  const monthlyTotalText = useMemo(() => {
    if (!selectedCurrency) return '0.00';
    const yearStr = viewDate.format('YYYY');
    const monthStr = viewDate.format('MM');
    const code = selectedCurrency.code;
    const total = subscriptions
      .filter((s) => s.currency === code && s.startDate.startsWith(`${yearStr}-${monthStr}`))
      .reduce((sum, s) => sum + (Number.isFinite(s.amount) ? s.amount : 0), 0);
    return `${total.toFixed(2)} ${selectedCurrency.symbol}`;
  }, [subscriptions, viewDate, selectedCurrency]);

  const currencySymbolMap = useMemo(() => {
    return currencies.reduce<Record<string, string>>((acc, curr) => {
      acc[curr.code] = curr.symbol;
      return acc;
    }, {});
  }, [currencies]);

  const serviceNameMap = useMemo(() => {
    return services.reduce<Record<string, string>>((acc, service) => {
      acc[service.id] = service.name;
      return acc;
    }, {});
  }, [services]);

  const selectedDateItems: SubscriptionListItem[] = useMemo(() => {
    if (!selectedDate) {
      return [];
    }

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

  return (
    <main className="min-h-dvh overflow-y-hidden bg-gradient-to-br from-[var(--bg-gradient-from)] via-[var(--bg-gradient-via)] to-[var(--bg-gradient-to)] flex flex-col">
      {loadError && (
        <div className="bg-red-500/20 text-red-200 border border-red-500/40 px-4 py-2 text-center text-sm">
          {loadError}
        </div>
      )}
      <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-6 flex-1 overflow-x-auto">
        <div className="flex w-full max-w-4xl min-w-[500px] flex-col gap-2 rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-4 py-5 shadow-modal backdrop-blur-xl">
          <div className="flex flex-row items-stretch gap-[5px]">
            <MonthList
              activeMonth={viewDate.month()}
              onSelectMonth={handleSelectMonth}
              className="mt-[64px]"
            />
            <MonthlyCalendar
              viewDate={viewDate}
              today={today}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              className="flex-1"
              onGridHeightChange={setCalendarHeight}
              onSelectYear={handleSelectYear}
              currencySymbol={selectedCurrency?.symbol ?? ''}
              markedDates={markedDates}
              monthlyTotalText={monthlyTotalText}
              onSubscriptionDateClick={handleSubscriptionDateClick}
            />
          </div>
          {selectedCurrency && (
            <ActionPanel
              selected={selectedCurrency}
              currencies={currencies}
              onChange={setSelectedCurrency}
              onNewSub={() => {
                setDialogMode('create');
                setEditingId(null);
                setDialogOpen(true);
              }}
            />
          )}
        </div>
      </div>
      <Footer />
      {selectedCurrency && (
        <SubscriptionDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          currency={selectedCurrency}
          currencies={currencies}
          subscriptions={services}
          mode={dialogMode}
          initial={
            editingId
              ? (() => {
                  const s = subscriptions.find((x) => x.id === editingId);
                  return s
                    ? {
                        id: s.id,
                        serviceId: s.serviceId,
                        startDate: s.startDate,
                        amount: s.amount,
                        currency: s.currency,
                        monthly:
                          s.monthly !== undefined
                            ? s.monthly
                            : (() => {
                                // Fallback inference: check if there is at least one future month entry for same service
                                const base = dayjs(s.startDate, 'YYYY-MM-DD', true);
                                const baseDay = base.date();
                                for (let i = 1; i < 12; i++) {
                                  const t = base.add(i, 'month');
                                  const end = t.endOf('month');
                                  const day = Math.min(baseDay, end.date());
                                  const dateStr = t.date(day).format('YYYY-MM-DD');
                                  const exists = subscriptions.some(
                                    (z) =>
                                      z.serviceId === s.serviceId &&
                                      z.currency === s.currency &&
                                      Number.isFinite(z.amount) &&
                                      Number.isFinite(s.amount) &&
                                      z.amount === s.amount &&
                                      z.startDate === dateStr,
                                  );
                                  if (exists) return true;
                                }
                                return false;
                              })(),
                      }
                    : undefined;
                })()
              : undefined
          }
          onDelete={async (id: string) => {
            try {
              const target = subscriptions.find((s) => s.id === id);
              if (target && target.monthly) {
                // Build expected dates for 12-month series anchored at target.startDate
                const anchor = dayjs(target.startDate, 'YYYY-MM-DD', true);
                const anchorDay = anchor.date();
                const expectedDates = new Set<string>();
                for (let i = 0; i < 12; i++) {
                  const t = anchor.add(i, 'month');
                  const end = t.endOf('month');
                  const day = Math.min(anchorDay, end.date());
                  expectedDates.add(t.date(day).format('YYYY-MM-DD'));
                }

                // Select ids to delete matching the series signature
                const idsToDelete = subscriptions
                  .filter(
                    (s) =>
                      s.monthly === true &&
                      s.userId === target.userId &&
                      s.serviceId === target.serviceId &&
                      s.currency === target.currency &&
                      Number.isFinite(s.amount) &&
                      Number.isFinite(target.amount) &&
                      s.amount === target.amount &&
                      expectedDates.has(s.startDate),
                  )
                  .map((s) => s.id);

                // Ensure at least delete the clicked one
                if (!idsToDelete.includes(id)) idsToDelete.push(id);

                // Delete sequentially to avoid backend write races
                for (const delId of idsToDelete) {
                  await api.delete(delId);
                }

                // Update state
                setSubscriptions((prev) => {
                  const next = prev.filter((s) => !idsToDelete.includes(s.id));
                  const dates = new Set<string>(next.map((s) => s.startDate));
                  setMarkedDates(dates);
                  return next;
                });
              } else {
                await api.delete(id);
                setSubscriptions((prev) => {
                  const next = prev.filter((s) => s.id !== id);
                  // recompute markedDates from next
                  const dates = new Set<string>(next.map((s) => s.startDate));
                  setMarkedDates(dates);
                  return next;
                });
              }
              setDialogOpen(false);
            } catch {
              setDialogOpen(false);
            }
          }}
          onSave={async (payload: {
            id?: string;
            serviceId: string;
            startDate: string;
            amount: number;
            currency: string;
            monthly?: boolean;
          }) => {
            try {
              if (dialogMode === 'edit' && payload.id) {
                if (payload.monthly) {
                  // Convert to monthly series starting from the (possibly changed) startDate
                  const start = dayjs(payload.startDate, 'YYYY-MM-DD', true);
                  const startDay = start.date();
                  // First, update the selected subscription for month 0
                  const updated = await api.update(payload.id, {
                    serviceId: payload.serviceId,
                    startDate: payload.startDate,
                    amount: payload.amount,
                    currency: payload.currency,
                    monthly: true,
                  });
                  // Prepare additional months (1..11), skipping ones that already exist for same service/date
                  const adds: Omit<ClientSubscription, 'id'>[] = [];
                  for (let i = 1; i < 12; i++) {
                    const target = start.add(i, 'month');
                    const endOfTarget = target.endOf('month');
                    const day = Math.min(startDay, endOfTarget.date());
                    const dateStr = target.date(day).format('YYYY-MM-DD');
                    const exists = subscriptions.some(
                      (s) => s.serviceId === payload.serviceId && s.startDate === dateStr,
                    );
                    if (!exists) {
                      adds.push({
                        userId: 'default',
                        serviceId: payload.serviceId,
                        startDate: dateStr,
                        amount: payload.amount,
                        currency: payload.currency,
                        monthly: true,
                      });
                    }
                  }
                  const createdList: ClientSubscription[] = [];
                  for (const b of adds) {
                    // Sequential to avoid backend file write races
                    const created = await api.add(b);
                    createdList.push(created);
                  }
                  setSubscriptions((prev) => {
                    const next = prev.map((s) => (s.id === updated.id ? updated : s));
                    const merged = [...next, ...createdList];
                    const dates = new Set<string>(merged.map((s) => s.startDate));
                    setMarkedDates(dates);
                    return merged;
                  });
                } else {
                  const updated = await api.update(payload.id, {
                    serviceId: payload.serviceId,
                    startDate: payload.startDate,
                    amount: payload.amount,
                    currency: payload.currency,
                    monthly: false,
                  });
                  setSubscriptions((prev) => {
                    const next = prev.map((s) => (s.id === updated.id ? updated : s));
                    const dates = new Set<string>(next.map((s) => s.startDate));
                    setMarkedDates(dates);
                    return next;
                  });
                }
              } else {
                if (payload.monthly) {
                  const start = dayjs(payload.startDate, 'YYYY-MM-DD', true);
                  const startDay = start.date();
                  const bodies: Omit<ClientSubscription, 'id'>[] = [];
                  for (let i = 0; i < 12; i++) {
                    const target = start.add(i, 'month');
                    const endOfTarget = target.endOf('month');
                    const day = Math.min(startDay, endOfTarget.date());
                    const dateStr = target.date(day).format('YYYY-MM-DD');
                    bodies.push({
                      userId: 'default',
                      serviceId: payload.serviceId,
                      startDate: dateStr,
                      amount: payload.amount,
                      currency: payload.currency,
                      monthly: true,
                    });
                  }
                  const createdList: ClientSubscription[] = [];
                  for (const b of bodies) {
                    // Sequential to avoid backend file write races
                    const created = await api.add(b);
                    createdList.push(created);
                  }
                  setSubscriptions((prev) => {
                    const next = [...prev, ...createdList];
                    const dates = new Set<string>(next.map((s) => s.startDate));
                    setMarkedDates(dates);
                    return next;
                  });
                } else {
                  const body: Omit<ClientSubscription, 'id'> = {
                    userId: 'default',
                    serviceId: payload.serviceId,
                    startDate: payload.startDate,
                    amount: payload.amount,
                    currency: payload.currency,
                    monthly: false,
                  };
                  const created = await api.add(body);
                  setSubscriptions((prev) => {
                    const next = [...prev, created];
                    const dates = new Set<string>(next.map((s) => s.startDate));
                    setMarkedDates(dates);
                    return next;
                  });
                }
              }
              setDialogOpen(false);
            } catch {
              setDialogOpen(false);
            }
          }}
        />
      )}
      <SubscriptionList
        open={listOpen}
        onClose={() => setListOpen(false)}
        onEdit={(id) => {
          setEditingId(id);
          setDialogMode('edit');
          setDialogOpen(true);
        }}
        date={selectedDate ?? undefined}
        items={selectedDateItems}
      />
    </main>
  );
}

export default App;
