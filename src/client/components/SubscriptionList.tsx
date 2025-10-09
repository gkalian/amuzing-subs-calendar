import { useMemo } from 'react';
import Modal from './forms/Modal';
import dayjs from 'dayjs';

type SubscriptionListItem = {
  id: string;
  name: string;
  amountText: string;
};

type SubscriptionListProps = {
  open: boolean;
  onClose: () => void;
  onEdit?: (id: string) => void;
  date?: string; // YYYY-MM-DD
  items: SubscriptionListItem[];
};

function SubscriptionList({ open, onClose, onEdit, date, items }: SubscriptionListProps) {
  const formattedDate = useMemo(() => {
    if (!date) {
      return '';
    }

    return dayjs(date).format('D MMMM YYYY');
  }, [date]);

  return (
    <Modal open={open} onClose={onClose} title={formattedDate || 'Subscriptions'}>
      <div className="flex flex-col gap-3 overflow-auto w-full max-h-[400px] min-w-0">
        {items.length === 0 && (
          <div className="text-sm text-[var(--text-muted)]">
            No subscriptions found for this date.
          </div>
        )}
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-2 w-full min-w-0">
            <div
              className="flex items-center justify-between gap-3 rounded-lg bg-[var(--surface-2)] px-3 py-2 min-w-0"
              style={{ width: 'calc(100% - 20px)' }}
            >
              <div className="flex items-center gap-2 text-sm min-w-0">
                <span className="text-lg" aria-hidden>
                  •
                </span>
                <span className="truncate" title={item.name}>{item.name}</span>
              </div>
              <span className="text-sm font-medium shrink-0">{item.amountText}</span>
            </div>
            <button
              type="button"
              onClick={() => onEdit?.(item.id)}
              className="rounded-md p-1 text-[var(--text-muted)] transition hover:bg-[var(--hover)] shrink-0"
              aria-label={`Edit ${item.name}`}
            >
              ✎
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export type { SubscriptionListItem, SubscriptionListProps };
export default SubscriptionList;
