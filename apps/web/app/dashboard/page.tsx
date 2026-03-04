'use client';

import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/app-shell';
import { getWorkspaces } from '@/lib/queries';
import { Card } from '@synapsehub/ui';

export default function DashboardPage() {
  const { data } = useQuery({
    queryKey: ['workspaces'],
    queryFn: getWorkspaces,
  });

  return (
    <AppShell title="Dashboard">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Workspaces</p>
          <p className="mt-2 font-display text-3xl font-bold text-ink">{data?.data.length ?? 0}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Realtime Status</p>
          <p className="mt-2 text-2xl font-bold text-ocean">Connected</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Platform</p>
          <p className="mt-2 text-lg font-semibold text-slate-700">Slack-like collaboration core online</p>
        </Card>
      </div>
    </AppShell>
  );
}