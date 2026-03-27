'use client';

import { useEffect, useState } from 'react';
import { Moon, SunMedium } from 'lucide-react';

export function ThemeToggle({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem('synapsehub-theme', nextTheme);
    setTheme(nextTheme);
  };

  if (!mounted) {
    return (
      <span
        className={compact ? 'inline-flex h-10 w-10 rounded-xl border border-app-line/80' : 'inline-flex h-11 w-11 rounded-xl border border-app-line/80'}
        aria-hidden
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`app-control inline-flex items-center justify-center text-app-muted ${
        compact ? 'h-10 w-10' : 'h-11 w-11'
      }`}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      {theme === 'dark' ? <SunMedium size={16} /> : <Moon size={16} />}
    </button>
  );
}
