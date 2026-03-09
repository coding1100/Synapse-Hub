'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Search, Sparkle, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/app-shell';
import { resolveApiError } from '@/lib/http-error';
import { searchAll, searchUsers } from '@/lib/queries';
import { useWorkspace } from '@/providers/workspace-provider';
import { Input, Button } from '@synapsehub/ui';

type SearchResult = {
  id: string;
  content: string;
  type: string;
};

export default function SearchPage() {
  const { selectedWorkspaceId: workspaceId } = useWorkspace();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('message');
  const [feedback, setFeedback] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!workspaceId) return { data: [] as SearchResult[] };

      if (type === 'user') {
        const users = await searchUsers(workspaceId, query);
        return {
          data: users.data.map((user) => ({
            id: user.id,
            type: 'user',
            content: `${user.displayName} (${user.email})`,
          })),
        };
      }

      return searchAll(workspaceId, query, type) as Promise<{ data: SearchResult[] }>;
    },
    onError: (error) => {
      const message = resolveApiError(error, 'Search failed.');
      setFeedback(message);
      toast.error(message);
    },
    onSuccess: () => {
      setFeedback(null);
    },
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    mutation.mutate();
  };

  const results = useMemo(() => mutation.data?.data ?? [], [mutation.data]);

  return (
    <AppShell title="Search">
      <section className="mb-4 border-b border-slate-200 bg-white px-3 py-3 sm:px-4 sm:py-4">
        <p className="app-kicker">Unified search</p>
        <h2 className="mt-1 text-3xl font-bold text-ink">Find people, messages, files, and channels instantly</h2>
        <p className="mt-2 text-sm text-slate-600">
          Query your active workspace with role-aware search scopes.
        </p>
      </section>

      <section className="overflow-hidden border-y border-slate-200 bg-white px-3 py-4 sm:px-4 sm:py-5">
        {!workspaceId && <p className="mb-3 text-sm text-slate-500">Select a workspace to search.</p>}

        <form onSubmit={onSubmit} className="grid gap-3 border-b border-slate-200 pb-4 lg:grid-cols-[1fr_12rem_auto]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search messages, channels, users, files..." />
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="app-select"
          >
            <option value="message">Messages</option>
            <option value="channel">Channels</option>
            <option value="user">Users</option>
            <option value="file">Files</option>
          </select>
          <Button type="submit" disabled={mutation.isPending || !query.trim() || !workspaceId}>
            <Search size={14} className="mr-1" />
            {mutation.isPending ? 'Searching...' : 'Search'}
          </Button>
        </form>

        {feedback && <p className="mt-3 text-sm font-semibold text-red-600">{feedback}</p>}
        {!mutation.isPending && results.length > 0 && (
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </p>
        )}

        <div className="mt-3">
          {results.map((result) => (
            <div key={result.id} className="border-b border-slate-200 px-1 py-2.5 last:border-b-0">
              <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase text-blue-700">
                {result.type === 'user' ? <UserRound size={12} /> : <Sparkle size={12} />}
                {result.type}
              </p>
              <p className="text-sm text-slate-800">{result.content}</p>
            </div>
          ))}
          {results.length === 0 && !mutation.isPending && (
            <p className="px-1 py-3 text-sm text-slate-500">Run a search to see results.</p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
