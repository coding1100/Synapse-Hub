'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchUsers } from '@/lib/queries';
import { buildMentionHandle } from '@/lib/mentions';

export type MentionSuggestion = {
  id: string;
  displayName: string;
  email: string;
  handle: string;
};

export function useMentionSuggestions(workspaceId: string | null | undefined, query?: string) {
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query?.trim() ?? '');
    }, 140);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  const usersQuery = useQuery({
    queryKey: ['mention-suggestions', workspaceId, debouncedQuery],
    queryFn: () => searchUsers(workspaceId!, debouncedQuery),
    enabled: Boolean(workspaceId && debouncedQuery.length >= 1),
    staleTime: 15_000,
  });

  const suggestions = useMemo(() => {
    const data = usersQuery.data?.data ?? [];

    return data.slice(0, 8).map((user) => ({
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      handle: buildMentionHandle(user.displayName, user.email),
    })) satisfies MentionSuggestion[];
  }, [usersQuery.data]);

  return {
    suggestions,
    isLoading: usersQuery.isLoading,
    isError: usersQuery.isError,
  };
}
