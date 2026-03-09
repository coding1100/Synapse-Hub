'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWorkspaces } from '@/lib/queries';
import { Workspace } from '@/types';
import { useAuth } from './auth-provider';

type WorkspaceContextValue = {
  workspaces: Workspace[];
  selectedWorkspaceId: string | null;
  selectedWorkspace: Workspace | null;
  isLoading: boolean;
  setSelectedWorkspaceId: (workspaceId: string) => void;
};

const WORKSPACE_KEY = 'synapsehub.workspaceId';

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoaded } = useAuth();
  const [selectedWorkspaceId, setSelectedWorkspaceIdState] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    const storedId = window.localStorage.getItem(WORKSPACE_KEY);
    setSelectedWorkspaceIdState(storedId);
    setStorageReady(true);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: getWorkspaces,
    enabled: storageReady && isLoaded && isAuthenticated,
  });

  const workspaces = useMemo(() => data?.data ?? [], [data]);

  useEffect(() => {
    if (!storageReady || !isAuthenticated) {
      return;
    }

    if (workspaces.length === 0) {
      setSelectedWorkspaceIdState(null);
      window.localStorage.removeItem(WORKSPACE_KEY);
      return;
    }

    const hasSelected = selectedWorkspaceId
      ? workspaces.some((workspace) => workspace.id === selectedWorkspaceId)
      : false;

    if (!hasSelected) {
      const fallbackWorkspaceId = workspaces[0].id;
      setSelectedWorkspaceIdState(fallbackWorkspaceId);
      window.localStorage.setItem(WORKSPACE_KEY, fallbackWorkspaceId);
    }
  }, [isAuthenticated, selectedWorkspaceId, storageReady, workspaces]);

  const setSelectedWorkspaceId = useCallback((workspaceId: string) => {
    setSelectedWorkspaceIdState(workspaceId);
    window.localStorage.setItem(WORKSPACE_KEY, workspaceId);
  }, []);

  const selectedWorkspace = useMemo(() => {
    if (!selectedWorkspaceId) {
      return null;
    }

    return workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null;
  }, [selectedWorkspaceId, workspaces]);

  const value = useMemo(
    () => ({
      workspaces,
      selectedWorkspaceId,
      selectedWorkspace,
      isLoading,
      setSelectedWorkspaceId,
    }),
    [isLoading, selectedWorkspace, selectedWorkspaceId, setSelectedWorkspaceId, workspaces],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used inside WorkspaceProvider');
  }
  return context;
}
