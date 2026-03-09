import React from 'react';
import clsx from 'clsx';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'secondary' | 'danger';
};

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary'
          ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:ring-blue-300'
          : variant === 'secondary'
            ? 'bg-slate-900 text-white shadow-sm hover:bg-slate-800 focus:ring-slate-300'
            : variant === 'danger'
              ? 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-300'
              : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-300',
        className,
      )}
      {...props}
    />
  );
}
