import { create } from 'zustand';
import {
  persist,
  createJSONStorage,
} from 'zustand/middleware';
import http from '@/lib/ky';
import { login as loginApi } from '@/services/auth.service';
import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
} from '@/services/auth.service';

export type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;

  // Derived helpers
  isAuthenticated: () => boolean;
  hasRole: (roles: string | string[]) => boolean;

  // Actions
  login: (dto: LoginRequest) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  setSession: (
    data: Pick<
      LoginResponse,
      'user' | 'access_token' | 'refresh_token'
    >,
  ) => void;
  hydrateFromLegacyStorage: () => void; // reads tokens saved by older code (access_token, refresh_token)
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      isAuthenticated: () => !!get().accessToken,

      hasRole: (roles) => {
        const role = get().user?.role;
        if (!role) return false;
        return Array.isArray(roles)
          ? roles.includes(role)
          : roles === role;
      },

      setSession: (data) => {
        set({
          user: data.user,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        });
      },

      login: async (dto) => {
        const data = await loginApi(dto);
        set({
          user: data.user,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
        });
        try {
          localStorage.removeItem('access_token');
          localStorage.removeItem(
            'refresh_token',
          );
        } catch {}
      },

      refresh: async () => {
        const token = get().refreshToken;
        if (!token) return;
        try {
          const res = await http.post(
            'auth/refresh',
            { json: { refresh_token: token } },
          );
          const data =
            (await res.json()) as Partial<LoginResponse> & {
              access_token: string;
            };
          set((s) => ({
            user: data.user ?? s.user,
            accessToken: data.access_token,
            refreshToken:
              data.refresh_token ??
              s.refreshToken,
          }));
        } catch (e) {
          // On refresh failure, clear session
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
          });
        }
      },

      hydrateFromLegacyStorage: () => {
        try {
          const at = localStorage.getItem(
            'access_token',
          );
          const rt = localStorage.getItem(
            'refresh_token',
          );
          if (at || rt)
            set({
              accessToken: at,
              refreshToken: rt,
            });
        } catch {}
      },
    }),
    {
      name: 'auth', // persisted under localStorage.auth
      storage: createJSONStorage(
        () => localStorage,
      ),
      // Only persist what's needed
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
      }),
    },
  ),
);

// Convenient selectors
export const selectUser = (s: AuthState) =>
  s.user;
export const selectIsAuthenticated = (
  s: AuthState,
) => s.isAuthenticated();
export const selectRole = (s: AuthState) =>
  s.user?.role ?? null;
