'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Copy, Link2, ShieldCheck, UserPlus, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/app-shell';
import { apiClient } from '@/lib/api-client';
import { resolveApiError } from '@/lib/http-error';
import {
  createWorkspaceInviteLink,
  getWorkspaceMembers,
  getWorkspaces,
  inviteWorkspaceMember,
  listWorkspaceInviteLinks,
  revokeWorkspaceInviteLink,
} from '@/lib/queries';
import { useAuth } from '@/providers/auth-provider';
import { useWorkspace } from '@/providers/workspace-provider';
import { WorkspaceRole } from '@/types';
import { Input, Button } from '@synapsehub/ui';

const workspaceRoles: WorkspaceRole[] = ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'];

export default function WorkspacePage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { selectedWorkspaceId, setSelectedWorkspaceId } = useWorkspace();

  const { data } = useQuery({
    queryKey: ['workspaces'],
    queryFn: getWorkspaces,
    retry: false,
  });

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['workspace-members', selectedWorkspaceId],
    queryFn: () => getWorkspaceMembers(selectedWorkspaceId!),
    enabled: Boolean(selectedWorkspaceId),
    retry: false,
  });

  const { data: inviteLinksData, isLoading: inviteLinksLoading } = useQuery({
    queryKey: ['workspace-invite-links', selectedWorkspaceId],
    queryFn: () => listWorkspaceInviteLinks(selectedWorkspaceId!),
    enabled: Boolean(selectedWorkspaceId),
    retry: false,
  });

  const [name, setName] = useState('Engineering');
  const [slug, setSlug] = useState('engineering');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('MEMBER');
  const [inviteLinkRole, setInviteLinkRole] = useState<WorkspaceRole>('MEMBER');
  const [inviteLinkExpiryHours, setInviteLinkExpiryHours] = useState('72');
  const [inviteLinkMaxUses, setInviteLinkMaxUses] = useState('10');
  const [inviteLinkDomain, setInviteLinkDomain] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);
  const [inviteLinkFeedback, setInviteLinkFeedback] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/workspaces', {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
      });
      return response.data as { id: string };
    },
    onSuccess: (workspace) => {
      setCreateError(null);
      toast.success('Workspace created');
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setSelectedWorkspaceId(workspace.id);
    },
    onError: (error) => {
      const message = resolveApiError(error, 'Unable to create workspace.');
      setCreateError(message);
      toast.error(message);
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedWorkspaceId) {
        throw new Error('Select a workspace first');
      }

      return inviteWorkspaceMember(selectedWorkspaceId, inviteEmail.trim(), inviteRole);
    },
    onSuccess: (result) => {
      setInviteEmail('');
      const message =
        result.mode === 'MEMBER_ADDED'
          ? 'Member added and notified.'
          : `Invite link sent to ${result.email}.`;
      setInviteFeedback(message);
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['workspace-members', selectedWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-invite-links', selectedWorkspaceId] });
    },
    onError: (error) => {
      const message = resolveApiError(error, 'Unable to invite member.');
      setInviteFeedback(message);
      toast.error(message);
    },
  });

  const createInviteLinkMutation = useMutation({
    mutationFn: async () => {
      if (!selectedWorkspaceId) {
        throw new Error('Select a workspace first');
      }

      const expiryHours = Number(inviteLinkExpiryHours);
      const maxUses = Number(inviteLinkMaxUses);

      return createWorkspaceInviteLink(selectedWorkspaceId, {
        role: inviteLinkRole,
        expiresInHours: Number.isFinite(expiryHours) ? expiryHours : 72,
        maxUses: Number.isFinite(maxUses) && maxUses > 0 ? maxUses : undefined,
        allowedDomain: inviteLinkDomain.trim() || undefined,
      });
    },
    onSuccess: () => {
      setInviteLinkFeedback('Invite link created.');
      toast.success('Invite link created');
      queryClient.invalidateQueries({ queryKey: ['workspace-invite-links', selectedWorkspaceId] });
    },
    onError: (error) => {
      const message = resolveApiError(error, 'Unable to create invite link.');
      setInviteLinkFeedback(message);
      toast.error(message);
    },
  });

  const revokeInviteLinkMutation = useMutation({
    mutationFn: async (inviteLinkId: string) => {
      if (!selectedWorkspaceId) {
        throw new Error('Select a workspace first');
      }
      return revokeWorkspaceInviteLink(selectedWorkspaceId, inviteLinkId);
    },
    onSuccess: () => {
      toast.success('Invite link revoked');
      queryClient.invalidateQueries({ queryKey: ['workspace-invite-links', selectedWorkspaceId] });
    },
    onError: (error) => {
      toast.error(resolveApiError(error, 'Unable to revoke invite link.'));
    },
  });

  const members = useMemo(() => membersData ?? [], [membersData]);
  const inviteLinks = useMemo(() => inviteLinksData ?? [], [inviteLinksData]);
  const currentMembership = members.find((member) => member.userId === user?.id);
  const canInvite = currentMembership?.role === 'OWNER' || currentMembership?.role === 'ADMIN';
  const inviteRoleOptions = useMemo(
    () =>
      currentMembership?.role === 'OWNER'
        ? workspaceRoles
        : workspaceRoles.filter((role) => role !== 'OWNER'),
    [currentMembership?.role],
  );

  useEffect(() => {
    if (!inviteRoleOptions.includes(inviteRole)) {
      setInviteRole('MEMBER');
    }
    if (!inviteRoleOptions.includes(inviteLinkRole)) {
      setInviteLinkRole('MEMBER');
    }
  }, [inviteLinkRole, inviteRole, inviteRoleOptions]);

  const onSubmitCreate = (event: FormEvent) => {
    event.preventDefault();
    setCreateError(null);
    createMutation.mutate();
  };

  const onSubmitInvite = (event: FormEvent) => {
    event.preventDefault();
    setInviteFeedback(null);
    inviteMutation.mutate();
  };

  const onSubmitCreateInviteLink = (event: FormEvent) => {
    event.preventDefault();
    setInviteLinkFeedback(null);
    createInviteLinkMutation.mutate();
  };

  return (
    <AppShell title="Workspace">
      <section className="mb-4 border-b border-slate-200 bg-white px-3 py-3 sm:px-4 sm:py-4">
        <p className="app-kicker">Workspace administration</p>
        <h2 className="mt-1 text-3xl font-bold text-ink">Manage teams, members, and role access</h2>
        <p className="mt-2 text-sm text-slate-600">
          Workspace owners and admins can invite members, assign roles, and keep team boundaries clean.
        </p>
      </section>

      <section className="overflow-hidden border-y border-slate-200 bg-white">
        <div className="grid divide-y divide-slate-200 xl:grid-cols-[1.2fr_1fr] xl:divide-x xl:divide-y-0">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="inline-flex items-center gap-2 text-2xl font-bold text-ink">
                <Building2 size={20} className="text-blue-600" />
                Existing workspaces
              </h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {data?.data.length ?? 0}
              </span>
            </div>
            <div className="mt-4 border-t border-slate-200">
              {data?.data.map((workspace) => {
                const isSelected = workspace.id === selectedWorkspaceId;
                return (
                  <button
                    key={workspace.id}
                    type="button"
                    onClick={() => setSelectedWorkspaceId(workspace.id)}
                    className={`block w-full border-b border-slate-200 px-3 py-2.5 text-left transition last:border-b-0 ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-semibold text-slate-800">{workspace.name}</p>
                    <p className="text-xs text-slate-500">{workspace.slug}</p>
                  </button>
                );
              })}
              {(!data?.data || data.data.length === 0) && (
                <p className="px-3 py-3 text-sm text-slate-500">No workspaces available.</p>
              )}
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            <div className="p-4 sm:p-5">
              <h2 className="inline-flex items-center gap-2 text-2xl font-bold text-ink">
                <ShieldCheck size={20} className="text-blue-600" />
                Create workspace
              </h2>
              <form onSubmit={onSubmitCreate} className="mt-4 space-y-3">
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Workspace name"
                />
                <Input
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="workspace-slug"
                />
                <Button type="submit" className="w-full" disabled={createMutation.isPending || !name.trim() || !slug.trim()}>
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
                {createError && <p className="text-sm font-semibold text-red-600">{createError}</p>}
              </form>
            </div>

            <div className="p-4 sm:p-5">
              <h2 className="inline-flex items-center gap-2 text-2xl font-bold text-ink">
                <UsersRound size={20} className="text-blue-600" />
                Members
              </h2>
              {!selectedWorkspaceId && (
                <p className="mt-3 text-sm text-slate-500">Select a workspace to manage members.</p>
              )}

              {selectedWorkspaceId && membersLoading && (
                <p className="mt-3 text-sm text-slate-500">Loading members...</p>
              )}

              {selectedWorkspaceId && !membersLoading && !membersData && (
                <p className="mt-3 text-sm font-semibold text-red-600">
                  Unable to load members for this workspace.
                </p>
              )}

              {selectedWorkspaceId && !membersLoading && (
                <>
                  {canInvite && (
                    <form onSubmit={onSubmitInvite} className="mt-3 grid gap-2">
                      <Input
                        value={inviteEmail}
                        onChange={(event) => setInviteEmail(event.target.value)}
                        placeholder="Invite user by email"
                      />
                      <select
                        value={inviteRole}
                        onChange={(event) => setInviteRole(event.target.value as WorkspaceRole)}
                        className="app-select"
                      >
                        {inviteRoleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <Button disabled={inviteMutation.isPending || !inviteEmail.trim()}>
                        <UserPlus size={15} className="mr-1" />
                        {inviteMutation.isPending ? 'Inviting...' : 'Invite member'}
                      </Button>
                      {inviteFeedback && (
                        <p className={`text-sm font-semibold ${inviteMutation.isError ? 'text-red-600' : 'text-emerald-700'}`}>
                          {inviteFeedback}
                        </p>
                      )}
                    </form>
                  )}

                  {!canInvite && currentMembership && (
                    <p className="mt-3 text-sm text-slate-500">
                      Your role is {currentMembership.role}. Only OWNER or ADMIN can invite members.
                    </p>
                  )}

                  <div className="mt-4 border-t border-slate-200">
                    {members.map((member) => (
                      <div key={member.id} className="border-b border-slate-200 px-2 py-2.5 last:border-b-0">
                        <p className="text-sm font-semibold text-slate-800">{member.user.displayName}</p>
                        <p className="text-xs text-slate-500">{member.user.email}</p>
                        <p className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold uppercase text-blue-700">
                          {member.role}
                        </p>
                      </div>
                    ))}
                    {members.length === 0 && (
                      <p className="px-2 py-3 text-sm text-slate-500">No members found for this workspace.</p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-4 sm:p-5">
              <h2 className="inline-flex items-center gap-2 text-2xl font-bold text-ink">
                <Link2 size={20} className="text-blue-600" />
                Invite links
              </h2>
              {!selectedWorkspaceId && (
                <p className="mt-3 text-sm text-slate-500">Select a workspace to manage invite links.</p>
              )}

              {selectedWorkspaceId && canInvite && (
                <form onSubmit={onSubmitCreateInviteLink} className="mt-3 grid gap-2">
                  <select
                    value={inviteLinkRole}
                    onChange={(event) => setInviteLinkRole(event.target.value as WorkspaceRole)}
                    className="app-select"
                  >
                    {inviteRoleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={inviteLinkExpiryHours}
                    onChange={(event) => setInviteLinkExpiryHours(event.target.value)}
                    placeholder="Expires in hours (e.g. 72)"
                  />
                  <Input
                    value={inviteLinkMaxUses}
                    onChange={(event) => setInviteLinkMaxUses(event.target.value)}
                    placeholder="Max uses (e.g. 10)"
                  />
                  <Input
                    value={inviteLinkDomain}
                    onChange={(event) => setInviteLinkDomain(event.target.value)}
                    placeholder="Allowed domain (optional, e.g. company.com)"
                  />
                  <Button
                    disabled={!selectedWorkspaceId || createInviteLinkMutation.isPending}
                  >
                    {createInviteLinkMutation.isPending ? 'Creating...' : 'Create invite link'}
                  </Button>
                  {inviteLinkFeedback && (
                    <p
                      className={`text-sm font-semibold ${
                        createInviteLinkMutation.isError ? 'text-red-600' : 'text-emerald-700'
                      }`}
                    >
                      {inviteLinkFeedback}
                    </p>
                  )}
                </form>
              )}

              {selectedWorkspaceId && !canInvite && currentMembership && (
                <p className="mt-3 text-sm text-slate-500">
                  Your role is {currentMembership.role}. Only OWNER or ADMIN can manage invite links.
                </p>
              )}

              {selectedWorkspaceId && inviteLinksLoading && (
                <p className="mt-3 text-sm text-slate-500">Loading invite links...</p>
              )}

              {selectedWorkspaceId && !inviteLinksLoading && (
                <div className="mt-4 border-t border-slate-200">
                  {inviteLinks.map((link) => (
                    <div key={link.id} className="border-b border-slate-200 px-2 py-2.5 last:border-b-0">
                      <p className="text-sm font-semibold text-slate-800">
                        {link.role} link {link.isRevoked ? '(revoked)' : ''}
                      </p>
                      <p className="text-xs text-slate-500">
                        Uses: {link.useCount}/{link.maxUses ?? 'unlimited'} | Expires: {new Date(link.expiresAt).toLocaleString()}
                      </p>
                      {link.allowedDomain && (
                        <p className="text-xs text-slate-500">Domain: {link.allowedDomain}</p>
                      )}
                      {link.invitedEmail && (
                        <p className="text-xs text-slate-500">Email lock: {link.invitedEmail}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            void navigator.clipboard.writeText(link.inviteUrl);
                            toast.success('Invite link copied');
                          }}
                        >
                          <Copy size={14} className="mr-1" />
                          Copy link
                        </Button>
                        {!link.isRevoked && canInvite && (
                          <Button
                            variant="danger"
                            disabled={revokeInviteLinkMutation.isPending}
                            onClick={() => revokeInviteLinkMutation.mutate(link.id)}
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {inviteLinks.length === 0 && (
                    <p className="px-2 py-3 text-sm text-slate-500">No invite links created.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
