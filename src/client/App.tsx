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
  const [services, setServices] = useState<Service[]>(subscriptionsData as Service[]);
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
      <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-6 flex-1">
        <div className="flex w-full max-w-4xl min-w-[600px] flex-col gap-2 rounded-3xl border border-white/[0.05] bg-white/[0.04] px-4 py-5 shadow-[0_28px_72px_-56px_rgba(13,148,136,0.55)] backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row lg:items-stretch lg:gap-[5px]">
            <MonthList
              activeMonth={viewDate.month()}
              onSelectMonth={handleSelectMonth}
              className="mt-0 lg:mt-[64px]"
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
              onNewSub={() => setDialogOpen(true)}
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
          onSave={async (payload: {
            serviceId: string;
            startDate: string;
            amount: number;
            currency: string;
          }) => {
            try {
              const body: Omit<ClientSubscription, 'id'> = {
                userId: 'default',
                serviceId: payload.serviceId,
                startDate: payload.startDate,
                amount: payload.amount,
                currency: payload.currency,
              };
              const created = await api.add(body);
              setSubscriptions((prev) => [...prev, created]);
              // Mark the selected date locally
              setMarkedDates((prev) => new Set(prev).add(payload.startDate));
              setDialogOpen(false);
            } catch (e) {
              // For now, just close; later we can show a toast
              setDialogOpen(false);
              // console.error('Failed to save subscription', e);
            }
          }}
        />
      )}
      <SubscriptionList
        open={listOpen}
        onClose={() => setListOpen(false)}
        onEdit={() => {
          if (selectedDate) {
            console.debug('Edit subscriptions for date:', selectedDate);
          }
        }}
        date={selectedDate ?? undefined}
        items={selectedDateItems}
      />
    </main>
  );
}

export default App;
