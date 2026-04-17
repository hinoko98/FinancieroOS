'use client';

import { createContext, useContext } from 'react';

export type AuthUser = {
  id: string;
  sub: string;
  username: string;
  role: string;
  fullName: string;
  firstName: string;
  lastName: string;
};

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  nationalId: string;
  birthDate: string;
  password: string;
};

export type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  hydrated: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<{ username: string }>;
  logout: () => void;
  updateUser: (nextUser: AuthUser) => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}
