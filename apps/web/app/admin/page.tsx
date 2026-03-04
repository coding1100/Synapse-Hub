'use client';

import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/app-shell';
import { getWorkspaces } from '@/lib/queries';
import { Card } from '@synapsehub/ui';

export default function AdminPage() {
  const { data } = useQuery({
    queryKey: ['workspaces'],
    queryFn: getWorkspaces,
  });

  return (
    <AppShell title="Admin Panel">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="font-display text-xl font-bold text-ink">Users</h2>
          <p className="mt-2 text-sm text-slate-600">Manage user lifecycle, role escalations, and account status.</p>
        </Card>
        <Card className="p-5">
          <h2 className="font-display text-xl font-bold text-ink">Workspaces</h2>
          <p className="mt-2 text-sm text-slate-600">Active workspaces: {data?.data.length ?? 0}</p>
        </Card>
        <Card className="p-5">
          <h2 className="font-display text-xl font-bold text-ink">Audit Logs</h2>
          <p className="mt-2 text-sm text-slate-600">Track sensitive admin actions and compliance events.</p>
        </Card>
      </div>
      <Card className="mt-4 p-5">
        <h3 className="font-display text-xl font-bold text-ink">Integrations</h3>
        <p className="mt-2 text-sm text-slate-600">
          Configure GitHub, incoming webhooks, and custom app integrations from this panel.
        </p>
      </Card>
    </AppShell>
  );
}