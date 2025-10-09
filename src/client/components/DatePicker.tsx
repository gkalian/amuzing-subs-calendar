import { useMemo, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import dayjs from 'dayjs';
import useOutsideClick from '../hooks/useOutsideClick';
import Button from './forms/Button';

export type DatePickerProps = {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
};

export default function DatePicker({ value, onChange, label = 'Start date' }: DatePickerProps) {
  // Use default dayjs locale (English) for month names/format
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => {
    const d = dayjs(value, 'YYYY-MM-DD', true);
    return d.isValid() ? d.toDate() : undefined;
  }, [value]);

  const popoverRef = useOutsideClick<HTMLDivElement>(open, () => setOpen(false));

  return (
    <label className="flex flex-col gap-1 text-sm relative">
      <span className="text-[var(--text-muted)]">{label}</span>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-left text-[var(--text)] outline-none hover:bg-[var(--hover)] focus:ring-1 focus:ring-[var(--ring)]"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span>{selected ? dayjs(selected).format('D MMM YYYY') : 'Select date'}</span>
        <span className="opacity-70">▾</span>
      </Button>
      {open && (
        <div
          ref={popoverRef}
          className="absolute z-popover mt-2 w-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-popover"
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(d) => {
              if (d) {
                onChange(dayjs(d).format('YYYY-MM-DD'));
                setOpen(false);
              }
            }}
            defaultMonth={selected}
            weekStartsOn={1}
            className="rdp-theme"
          />
        </div>
      )}
    </label>
  );
}
