import { memo, useEffect, useRef, useState } from 'react';
import Dropdown from './forms/Dropdown';
import Listbox, { type ListboxOption } from './forms/Listbox';
import Button from './forms/Button';

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

  const options: ListboxOption<Currency>[] = currencies.map((c) => ({
    id: c.code,
    label: `${c.symbol} ${c.name}`,
    value: c,
  }));

  return (
    <div className="flex items-center justify-end">
      <div className="relative" ref={menuRef}>
        <Dropdown
          open={open}
          onOpenChange={setOpen}
          align="right"
          anchor={
            <Button
              type="button"
              size="md"
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-controls="currency-menu"
              className="bg-[var(--surface)]"
            >
              <span className="text-sm align-middle">{selected.symbol}</span>
            </Button>
          }
        >
          <div id="currency-menu" aria-label="Select currency">
            <Listbox
              options={options}
              activeIndex={-1}
              selectedId={selected.code}
              onSelect={(opt) => {
                onChange(opt.value);
                setOpen(false);
              }}
            />
          </div>
        </Dropdown>
      </div>

      <Button type="button" size="md" onClick={onNewSub} className="ml-3 bg-[var(--surface)]">
        New sub
      </Button>
    </div>
  );
}

export default memo(ActionPanel);
