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
        tone === 'accent' && 'bg-accent/15 text-accentDeep',
        tone === 'ocean' && 'bg-ocean/15 text-ocean',
        tone === 'success' && 'bg-emerald-100 text-emerald-700',
        tone === 'warning' && 'bg-amber-100 text-amber-700',
        tone === 'neutral' && 'bg-slate-100 text-slate-600',
        className,
      )}
      {...props}
    />
  );
}
