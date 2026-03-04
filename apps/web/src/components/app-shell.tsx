'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { NotificationPanel } from './notification-panel';
import { UserProfileModal } from './user-profile-modal';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@synapsehub/ui';

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 px-6 py-6 lg:px-10">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink">{title}</h1>
            <p className="text-sm text-slate-600">Realtime collaboration at enterprise scale.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setIsNotificationsOpen((value) => !value)}>
              Notifications
            </Button>
            <button
              onClick={() => setIsProfileOpen(true)}
              className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
            >
              {user?.displayName ?? 'Account'}
            </button>
          </div>
        </header>
        {children}
      </main>
      <NotificationPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}
