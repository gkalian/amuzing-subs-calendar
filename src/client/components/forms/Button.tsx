import React from 'react';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
};

const base =
  'inline-flex items-center justify-center rounded-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]';
const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-2',
  md: 'h-9 px-3',
  lg: 'h-10 px-4',
};
const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-[var(--active)] text-[var(--text)] hover:bg-[var(--hover)]',
  ghost: 'bg-transparent text-[var(--text)] hover:bg-[var(--hover)]',
  danger: 'bg-red-600 text-white hover:bg-red-500',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', iconOnly, className, children, ...rest },
  ref,
) {
  const sizeCls = iconOnly ? sizes[size].replace(/px-\d+/, 'px-2') : sizes[size];
  const cls = [base, variants[variant], sizeCls, className].filter(Boolean).join(' ');
  return (
    <button ref={ref} className={cls} {...rest}>
      {children}
    </button>
  );
});

export default Button;
