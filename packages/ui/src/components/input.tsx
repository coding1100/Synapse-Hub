import React from 'react';
import clsx from 'clsx';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        'w-full rounded-xl border border-app-line bg-app-soft px-3 py-2.5 text-sm text-app-ink shadow-sm outline-none transition placeholder:text-app-muted focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/50',
        className,
      )}
      {...props}
    />
  );
}
