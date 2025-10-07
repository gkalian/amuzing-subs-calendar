import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import MonthList from './components/MonthList';
import MonthlyCalendar from './components/MonthlyCalendar';
import Footer from './components/Footer';
import ActionPanel from './components/ActionPanel';
import SubscriptionDialog from './components/SubscriptionDialog';
import currencies from './data/currencies.json';
import { ApiAdapter } from './services/apiAdapter';
import type { Subscription as ServerSubscription } from '../server/types';

type Currency = {
  code: string;
  name: string;
  symbol: string;
};

function App() {
  const [viewDate, setViewDate] = useState(() => dayjs());
  const today = useMemo(() => dayjs(), []);
  const [calendarHeight, setCalendarHeight] = useState<number | null>(null);
  const allCurrencies = currencies as Currency[];
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    () => allCurrencies.find((c) => c.code === 'EUR') || allCurrencies[0],
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [markedDates, setMarkedDates] = useState<Set<string>>(new Set());
  const [subscriptions, setSubscriptions] = useState<ServerSubscription[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const api = useMemo(() => new ApiAdapter(), []);

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
        setLoadError('Subscriptions can not be loaded. Try o refresh the page');
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

  // Monthly total for current view month and selected currency
  const monthlyTotalText = useMemo(() => {
    const yearStr = viewDate.format('YYYY');
    const monthStr = viewDate.format('MM');
    const code = selectedCurrency.code;
    const total = subscriptions
      .filter((s) => s.currency === code && s.startDate.startsWith(`${yearStr}-${monthStr}`))
      .reduce((sum, s) => sum + (Number.isFinite(s.amount) ? s.amount : 0), 0);
    return `${total.toFixed(2)} ${selectedCurrency.symbol}`;
  }, [subscriptions, viewDate, selectedCurrency]);

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
              currencySymbol={selectedCurrency.symbol}
              markedDates={markedDates}
              monthlyTotalText={monthlyTotalText}
            />
          </div>
          <ActionPanel
            selected={selectedCurrency}
            onChange={setSelectedCurrency}
            onNewSub={() => setDialogOpen(true)}
          />
        </div>
      </div>
      <Footer />
      <SubscriptionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        currency={selectedCurrency}
        onSave={async (payload: { serviceId: string; startDate: string; amount: number; currency: string }) => {
          try {
            const body: Omit<ServerSubscription, 'id'> = {
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
    </main>
  );
}

export default App;
