'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Mail, User2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@synapsehub/ui';

export function UserProfileModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user, clearSession, refreshToken } = useAuth();
  const router = useRouter();

  const signOut = async () => {
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', {
          refreshToken,
        });
      } catch {
        // Logout remains best-effort for expired sessions.
      }
    }

    clearSession();
    onClose();
    router.replace('/login');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-[1px]"
          />
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          >
            <div className="w-full max-w-md app-glass p-4 sm:p-6">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-ink sm:text-2xl">User Profile</h3>
                  <p className="text-sm text-slate-500">Manage your active session</p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-xl border border-slate-300 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="app-muted-box flex items-center gap-2">
                  <User2 size={14} className="text-blue-700" />
                  <p className="text-sm text-slate-700">{user?.displayName}</p>
                </div>
                <div className="app-muted-box flex items-center gap-2">
                  <Mail size={14} className="text-blue-700" />
                  <p className="text-sm text-slate-700">{user?.email}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose}>
                  Close
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    void signOut();
                  }}
                >
                  <LogOut size={15} className="mr-1" />
                  Sign out
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
