import { UserTypes } from '@/types';

import { create } from 'zustand';
import {
  persist,
  createJSONStorage,
} from 'zustand/middleware';

interface AuthenticatedUser
  extends UserTypes.User {}
/**
 * Shape of the authentication store
 */
export type AuthenticationState = {
  /** Currently logged-in user */
  currentUser: AuthenticatedUser | null;

  /** Short-lived token used for API & socket auth */
  accessToken: string | null;

  /** Long-lived token used to refresh access token */
  refreshToken: string | null;

  /** Exact time (ms) when access token expires */
  accessTokenExpiresAt: number | null;

  /** ============================
   *  Exact time (ms) when refresh token expires
   *  ============================ */
  refreshTokenExpiresAt: number | null;

  /* ============================
       Derived / Computed helpers
       ============================ */

  /** True only if access token exists AND is not expired */
  isSessionValid: () => boolean;

  /** Check if current user has a specific role */
  userHasRole: (
    role: AuthenticatedUser['role'],
  ) => boolean;

  /* ============================
       State mutation actions
       ============================ */

  /** Set a fresh authenticated session (on login or refresh) */
  setAuthenticatedSession: (data: {
    user: AuthenticatedUser;
    accessToken: string;
    refreshToken: string;
    expiresInSeconds: number;
  }) => void;

  /** Clear all auth data (logout or hard expiry) */
  clearSession: () => void;

  /** Refresh access token if expired or close to expiring */
  refreshSessionIfNeeded: () => Promise<void>;
};

export const useAuthenticationStore =
  create<AuthenticationState>()(
    persist(
      /**
       * Creates the initial state for the authentication store.
       * @param set - Zustand's set function to update the state.
       * @param get - Zustand's get function to access the current state.
       * @returns The initial state of the authentication store.
       */
      (set, get) => {
        // Auto-refresh token before it expires
        let autoRefreshInterval: NodeJS.Timeout | null =
          null;

        function startAutoRefresh() {
          // check if truly running then return
          if (autoRefreshInterval) return; // already running
          autoRefreshInterval = setInterval(
            async () => {
              await get().refreshSessionIfNeeded();
            },
            30_000, // every 30 seconds
          );
        }

        // auto-refresh on window focus
        if (typeof window !== 'undefined') {
          window.addEventListener('focus', () => {
            get().refreshSessionIfNeeded();
            // startAutoRefresh(); // can't hurt to ensure it's running but not strictly needed
          });
        }

        /** cross-tab communication */
        if (typeof window !== 'undefined') {
          window.addEventListener(
            'storage',
            (event) => {
              if (event.key === 'access_token') {
                get().refreshSessionIfNeeded();
              }
            },
          );
        }

        // cross-tab logout sync
        if (typeof window !== 'undefined') {
          window.addEventListener(
            'storage',
            (event) => {
              if (
                event.key === 'auth-storage' &&
                event.newValue === null
              ) {
                // another tab logged out, clear here too
                set({
                  currentUser: null,
                  accessToken: null,
                  refreshToken: null,
                  accessTokenExpiresAt: null,
                  refreshTokenExpiresAt: null,
                });
              }
            },
          );
        }

        return {
          currentUser: null,
          accessToken: null,
          refreshToken: null,
          accessTokenExpiresAt: null,
          refreshTokenExpiresAt: null,

          // Derived / Computed helpers
          isSessionValid: () => {
            /** first we get the necessary state values */
            const {
              accessToken,
              accessTokenExpiresAt,
            } = get();
            /** then we check if the access token exists and is not expired */
            if (
              !accessToken ||
              !accessTokenExpiresAt
            ) {
              return false;
            }
            const currentTime = Date.now();
            return (
              currentTime < accessTokenExpiresAt
            );
          },
          userHasRole: (role) => {
            const { currentUser } = get();
            if (!currentUser) {
              return false;
            }
            return currentUser.role === role;
          },
          // State mutation actions
          setAuthenticatedSession: (data: {
            user: AuthenticatedUser;
            accessToken: string;
            refreshToken: string;
            expiresInSeconds: number;
          }) => {
            // we extract the data from the input
            const {
              user,
              accessToken,
              refreshToken,
              expiresInSeconds,
            } = data;
            const currentTime = Date.now();
            set({
              currentUser: user,
              accessToken: accessToken,
              refreshToken: refreshToken,
              accessTokenExpiresAt:
                currentTime +
                expiresInSeconds * 1000,
              // assuming refresh token lasts 7 days
              refreshTokenExpiresAt:
                currentTime +
                7 * 24 * 60 * 60 * 1000,
            });
          },
          clearSession: () => {
            set({
              currentUser: null,
              accessToken: null,
              refreshToken: null,
              accessTokenExpiresAt: null,
              refreshTokenExpiresAt: null,
            });
          },
          refreshSessionIfNeeded: async () => {
            // implementation would go here
            const {
              refreshToken,
              accessTokenExpiresAt,
              refreshTokenExpiresAt,
              clearSession,
            } = get();
            // first get the current time needed for comparisons between expiry times for access and refresh tokens
            const currentTime = Date.now();
            // If refresh token has expired, clear session immediately
            if (
              refreshTokenExpiresAt !== null &&
              currentTime > refreshTokenExpiresAt
            ) {
              clearSession();
              return;
            }
            // check if access token is valid for at least another minute
            if (
              !refreshToken ||
              !refreshTokenExpiresAt ||
              !accessTokenExpiresAt
            ) {
              // prerequisites missing, nothing to do
              return;
            }
            // Refresh  60 seconds before expiry
            const shouldRefresh =
              currentTime >=
              accessTokenExpiresAt - 60000;
            if (!shouldRefresh) {
              return;
            }
            // Here i would call the refresh token API
            // and update the store with the new tokens
            try {
              // making an API call to refresh the access token
              const newAccessToken = await fetch(
                `/api/refresh-token`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type':
                      'application/json',
                    Authorization: `Bearer ${refreshToken}`,
                  },
                },
              );
              const { access_token } =
                await newAccessToken.json();
              if (!access_token) {
                throw new Error(
                  'Failed to refresh access token',
                );
              }
              const user = get().currentUser;

              if (!user) {
                clearSession();
                return;
              }

              get().setAuthenticatedSession({
                user,
                accessToken: access_token,
                refreshToken,
                // assuming new access token lasts 15 minutes
                expiresInSeconds: 15 * 60,
              });
            } catch (e) {
              // optionally log or handle error without returning a value
              clearSession();
            }
          },
        };
      },
      {
        name: 'auth-storage',
        storage: createJSONStorage(
          () => localStorage,
        ),

        partialize: (state) => ({
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          accessTokenExpiresAt:
            state.accessTokenExpiresAt,
          refreshTokenExpiresAt:
            state.refreshTokenExpiresAt,
          currentUser: state.currentUser,
        }),
      },
    ),
  );
