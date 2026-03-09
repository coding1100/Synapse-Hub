'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bell, Building2, Search, Settings2, UserCircle2 } from 'lucide-react';
import { Sidebar } from './sidebar';
import { NotificationPanel } from './notification-panel';
import { UserProfileModal } from './user-profile-modal';
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
      <div className="flex min-h-screen items-center justify-center text-sm font-semibold text-slate-600">
        Loading session...
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-transparent lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-2.5 sm:p-4 lg:p-5">
        <div className="mx-auto flex h-full max-w-[1620px] flex-col gap-3 sm:gap-4">
          <motion.header
            initial={{ opacity: 0, y: isMobileViewport ? -4 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: isMobileViewport ? 0.14 : 0.2, ease: 'easeOut' }}
            className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 border border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur sm:px-4 sm:py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 sm:text-sm">
                {user?.displayName ? `Hey ${user.displayName}, ${greeting}` : greeting}
              </p>
              <div className="mt-1 inline-flex max-w-full items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                  <Building2 size={12} />
                </span>
                <span className="truncate">
                  {selectedWorkspace?.name ?? 'No workspace selected'} | {title}
                </span>
              </div>
            </div>

            <Link
              href="/search"
              className="hidden min-w-[280px] max-w-[460px] flex-1 items-center gap-2 border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100 lg:flex"
            >
              <Search size={14} className="text-slate-400" />
              <span className="w-full">Search here</span>
            </Link>

            <div className="flex items-center justify-end gap-1.5 sm:gap-2">
              <Link
                href="/search"
                className="inline-flex h-9 w-9 items-center justify-center border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 lg:hidden"
                aria-label="Open search"
              >
                <Search size={15} />
              </Link>

              <button
                type="button"
                onClick={() => setIsNotificationsOpen((value) => !value)}
                className="inline-flex h-9 w-9 items-center justify-center border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 sm:h-10 sm:w-10"
                aria-label="Open notifications"
              >
                <Bell size={15} />
              </button>

              <Link
                href="/settings"
                className="inline-flex h-9 w-9 items-center justify-center border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 sm:h-10 sm:w-10"
                aria-label="Open settings"
              >
                <Settings2 size={15} />
              </Link>

              <button
                onClick={() => setIsProfileOpen(true)}
                className="inline-flex items-center gap-1.5 border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 sm:gap-2 sm:px-2.5 sm:py-2 sm:text-sm"
              >
                <UserCircle2 size={18} className="text-blue-600" />
                <span className="hidden sm:inline">{user?.displayName ?? 'Account'}</span>
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
