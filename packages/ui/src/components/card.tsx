import React from 'react';
import clsx from 'clsx';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-[22px] border border-slate-200 bg-white shadow-[0_10px_26px_rgba(15,23,42,0.06)]',
        className,
      )}
      {...props}
    />
  );
}
