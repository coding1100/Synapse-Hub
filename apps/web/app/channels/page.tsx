'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Globe, Hash, Lock, Megaphone, PlusCircle, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/app-shell';
import { resolveApiError } from '@/lib/http-error';
import { createChannel, getChannels, getWorkspaceMembers } from '@/lib/queries';
import { useAuth } from '@/providers/auth-provider';
import { useWorkspace } from '@/providers/workspace-provider';
import { Input, Button } from '@synapsehub/ui';

export default function ChannelsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { selectedWorkspaceId: workspaceId } = useWorkspace();
  const [feedback, setFeedback] = useState<string | null>(null);

  const channelQuery = useQuery({
    queryKey: ['channels', workspaceId],
    queryFn: () => getChannels(workspaceId!),
    enabled: Boolean(workspaceId),
    retry: false,
  });

  const membersQuery = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => getWorkspaceMembers(workspaceId!),
    enabled: Boolean(workspaceId),
    retry: false,
  });

  const [name, setName] = useState('product-updates');
  const [topic, setTopic] = useState('Roadmap, releases, and announcements');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PRIVATE');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!workspaceId) {
        throw new Error('Select a workspace first');
      }

      if (visibility === 'PRIVATE' && selectedMemberIds.length === 0) {
        throw new Error('Select at least one member for a private channel');
      }

      return createChannel({
        workspaceId,
        name: name.trim(),
        topic: topic.trim(),
        isPrivate: visibility === 'PRIVATE',
        memberIds: visibility === 'PRIVATE' ? selectedMemberIds : [],
      });
    },
    onSuccess: () => {
      setFeedback('Channel created.');
      toast.success('Channel created');
      setName('');
      setTopic('');
      setSelectedMemberIds([]);
      queryClient.invalidateQueries({ queryKey: ['channels', workspaceId] });
    },
    onError: (error) => {
      const message = resolveApiError(error);
      setFeedback(message);
      toast.error(message);
    },
  });

  const channels = useMemo(() => channelQuery.data?.data ?? [], [channelQuery.data]);
  const availableMembers = useMemo(
    () => (membersQuery.data ?? []).filter((member) => member.userId !== user?.id),
    [membersQuery.data, user?.id],
  );

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    mutation.mutate();
  };

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((previous) => {
      if (previous.includes(memberId)) {
        return previous.filter((id) => id !== memberId);
      }
      return [...previous, memberId];
    });
  };

  return (
    <AppShell title="Channels">
      <section className="app-panel mb-4 px-3 py-3 sm:px-4 sm:py-4">
        <p className="app-kicker">Channel architecture</p>
        <h2 className="mt-1 text-3xl font-bold text-app-ink">Structure conversations by team or initiative</h2>
        <p className="mt-2 text-sm text-app-muted">
          Build focused spaces for updates, planning, and fast tactical communication.
        </p>
      </section>

      <section className="app-panel overflow-hidden">
        <div className="grid divide-y divide-app-line lg:grid-cols-[1.2fr_1fr] lg:divide-x lg:divide-y-0">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="inline-flex items-center gap-2 text-2xl font-bold text-app-ink">
                <Hash size={20} className="text-indigo-600 dark:text-indigo-300" />
                Channel list
              </h2>
              <span className="rounded-full border border-app-line bg-app-soft px-2.5 py-1 text-xs font-semibold text-app-muted">
                {channels.length}
              </span>
            </div>

            {!workspaceId && <p className="mt-4 text-sm text-app-muted">Select a workspace to view channels.</p>}
            {workspaceId && channelQuery.isError && (
              <p className="mt-4 text-sm font-semibold text-red-600">Unable to load channels for this workspace.</p>
            )}

            <div className="mt-4 border-t border-app-line">
              {channels.map((channel) => (
                <div key={channel.id} className="border-b border-app-line px-3 py-2.5 last:border-b-0">
                  <p className="inline-flex items-center gap-1 font-semibold text-app-ink">
                    <Hash size={13} className="text-indigo-600 dark:text-indigo-300" />
                    {resolveChannelName(channel.name, channel.type, channel.members, user?.id)}
                  </p>
                  <p className="text-xs text-app-muted">
                    {channel.type} {channel.topic ? `- ${channel.topic}` : '- No topic set'}
                  </p>
                </div>
              ))}
              {workspaceId && channels.length === 0 && !channelQuery.isLoading && (
                <p className="px-3 py-3 text-sm text-app-muted">No channels yet.</p>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <h2 className="inline-flex items-center gap-2 text-2xl font-bold text-app-ink">
              <Megaphone size={20} className="text-indigo-600 dark:text-indigo-300" />
              Create channel
            </h2>
            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="channel-name" />
              <Input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Topic" />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility('PUBLIC')}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    visibility === 'PUBLIC'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/18 dark:text-emerald-200'
                      : 'border-app-line bg-app-panel text-app-muted hover:bg-app-hover'
                  }`}
                >
                  <Globe size={14} />
                  Public
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('PRIVATE')}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    visibility === 'PRIVATE'
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/18 dark:text-indigo-200'
                      : 'border-app-line bg-app-panel text-app-muted hover:bg-app-hover'
                  }`}
                >
                  <Lock size={14} />
                  Private
                </button>
              </div>

              {visibility === 'PRIVATE' && (
                <div className="app-panel-soft p-3">
                  <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-app-muted">
                    <UsersRound size={13} />
                    Visible to selected members
                  </p>
                  <div className="max-h-40 overflow-y-auto rounded-md border border-app-line bg-app-panel">
                    {availableMembers.map((member) => {
                      const checked = selectedMemberIds.includes(member.userId);
                      return (
                        <label
                          key={member.userId}
                          className="flex cursor-pointer items-center gap-2 border-b border-app-line px-2 py-1.5 text-sm text-app-ink last:border-b-0 hover:bg-app-hover"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMember(member.userId)}
                            className="h-4 w-4 rounded border-app-line"
                          />
                          <span className="truncate">{member.user.displayName}</span>
                          <span className="truncate text-xs text-app-muted">{member.user.email}</span>
                        </label>
                      );
                    })}
                    {availableMembers.length === 0 && (
                      <p className="px-2 py-2 text-xs text-app-muted">No members available.</p>
                    )}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={!workspaceId || mutation.isPending || !name.trim()}
              >
                <PlusCircle size={15} className="mr-1" />
                {mutation.isPending ? 'Creating...' : 'Create channel'}
              </Button>
              {feedback && (
                <p className={`text-sm font-semibold ${mutation.isError ? 'text-red-600' : 'text-emerald-700'}`}>
                  {feedback}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function resolveChannelName(
  name: string,
  type: 'PUBLIC' | 'PRIVATE' | 'DIRECT',
  members: { userId: string; user?: { displayName: string; email: string } }[] | undefined,
  currentUserId?: string,
) {
  if (type !== 'DIRECT') {
    return name;
  }

  const counterpart = members?.find((member) => member.userId !== currentUserId)?.user;
  return counterpart?.displayName || counterpart?.email || 'Direct message';
}
