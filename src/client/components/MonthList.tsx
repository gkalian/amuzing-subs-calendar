import { memo } from 'react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type MonthListProps = {
  activeMonth: number;
  onSelectMonth: (monthIndex: number) => void;
  className?: string;
  calendarHeight?: number;
};

function MonthList({ activeMonth, onSelectMonth, className, calendarHeight }: MonthListProps) {
  const baseClass = 'flex flex-col items-end flex-shrink-0 w-[50px]';
  const containerClass = [baseClass, className].filter(Boolean).join(' ');
  const rowHeight = calendarHeight ? Math.max(calendarHeight / 13 - 2, 20) : 24;

  return (
    <aside className={containerClass}>
      <div className="flex flex-col items-end gap-1">
        {MONTHS.map((month, index) => {
          const isActive = index === activeMonth;

          return (
            <button
              key={month}
              type="button"
              onClick={() => onSelectMonth(index)}
              className={`flex w-10 items-center justify-center text-[11px] font-semibold uppercase tracking-[0.28em] transition ${
                isActive ? 'text-[var(--text)]' : 'text-slate-400 hover:text-[var(--text)]'
              }`}
              style={{ height: `${rowHeight}px` }}
            >
              {month}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export default memo(MonthList);
