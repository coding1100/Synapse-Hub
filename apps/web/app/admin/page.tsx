'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/app-shell';
import { apiClient } from '@/lib/api-client';
import { getWorkspaces } from '@/lib/queries';
import { useAuth } from '@/providers/auth-provider';
import { Card, Button, Input } from '@synapsehub/ui';

export default function AdminPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: workspaceData } = useQuery({
    queryKey: ['workspaces'],
    queryFn: getWorkspaces,
  });

  const workspaceId = workspaceData?.data[0]?.id;

  const { data: botsData } = useQuery({
    queryKey: ['bots', workspaceId],
    queryFn: async () => {
      const response = await apiClient.get('/bots', { params: { workspaceId } });
      return response.data as Array<{ id: string; name: string; scopes: string[]; isActive: boolean }>;
    },
    enabled: Boolean(workspaceId),
  });

  const { data: integrationsData } = useQuery({
    queryKey: ['integrations', workspaceId],
    queryFn: async () => {
      const response = await apiClient.get('/integrations', { params: { workspaceId } });
      return response.data as Array<{ id: string; name: string; type: string; isActive: boolean }>;
    },
    enabled: Boolean(workspaceId),
  });

  const [botName, setBotName] = useState('status-bot');
  const [integrationName, setIntegrationName] = useState('github-feed');
  const [integrationType, setIntegrationType] = useState('GITHUB');

  const createBot = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/bots', {
        workspaceId,
        createdById: user?.id,
        name: botName,
        scopes: ['messages:write', 'events:read', 'commands:execute'],
      });
      return response.data as { token: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots', workspaceId] });
    },
  });

  const createIntegration = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/integrations', {
        workspaceId,
        createdById: user?.id,
        type: integrationType,
        name: integrationName,
        config: {},
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', workspaceId] });
    },
  });

  const bots = useMemo(() => botsData ?? [], [botsData]);
  const integrations = useMemo(() => integrationsData ?? [], [integrationsData]);

  const onCreateBot = (event: FormEvent) => {
    event.preventDefault();
    createBot.mutate();
  };

  const onCreateIntegration = (event: FormEvent) => {
    event.preventDefault();
    createIntegration.mutate();
  };

  return (
    <AppShell title="Admin Panel">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display text-xl font-bold text-ink">Bot API</h2>
          <form onSubmit={onCreateBot} className="mt-3 flex gap-2">
            <Input value={botName} onChange={(event) => setBotName(event.target.value)} />
            <Button disabled={!workspaceId || !user?.id || createBot.isPending}>
              {createBot.isPending ? 'Creating...' : 'Create bot'}
            </Button>
          </form>
          {createBot.data?.token && (
            <p className="mt-3 rounded-xl bg-mint p-2 text-xs text-slate-700">
              New bot token: {createBot.data.token}
            </p>
          )}
          <div className="mt-4 space-y-2">
            {bots.map((bot) => (
              <div key={bot.id} className="rounded-xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-800">{bot.name}</p>
                <p className="text-xs text-slate-500">Scopes: {bot.scopes.join(', ')}</p>
              </div>
            ))}
            {bots.length === 0 && <p className="text-sm text-slate-500">No bots configured.</p>}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-xl font-bold text-ink">Integrations</h2>
          <form onSubmit={onCreateIntegration} className="mt-3 grid gap-2">
            <Input
              value={integrationName}
              onChange={(event) => setIntegrationName(event.target.value)}
            />
            <select
              value={integrationType}
              onChange={(event) => setIntegrationType(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="GITHUB">GitHub</option>
              <option value="WEBHOOK">Webhook</option>
              <option value="CUSTOM">Custom</option>
            </select>
            <Button disabled={!workspaceId || !user?.id || createIntegration.isPending}>
              {createIntegration.isPending ? 'Creating...' : 'Create integration'}
            </Button>
          </form>
          <div className="mt-4 space-y-2">
            {integrations.map((integration) => (
              <div key={integration.id} className="rounded-xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-800">{integration.name}</p>
                <p className="text-xs uppercase text-ocean">{integration.type}</p>
              </div>
            ))}
            {integrations.length === 0 && (
              <p className="text-sm text-slate-500">No integrations configured.</p>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}