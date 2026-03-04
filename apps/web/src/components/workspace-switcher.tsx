'use client';

import { useQuery } from '@tanstack/react-query';
import { getWorkspaces } from '@/lib/queries';
import { useMemo } from 'react';

export function WorkspaceSwitcher() {
  const { data } = useQuery({
    queryKey: ['workspaces'],
    queryFn: getWorkspaces,
  });

  const workspaceItems = useMemo(() => data?.data ?? [], [data]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Workspace Switcher</p>
      <div className="space-y-2">
        {workspaceItems.length === 0 && <p className="text-sm text-slate-500">No workspaces yet</p>}
        {workspaceItems.map((workspace) => (
          <div key={workspace.id} className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-700">
            {workspace.name}
          </div>
        ))}
      </div>
    </div>
  );
}