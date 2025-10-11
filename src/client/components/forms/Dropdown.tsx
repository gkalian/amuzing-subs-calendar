import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import useOutsideClick from '../../hooks/useOutsideClick';

export type DropdownProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchor: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
};

export default function Dropdown({
  open,
  onOpenChange,
  anchor,
  children,
  className,
  align = 'left',
}: DropdownProps) {
  const ref = useOutsideClick<HTMLDivElement>(open, () => onOpenChange(false));

  return (
    <div className="relative inline-block align-baseline" ref={ref}>
      <div className="inline-flex align-baseline" onClick={() => onOpenChange(!open)}>
        {anchor}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            className={[
              'absolute mt-1 max-h-64 w-56 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-lg backdrop-blur z-50 font-normal',
              align === 'right' ? 'right-0' : 'left-0',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ transformOrigin: align === 'right' ? 'top right' : 'top left' }}
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
