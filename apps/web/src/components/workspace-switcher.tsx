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
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
          {workspaces.length}
        </span>
      </div>
      <div className="space-y-1">
        {isLoading && <p className="text-sm text-slate-500">Loading workspaces...</p>}
        {!isLoading && workspaces.length === 0 && <p className="text-sm text-slate-500">No workspaces yet</p>}
        {workspaces.map((workspace) => {
          const isSelected = workspace.id === selectedWorkspaceId;

          return (
            <button
              key={workspace.id}
              type="button"
              onClick={() => setSelectedWorkspaceId(workspace.id)}
              className={clsx(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition',
                isSelected
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-700 hover:bg-slate-100',
              )}
            >
              <Building2 size={15} className={isSelected ? 'text-blue-600' : 'text-slate-500'} />
              <span className="flex-1 truncate">{workspace.name}</span>
              {isSelected && <CheckCircle2 size={14} className="text-blue-600" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
