import ky from 'ky';

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
  },
});

export default http;
