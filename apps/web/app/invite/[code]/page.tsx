'use client';

import { useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { AuthShell } from '@/components/auth-shell';
import { resolveApiError } from '@/lib/http-error';
import { acceptWorkspaceInviteLink } from '@/lib/queries';
import { useAuth } from '@/providers/auth-provider';
import { useWorkspace } from '@/providers/workspace-provider';
import { Button } from '@synapsehub/ui';

export default function InviteAcceptPage() {
  const params = useParams<{ code?: string }>();
  const inviteCode = useMemo(() => (params.code ?? '').trim(), [params.code]);
  const router = useRouter();
  const { isLoaded, isAuthenticated } = useAuth();
  const { setSelectedWorkspaceId } = useWorkspace();

  useEffect(() => {
    if (!isLoaded || isAuthenticated || !inviteCode) {
      return;
    }

    const nextPath = `/invite/${encodeURIComponent(inviteCode)}`;
    router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
  }, [inviteCode, isAuthenticated, isLoaded, router]);

  const mutation = useMutation({
    mutationFn: () => acceptWorkspaceInviteLink(inviteCode),
    onSuccess: (result) => {
      setSelectedWorkspaceId(result.workspaceId);
      toast.success(result.alreadyAccepted ? 'Workspace opened' : 'Workspace joined');
      router.replace('/messages');
    },
    onError: (error) => {
      const message = resolveApiError(error, 'Unable to accept invitation.');
      toast.error(message);
    },
  });

  if (!inviteCode) {
    return (
      <AuthShell
        title="Invite link"
        subtitle="This invitation link is invalid."
        footerLabel="Go to"
        footerHref="/dashboard"
        footerLinkLabel="Dashboard"
      >
        <p className="mt-6 text-sm font-semibold text-red-600">Invite code is missing.</p>
      </AuthShell>
    );
  }

  if (isLoaded && !isAuthenticated) {
    return null;
  }

  return (
    <AuthShell
      title="Workspace invitation"
      subtitle="Accept this invitation to join the workspace."
      footerLabel="Back to"
      footerHref="/dashboard"
      footerLinkLabel="Dashboard"
    >
      <div className="mt-6 space-y-4">
        <p className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          <Link2 size={13} />
          Invite code: {inviteCode}
        </p>

        <Button
          className="w-full"
          disabled={!isLoaded || !isAuthenticated || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Joining workspace...' : 'Accept invitation'}
        </Button>

        {mutation.isSuccess && (
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={15} />
            Invitation accepted.
          </p>
        )}
        {mutation.isError && (
          <p className="text-sm font-semibold text-red-600">Unable to accept this invitation.</p>
        )}
      </div>
    </AuthShell>
  );
}
