// Auth utilities: guards and helpers for session-aware routing
// In App Router, use `middleware.ts` at the project root for route protection.
// This file provides client-side helpers and a Next.js Middleware example snippet.

import { http } from '@/lib/http';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Client-side: check auth state from localStorage (basic example)
export function isAuthenticatedClient(): boolean {
  try {
    const token = localStorage.getItem(
      'access_token',
    );
    return !!token;
  } catch {
    return false;
  }
}

// Client-side guard: redirect if not authenticated (use in useEffect on protected pages)
export function guardClientRoute(
  onFail: () => void,
): boolean {
  const authed = isAuthenticatedClient();
  if (!authed) onFail();
  return authed;
}

// Server-side Middleware guard: protect specific paths
// Note: place this logic into `middleware.ts` at the project root for it to run.
export function middlewareGuard(
  req: NextRequest,
) {
  const { pathname } = req.nextUrl;
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/settings');

  if (!isProtected) return NextResponse.next();

  // Read token from cookies (prefer httpOnly cookies for security)
  const access = req.cookies.get(
    'access_token',
  )?.value;

  if (!access) {
    const loginUrl = new URL(
      '/auth/login',
      req.url,
    );
    loginUrl.searchParams.set(
      'redirect',
      pathname,
    );
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Example Middleware config (use in middleware.ts)
// export const config = {
//   matcher: ["/dashboard/:path*", "/settings/:path*"],
// };

export async function refreshAccessToken(
  refreshToken: string,
): Promise<string | null> {
  try {
    const response = await http.post(
      'auth/refresh-token',
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      },
    );

    const { access_token } = response as {
      access_token: string;
    };

    localStorage.setItem(
      'access_token',
      access_token,
    );
    return access_token;
  } catch {
    return null;
  }
}

export async function checkUserAuthenticated(): Promise<boolean> {
  const accessToken = localStorage.getItem(
    'access_token',
  );
  const refreshToken = localStorage.getItem(
    'refresh_token',
  );

  if (!refreshToken) return false;

  if (
    !accessToken ||
    (await isTokenExpired(accessToken))
  ) {
    const newToken = await refreshAccessToken(
      refreshToken,
    );
    return Boolean(newToken);
  }

  return true;
}
async function isTokenExpired(
  token: string,
): Promise<boolean> {
  try {
    await http.get('auth/session-info', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return false;
  } catch {
    return true;
  }
}
