import React from 'react';
import clsx from 'clsx';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'accent' | 'ocean' | 'success' | 'warning';
};

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        tone === 'accent' && 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/25 dark:text-indigo-200',
        tone === 'ocean' && 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200',
        tone === 'success' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
        tone === 'warning' && 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
        tone === 'neutral' && 'bg-app-soft text-app-muted',
        className,
      )}
      {...props}
    />
  );
}
