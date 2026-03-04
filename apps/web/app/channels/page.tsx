'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/app-shell';
import { apiClient } from '@/lib/api-client';
import { getChannels, getWorkspaces } from '@/lib/queries';
import { Card, Input, Button } from '@synapsehub/ui';

export default function ChannelsPage() {
  const queryClient = useQueryClient();
  const { data: workspaceData } = useQuery({
    queryKey: ['workspaces'],
    queryFn: getWorkspaces,
  });

  const workspaceId = workspaceData?.data[0]?.id;

  const { data: channelData } = useQuery({
    queryKey: ['channels', workspaceId],
    queryFn: () => getChannels(workspaceId!),
    enabled: Boolean(workspaceId),
  });

  const [name, setName] = useState('general');
  const [topic, setTopic] = useState('Company updates');

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/channels', {
        workspaceId,
        name,
        topic,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', workspaceId] });
    },
  });

  const channels = useMemo(() => channelData?.data ?? [], [channelData]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate();
  };

  return (
    <AppShell title="Channels">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-5">
          <h2 className="font-display text-2xl font-bold text-ink">Channel list</h2>
          <div className="mt-4 space-y-3">
            {channels.map((channel) => (
              <div key={channel.id} className="rounded-xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-800"># {channel.name}</p>
                <p className="text-xs text-slate-500">{channel.topic ?? 'No topic set'}</p>
              </div>
            ))}
            {channels.length === 0 && <p className="text-sm text-slate-500">No channels yet.</p>}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-2xl font-bold text-ink">Create channel</h2>
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="channel-name" />
            <Input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Topic" />
            <Button type="submit" className="w-full" disabled={!workspaceId || mutation.isPending}>
              {mutation.isPending ? 'Creating...' : 'Create channel'}
            </Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}