import React, { useMemo, useState } from 'react';
import useOutsideClick from '../../hooks/useOutsideClick';
import Listbox, { ListboxOption } from './Listbox';
import Input from './Input';

export type AutocompleteProps<T = any> = {
  value: string;
  onChange: (v: string) => void;
  options: ListboxOption<T>[];
  onSelect: (opt: ListboxOption<T>) => void;
  placeholder?: string;
};

export default function Autocomplete<T>({
  value,
  onChange,
  options,
  onSelect,
  placeholder,
}: AutocompleteProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClick<HTMLDivElement>(open, () => setOpen(false));

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, value]);

  return (
    <div className="relative" ref={ref}>
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-popover mt-2 w-full max-h-64 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-popover">
          <Listbox
            options={filtered}
            activeIndex={-1}
            selectedId={undefined}
            onSelect={(opt) => {
              onSelect(opt);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
