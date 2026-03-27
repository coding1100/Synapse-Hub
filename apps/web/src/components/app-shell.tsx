'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bell, Building2, Search, Settings2, UserCircle2 } from 'lucide-react';
import { Sidebar } from './sidebar';
import { NotificationPanel } from './notification-panel';
import { UserProfileModal } from './user-profile-modal';
import { ThemeToggle } from './theme-toggle';
import { useAuth } from '@/providers/auth-provider';
import { useWorkspace } from '@/providers/workspace-provider';

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const { user, isLoaded, isAuthenticated } = useAuth();
  const { selectedWorkspace } = useWorkspace();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoaded, router]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobileViewport(mediaQuery.matches);
    sync();

    mediaQuery.addEventListener('change', sync);
    return () => mediaQuery.removeEventListener('change', sync);
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning';
    }
    if (hour < 18) {
      return 'Good afternoon';
    }
    return 'Good evening';
  }, []);

  if (!isLoaded || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm font-semibold text-app-muted">
        Loading session...
      </div>
    );
  }

  return (
    <div className="app-page-bg relative flex min-h-screen flex-col lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-2.5 sm:p-4">
        <div className="mx-auto flex h-full max-w-[1640px] flex-col gap-3">
          <motion.header
            initial={{ opacity: 0, y: isMobileViewport ? -4 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: isMobileViewport ? 0.14 : 0.2, ease: 'easeOut' }}
            className="app-panel sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 px-4 py-3 backdrop-blur"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-app-ink sm:text-[15px]">
                {user?.displayName ? `Hey ${user.displayName}, ${greeting}` : greeting}
              </p>
              <div className="mt-1 inline-flex max-w-full items-center gap-2 text-sm text-app-muted">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                  <Building2 size={12} />
                </span>
                <span className="truncate">
                  {selectedWorkspace?.name ?? 'No workspace selected'} | {title}
                </span>
              </div>
            </div>

            <Link
              href="/search"
              className="hidden min-w-[320px] max-w-[500px] flex-1 items-center gap-2 rounded-xl border border-app-line bg-app-soft px-4 py-2.5 text-sm font-medium text-app-muted transition hover:bg-app-hover lg:flex"
            >
              <Search size={15} className="text-app-muted" />
              <span className="w-full">Search here</span>
            </Link>

            <div className="flex items-center justify-end gap-1.5 sm:gap-2">
              <nav className="hidden items-center gap-1.5 xl:flex">
                <Link
                  href="/dashboard"
                  className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-app-muted transition hover:bg-app-hover hover:text-app-ink"
                >
                  Dashboard
                </Link>
                <Link
                  href="/messages"
                  className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-app-muted transition hover:bg-app-hover hover:text-app-ink"
                >
                  Messages
                </Link>
                <Link
                  href="/workspace"
                  className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-app-muted transition hover:bg-app-hover hover:text-app-ink"
                >
                  Team
                </Link>
              </nav>

              <Link
                href="/search"
                className="app-control inline-flex h-11 w-11 items-center justify-center lg:hidden"
                aria-label="Open search"
              >
                <Search size={16} />
              </Link>

              <button
                type="button"
                onClick={() => setIsNotificationsOpen((value) => !value)}
                className="app-control inline-flex h-11 w-11 items-center justify-center"
                aria-label="Open notifications"
              >
                <Bell size={16} />
              </button>

              <Link
                href="/settings"
                className="app-control inline-flex h-11 w-11 items-center justify-center"
                aria-label="Open settings"
              >
                <Settings2 size={16} />
              </Link>

              <ThemeToggle />

              <button
                onClick={() => setIsProfileOpen(true)}
                className="app-control inline-flex h-11 items-center gap-1.5 px-3 text-sm font-semibold text-app-ink"
              >
                <UserCircle2 size={19} className="text-indigo-600 dark:text-indigo-300" />
                <span>{user?.displayName ?? 'Account'}</span>
              </button>
            </div>
          </motion.header>

          <motion.div
            initial={{ opacity: 0, y: isMobileViewport ? 4 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: isMobileViewport ? 0.14 : 0.2, ease: 'easeOut' }}
            className="min-h-0 flex-1"
          >
            {children}
          </motion.div>
        </div>
      </main>

      <NotificationPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}
