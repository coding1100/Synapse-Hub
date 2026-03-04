import React from 'react';
import clsx from 'clsx';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20',
        className,
      )}
      {...props}
    />
  );
}