import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import MonthList from './components/MonthList';
import MonthlyCalendar from './components/MonthlyCalendar';
import Footer from './components/Footer';
import ActionPanel from './components/ActionPanel';
import SubscriptionDialog from './components/SubscriptionDialog';
import SubscriptionList, { type SubscriptionListItem } from './components/SubscriptionList';
import { useSubscriptions } from './hooks/useSubscriptions';
import { useCalendar } from './hooks/useCalendar';
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
  const {
    subscriptions,
    markedDates,
    loading,
    error,
    currencySymbolMap,
    serviceNameMap,
    loadAll,
    addOne,
    addSeries,
    updateOne,
    convertToSeries,
    deleteOne,
    deleteSeries,
  } = useSubscriptions(currencies, services);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  // Settings (currencies and services) are loaded directly from JSON at build time
  useEffect(() => {
    // Marked dates will be filled after loading subscriptions
    setCurrencies((prev) => (prev.length > 0 ? prev : [DEFAULT_CURRENCY]));
    setServices((prev) => prev);
  }, []);

  // Load existing subscriptions on first render
  useEffect(() => {
    loadAll();
  }, [loadAll]);
  const { viewDate, prevMonth, nextMonth, selectYear, selectMonth, monthlyTotalText } = useCalendar(
    subscriptions,
    selectedCurrency,
  );
  const handleSubscriptionDateClick = (isoDate: string) => {
    setSelectedDate(isoDate);
    setListOpen(true);
  };

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
      {error && (
        <div className="bg-red-500/20 text-red-200 border border-red-500/40 px-4 py-2 text-center text-sm">
          {error}
        </div>
      )}
      <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-6 flex-1 overflow-x-auto">
        <div className="flex w-full max-w-4xl min-w-[500px] flex-col gap-2 rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-4 py-5 shadow-modal backdrop-blur-xl">
          <div className="flex flex-row items-stretch gap-[5px]">
            <MonthList
              activeMonth={viewDate.month()}
              onSelectMonth={selectMonth}
              className="mt-[64px]"
            />
            <MonthlyCalendar
              viewDate={viewDate}
              today={today}
              onPrevMonth={prevMonth}
              onNextMonth={nextMonth}
              className="flex-1"
              onGridHeightChange={setCalendarHeight}
              onSelectYear={selectYear}
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
              if (target && target.monthly) await deleteSeries(id);
              else await deleteOne(id);
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
                if (payload.monthly)
                  await convertToSeries(payload.id, {
                    serviceId: payload.serviceId,
                    startDate: payload.startDate,
                    amount: payload.amount,
                    currency: payload.currency,
                    monthly: true,
                  });
                else
                  await updateOne(payload.id, {
                    serviceId: payload.serviceId,
                    startDate: payload.startDate,
                    amount: payload.amount,
                    currency: payload.currency,
                    monthly: false,
                  });
              } else {
                if (payload.monthly)
                  await addSeries({
                    userId: 'default',
                    serviceId: payload.serviceId,
                    startDate: payload.startDate,
                    amount: payload.amount,
                    currency: payload.currency,
                    monthly: true,
                  });
                else
                  await addOne({
                    userId: 'default',
                    serviceId: payload.serviceId,
                    startDate: payload.startDate,
                    amount: payload.amount,
                    currency: payload.currency,
                    monthly: false,
                  });
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
