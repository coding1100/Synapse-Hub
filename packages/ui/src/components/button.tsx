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
          ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus:ring-indigo-300 dark:bg-indigo-500 dark:hover:bg-indigo-400'
          : variant === 'secondary'
            ? 'bg-slate-900 text-white shadow-sm hover:bg-slate-800 focus:ring-slate-300 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
            : variant === 'danger'
              ? 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-300 dark:bg-rose-500 dark:hover:bg-rose-400'
              : 'border border-app-line bg-app-panel text-app-ink hover:bg-app-hover focus:ring-slate-300',
        className,
      )}
      {...props}
    />
  );
}
