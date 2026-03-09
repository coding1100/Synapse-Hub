'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { BellRing, CheckCircle2, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/auth-provider';
import { getNotifications, markNotificationRead } from '@/lib/queries';

export function NotificationPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => getNotifications(user!.id),
    enabled: Boolean(user?.id && isOpen),
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[1px]"
          />
          <motion.aside
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed right-2 top-2 z-50 h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-md app-glass p-3 sm:right-4 sm:top-4 sm:h-[calc(100vh-2rem)] sm:w-full sm:p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink sm:text-xl">Notifications</h3>
                <p className="text-xs text-slate-500">Realtime alerts and mentions</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
              >
                <X size={16} />
              </button>
            </div>

            {typeof data?.unreadCount === 'number' && (
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                <BellRing size={13} />
                Unread: {data.unreadCount}
              </p>
            )}

            <div className="space-y-2 overflow-y-auto pb-2">
              {data?.data?.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  disabled={notification.isRead || markReadMutation.isPending}
                  onClick={() => markReadMutation.mutate(notification.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    notification.isRead
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-blue-200 bg-blue-50 hover:bg-blue-100/70'
                  }`}
                >
                  <p className="text-xs font-semibold uppercase text-blue-700">{notification.type}</p>
                  <p className="mt-1 text-sm text-slate-800">{notification.body}</p>
                  {!notification.isRead && (
                    <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 size={12} />
                      Click to mark as read
                    </p>
                  )}
                </button>
              ))}
              {(!data?.data || data.data.length === 0) && (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  No notifications yet.
                </p>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
