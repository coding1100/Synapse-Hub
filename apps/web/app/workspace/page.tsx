'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/app-shell';
import { apiClient } from '@/lib/api-client';
import { getWorkspaces } from '@/lib/queries';
import { Card, Input, Button } from '@synapsehub/ui';

export default function WorkspacePage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['workspaces'],
    queryFn: getWorkspaces,
  });

  const [name, setName] = useState('Engineering');
  const [slug, setSlug] = useState('engineering');

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/workspaces', { name, slug });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate();
  };

  return (
    <AppShell title="Workspace">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-5">
          <h2 className="font-display text-2xl font-bold text-ink">Existing workspaces</h2>
          <div className="mt-4 space-y-3">
            {data?.data.map((workspace) => (
              <div key={workspace.id} className="rounded-xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-800">{workspace.name}</p>
                <p className="text-xs text-slate-500">{workspace.slug}</p>
              </div>
            ))}
            {(!data?.data || data.data.length === 0) && <p className="text-sm text-slate-500">No workspaces available.</p>}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-display text-2xl font-bold text-ink">Create workspace</h2>
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Workspace name" />
            <Input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="workspace-slug" />
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}