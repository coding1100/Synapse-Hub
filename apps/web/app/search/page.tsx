'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/app-shell';
import { getWorkspaces, searchAll } from '@/lib/queries';
import { Card, Input, Button } from '@synapsehub/ui';

export default function SearchPage() {
  const { data: workspaceData } = useQuery({
    queryKey: ['workspaces'],
    queryFn: getWorkspaces,
  });

  const workspaceId = workspaceData?.data[0]?.id;

  const [query, setQuery] = useState('');
  const [type, setType] = useState('message');

  const mutation = useMutation({
    mutationFn: async () => {
      if (!workspaceId) return { data: [] };
      return searchAll(workspaceId, query, type);
    },
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate();
  };

  const results = (mutation.data as { data?: Array<{ id: string; content: string; type: string }> })?.data ?? [];

  return (
    <AppShell title="Search">
      <Card className="p-5">
        <form onSubmit={onSubmit} className="grid gap-3 lg:grid-cols-[1fr_12rem_auto]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search messages, channels, users, files..." />
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="message">Messages</option>
            <option value="channel">Channels</option>
            <option value="user">Users</option>
            <option value="file">Files</option>
          </select>
          <Button type="submit" disabled={mutation.isPending || !query.trim()}>
            {mutation.isPending ? 'Searching...' : 'Search'}
          </Button>
        </form>
        <div className="mt-5 space-y-3">
          {results.map((result) => (
            <div key={result.id} className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-ocean">{result.type}</p>
              <p className="text-sm text-slate-800">{result.content}</p>
            </div>
          ))}
          {results.length === 0 && <p className="text-sm text-slate-500">Run a search to see indexed results.</p>}
        </div>
      </Card>
    </AppShell>
  );
}