import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import MonthList from './components/MonthList';
import MonthlyCalendar from './components/MonthlyCalendar';
import Footer from './components/Footer';
import ActionPanel from './components/ActionPanel';
import SubscriptionDialog from './components/SubscriptionDialog';
import SubscriptionList from './components/SubscriptionList';
import StatsModal from './components/StatsModal';
import { usePerCategoryData } from './hooks/usePerCategoryData';
import { useSelectedDateItems } from './hooks/useSelectedDateItems';
import { useSubscriptions } from './hooks/useSubscriptions';
import { useCalendar } from './hooks/useCalendar';
import currenciesData from './data/currencies.json';
import subscriptionsData from './data/subscriptions.json';
import type { Currency, Service, ServiceCategory } from './types';
import { useServiceCategoryMap } from './hooks/useServiceCategoryMap';
import { inferMonthlyFromHistory } from './utils/inferMonthly';

const DEFAULT_CURRENCY: Currency = {
  code: 'EUR',
  name: 'Euro',
  symbol: '€',
};

// Static catalogs: they never change at runtime
const CURRENCIES: Currency[] =
  (currenciesData as Currency[])?.length > 0 ? (currenciesData as Currency[]) : [DEFAULT_CURRENCY];

const SERVICES: Service[] = (() => {
  const data = subscriptionsData as unknown as Service[] | ServiceCategory[];
  // If data is categorized, flatten categories; else assume it's already a flat array
  if (data.length > 0 && 'services' in data[0]) {
    return (data as ServiceCategory[]).flatMap((c) => c.services);
  }
  return data as Service[];
})();

function App() {
  const today = dayjs();
  const currencies = CURRENCIES;
  const services = SERVICES;
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(
    () => CURRENCIES.find((c) => c.code === 'EUR') || CURRENCIES[0] || null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);
  const {
    subscriptions,
    markedDates,
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

  // Load existing subscriptions on first render
  useEffect(() => {
    loadAll();
  }, [loadAll]);
  const { viewDate, prevMonth, nextMonth, selectYear, selectMonth, monthlyTotalText } = useCalendar(
    subscriptions,
    selectedCurrency,
  );
  const serviceCategoryMap = useServiceCategoryMap();
  const perCategoryData = usePerCategoryData(
    subscriptions,
    viewDate,
    selectedCurrency,
    serviceCategoryMap,
  );
  const handleSubscriptionDateClick = useCallback((isoDate: string) => {
    setSelectedDate(isoDate);
    setListOpen(true);
  }, []);
  const handleMonthlyTotalClick = useCallback(() => {
    setStatsOpen(true);
  }, []);

  const handleEdit = useCallback((id: string) => {
    setEditingId(id);
    setDialogMode('edit');
    setDialogOpen(true);
  }, []);

  // Errors are not caught here: SubscriptionDialog shows them and stays open
  const handleDelete = useCallback(
    async (id: string) => {
      const target = subscriptions.find((s) => s.id === id);
      if (target && target.monthly) await deleteSeries(id);
      else await deleteOne(id);
      setDialogOpen(false);
    },
    [subscriptions, deleteSeries, deleteOne],
  );

  const handleSave = useCallback(
    async (payload: {
      id?: string;
      serviceId: string;
      name?: string;
      startDate: string;
      amount: number;
      currency: string;
      monthly?: boolean;
    }) => {
      const fields = {
        serviceId: payload.serviceId,
        name: payload.name,
        startDate: payload.startDate,
        amount: payload.amount,
        currency: payload.currency,
        monthly: Boolean(payload.monthly),
      };
      if (dialogMode === 'edit' && payload.id) {
        if (fields.monthly) await convertToSeries(payload.id, fields);
        else await updateOne(payload.id, fields);
      } else {
        if (fields.monthly) await addSeries({ userId: 'default', ...fields });
        else await addOne({ userId: 'default', ...fields });
      }
      setDialogOpen(false);
    },
    [dialogMode, convertToSeries, updateOne, addSeries, addOne],
  );

  // Memoized so the dialog does not reset its fields on unrelated re-renders
  const editingInitial = useMemo(() => {
    if (!editingId) return undefined;
    const s = subscriptions.find((x) => x.id === editingId);
    if (!s) return undefined;
    return {
      id: s.id,
      serviceId: s.serviceId,
      name: s.name,
      startDate: s.startDate,
      amount: s.amount,
      currency: s.currency,
      monthly: s.monthly !== undefined ? s.monthly : inferMonthlyFromHistory(s, subscriptions),
    };
  }, [editingId, subscriptions]);

  const selectedDateItems = useSelectedDateItems(
    selectedDate,
    subscriptions,
    serviceNameMap,
    currencySymbolMap,
  );

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
              onSelectYear={selectYear}
              markedDates={markedDates}
              monthlyTotalText={monthlyTotalText}
              onSubscriptionDateClick={handleSubscriptionDateClick}
              onMonthlyTotalClick={handleMonthlyTotalClick}
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
          initial={editingInitial}
          onDelete={handleDelete}
          onSave={handleSave}
        />
      )}
      <SubscriptionList
        open={listOpen}
        onClose={() => setListOpen(false)}
        onEdit={handleEdit}
        date={selectedDate ?? undefined}
        items={selectedDateItems}
      />
      <StatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        title={`${viewDate.format('MMMM YYYY')} — ${monthlyTotalText}`}
        data={perCategoryData}
        currencySymbol={selectedCurrency?.symbol}
      />
    </main>
  );
}

export default App;
