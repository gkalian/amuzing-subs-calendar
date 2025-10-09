import React from 'react';
import Label from './Label';

type FormFieldProps = {
  id?: string;
  label?: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export default function FormField({
  id,
  label,
  required,
  hint,
  error,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={['flex flex-col gap-1 text-sm', className].filter(Boolean).join(' ')}>
      {label && (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      )}
      {children}
      {hint && !error && <div className="text-xs text-[var(--text-muted)]">{hint}</div>}
      {error && <div className="text-xs text-red-500">{error}</div>}
    </div>
  );
}
