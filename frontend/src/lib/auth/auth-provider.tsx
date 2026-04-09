'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';

type AuthUser = {
  sub: string;
  username: string;
  role: string;
  fullName: string;
  firstName: string;
  lastName: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  hydrated: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (payload: {
    firstName: string;
    lastName: string;
    nationalId: string;
    birthDate: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  updateUser: (nextUser: AuthUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'cf_token';
const USER_KEY = 'cf_user';

function syncApiToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete apiClient.defaults.headers.common.Authorization;
}

function readStoredSession() {
  if (typeof window === 'undefined') {
    return { token: null, user: null };
  }

  const token = window.localStorage.getItem(TOKEN_KEY);
  const storedUser = window.localStorage.getItem(USER_KEY);

  try {
    const user = storedUser ? (JSON.parse(storedUser) as AuthUser) : null;
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
      setSession({ token: nextToken, user: nextUser });
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
      window.localStorage.setItem(TOKEN_KEY, nextToken);
      window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      applySession(nextToken, nextUser);
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
    async (payload: {
      firstName: string;
      lastName: string;
      nationalId: string;
      birthDate: string;
      password: string;
    }) => {
      const response = await apiClient.post('/auth/register', payload);
      persistSession(response.data.accessToken, response.data.user);
      router.push('/');
    },
    [persistSession, router],
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

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}
