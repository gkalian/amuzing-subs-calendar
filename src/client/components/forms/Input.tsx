import React from 'react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
};

const base = 'input w-full';

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { leftIcon, rightIcon, error, className, ...rest },
  ref,
) {
  return (
    <div className="relative">
      {leftIcon && (
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        className={[base, leftIcon ? 'pl-7' : '', rightIcon ? 'pr-8' : '', className]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />
      {rightIcon && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
          {rightIcon}
        </span>
      )}
      {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
    </div>
  );
});

export default Input;
