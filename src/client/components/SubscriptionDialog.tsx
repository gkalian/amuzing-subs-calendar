import { memo, useEffect, useMemo, useRef, useState } from 'react';
import DatePicker from './DatePicker';
import currencies from '../data/currencies.json';
import subscriptions from '../data/subscriptions.json';

export type Currency = {
  code: string;
  name: string;
  symbol: string;
};

type Subscription = {
  id: string;
  name: string;
};

type SubscriptionDialogProps = {
  open: boolean;
  onClose: () => void;
  currency: Currency; // initial currency (from App)
  onSave?: (payload: {
    serviceId: string;
    startDate: string; // YYYY-MM-DD
    amount: number;
    currency: string; // code
    userId?: string;
  }) => void | Promise<void>;
};

function SubscriptionDialog({ open, onClose, currency, onSave }: SubscriptionDialogProps) {
  const allCurrencies = currencies as Currency[];
  const allSubscriptions = subscriptions as Subscription[];

  // Always use current date when dialog is opened
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  
  // Reset date to current date when dialog is opened
  useEffect(() => {
    if (open) {
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [open]);
  const [selectedSub, setSelectedSub] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [amount, setAmount] = useState<string>('0.00');
  const [curr, setCurr] = useState<Currency>(currency);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const subMenuRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [subOpen, setSubOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    setCurr(currency);
  }, [currency]);

  // Reset search text and close service dropdown when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setSubOpen(false);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!modalRef.current) return;
      if (!modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  const symbolsByCode = useMemo(() => {
    const map = new Map<string, string>();
    allCurrencies.forEach((c) => map.set(c.code, c.symbol));
    return map;
  }, [allCurrencies]);

  const filteredSubscriptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allSubscriptions;
    return allSubscriptions.filter((s) => s.name.toLowerCase().includes(q));
  }, [allSubscriptions, query]);

  // Close service dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!subMenuRef.current) return;
      if (!subMenuRef.current.contains(e.target as Node)) {
        setSubOpen(false);
      }
    };
    if (subOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [subOpen]);

  // Initialize highlighted index and focus search on open
  useEffect(() => {
    if (!subOpen) return;
    const idx = filteredSubscriptions.findIndex((s) => s.id === selectedSub);
    setHighlightedIndex(idx >= 0 ? idx : filteredSubscriptions.length > 0 ? 0 : -1);
    // focus search input after open
    setTimeout(() => searchRef.current?.focus(), 0);
  }, [subOpen, filteredSubscriptions, selectedSub]);

  // Focus trap within modal
  useEffect(() => {
    const modal = modalRef.current;
    if (!open || !modal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusables = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !modal.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          (first as HTMLElement).focus();
        }
      }
    };
    modal.addEventListener('keydown', onKeyDown);
    return () => modal.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-overlay flex items-center justify-center">
      {/* overlay */}
      <div className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-sm" />

      {/* modal */}
      <div
        ref={modalRef}
        className="relative z-modal w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-[var(--text)] shadow-modal"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">New subscription</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-[var(--text-muted)] hover:bg-[var(--hover)]"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Date picker */}
          <DatePicker value={date} onChange={setDate} label="Start date" />

          {/* Subscription searchable dropdown */}
          <div className="flex flex-col gap-1 text-sm" ref={subMenuRef}>
            <span className="text-[var(--text-muted)]">Service</span>
            <button
              type="button"
              onClick={() => setSubOpen((v) => !v)}
              className="btn w-full justify-between text-left"
              aria-haspopup="listbox"
              aria-expanded={subOpen}
              aria-controls="service-menu"
            >
              <span>
                {selectedSub
                  ? allSubscriptions.find((s) => s.id === selectedSub)?.name || 'Select a service'
                  : 'Select a service'}
              </span>
              <span className="opacity-60">▾</span>
            </button>
            {subOpen && (
              <div className="relative">
                <div
                  id="service-menu"
                  role="listbox"
                  aria-label="Select service"
                  aria-activedescendant={
                    highlightedIndex >= 0
                      ? `service-option-${filteredSubscriptions[highlightedIndex]?.id}`
                      : undefined
                  }
                  className="absolute z-popover mt-2 w-full max-h-64 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-popover"
                  tabIndex={-1}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setHighlightedIndex((i) => {
                        const next = i < filteredSubscriptions.length - 1 ? i + 1 : 0;
                        return filteredSubscriptions.length ? next : -1;
                      });
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setHighlightedIndex((i) => {
                        const next = i > 0 ? i - 1 : filteredSubscriptions.length - 1;
                        return filteredSubscriptions.length ? next : -1;
                      });
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      const item = filteredSubscriptions[highlightedIndex];
                      if (item) {
                        setSelectedSub(item.id);
                        setSubOpen(false);
                      }
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      setSubOpen(false);
                    }
                  }}
                >
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search services..."
                    className="mb-2 w-full input"
                    ref={searchRef}
                    aria-autocomplete="list"
                    aria-controls="service-menu"
                    aria-expanded={subOpen}
                  />
                  <div className="flex flex-col">
                    {filteredSubscriptions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        role="option"
                        id={`service-option-${s.id}`}
                        aria-selected={s.id === selectedSub}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                          s.id === selectedSub
                            ? 'bg-[var(--active)] text-[var(--text)]'
                            : highlightedIndex >= 0 &&
                                filteredSubscriptions[highlightedIndex]?.id === s.id
                              ? 'text-[var(--text)] bg-[var(--hover)]'
                              : 'text-[var(--text)] hover:bg-[var(--hover)]'
                        }`}
                        onClick={() => {
                          setSelectedSub(s.id);
                          setSubOpen(false);
                        }}
                      >
                        <span>{s.name}</span>
                        {s.id === selectedSub && (
                          <span className="text-[var(--text-muted)]">•</span>
                        )}
                      </button>
                    ))}
                    {filteredSubscriptions.length === 0 && (
                      <div className="px-3 py-2 text-xs text-[var(--text-muted)]/70">
                        No results
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Amount input */}
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--text-muted)]">Amount</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 input"
              />
              <div className="relative">
                <select
                  value={curr.code}
                  onChange={(e) => {
                    const c = allCurrencies.find((x) => x.code === e.target.value) || curr;
                    setCurr(c);
                  }}
                  className="input"
                >
                  {allCurrencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={async () => {
              const payload = {
                serviceId: selectedSub || 'custom',
                startDate: date,
                amount: Number.parseFloat(amount || '0') || 0,
                currency: curr.code,
              };
              try {
                await onSave?.(payload);
              } finally {
                // Close is handled by parent after save; keep fallback close to be safe if no onSave
                if (!onSave) onClose();
              }
            }}
            className="btn-primary"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(SubscriptionDialog);
