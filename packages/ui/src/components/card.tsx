import React from 'react';
import clsx from 'clsx';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-app-line bg-app-panel shadow-[0_10px_28px_rgba(15,23,42,0.05)] dark:shadow-[0_12px_30px_rgba(2,8,23,0.45)]',
        className,
      )}
      {...props}
    />
  );
}
