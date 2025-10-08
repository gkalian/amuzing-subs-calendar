import { memo, useEffect, useMemo, useRef, useState } from 'react';
import DatePicker from './DatePicker';

type Currency = { code: string; name: string; symbol: string };
type Service = { id: string; name: string };

type SubscriptionDialogProps = {
  open: boolean;
  onClose: () => void;
  currency: Currency; // initial currency (from App)
  currencies: Currency[];
  subscriptions: Service[];
  onSave?: (payload: {
    serviceId: string;
    startDate: string; // YYYY-MM-DD
    amount: number;
    currency: string; // code
    userId?: string;
  }) => void | Promise<void>;
};

function SubscriptionDialog({
  open,
  onClose,
  currency,
  currencies,
  subscriptions,
  onSave,
}: SubscriptionDialogProps) {
  // Always use current date when dialog is opened
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [selectedSub, setSelectedSub] = useState<string>('');
  const [query, setQuery] = useState<string>(''); // acts both as search text and custom value
  const [amount, setAmount] = useState<string>('0.00');
  const [curr, setCurr] = useState<Currency>(currency);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const subMenuRef = useRef<HTMLDivElement | null>(null);
  const currMenuRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [subOpen, setSubOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [suggestOpen, setSuggestOpen] = useState<boolean>(false);
  const [currOpen, setCurrOpen] = useState<boolean>(false);

  // Reset date to current date when dialog is opened
  useEffect(() => {
    if (open) setDate(new Date().toISOString().slice(0, 10));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => setCurr(currency), [currency]);

  // Reset search text and close service dropdown when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setSubOpen(false);
      setSelectedSub('');
    }
  }, [open]);

  // Outside click to close dropdowns (services + currencies)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickInServices = subMenuRef.current?.contains(target);
      const clickInCurrencies = currMenuRef.current?.contains(target);
      if (!clickInServices) {
        setSubOpen(false);
        setSuggestOpen(false);
      }
      if (!clickInCurrencies) {
        setCurrOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [subOpen, currOpen]);

  const filteredSubscriptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subscriptions;
    return subscriptions.filter((s) => s.name.toLowerCase().includes(q));
  }, [subscriptions, query]);

  // Initialize highlighted index and focus search on open
  useEffect(() => {
    if (!subOpen) return;
    const idx = subscriptions.findIndex((s) => s.id === selectedSub);
    setHighlightedIndex(idx >= 0 ? idx : subscriptions.length > 0 ? 0 : -1);
    setTimeout(() => searchRef.current?.focus(), 0);
  }, [subOpen, subscriptions, selectedSub]);

  function slugify(input: string): string {
    return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-overlay flex items-center justify-center">
      {/* overlay */}
      <div className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-sm" />

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
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {/* Date picker */}
          <DatePicker value={date} onChange={setDate} label="Start date" />

          {/* Service input + dropdown button */}
          <div className="flex flex-col gap-1 text-sm" ref={subMenuRef}>
            <span className="text-[var(--text-muted)]">Service</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedSub('');
                  setSuggestOpen(true);
                }}
                placeholder="Type a service or search..."
                className="flex-1 input"
                ref={searchRef}
                aria-autocomplete="list"
                aria-controls="service-menu"
                aria-expanded={subOpen}
                onFocus={() => setSuggestOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightedIndex((i) => {
                      const next = i < filteredSubscriptions.length - 1 ? i + 1 : 0;
                      return filteredSubscriptions.length ? next : -1;
                    });
                  } else if (e.key === 'Enter' && filteredSubscriptions.length > 0 && highlightedIndex >= 0) {
                    e.preventDefault();
                    const item = filteredSubscriptions[highlightedIndex];
                    if (item) {
                      setSelectedSub(item.id);
                      setQuery(item.name);
                      setSuggestOpen(false);
                    }
                  } else if (e.key === 'Escape') {
                    setSuggestOpen(false);
                  }
                }}
              />
              <button
                type="button"
                aria-label="Open services list"
                className="btn"
                aria-haspopup="listbox"
                aria-expanded={subOpen}
                aria-controls="service-menu"
                onClick={() => setSubOpen((v) => !v)}
              >
                ▾
              </button>
            </div>
            {/* Live suggestions under input (filtered list) */}
            {query.trim() && filteredSubscriptions.length > 0 && suggestOpen && (
              <div className="relative">
                <div className="absolute z-popover mt-2 w-full max-h-64 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-popover">
                  <div className="flex flex-col">
                    {filteredSubscriptions.map((s, idx) => (
                      <button
                        key={`suggest-${s.id}`}
                        type="button"
                        role="option"
                        id={`suggest-option-${s.id}`}
                        aria-selected={s.id === selectedSub}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                          s.id === selectedSub
                            ? 'bg-[var(--active)] text-[var(--text)]'
                            : highlightedIndex >= 0 && idx === highlightedIndex
                              ? 'text-[var(--text)] bg-[var(--hover)]'
                              : 'text-[var(--text)] hover:bg-[var(--hover)]'
                        }`}
                        onClick={() => {
                          setSelectedSub(s.id);
                          setQuery(s.name);
                          setSuggestOpen(false);
                        }}
                      >
                        <span>{s.name}</span>
                        {s.id === selectedSub && (
                          <span className="text-[var(--text-muted)]">•</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Dropdown with full list (unfiltered), toggled by button */}
            {subOpen && (
              <div className="relative">
                <div
                  id="service-menu"
                  role="listbox"
                  aria-label="Select service"
                  aria-activedescendant={
                    highlightedIndex >= 0 && subscriptions[highlightedIndex]
                      ? `service-option-${subscriptions[highlightedIndex].id}`
                      : undefined
                  }
                  className="absolute z-popover mt-2 w-full max-h-64 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-popover"
                  tabIndex={-1}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setHighlightedIndex((i) => {
                        const next = i < subscriptions.length - 1 ? i + 1 : 0;
                        return subscriptions.length ? next : -1;
                      });
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setHighlightedIndex((i) => {
                        const next = i > 0 ? i - 1 : subscriptions.length - 1;
                        return subscriptions.length ? next : -1;
                      });
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      const item = subscriptions[highlightedIndex];
                      if (item) {
                        setSelectedSub(item.id);
                        setQuery(item.name);
                        setSubOpen(false);
                      }
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      setSubOpen(false);
                    }
                  }}
                >
                  <div className="flex flex-col">
                    {subscriptions.map((s, idx) => (
                      <button
                        key={s.id}
                        type="button"
                        role="option"
                        id={`service-option-${s.id}`}
                        aria-selected={s.id === selectedSub}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                          s.id === selectedSub
                            ? 'bg-[var(--active)] text-[var(--text)]'
                            : highlightedIndex >= 0 && idx === highlightedIndex
                              ? 'text-[var(--text)] bg-[var(--hover)]'
                              : 'text-[var(--text)] hover:bg-[var(--hover)]'
                        }`}
                        onClick={() => {
                          setSelectedSub(s.id);
                          setQuery(s.name);
                          setSubOpen(false);
                        }}
                      >
                        <span>{s.name}</span>
                        {s.id === selectedSub && (
                          <span className="text-[var(--text-muted)]">•</span>
                        )}
                      </button>
                    ))}
                    {subscriptions.length === 0 && (
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
              <div className="relative" ref={currMenuRef}>
                <button
                  type="button"
                  onClick={() => setCurrOpen((v) => !v)}
                  className="input flex items-center gap-2"
                  aria-haspopup="listbox"
                  aria-expanded={currOpen}
                  aria-controls="currency-menu-dialog"
                >
                  <span className="text-base">{curr.symbol}</span>
                  <span className="text-xs text-[var(--text-muted)]">{curr.name}</span>
                  <span className="ml-auto opacity-60">▾</span>
                </button>
                {currOpen && (
                  <div
                    id="currency-menu-dialog"
                    role="listbox"
                    aria-label="Select currency"
                    className="absolute right-0 mt-2 max-h-64 w-56 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-lg backdrop-blur z-50"
                  >
                    {currencies.map((c) => {
                      const isActive = c.code === curr.code;
                      return (
                        <button
                          key={c.code}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                            isActive
                              ? 'bg-[var(--active)] text-[var(--text)]'
                              : 'text-[var(--text)] hover:bg-[var(--hover)]'
                          }`}
                          onClick={() => {
                            setCurr(c);
                            setCurrOpen(false);
                          }}
                        >
                          <span className="text-lg">{c.symbol}</span>
                          <span className="text-[var(--text-muted)] text-sm">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={async () => {
              const userText = query.trim();
              const payload = {
                serviceId: selectedSub || (userText ? `custom-${slugify(userText)}` : 'custom'),
                startDate: date,
                amount: Number.parseFloat(amount || '0') || 0,
                currency: curr.code,
              };
              try {
                await onSave?.(payload);
              } finally {
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
