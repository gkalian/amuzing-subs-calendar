import { memo } from 'react';
import Button from './forms/Button';

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
            <Button
              key={month}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onSelectMonth(index)}
              className={`w-10 text-[11px] font-semibold uppercase tracking-[0.28em] transition bg-transparent hover:bg-transparent border-transparent ${
                isActive ? 'text-[var(--text)]' : 'text-slate-400 hover:text-[var(--text)]'
              }`}
              style={{ height: `${rowHeight}px` }}
            >
              {month}
            </Button>
          );
        })}
      </div>
    </aside>
  );
}

export default memo(MonthList);
