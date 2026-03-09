'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthResponse, AuthUser } from '@/types';

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoaded: boolean;
  setSession: (session: AuthResponse) => void;
  updateUser: (user: AuthUser) => void;
  clearSession: () => void;
};

const AUTH_KEY = 'synapsehub.auth';
const WORKSPACE_KEY = 'synapsehub.workspaceId';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(AUTH_KEY);
    if (!raw) {
      setIsLoaded(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as {
        user: AuthUser;
        accessToken: string;
        refreshToken: string;
      };

      setUser(parsed.user);
      setAccessToken(parsed.accessToken);
      setRefreshToken(parsed.refreshToken);
    } catch {
      window.localStorage.removeItem(AUTH_KEY);
    }

    setIsLoaded(true);
  }, []);

  const setSession = useCallback((session: AuthResponse) => {
    setUser(session.user);
    setAccessToken(session.accessToken);
    setRefreshToken(session.refreshToken);
    window.localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({
        user: session.user,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      }),
    );
  }, []);

  const updateUser = useCallback((nextUser: AuthUser) => {
    setUser(nextUser);

    const raw = window.localStorage.getItem(AUTH_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as {
        user: AuthUser;
        accessToken: string;
        refreshToken: string;
      };

      window.localStorage.setItem(
        AUTH_KEY,
        JSON.stringify({
          ...parsed,
          user: nextUser,
        }),
      );
    } catch {
      window.localStorage.removeItem(AUTH_KEY);
    }
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    window.localStorage.removeItem(AUTH_KEY);
    window.localStorage.removeItem(WORKSPACE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(accessToken && user),
      isLoaded,
      setSession,
      updateUser,
      clearSession,
    }),
    [accessToken, clearSession, isLoaded, refreshToken, setSession, updateUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
