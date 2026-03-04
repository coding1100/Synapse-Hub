import React from 'react';
import clsx from 'clsx';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
};

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2',
        variant === 'primary'
          ? 'bg-accent text-white hover:bg-accentDeep focus:ring-accent'
          : 'bg-white text-slate-700 hover:bg-slate-100 focus:ring-slate-400',
        className,
      )}
      {...props}
    />
  );
}