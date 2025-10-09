import React, { useEffect } from 'react';
import Button from './Button';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  zIndexBase?: number; // base z-index for overlay (content will be base+1)
};

export default function Modal({ open, onClose, children, className, title, zIndexBase = 60 }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: zIndexBase }}>
      <div className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-sm" onClick={onClose} />
      <div
        className={[
          'relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-[var(--text)] shadow-modal',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ zIndex: zIndexBase + 1 }}
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
      </div>
    </div>
  );
}
