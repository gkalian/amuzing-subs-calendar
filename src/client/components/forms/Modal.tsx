import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Button from './Button';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  zIndexBase?: number; // base z-index for overlay (content will be base+1)
};

export default function Modal({
  open,
  onClose,
  children,
  className,
  title,
  zIndexBase = 60,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: zIndexBase }}>
          <motion.div
            className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          />
          <motion.div
            className={[
              'relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-[var(--text)] shadow-modal',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ zIndex: zIndexBase + 1, transformOrigin: 'center' }}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {(title || title === 0) && (
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{title}</h2>
                <Button type="button" size="md" onClick={onClose} aria-label="Close">
                  ✕
                </Button>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
