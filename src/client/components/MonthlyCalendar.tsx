import { useEffect, useMemo, useRef, useState } from 'react';
import Button from './forms/Button';
import Dropdown from './forms/Dropdown';
import Listbox, { type ListboxOption } from './forms/Listbox';
import { Dayjs } from 'dayjs';
import { AnimatePresence, motion } from 'motion/react';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getCalendarMatrix(referenceDate: Dayjs) {
  const startOfMonth = referenceDate.startOf('month');
  const endOfMonth = referenceDate.endOf('month');

  const startOffset = (startOfMonth.day() + 6) % 7;
  const endOffset = 6 - ((endOfMonth.day() + 6) % 7);

  const calendarStart = startOfMonth.subtract(startOffset, 'day');
  const calendarEnd = endOfMonth.add(endOffset, 'day');

  const days: Dayjs[] = [];
  let cursor = calendarStart;

  while (cursor.isBefore(calendarEnd) || cursor.isSame(calendarEnd, 'day')) {
    days.push(cursor);
    cursor = cursor.add(1, 'day');
  }

  while (days.length < 42) {
    days.push(cursor);
    cursor = cursor.add(1, 'day');
  }

  const weeks: Dayjs[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return weeks;
}

type MonthlyCalendarProps = {
  viewDate: Dayjs;
  today: Dayjs;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  className?: string;
  onGridHeightChange?: (height: number) => void;
  onSelectYear?: (year: number) => void;
  currencySymbol?: string;
  // YYYY-MM-DD set of days to mark with a dot
  markedDates?: Set<string>;
  // Pre-formatted monthly total text (e.g., "123.45 €"). Falls back to 0.00 when not provided.
  monthlyTotalText?: string;
  onSubscriptionDateClick?: (isoDate: string) => void;
};

function MonthlyCalendar({
  viewDate,
  today,
  className,
  onGridHeightChange,
  onSelectYear,
  currencySymbol,
  markedDates,
  monthlyTotalText,
  onSubscriptionDateClick,
}: MonthlyCalendarProps) {
  const weeks = useMemo(() => getCalendarMatrix(viewDate), [viewDate]);
  const monthLabel = viewDate.format('MMMM');
  const yearLabel = viewDate.format('YYYY');
  const monthKey = viewDate.format('YYYY-MM');
  const baseClass = 'flex w-full flex-1 flex-col gap-2';
  const containerClass = [baseClass, className].filter(Boolean).join(' ');
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [yearOpen, setYearOpen] = useState(false);
  const years = useMemo(() => {
    const baseYear = today.year();
    const startYear = baseYear - 15;
    const endYear = baseYear + 10;
    const range: number[] = [];
    for (let y = startYear; y <= endYear; y++) {
      range.push(y);
    }
    return range;
  }, [today]);

  useEffect(() => {
    if (!onGridHeightChange) {
      return;
    }

    const updateHeight = () => {
      if (gridRef.current) {
        onGridHeightChange(gridRef.current.offsetHeight);
      }
    };

    updateHeight();

    window.addEventListener('resize', updateHeight);
    return () => {
      window.removeEventListener('resize', updateHeight);
    };
  }, [onGridHeightChange, weeks]);

  return (
    <div className={containerClass}>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <h1 className="text-2xl font-semibold text-[var(--text)]">
            {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}{' '}
            <Dropdown
              open={yearOpen}
              onOpenChange={setYearOpen}
              align="right"
              anchor={
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  aria-haspopup="listbox"
                  aria-expanded={yearOpen}
                  aria-controls="year-menu"
                  className="align-baseline text-2xl font-semibold text-[var(--text)] hover:text-[var(--text)] focus:outline-none px-1 bg-transparent border-0"
                >
                  {yearLabel}
                </Button>
              }
            >
              <div id="year-menu">
                <Listbox
                  options={years.map<ListboxOption<number>>((y) => ({ id: String(y), label: String(y), value: y }))}
                  activeIndex={-1}
                  selectedId={String(viewDate.year())}
                  onSelect={(opt) => {
                    onSelectYear?.(opt.value);
                    setYearOpen(false);
                  }}
                />
              </div>
            </Dropdown>
          </h1>
        </div>
        {/* Right-side summary */}
        <div className="text-lg font-semibold text-[var(--text)]">
          {monthlyTotalText ? (
            <div className="flex items-center gap-2">
              <span aria-label={`Monthly total`}>{monthlyTotalText}</span>
            </div>
          ) : null}
        </div>
      </header>

      <div
        ref={gridRef}
        className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
      >
        <div className="grid grid-cols-7 gap-px bg-[var(--border)] text-[9px] uppercase tracking-[0.24em] text-[var(--text)] border-b border-[var(--border)]">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="bg-[var(--surface)] px-3 py-2 text-center">
              {label}
            </div>
          ))}
        </div>

        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={monthKey}
            className="grid grid-cols-7 gap-px bg-[var(--border)] text-xs"
            initial={{ opacity: 0, filter: 'blur(6px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(6px)' }}
            transition={{ opacity: { duration: 0.28, ease: 'easeOut' }, filter: { duration: 0.28, ease: 'easeOut' } }}
            style={{ willChange: 'opacity, filter' }}
          >
            {weeks.map((week) => (
              <div key={week[0].format('YYYY-MM-DD')} className="contents">
                {week.map((date) => {
                const isCurrentMonth = date.month() === viewDate.month();
                const isToday = date.isSame(today, 'day');
                const isWeekend = date.day() === 0 || date.day() === 6;
                const isoDate = date.format('YYYY-MM-DD');
                const hasSubscriptions = isCurrentMonth && markedDates?.has(isoDate);
                const isClickable = hasSubscriptions && Boolean(onSubscriptionDateClick);

                return (
                  <div
                    key={date.format('YYYY-MM-DD')}
                    className={`relative flex min-h-[54px] flex-col bg-[var(--surface)] px-3 py-2 transition-colors ${
                      isCurrentMonth ? 'text-[var(--text)]' : 'text-[var(--text-muted)]/20'
                    } ${isWeekend && isCurrentMonth ? 'bg-[var(--surface)]' : ''} ${
                      isToday ? 'bg-[var(--today-bg)]' : ''
                    } ${isClickable ? 'cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)]' : ''}`}
                    role={isClickable ? 'button' : undefined}
                    tabIndex={isClickable ? 0 : undefined}
                    aria-label={
                      isClickable
                        ? `View subscriptions for ${date.format('D MMMM YYYY')}`
                        : undefined
                    }
                    onClick={
                      isClickable
                        ? () => {
                            onSubscriptionDateClick?.(isoDate);
                          }
                        : undefined
                    }
                    onKeyDown={
                      isClickable
                        ? (event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              onSubscriptionDateClick?.(isoDate);
                            }
                          }
                        : undefined
                    }
                  >
                    {isCurrentMonth ? (
                      <span
                        className={`text-xs font-semibold tracking-[0.18em] ${
                          isToday
                            ? 'text-[var(--text)] drop-shadow-[0_0_6px_rgba(255,255,255,0.35)]'
                            : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {date.format('D')}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold tracking-[0.18em] text-transparent">
                        {date.format('D')}
                      </span>
                    )}
                    {/* Mark dot if the date is in markedDates. Using a simple bullet to avoid style changes. */}
                    {hasSubscriptions && (
                      <span
                        className="absolute right-2 top-2 text-[var(--marker)]"
                        aria-hidden
                        style={{ fontSize: '2em', lineHeight: 1 }}
                      >
                        •
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default MonthlyCalendar;
