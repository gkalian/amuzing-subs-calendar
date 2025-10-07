import { useEffect, useMemo, useRef } from 'react';
import dayjs from 'dayjs';

type SubscriptionListItem = {
  id: string;
  name: string;
  amountText: string;
};

type SubscriptionListProps = {
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  date?: string; // YYYY-MM-DD
  items: SubscriptionListItem[];
};

function SubscriptionList({ open, onClose, onEdit, date, items }: SubscriptionListProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!dialogRef.current) {
        return;
      }

      if (!dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open, onClose]);

  const formattedDate = useMemo(() => {
    if (!date) {
      return '';
    }

    return dayjs(date).format('D MMMM YYYY');
  }, [date]);

  if (!open) {
    return null;
  }

  const containerStyle = items.length <= 1 ? { minWidth: 500, minHeight: 700 } : { minWidth: 500 };

  return (
    <div className="fixed inset-0 z-overlay flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" aria-hidden />
      <div
        ref={dialogRef}
        className="relative z-modal max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-[var(--text)] shadow-modal"
        style={containerStyle}
        role="dialog"
        aria-modal="true"
        aria-label={formattedDate ? `Subscriptions for ${formattedDate}` : 'Subscriptions'}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {formattedDate}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-md px-2 py-1 text-[var(--text-muted)] transition hover:bg-[var(--hover)]"
            >
              ✎
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2 py-1 text-[var(--text-muted)] transition hover:bg-[var(--hover)]"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {items.length === 0 && (
            <div className="text-sm text-[var(--text-muted)]">No subscriptions found for this date.</div>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-[var(--surface-2)] px-3 py-2"
            >
              <div className="flex items-center gap-2 text-sm">
                <span className="text-lg" aria-hidden>
                  •
                </span>
                <span>{item.name}</span>
              </div>
              <span className="text-sm font-medium">{item.amountText}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export type { SubscriptionListItem, SubscriptionListProps };
export default SubscriptionList;
