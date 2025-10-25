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

function App() {
  const today = dayjs();
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
  const [statsOpen, setStatsOpen] = useState(false);
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

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const target = subscriptions.find((s) => s.id === id);
        if (target && target.monthly) await deleteSeries(id);
        else await deleteOne(id);
        setDialogOpen(false);
      } catch {
        setDialogOpen(false);
      }
    },
    [subscriptions, deleteSeries, deleteOne],
  );

  const handleSave = useCallback(
    async (payload: {
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
    },
    [dialogMode, convertToSeries, updateOne, addSeries, addOne],
  );

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
              onGridHeightChange={setCalendarHeight}
              onSelectYear={selectYear}
              currencySymbol={selectedCurrency?.symbol ?? ''}
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
                            : inferMonthlyFromHistory(s, subscriptions),
                      }
                    : undefined;
                })()
              : undefined
          }
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
