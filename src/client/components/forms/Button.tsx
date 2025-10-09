import React from 'react';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
};

const base =
  'inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] transition hover:bg-[var(--hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]';
const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-2 text-xs',
  md: 'h-9 px-3 text-sm',
  lg: 'h-10 px-4 text-base',
};
// All variants share the same visual style per design request
const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: '',
  ghost: '',
  danger: '',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', iconOnly, className, children, ...rest },
  ref,
) {
  const sizeCls = sizes[size];
  const cls = [base, variants[variant], sizeCls, className].filter(Boolean).join(' ');
  return (
    <button ref={ref} className={cls} {...rest}>
      {children}
    </button>
  );
});

export default Button;
