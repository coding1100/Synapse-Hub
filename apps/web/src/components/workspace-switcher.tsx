'use client';

import clsx from 'clsx';
import { Building2, CheckCircle2 } from 'lucide-react';
import { useWorkspace } from '@/providers/workspace-provider';

export function WorkspaceSwitcher() {
  const { workspaces, selectedWorkspaceId, setSelectedWorkspaceId, isLoading } = useWorkspace();

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <p className="app-kicker">Workspace</p>
        <span className="rounded-full border border-app-line bg-app-soft px-2 py-0.5 text-[10px] font-semibold text-app-muted">
          {workspaces.length}
        </span>
      </div>
      <div className="space-y-1">
        {isLoading && <p className="text-sm text-app-muted">Loading workspaces...</p>}
        {!isLoading && workspaces.length === 0 && <p className="text-sm text-app-muted">No workspaces yet</p>}
        {workspaces.map((workspace) => {
          const isSelected = workspace.id === selectedWorkspaceId;

          return (
            <button
              key={workspace.id}
              type="button"
              onClick={() => setSelectedWorkspaceId(workspace.id)}
              className={clsx(
                'flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm font-medium transition',
                isSelected
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/70 dark:bg-indigo-500/20 dark:text-indigo-200'
                  : 'border-transparent text-app-muted hover:bg-app-hover hover:text-app-ink',
              )}
            >
              <Building2 size={15} className={isSelected ? 'text-indigo-600 dark:text-indigo-300' : 'text-app-muted'} />
              <span className="flex-1 truncate">{workspace.name}</span>
              {isSelected && <CheckCircle2 size={14} className="text-indigo-600 dark:text-indigo-300" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
