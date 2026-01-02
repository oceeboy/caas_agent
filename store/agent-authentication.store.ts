import type { UserTypes } from '@/types';
import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';

interface AgentAuthenticatedUser extends UserTypes.AgentUser {}

/** * Shape of the agent authentication store
 */
export type AgentAuthenticationState = {
  /** Currently logged-in agent user */
  currentUser: AgentAuthenticatedUser | null;

  /** Short-lived token used for API & socket auth */
  token: string | null;
  tokenExpiresAt: number | null;

  /* ============================
       Derived / Computed helpers
       ============================ */

  /** True only if token exists AND is not expired */
  isTokenValid: () => boolean;

  /* ============================

   */
  isAuthenticated: () => boolean;
  /** Check if current user has a specific role */
  userHasRole: (role: AgentAuthenticatedUser['role']) => boolean;
  clearSession: () => void;
  setAgentAuthenticatedSession: (data: { user: AgentAuthenticatedUser; token: string }) => void;

  /* ============================
    hydration here
    ============================ */

  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
};

export const useAgentAuthenticationStore = create<AgentAuthenticationState>()(
  devtools(
    persist(
      (set, get) => ({
        currentUser: null,
        token: null,
        tokenExpiresAt: null,

        // when token is set or updated, we can compute its validity

        isTokenValid: () => {
          console.log('Checking token validity');
          const token = get().token;
          const expiresAt = get().tokenExpiresAt;
          if (!token || !expiresAt) return false;
          return Date.now() < expiresAt;
        },

        isAuthenticated: () => {
          return get().currentUser !== null && get().isTokenValid();
        },

        userHasRole: (role: AgentAuthenticatedUser['role']) => {
          console.log('Checking user role');
          const user = get().currentUser;
          if (!user) return false;
          return user.role === role;
        },

        setAgentAuthenticatedSession: (data: { user: AgentAuthenticatedUser; token: string }) => {
          const { user, token } = data;

          console.log('Setting agent authenticated session');
          set({
            currentUser: user,
            token,
            tokenExpiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes by default
          });
        },

        clearSession: () => {
          console.log('Clearing agent authentication session');
          set({
            currentUser: null,
            token: null,
            tokenExpiresAt: null,
          });
        },

        hydrated: false,
        setHydrated: (hydrated: boolean) => {
          console.log('Setting hydration state:', hydrated);
          set({ hydrated });
        },
      }),
      {
        name: 'agent-auth-storage',
        storage: createJSONStorage(() => localStorage),
        version: 1,
      },
    ),
  ),
);
