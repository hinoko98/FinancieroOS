'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import {
  AuthContext,
  type AuthUser,
  type RegisterPayload,
} from './auth-context';

const TOKEN_KEY = 'cf_token';
const USER_KEY = 'cf_user';

function syncApiToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete apiClient.defaults.headers.common.Authorization;
}

function normalizeAuthUser(user: AuthUser | null) {
  if (!user) {
    return null;
  }

  const resolvedId = user.id || user.sub;

  return {
    ...user,
    id: resolvedId,
    sub: user.sub || resolvedId,
  };
}

function readStoredSession() {
  if (typeof window === 'undefined') {
    return { token: null, user: null };
  }

  const token = window.localStorage.getItem(TOKEN_KEY);
  const storedUser = window.localStorage.getItem(USER_KEY);

  try {
    const rawUser = storedUser ? (JSON.parse(storedUser) as AuthUser) : null;
    const user = normalizeAuthUser(rawUser);
    return { token, user };
  } catch {
    window.localStorage.removeItem(USER_KEY);
    return { token, user: null };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<{ token: string | null; user: AuthUser | null }>(
    {
      token: null,
      user: null,
    },
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    syncApiToken(session.token);
  }, [session.token]);

  const applySession = useCallback(
    (nextToken: string | null, nextUser: AuthUser | null) => {
      syncApiToken(nextToken);
      setSession({ token: nextToken, user: normalizeAuthUser(nextUser) });
    },
    [],
  );

  useEffect(() => {
    const initialSession = readStoredSession();
    applySession(initialSession.token, initialSession.user);
    setHydrated(true);
  }, [applySession]);

  useEffect(() => {
    const syncFromStorage = () => {
      const nextSession = readStoredSession();
      applySession(nextSession.token, nextSession.user);
    };

    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('auth-change', syncFromStorage as EventListener);

    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('auth-change', syncFromStorage as EventListener);
    };
  }, [applySession]);

  const emitAuthChange = () => {
    window.dispatchEvent(new Event('auth-change'));
  };

  const persistSession = useCallback(
    (nextToken: string, nextUser: AuthUser) => {
      const normalizedUser = normalizeAuthUser(nextUser);
      if (!normalizedUser) {
        return;
      }

      window.localStorage.setItem(TOKEN_KEY, nextToken);
      window.localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
      applySession(nextToken, normalizedUser);
      emitAuthChange();
    },
    [applySession],
  );

  const login = useCallback(
    async (credentials: { username: string; password: string }) => {
      const response = await apiClient.post('/auth/login', credentials);
      persistSession(response.data.accessToken, response.data.user);
      router.push('/');
    },
    [persistSession, router],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const response = await apiClient.post('/auth/register', payload);
      return {
        username: response.data.user.username as string,
      };
    },
    [],
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    applySession(null, null);
    emitAuthChange();
    router.push('/login');
  }, [applySession, router]);

  const updateUser = useCallback(
    (nextUser: AuthUser) => {
      if (!session.token) {
        return;
      }

      window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      applySession(session.token, nextUser);
      emitAuthChange();
    },
    [applySession, session.token],
  );

  const value = useMemo(
    () => ({
      user: session.user,
      token: session.token,
      hydrated,
      login,
      register,
      logout,
      updateUser,
    }),
    [hydrated, login, logout, register, session.token, session.user, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
