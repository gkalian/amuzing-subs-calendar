import React, { useEffect, useRef } from 'react';

export type ListboxOption<T = any> = {
  id: string;
  label: string;
  value: T;
};

export type ListboxProps<T = any> = {
  options: ListboxOption<T>[];
  activeIndex: number;
  selectedId?: string;
  onSelect: (opt: ListboxOption<T>, index: number) => void;
};

export default function Listbox<T>({
  options,
  activeIndex,
  selectedId,
  onSelect,
}: ListboxProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !selectedId) return;
    const el = containerRef.current.querySelector<HTMLElement>(`#${CSS.escape(selectedId)}`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedId]);

  return (
    <div
      ref={containerRef}
      role="listbox"
      aria-activedescendant={activeIndex >= 0 ? options[activeIndex]?.id : undefined}
    >
      {options.map((o, idx) => (
        <button
          key={o.id}
          type="button"
          role="option"
          id={o.id}
          aria-selected={o.id === selectedId}
          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-normal transition ${
            o.id === selectedId
              ? 'bg-[var(--active)] text-[var(--text)]'
              : activeIndex === idx
                ? 'text-[var(--text)] bg-[var(--hover)]'
                : 'text-[var(--text)] hover:bg-[var(--hover)]'
          }`}
          onClick={() => onSelect(o, idx)}
        >
          <span>{o.label}</span>
          {o.id === selectedId && <span className="text-[var(--text-muted)]">•</span>}
        </button>
      ))}
    </div>
  );
}
