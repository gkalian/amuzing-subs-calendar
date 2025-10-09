import React from 'react';

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

export default function Label({ required, className, children, ...rest }: LabelProps) {
  return (
    <label
      className={['text-sm text-[var(--text-muted)]', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}
