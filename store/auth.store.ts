import { create } from 'zustand';
import {
  persist,
  createJSONStorage,
} from 'zustand/middleware';
import {
  login as loginApi,
  refreshToken as refreshAccessToken,
  fetchUserDetails,
} from '@/services/auth.service';
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
  login: (dto: LoginRequest) => Promise<boolean>;
  logout: () => void;
  refresh: () => Promise<void>;
  setSession: (
    data: Pick<
      LoginResponse,
      'user' | 'access_token' | 'refresh_token'
    >,
  ) => void;
  hydrateFromLegacyStorage: () => Promise<void>; // reads tokens from localStorage and populates user
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
        const result = await loginApi(dto);
        if (!result?.success) {
          //   throw new Error(
          //     (result as any)?.message ||
          //       'Login failed',
          //   );
          return false;
        }
        set({
          user: result.user,
          accessToken: result.access_token,
          refreshToken: result.refresh_token,
        });
        return true;
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
        // Attempt to refresh using service (updates localStorage tokens)
        try {
          await refreshAccessToken();
        } catch {
          // ignore, we'll re-read below
        }
        try {
          const at = localStorage.getItem(
            'access_token',
          );
          if (at) {
            set((s) => ({
              accessToken: at,
              refreshToken: s.refreshToken,
            }));
          } else {
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
            });
          }
        } catch {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
          });
        }
      },

      hydrateFromLegacyStorage: async () => {
        try {
          const at = localStorage.getItem(
            'access_token',
          );
          const rt = localStorage.getItem(
            'refresh_token',
          );
          if (at || rt) {
            set({
              accessToken: at,
              refreshToken: rt,
            });
            // Try to fetch user profile with the current/updated token
            try {
              const profile =
                await fetchUserDetails();
              set((s) => ({
                user: profile ?? s.user,
              }));
            } catch {
              // If profile fails, try refresh once and retry profile
              try {
                await refreshAccessToken();
                const at2 = localStorage.getItem(
                  'access_token',
                );
                set((s) => ({
                  accessToken:
                    at2 ?? s.accessToken,
                }));
                const profile2 =
                  await fetchUserDetails();
                set((s) => ({
                  user: profile2 ?? s.user,
                }));
              } catch {
                // give up, clear session
                set({
                  user: null,
                  accessToken: null,
                  refreshToken: null,
                });
              }
            }
          }
        } catch {
          // storage unavailable
        }
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
