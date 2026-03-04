'use client';

import { useAuth } from '@/providers/auth-provider';

export function UserProfileModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user, clearSession } = useAuth();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-panel">
        <h3 className="font-display text-2xl font-bold text-ink">User profile</h3>
        <p className="mt-2 text-sm text-slate-600">Name: {user?.displayName}</p>
        <p className="text-sm text-slate-600">Email: {user?.email}</p>
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => {
              clearSession();
              onClose();
            }}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Sign out
          </button>
          <button onClick={onClose} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}