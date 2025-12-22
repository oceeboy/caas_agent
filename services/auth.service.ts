import { http } from '@/lib/http';
import httplogin from '@/lib/ky';
// import { useAuthenticationStore } from '@/store/authentication.store';
// import { useAuthStore } from '@/store/auth.store';
import type { UserTypes } from '@/types';
import { checkUserAuthenticated } from '@/utils/auth.utils';

export type LoginRequest = {
  email: string;
  password: string;
};
export type AuthUser = {
  userId: string;
  orgId: string;
  role: string;
};
export type LoginResponse = {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expiresInSeconds: number;
};

// Persist tokens (basic localStorage; replace with secure storage if needed)
function persistTokens(accessToken: string, refreshToken: string) {
  try {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  } catch (e) {
    // storage not available (SSR or disabled)
  }
}

export async function login(dto: LoginRequest) {
  try {
    const res = await httplogin.post('auth/login', { json: dto });

    const result = await res.json();
    const data = result as {
      user: UserTypes.User;
      access_token: string;
      refresh_token: string;
      expiresInSeconds: number;
    };

    const { user, access_token, refresh_token, expiresInSeconds } = data;

    // Save tokens for subsequent requests (used by utils/http.ts)
    // persistTokens(access_token, refresh_token); // will be used in http.ts

    // Do NOT call Zustand hooks or store setters here to avoid invalid hook calls.
    // Let the UI layer call setSession after invoking login.

    return {
      success: true,
      user,
      access_token,
      refresh_token,
      expiresInSeconds,
    };
  } catch (error) {
    console.log('error', error);
    const isUnauthorized = error instanceof Error && (error as any).response?.status === 401;

    return {
      success: false,
      message: isUnauthorized ? 'Invalid email or password' : 'An error occurred while logging in',
    };
  }
}

export async function logout() {}

export async function getNewAccessToken(refresh_token: string) {
  try {
    const res = await http.post(
      'auth/refresh-token',
      {},
      {
        headers: {
          Authorization: `Bearer ${refresh_token}`,
        },
      },
    );
    const data = (await res) as {
      access_token: string;
    };
    const { access_token } = data;

    // Update stored access token
    // persistTokens(access_token, refresh_token);
    return access_token;
  } catch (error) {
    throw new Error('An error occurred while refreshing token');
  }
}

export async function refreshToken() {
  const refresh_token = localStorage.getItem('refresh_token');

  if (!refresh_token) {
    return {
      success: false,
      message: 'No refresh token available',
    };
  }
  try {
    const res = await http.post(
      'auth/refresh-token',
      {},
      {
        headers: {
          Authorization: `Bearer ${refresh_token}`,
        },
      },
    );
    const data = (await res) as {
      access_token: string;
    };
    const { access_token } = data;

    // Update stored access token
    persistTokens(access_token, refresh_token);
  } catch (error) {
    console.log('error', error);
    throw new Error('An error occurred while refreshing token');
  }
}

// get user info

export async function fetchUserDetails() {
  //   const isAuthenticated =
  //     await checkUserAuthenticated();
  //   if (!isAuthenticated) {
  //     // this is meant to force the caller to handle unauthenticated state to redirect to login
  //     throw new Error('User is not authenticated');
  //   }

  //   const access_token = localStorage.getItem(
  //     'access_token',
  //   );

  try {
    const res = await httplogin.get('auth/profile');
    const data: UserTypes.User = await res.json();
    return data;
  } catch (error) {
    console.log('error', error);
    throw new Error('An error occurred while fetching user details');
  }
}
