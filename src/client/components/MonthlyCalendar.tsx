import { useEffect, useMemo, useRef, useState } from 'react';
import { Dayjs } from 'dayjs';

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
};

function MonthlyCalendar({
  viewDate,
  today,
  onPrevMonth,
  onNextMonth,
  className,
  onGridHeightChange,
  onSelectYear,
  currencySymbol,
  markedDates,
  monthlyTotalText,
}: MonthlyCalendarProps) {
  const weeks = useMemo(() => getCalendarMatrix(viewDate), [viewDate]);
  const monthLabel = viewDate.format('MMMM');
  const yearLabel = viewDate.format('YYYY');
  const baseClass = 'flex w-full flex-1 flex-col gap-2';
  const containerClass = [baseClass, className].filter(Boolean).join(' ');
  const gridRef = useRef<HTMLDivElement | null>(null);
  const yearRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const activeYearBtnRef = useRef<HTMLButtonElement | null>(null);
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

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!yearRef.current) return;
      if (!yearRef.current.contains(e.target as Node)) {
        setYearOpen(false);
      }
    };
    if (yearOpen) {
      document.addEventListener('mousedown', onDocClick);
    }
    return () => {
      document.removeEventListener('mousedown', onDocClick);
    };
  }, [yearOpen]);

  // When dropdown opens, scroll to the active year (without visual focus)
  useEffect(() => {
    if (yearOpen) {
      // Delay to ensure elements are in the DOM
      setTimeout(() => {
        if (activeYearBtnRef.current) {
          activeYearBtnRef.current.scrollIntoView({ block: 'nearest' });
        } else if (dropdownRef.current) {
          dropdownRef.current.scrollTop = 0;
        }
      }, 0);
    }
  }, [yearOpen]);

  return (
    <div className={containerClass}>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative" ref={yearRef}>
          <h1 className="text-2xl font-semibold text-[var(--text)]">
            {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}{' '}
            <button
              type="button"
              onClick={() => setYearOpen((v) => !v)}
              className="align-baseline text-[var(--text-muted)] hover:text-[var(--text)] focus:outline-none"
            >
              {yearLabel}
            </button>
          </h1>
          {yearOpen && (
            <div
              ref={dropdownRef}
              className="absolute left-0 mt-2 max-h-64 w-40 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-lg backdrop-blur z-50"
            >
              {years.map((y) => {
                const isActive = y === viewDate.year();
                return (
                  <button
                    key={y}
                    type="button"
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                      isActive
                        ? 'bg-[var(--active)] text-[var(--text)]'
                        : 'text-[var(--text)] hover:bg-[var(--hover)]'
                    }`}
                    onClick={() => {
                      onSelectYear?.(y);
                      setYearOpen(false);
                    }}
                  >
                    <span>{y}</span>
                    {isActive && <span className="text-[var(--text-muted)]">•</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {/* Right-side summary */}
        <div className="text-sm font-medium text-[var(--text-muted)]">
          {monthlyTotalText ?? `0.00 ${currencySymbol ?? ''}`}
        </div>
      </header>

      <div
        ref={gridRef}
        className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]"
      >
        <div className="grid grid-cols-7 gap-px bg-[var(--hover)] text-[9px] uppercase tracking-[0.24em] text-[var(--text-muted)] border-b border-[var(--surface-2)]">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="bg-[var(--weekday-bg)] px-3 py-2 text-center">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-[var(--surface-2)] text-xs">
          {weeks.map((week) => (
            <div key={week[0].toISOString()} className="contents">
              {week.map((date) => {
                const isCurrentMonth = date.month() === viewDate.month();
                const isToday = date.isSame(today, 'day');
                const isWeekend = date.day() === 0 || date.day() === 6;
                const isoDate = date.format('YYYY-MM-DD');

                return (
                  <div
                    key={date.toISOString()}
                    className={`relative flex min-h-[54px] flex-col bg-[var(--surface)] px-3 py-2 transition-colors ${
                      isCurrentMonth ? 'text-[var(--text)]' : 'text-[var(--text-muted)]/20'
                    } ${isWeekend && isCurrentMonth ? 'bg-[var(--surface)]' : ''} ${
                      isToday ? 'bg-[var(--today-bg)]' : ''
                    }`}
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
                    {isCurrentMonth && markedDates?.has(isoDate) && (
                      <span
                        className="absolute right-2 top-2"
                        aria-hidden
                        style={{ color: '#ef4444', fontSize: '2em', lineHeight: 1 }}
                      >
                        •
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MonthlyCalendar;
