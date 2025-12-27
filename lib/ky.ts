import ky from 'ky';
import { NextResponse } from 'next/server';

// Same-origin API base (proxied via Next.js rewrites) // check next.config.ts for details
const API_BASE_URL = 'api/';
const AUTH_STORAGE_KEY = 'auth-storage';

const baseClient = ky.create({
  prefixUrl: API_BASE_URL,
  timeout: 30_000, // 30 seconds
});

const http = baseClient.extend({
  hooks: {
    beforeRequest: [
      (request) => {
        try {
          if (request.url.endsWith('/auth/login') || request.url.endsWith('/auth/register')) {
            return; // skip adding auth header for login/register
          }
          const raw = typeof window !== 'undefined' ? localStorage.getItem(AUTH_STORAGE_KEY) : null;
          const persisted = raw ? JSON.parse(raw) : null;
          const accessToken: string | undefined = persisted?.state?.accessToken;

          if (accessToken) {
            request.headers.set('Authorization', `Bearer ${accessToken}`);
          }
        } catch {
          // ignore storage/JSON errors
        }
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        // Global response handling can be added here
        if (response.status === 401) {
          // Handle unauthorized access globally if needed
          const loginUrl = new URL('/login', request.url);
          loginUrl.searchParams.set('redirect', request.url);
          return NextResponse.redirect(loginUrl);
        }
        return response;
      },
    ],
  },
});

export default http;
