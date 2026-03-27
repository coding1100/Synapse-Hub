'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { BellRing, ShieldCheck, UserRoundCog } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/app-shell';
import { resolveApiError } from '@/lib/http-error';
import { getUserProfile, updateUserProfile } from '@/lib/queries';
import { useAuth } from '@/providers/auth-provider';
import { Card, Input, Button } from '@synapsehub/ui';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [title, setTitle] = useState('');
  const [timezone, setTimezone] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: () => getUserProfile(user!.id),
    enabled: Boolean(user?.id),
    retry: false,
  });

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    setDisplayName(profileQuery.data.displayName ?? '');
    setTitle(profileQuery.data.title ?? '');
    setTimezone(profileQuery.data.timezone ?? '');
  }, [profileQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error('Missing user session');
      }

      return updateUserProfile(user.id, {
        displayName: displayName.trim(),
        title: title.trim(),
        timezone: timezone.trim(),
      });
    },
    onSuccess: (updatedProfile) => {
      updateUser({
        id: updatedProfile.id,
        email: updatedProfile.email,
        displayName: updatedProfile.displayName,
      });
      setFeedback('Profile updated.');
      toast.success('Profile updated');
    },
    onError: (error) => {
      const message = resolveApiError(error, 'Unable to update profile.');
      setFeedback(message);
      toast.error(message);
    },
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    updateMutation.mutate();
  };

  return (
    <AppShell title="Settings">
      <section className="app-panel mb-4 p-5">
        <p className="app-kicker">Account preferences</p>
        <h2 className="mt-1 text-3xl font-bold text-app-ink">Tune profile details and collaboration defaults</h2>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="inline-flex items-center gap-2 text-2xl font-bold text-app-ink">
            <UserRoundCog size={20} className="text-indigo-600 dark:text-indigo-300" />
            Profile
          </h2>
          {profileQuery.isLoading && <p className="mt-3 text-sm text-app-muted">Loading profile...</p>}
          {profileQuery.isError && <p className="mt-3 text-sm font-semibold text-red-600">Unable to load profile.</p>}
          {!profileQuery.isLoading && !profileQuery.isError && (
            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <Input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Display name"
              />
              <Input value={user?.email ?? ''} readOnly />
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" />
              <Input
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                placeholder="Timezone (e.g. Asia/Karachi)"
              />
              {feedback && (
                <p className={`text-sm font-semibold ${updateMutation.isError ? 'text-red-600' : 'text-emerald-700'}`}>
                  {feedback}
                </p>
              )}
              <Button
                type="submit"
                disabled={updateMutation.isPending || !displayName.trim()}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save profile'}
              </Button>
            </form>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="inline-flex items-center gap-2 text-2xl font-bold text-app-ink">
            <ShieldCheck size={20} className="text-indigo-600 dark:text-indigo-300" />
            Preferences
          </h2>
          <div className="mt-4 space-y-3 text-sm text-app-ink">
            <label className="app-muted-box flex cursor-pointer items-center gap-2">
              <BellRing size={14} className="text-indigo-600 dark:text-indigo-300" />
              <input type="checkbox" defaultChecked /> Enable thread notifications
            </label>
            <label className="app-muted-box flex cursor-pointer items-center gap-2">
              <BellRing size={14} className="text-indigo-600 dark:text-indigo-300" />
              <input type="checkbox" defaultChecked /> Receive email mentions
            </label>
            <label className="app-muted-box flex cursor-pointer items-center gap-2">
              <BellRing size={14} className="text-indigo-600 dark:text-indigo-300" />
              <input type="checkbox" /> Compact message density
            </label>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
