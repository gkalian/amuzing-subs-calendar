import { useCallback, useState } from 'react';

export type ListNavigationOptions = {
  itemCount: number;
  initialIndex?: number;
  loop?: boolean;
  onEnter?: (index: number) => void;
  onEscape?: () => void;
};

export default function useListNavigation({
  itemCount,
  initialIndex = -1,
  loop = true,
  onEnter,
  onEscape,
}: ListNavigationOptions) {
  const [activeIndex, setActiveIndex] = useState<number>(initialIndex);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => {
          if (itemCount <= 0) return -1;
          const next = i < itemCount - 1 ? i + 1 : loop ? 0 : itemCount - 1;
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => {
          if (itemCount <= 0) return -1;
          const next = i > 0 ? i - 1 : loop ? itemCount - 1 : 0;
          return next;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < itemCount) onEnter?.(activeIndex);
      } else if (e.key === 'Escape') {
        onEscape?.();
      }
    },
    [activeIndex, itemCount, loop, onEnter, onEscape],
  );

  return { activeIndex, setActiveIndex, onKeyDown };
}
