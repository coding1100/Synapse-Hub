'use client';

import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/providers/auth-provider';
import { Card, Input, Button } from '@synapsehub/ui';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <AppShell title="Settings">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display text-2xl font-bold text-ink">Profile</h2>
          <div className="mt-4 space-y-3">
            <Input value={user?.displayName ?? ''} readOnly />
            <Input value={user?.email ?? ''} readOnly />
            <Button>Save profile</Button>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-display text-2xl font-bold text-ink">Preferences</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked /> Enable thread notifications
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked /> Receive email mentions
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" /> Compact message density
            </label>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}