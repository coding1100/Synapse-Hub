'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/auth-provider';
import { getNotifications } from '@/lib/queries';

export function NotificationPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => getNotifications(user!.id),
    enabled: Boolean(user?.id && isOpen),
  });

  if (!isOpen) return null;

  return (
    <aside className="fixed right-4 top-4 z-30 h-[calc(100vh-2rem)] w-full max-w-sm rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-panel">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-xl font-bold text-ink">Notifications</h3>
        <button onClick={onClose} className="text-sm font-semibold text-slate-500 hover:text-slate-700">
          Close
        </button>
      </div>
      <div className="space-y-2 overflow-y-auto">
        {data?.data?.map((notification) => (
          <div key={notification.id} className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-ocean">{notification.type}</p>
            <p className="text-sm text-slate-800">{notification.body}</p>
          </div>
        ))}
        {(!data?.data || data.data.length === 0) && <p className="text-sm text-slate-500">No notifications.</p>}
      </div>
    </aside>
  );
}