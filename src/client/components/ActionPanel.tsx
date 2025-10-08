import { memo, useEffect, useRef, useState } from 'react';

type Currency = { code: string; name: string; symbol: string };

type ActionPanelProps = {
  selected: Currency;
  currencies: Currency[];
  onChange: (c: Currency) => void;
  onNewSub?: () => void;
};

function ActionPanel({ selected, currencies, onChange, onNewSub }: ActionPanelProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <div className="flex items-center justify-end">
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="btn"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls="currency-menu"
        >
          <span className="text-sm align-middle">{selected.symbol}</span>
        </button>
        {open && (
          <div
            id="currency-menu"
            role="listbox"
            aria-label="Select currency"
            className="absolute right-0 mt-2 max-h-64 w-56 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-lg backdrop-blur z-50"
          >
            {currencies.map((c) => {
              const isActive = c.code === selected.code;
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
                    onChange(c);
                    setOpen(false);
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

      <button type="button" onClick={onNewSub} className="ml-3 btn">
        New sub
      </button>
    </div>
  );
}

export default memo(ActionPanel);
