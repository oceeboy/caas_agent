'use client';
import React, {
  createContext,
  useContext,
  useEffect,
} from 'react';
import {
  useAuthStore,
  selectIsAuthenticated,
  selectUser,
} from '@/store/auth.store';
import type { AuthState } from '@/store/auth.store';

export type AuthContextValue = {
  isAuthenticated: boolean;
  user: ReturnType<typeof selectUser>;
  login: AuthState['login'];
  logout: AuthState['logout'];
  refresh: AuthState['refresh'];
};

const AuthContext =
  createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = useAuthStore(
    selectIsAuthenticated,
  );
  const user = useAuthStore(selectUser);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const refresh = useAuthStore((s) => s.refresh);
  const hydrateFromLegacyStorage = useAuthStore(
    (s) => s.hydrateFromLegacyStorage,
  );

  useEffect(() => {
    // hydrateFromLegacyStorage();
    // refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextValue = {
    isAuthenticated,
    user,
    login,
    logout,
    refresh,
  };
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error(
      'useAuth must be used within AuthProvider',
    );
  return ctx;
}
