'use client';

import { FormEvent, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, Cable, PlusCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/app-shell';
import { apiClient } from '@/lib/api-client';
import { resolveApiError } from '@/lib/http-error';
import { useWorkspace } from '@/providers/workspace-provider';
import { Button, Input } from '@synapsehub/ui';

export default function AdminPage() {
  const { selectedWorkspaceId: workspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);

  const botsQuery = useQuery({
    queryKey: ['bots', workspaceId],
    queryFn: async () => {
      const response = await apiClient.get('/bots', { params: { workspaceId } });
      return response.data as Array<{ id: string; name: string; scopes: string[]; isActive: boolean }>;
    },
    enabled: Boolean(workspaceId),
    retry: false,
  });

  const integrationsQuery = useQuery({
    queryKey: ['integrations', workspaceId],
    queryFn: async () => {
      const response = await apiClient.get('/integrations', { params: { workspaceId } });
      return response.data as Array<{ id: string; name: string; type: string; isActive: boolean }>;
    },
    enabled: Boolean(workspaceId),
    retry: false,
  });

  const [botName, setBotName] = useState('status-bot');
  const [integrationName, setIntegrationName] = useState('incoming-webhook');
  const [integrationType, setIntegrationType] = useState<'WEBHOOK' | 'CUSTOM'>('WEBHOOK');

  const createBot = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/bots', {
        workspaceId,
        name: botName.trim(),
        scopes: ['messages:write', 'events:read', 'commands:execute'],
      });
      return response.data as { token: string };
    },
    onSuccess: () => {
      setFeedback('Bot created.');
      toast.success('Bot created');
      queryClient.invalidateQueries({ queryKey: ['bots', workspaceId] });
    },
    onError: (error) => {
      const message = resolveApiError(error);
      setFeedback(message);
      toast.error(message);
    },
  });

  const createIntegration = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/integrations', {
        workspaceId,
        type: integrationType,
        name: integrationName.trim(),
        config: {},
      });
      return response.data as { signingSecret?: string };
    },
    onSuccess: () => {
      setFeedback('Integration created.');
      toast.success('Integration created');
      queryClient.invalidateQueries({ queryKey: ['integrations', workspaceId] });
    },
    onError: (error) => {
      const message = resolveApiError(error);
      setFeedback(message);
      toast.error(message);
    },
  });

  const bots = useMemo(() => botsQuery.data ?? [], [botsQuery.data]);
  const integrations = useMemo(() => integrationsQuery.data ?? [], [integrationsQuery.data]);
  const queryError = botsQuery.error || integrationsQuery.error;
  const unauthorized =
    (queryError as AxiosError | undefined)?.response?.status === 403;

  const onCreateBot = (event: FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    createBot.mutate();
  };

  const onCreateIntegration = (event: FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    createIntegration.mutate();
  };

  return (
    <AppShell title="Admin Panel">
      <section className="mb-4 border-b border-slate-200 bg-white px-3 py-3 sm:px-4 sm:py-4">
        <p className="app-kicker">Automation and governance</p>
        <h2 className="mt-1 text-3xl font-bold text-ink">Configure bots and internal automation securely</h2>
        <p className="mt-2 text-sm text-slate-600">
          Owner and admin access only. Configure webhook/custom automation and rotate secrets regularly.
        </p>
      </section>
      {!workspaceId && <p className="mb-4 text-sm text-slate-500">Select a workspace to manage bots and integrations.</p>}
      {workspaceId && unauthorized && (
        <p className="mb-4 text-sm font-semibold text-red-600">
          You need OWNER or ADMIN role in this workspace to access admin controls.
        </p>
      )}
      {feedback && (
        <p className={`mb-4 text-sm font-semibold ${(createBot.isError || createIntegration.isError) ? 'text-red-600' : 'text-emerald-700'}`}>
          {feedback}
        </p>
      )}

      <section className="overflow-hidden border-y border-slate-200 bg-white">
        <div className="grid divide-y divide-slate-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          <div className="p-4 sm:p-5">
            <h2 className="inline-flex items-center gap-2 text-xl font-bold text-ink">
              <Bot size={19} className="text-blue-600" />
              Bot API
            </h2>
            <form onSubmit={onCreateBot} className="mt-3 flex gap-2">
              <Input value={botName} onChange={(event) => setBotName(event.target.value)} />
              <Button disabled={!workspaceId || createBot.isPending || unauthorized || !botName.trim()}>
                <PlusCircle size={14} className="mr-1" />
                {createBot.isPending ? 'Creating...' : 'Create bot'}
              </Button>
            </form>
            {createBot.data?.token && (
              <p className="mt-3 bg-slate-50 px-2 py-2 text-xs text-slate-700">
                New bot token: {createBot.data.token}
              </p>
            )}
            <p className="mt-2 text-xs text-slate-500">Use header `x-bot-token` for bot event/message endpoints.</p>

            <div className="mt-4 border-t border-slate-200">
              {bots.map((bot) => (
                <div key={bot.id} className="border-b border-slate-200 px-2 py-2.5 last:border-b-0">
                  <p className="font-semibold text-slate-800">{bot.name}</p>
                  <p className="text-xs text-slate-500">Scopes: {bot.scopes.join(', ')}</p>
                </div>
              ))}
              {workspaceId && bots.length === 0 && !botsQuery.isLoading && (
                <p className="px-2 py-3 text-sm text-slate-500">No bots configured.</p>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <h2 className="inline-flex items-center gap-2 text-xl font-bold text-ink">
              <Cable size={19} className="text-blue-600" />
              Integrations
            </h2>
            <form onSubmit={onCreateIntegration} className="mt-3 grid gap-2">
              <Input
                value={integrationName}
                onChange={(event) => setIntegrationName(event.target.value)}
              />
              <select
                value={integrationType}
                onChange={(event) => setIntegrationType(event.target.value as 'WEBHOOK' | 'CUSTOM')}
                className="app-select"
              >
                <option value="WEBHOOK">Webhook</option>
                <option value="CUSTOM">Custom</option>
              </select>
              <Button disabled={!workspaceId || createIntegration.isPending || unauthorized || !integrationName.trim()}>
                <ShieldCheck size={14} className="mr-1" />
                {createIntegration.isPending ? 'Creating...' : 'Create integration'}
              </Button>
            </form>
            {createIntegration.data?.signingSecret && (
              <p className="mt-3 bg-slate-50 px-2 py-2 text-xs text-slate-700">
                Integration signing secret: {createIntegration.data.signingSecret}
              </p>
            )}
            <p className="mt-2 text-xs text-slate-500">Use header `x-integration-secret` when sending integration events.</p>

            <div className="mt-4 border-t border-slate-200">
              {integrations.map((integration) => (
                <div key={integration.id} className="border-b border-slate-200 px-2 py-2.5 last:border-b-0">
                  <p className="font-semibold text-slate-800">{integration.name}</p>
                  <p className="text-xs uppercase text-blue-700">{integration.type}</p>
                </div>
              ))}
              {workspaceId && integrations.length === 0 && !integrationsQuery.isLoading && (
                <p className="px-2 py-3 text-sm text-slate-500">No integrations configured.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
